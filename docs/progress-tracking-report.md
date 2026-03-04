# Progress Tracking Report

> Phân tích progress tracking pipeline: upload → import → scoring → hoàn thành.

---

## 1. Progress tracking hiện tại

### ImportBatch fields liên quan

| Field | Type | Mô tả | Ai update |
|-------|------|--------|-----------|
| `recordCount` | Int | Tổng SP trong file (set 1 lần khi tạo batch) | `upload/products/route.ts` |
| `rowsProcessed` | Int | Số SP đã import xong | `incrementBatchProgress()` sau mỗi chunk |
| `rowsCreated` | Int | SP mới tạo | `incrementBatchProgress()` |
| `rowsUpdated` | Int | SP cập nhật | `incrementBatchProgress()` |
| `rowsError` | Int | SP lỗi | `incrementBatchProgress()` |
| `status` | String | Import phase: pending → processing → completed/partial/failed | `process-product-batch.ts` |
| `scoringStatus` | String | Scoring phase: pending → processing → completed/failed | `score-batch/route.ts` |
| `completedAt` | DateTime? | Thời điểm hoàn thành (import+scoring) | `score-batch/route.ts` |

### Progress % tính thế nào

**Status endpoint** (`app/api/imports/[id]/status/route.ts:71-73`):

```ts
progress: batch.recordCount > 0
  ? Math.round((batch.rowsProcessed / batch.recordCount) * 100)
  : 0
```

**Vấn đề: `progress` chỉ track IMPORT phase.**

- `rowsProcessed` được increment bởi `incrementBatchProgress()` trong `processChunk()` — chỉ trong import phase.
- Scoring phase (`score-batch/route.ts`) KHÔNG update `rowsProcessed`.
- → Khi import xong 300/300 SP → `progress = 100%` → scoring bắt đầu nhưng progress vẫn 100%.

### Widget hiện % từ đâu

**Widget** (`import-progress-widget.tsx:144-147`):

```ts
const ratio = Math.min(batch.rowsProcessed / batch.recordCount, 1);
const pct = isScoring
  ? 50 + Math.round(ratio * 50)    // scoring: 50-100%
  : Math.round(ratio * 50);         // import: 0-50%
```

Widget cố gắng chia 50/50 cho import/scoring, nhưng `rowsProcessed` KHÔNG thay đổi trong scoring → `ratio` luôn = 1 khi scoring → `pct` luôn = 100%.

**Widget progress ring hiện 100% suốt scoring phase.** Import = 50% ring, scoring bắt đầu → nhảy thẳng 100%.

### /sync page (`upload-progress.tsx`)

Không hiện progress % — chỉ hiện text label ("Đang chấm điểm AI...") + dot status. Không bị ảnh hưởng bởi bug này.

---

## 2. Lifecycle tổng thể cần tracking

| Bước | File | Thời gian ước tính (300 SP) | Weight đề xuất |
|------|------|-----------------------------|----------------|
| 1. Upload + Parse + Dedup | `upload/products/route.ts` | ~200ms | 0% (sync, trước polling) |
| 2. Import chunk (DB writes) | `process-product-batch.ts` | ~3-5s | 15% |
| 3. Identity sync | `process-product-batch.ts` | ~3-5s | 10% |
| 4. Fire scoring relay | `process-product-batch.ts` | ~100ms | 0% |
| 5. Scoring chunk (AI calls) | `score-batch/route.ts` | ~10-20s | 60% |
| 6. Identity score sync | `score-batch/route.ts` | ~1-2s | 10% |
| 7. Lifecycle recalc | `score-batch/route.ts` | ~1-2s | 5% |
| **Total** | | **~20-35s** | **100%** |

**Cho 3000 SP:**
- Import: 10 chunks × 3-5s = ~30-50s (10 relay invocations)
- Scoring: 20 relay invocations × 10-20s = ~200-400s
- → Scoring chiếm **~80% tổng thời gian**

### Weight đề xuất cho unified progress

| Phase | Weight | Lý do |
|-------|--------|-------|
| Import (parse + DB + identity) | 25% | Nhanh, chunked, đã track tốt |
| Scoring (AI + sync + lifecycle) | 75% | Chậm nhất, bottleneck chính |

---

## 3. Scoring progress — GAP hiện tại

### Score-batch có update progress không?

**KHÔNG.** `score-batch/route.ts` chỉ update:

