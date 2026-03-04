# Widget Audit Report — Async Workflow Tracking

> Cập nhật: 2026-03-04

## 1. Tổng quan workflow async

### A. Import Pipeline (relay chain — đã có widget)

| Endpoint | Vai trò | Thời gian | Tracking |
|----------|---------|-----------|----------|
| `POST /api/upload/products` | Upload + parse file | ~1s response | Trả `batchId` |
| `POST /api/internal/import-chunk` | Import 300 sản phẩm/hop | ~10-30s/hop | `rowsProcessed` trong DB |
| `POST /api/internal/score-batch` | Chấm điểm 150 SP/hop | ~30-60s/hop | `scoredCount` trong DB |
| `GET /api/imports/[id]/status` | Poll tiến độ | <100ms | Trả `progress` 0-100 |
| `GET /api/imports/active` | Batch đang chạy | <100ms | Widget toàn cục |
| `GET /api/cron/retry-scoring` | Cron retry mỗi 5 phút | ~5-30s | Không UI |

**Công thức progress:** Import 0-25% (`rowsProcessed/recordCount×25`) + Scoring 25-100% (`scoredCount/recordCount×75`)

### B. TikTok Studio Import (đã có widget)

| Endpoint | Vai trò | Thời gian | Tracking |
|----------|---------|-----------|----------|
| `POST /api/sync/tiktok-studio` | Upload + parse multi-file | ~1-2s response | Trả `batchId` |
| Dùng chung relay chain import/score | — | — | Chung pipeline |

### C. AI Generation — CHƯA có widget

| Endpoint | Vai trò | Thời gian | Tracking |
|----------|---------|-----------|----------|
| `POST /api/briefs/generate` | Tạo 1 brief | 5-15s | Không |
| `POST /api/briefs/batch` | Tạo N briefs tuần tự | N×5-15s (50-150s cho 10 SP) | **Không** |
| `POST /api/briefs/[id]/regenerate` | Tạo lại 1 brief | 5-15s | Không |
| `POST /api/channels/generate` | Tạo channel profile | 5-20s | Không |
| `POST /api/channels/[id]/character-bible/generate` | Tạo character bible | 10-30s | Không |
| `POST /api/channels/[id]/video-bible/generate` | Tạo video bible | 10-30s | Không |
| `POST /api/channels/[id]/idea-matrix/generate` | Tạo idea matrix | 10-30s | Không |
| `POST /api/channels/[id]/series/[sid]/episodes/generate` | Tạo episodes | 5-15s | Không |
| `POST /api/channels/[id]/refresh-tactics` | Làm mới chiến thuật | 10-30s | Không |

### D. AI Reports & Learning — CHƯA có widget

| Endpoint | Vai trò | Thời gian | Tracking |
|----------|---------|-----------|----------|
| `POST /api/ai/weekly-report` | Báo cáo tuần AI | 10-30s | Không |
| `POST /api/reports/weekly` | Báo cáo sản xuất tuần | 5-20s | Không |
| `POST /api/learning/trigger` | Chu kỳ học từ feedback | 10-30s | Không |

### E. Scoring trực tiếp — CHƯA có widget

| Endpoint | Vai trò | Thời gian | Tracking |
|----------|---------|-----------|----------|
| `POST /api/score` | Chấm điểm batch (blocking) | 5-30s+ | Không |
| `POST /api/inbox/score-all` | Chấm tất cả identity | vài phút | **Không** |
| `POST /api/inbox/[id]/score` | Chấm 1 identity | <2s | Không cần |

### F. Export & File Generation — không cần widget

| Endpoint | Vai trò | Thời gian | Tracking |
|----------|---------|-----------|----------|
| `GET /api/production/[batchId]/export-pack` | Tạo ZIP production pack | 1-5s | Download trực tiếp |
| `GET /api/products/[id]/gallery/zip` | ZIP ảnh gallery | 2-10s | Download trực tiếp |
| `GET /api/export/sheet` | Export CSV top 100 | <1s | Download trực tiếp |

### G. Inbox Processing — không cần widget

| Endpoint | Vai trò | Thời gian | Tracking |
|----------|---------|-----------|----------|
| `POST /api/inbox/paste` | Parse URLs, tạo items | 0.5-2s/link | Không cần |
| `POST /api/inbox/items/[id]/retry` | Retry 1 item | 0.5-2s | Không cần |

### H. Repair & Maintenance

| Endpoint | Vai trò | Thời gian | Tracking |
|----------|---------|-----------|----------|
| `POST /api/internal/repair-identity-links` | Sửa link Product→Identity | 5-60s | Trả count khi xong |

---

## 2. Workflow nào ĐÃ có widget

| Workflow | Component | Hook | Polling |
|----------|-----------|------|---------|
| Import pipeline (upload→import→score) | `ImportProgressWidget` (floating, mọi trang) | `useActiveImportBatch` | 2s |
| Import pipeline (trang /sync) | `UploadProgress` + `ProcessLog` | `useImportPolling` | 3s |
| TikTok Studio import | `TikTokStudioDropzone` | `useImportPolling` | 3s |
| Import auto-resume | `SyncPageContent` | Poll `/api/upload/import/active` on mount | — |