| Thời điểm | Field updated | Line |
|-----------|--------------|------|
| Bắt đầu | `scoringStatus: "processing"` | :28 |
| Xong tất cả | `scoringStatus: "completed"`, `completedAt` | :82-85 |
| Lỗi | `scoringStatus: "failed"`, `errorLog` | :99-103 |

**Không update `rowsProcessed` hay bất kỳ counter nào sau mỗi scoring chunk.**

### Có biết đã score bao nhiêu SP?

Có thể tính gián tiếp:

```ts
// Trong score-batch/route.ts
const unscored = await prisma.product.count({
  where: { importBatchId: batchId, aiScore: null },
});
const scored = batch.recordCount - unscored;
```

Nhưng giá trị này KHÔNG được lưu vào ImportBatch → polling endpoint không có dữ liệu → UI không biết.

### Đề xuất thêm fields vào ImportBatch

```prisma
model ImportBatch {
  // ... existing fields ...

  // Scoring progress tracking (new)
  scoredCount     Int    @default(0)   // Số SP đã score xong
}
```

**Chỉ cần 1 field `scoredCount`** — increment sau mỗi scoring chunk (150 SP). Không cần field phức tạp hơn.

Update location: `score-batch/route.ts` sau `scoreProducts()` thành công:

```ts
await incrementBatchProgress(batchId, { scoredCount: productIds.length });
```

---

## 4. Đề xuất unified progress

### Thiết kế

**Unified progress = 0-100% covering toàn bộ pipeline.**

```
0%────────25%──────────────────────100%
│  IMPORT  │        SCORING         │
│ 0-25%    │       25-100%          │
└──────────┴────────────────────────┘
```

### Công thức

```ts
function calcUnifiedProgress(batch: ImportBatch): number {
  const { recordCount, rowsProcessed, scoredCount, status, scoringStatus } = batch;
  if (recordCount === 0) return 0;

  // Import phase: 0% → 25%
  const importRatio = Math.min(rowsProcessed / recordCount, 1);
  const importPct = importRatio * 25;

  // Scoring phase: 25% → 100%
  if (scoringStatus === "completed") return 100;
  if (status === "failed") return importPct; // Stuck at import %

  const scoredRatio = Math.min((scoredCount ?? 0) / recordCount, 1);
  const scoringPct = scoredRatio * 75;

  return Math.round(importPct + scoringPct);
}
```

### Thay đổi cần thiết

| # | File | Thay đổi |
|---|------|----------|
| 1 | `prisma/schema.prisma` | Thêm `scoredCount Int @default(0)` vào ImportBatch |
| 2 | `score-batch/route.ts` | Sau `scoreProducts()` → `incrementBatchProgress(batchId, { scoredCount: productIds.length })` |
| 3 | `update-batch-progress.ts` | Thêm `scoredCount` vào `incrementBatchProgress` |
| 4 | `imports/[id]/status/route.ts` | Thay công thức progress bằng `calcUnifiedProgress()` |
| 5 | `imports/active/route.ts` | Thêm `scoredCount` vào select |
| 6 | `use-import-polling.ts` | Thêm `scoredCount` vào `ImportStatus` interface |
| 7 | `use-active-import-batch.ts` | Thêm `scoredCount` vào `ActiveBatch` interface |
| 8 | `import-progress-widget.tsx` | Dùng `progress` từ API (đã unified), bỏ tính tay |

### Widget + /sync page dùng cùng 1 nguồn data

- **Status endpoint** (`/api/imports/[id]/status`) trả `progress` đã unified → /sync page polling dùng luôn
- **Active endpoint** (`/api/imports/active`) trả `scoredCount` + `rowsProcessed` → widget tự tính hoặc cũng gọi status endpoint

**Đề xuất:** Cho active endpoint cũng trả `progress` đã tính sẵn (giống status endpoint). Cả 2 nơi dùng cùng 1 function `calcUnifiedProgress()` ở `lib/import/calc-unified-progress.ts`.

---

## Unresolved Questions

1. **Migration `scoredCount`**: Cần chạy `prisma migrate` trên production DB — field mới default 0, batches cũ sẽ hiện 25% progress (import done nhưng scoredCount=0). Chấp nhận được cho batches cũ.
2. **Score-batch relay chaining**: Mỗi relay score 150 SP. Nếu chain gồm 20 relay (3000 SP) → cần `incrementBatchProgress` 20 lần. DB writes nhẹ (~1ms each), không vấn đề.
3. **Race condition**: 2 concurrent score-batch relay sẽ increment `scoredCount` đồng thời — Prisma `increment` operator là atomic, an toàn.