---

## 3. Workflow CẦN widget (>3s, user cần biết tiến độ)

### Ưu tiên CAO (thường xuyên dùng, >10s, dễ timeout)

| Workflow | Thời gian | Lý do cần | Mức ưu tiên |
|----------|-----------|-----------|-------------|
| **Batch brief generation** | 50-150s (10 SP) | Dễ timeout, user không biết đang chạy | **P0** |
| **Score all identities** | vài phút | Blocking, không feedback | **P0** |
| **Idea matrix generation** | 10-30s | Cần bible + format trước, dễ nhầm tưởng bị treo | **P1** |

### Ưu tiên TRUNG BÌNH (dùng ít hơn, 5-30s)

| Workflow | Thời gian | Lý do cần | Mức ưu tiên |
|----------|-----------|-----------|-------------|
| Character bible generation | 10-30s | User chờ trên trang channel | **P2** |
| Video bible generation | 10-30s | User chờ trên trang channel | **P2** |
| Weekly report (AI) | 10-30s | User chờ trên dashboard | **P2** |
| Tactical refresh | 10-30s | User chờ trên trang channel | **P2** |
| Learning trigger | 10-30s | Admin action, hiếm dùng | **P3** |

### KHÔNG cần widget (đã đủ hoặc quá nhanh)

- Single brief generate (5-15s) — inline loading state đủ
- Single identity score (<2s) — inline loading state đủ
- Channel profile generate (5-20s) — đã có loading button trong form
- Episode generate (5-15s) — inline loading state đủ
- File exports — browser download tự handle
- Inbox paste — nhanh, inline feedback đủ

---

## 4. Đề xuất mở rộng widget system

### 4.1 Kiến trúc đề xuất: Unified Task Tracker

Thay vì mỗi workflow tự tạo widget riêng, mở rộng widget hiện tại thành **multi-task tracker**.

```
┌─────────────────────────────────────┐
│  Trạng thái hệ thống          [×]  │
│                                     │
│  ⟳ Đang tạo 8 briefs... (3/8)     │
│  ✓ Import 300 SP — Hoàn thành     │
│  ⟳ Đang chấm điểm inbox...       │
│                                     │
└─────────────────────────────────────┘
```

### 4.2 Database: bảng `BackgroundTask`

```prisma
model BackgroundTask {
  id        String   @id @default(cuid())
  type      String   // "brief_batch" | "score_all" | "idea_matrix" | "bible_gen" | ...
  status    String   @default("pending") // pending | processing | completed | failed
  label     String   // "Tạo 8 briefs" — hiển thị cho user
  progress  Int      @default(0) // 0-100
  detail    String?  // "3/8 briefs" — chi tiết phụ
  error     String?
  channelId String?  // nullable, liên kết channel nếu có
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 4.3 API mới

| Endpoint | Vai trò |
|----------|---------|
| `GET /api/tasks/active` | Trả tất cả task đang chạy (polling mỗi 2s) |
| `POST /api/tasks` | Tạo task mới (server-side gọi khi bắt đầu workflow) |
| `PATCH /api/tasks/[id]` | Cập nhật progress/status (server-side gọi trong quá trình xử lý) |

### 4.4 Client hook

```typescript
// lib/hooks/use-active-tasks.ts
function useActiveTasks() {
  // Poll GET /api/tasks/active mỗi 2s
  // Trả về: { tasks: BackgroundTask[], hasActive: boolean }
}
```

### 4.5 Widget cải tiến

```
ImportProgressWidget → TaskProgressWidget
- Hiển thị TẤT CẢ task đang chạy, không chỉ import
- Mỗi task 1 dòng: icon + label + trạng thái text
- Click vào task → navigate tới trang liên quan
- Auto-hide khi không còn task active (sau 10s)
- Vẫn floating bottom-right, mọi trang
```

### 4.6 Lộ trình triển khai

| Phase | Nội dung | Ưu tiên |
|-------|---------|---------|
| **Phase 1** | Tạo bảng `BackgroundTask`, API CRUD, refactor widget | Nền tảng |
| **Phase 2** | Tích hợp batch brief + score-all (P0) | Cao |
| **Phase 3** | Tích hợp idea matrix, bible gen, weekly report (P1-P2) | Trung bình |
| **Phase 4** | Migrate import pipeline sang dùng chung `BackgroundTask` | Thấp (đã hoạt động tốt) |

### 4.7 Backward compatibility

- Import pipeline hiện tại (`ImportBatch` + `useActiveImportBatch`) vẫn hoạt động song song
- Phase 4 mới merge vào unified system khi ổn định
- Widget mới đọc cả `BackgroundTask` lẫn `ImportBatch` (union)
