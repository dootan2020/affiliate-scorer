# Phase 2: Missing Transitions + ProductionBatch Fix

**Priority:** HIGH
**Depends on:** Phase 1 (validation engine)
**Issues:** #3 (missing transitions), #4 (ProductionBatch stuck)
**Status:** Pending

---

## Issue #3: Missing Transitions

5 transitions thiếu đã được define trong Phase 1 STATE_MACHINES. Phase này implement logic thực tế cho từng transition.

### 3a. `briefed → archived` (Inbox Pipeline)

**File:** `app/api/inbox/[id]/route.ts`

Hiện tại PUT route xử lý enrichment (`new → enriched`). Cần mở rộng để hỗ trợ archive từ mọi state cho phép.

```typescript
// Thêm vào PUT handler
if (body.inboxState === "archived") {
  assertTransition("inboxState", identity.inboxState, "archived");
  await prisma.productIdentity.update({
    where: { id },
    data: { inboxState: "archived" },
  });
  return NextResponse.json({ data: { id, inboxState: "archived" } });
}
```

### 3b. `published → archived` (ContentAsset)

**File:** `app/api/assets/[id]/route.ts`

PATCH route hiện nhận bất kỳ status. Sau Phase 1, validation engine sẽ tự cho phép `published → archived`. Chỉ cần ensure PATCH handler gọi `assertTransition()`.

**Side effect:** Khi asset chuyển `archived`, call `syncSlotStatusFromAsset()` → slot chuyển `skipped`. Đã hoạt động vì mapping `archived → skipped` đã có.

### 3c. `failed → draft` (ContentAsset retry)

**File:** `app/api/assets/[id]/route.ts`

Cho phép retry asset bị lỗi. Validation engine đã cho phép `failed → draft`. Khi reset về draft:
- Clear error-related fields nếu có
- Reset `version` nếu cần

```typescript
// Trong PATCH handler, sau assertTransition:
if (newStatus === "draft" && currentStatus === "failed") {
  // Reset asset to draft state for retry
  updateData.complianceStatus = "unchecked";
  updateData.complianceNotes = null;
}
```

### 3d. `skipped → planned` (ContentSlot reactivate)

**File:** `app/api/calendar/slots/[id]/route.ts`

Cho phép reactivate slot đã skip. Validation engine đã cho phép.

### 3e. `published → produced` (ContentAsset unpublish)

**File:** `app/api/assets/[id]/route.ts`

Cho phép rollback video đã publish. Side effect: `syncSlotStatusFromAsset()` cần cập nhật slot.

---

## Issue #4: ProductionBatch stuck forever

**Problem:** Chỉ có `active → done`. Nếu 1 asset fail → batch stuck vĩnh viễn.

### Schema Change

```prisma
// ProductionBatch.status: "active" | "done" | "failed" | "cancelled"
// Không cần migration vì là String field, không phải enum
```

Không cần Prisma migration — `status` là `String` field, giá trị mới tự hoạt động.

### Auto-complete Logic

Tạo function `checkBatchCompletion()` trong `lib/services/batch-status.ts`:

```typescript
export async function checkBatchCompletion(batchId: string): Promise<string> {
  const batch = await prisma.productionBatch.findUnique({
    where: { id: batchId },
    include: { assets: { select: { status: true } } },
  });

  if (!batch || batch.status !== "active") return batch?.status ?? "unknown";

  const statuses = batch.assets.map(a => a.status);
  const allTerminal = statuses.every(s =>
    ["published", "logged", "archived", "failed"].includes(s)
  );

  if (!allTerminal) return "active"; // still in progress

  const hasFailed = statuses.some(s => s === "failed");
  const allFailed = statuses.every(s => s === "failed" || s === "archived");

  let newStatus: string;
  if (allFailed) {
    newStatus = "failed";
  } else {
    newStatus = "done";
  }

  await prisma.productionBatch.update({
    where: { id: batchId },
    data: { status: newStatus },
  });

  return newStatus;
}
```

### Integration Points

Gọi `checkBatchCompletion()` mỗi khi asset status thay đổi:

**File:** `app/api/assets/[id]/route.ts` — sau khi update asset status:
```typescript
// After asset status update
if (asset.productionBatchId) {
  await checkBatchCompletion(asset.productionBatchId);
}
```

### Manual Cancel

**File:** Thêm PATCH handler vào `app/api/production/create-batch/route.ts` hoặc tạo route mới `app/api/production/[batchId]/route.ts`:

```typescript
// PATCH /api/production/[batchId]
assertTransition("batchStatus", batch.status, body.status);
await prisma.productionBatch.update({
  where: { id: batchId },
  data: { status: body.status },
});
```

---

## Implementation Steps

- [ ] Implement 5 missing transitions in API routes
- [ ] Add `assertTransition()` calls to each route
- [ ] Create `lib/services/batch-status.ts` with `checkBatchCompletion()`
- [ ] Integrate batch check into asset PATCH handler
- [ ] Add batch cancel/fail API endpoint
- [ ] Test: verify all 5 new transitions work
- [ ] Test: verify batch auto-completes when all assets terminal

---

## Files to Create
- `lib/services/batch-status.ts`
- `app/api/production/[batchId]/route.ts` (nếu chưa có)

## Files to Modify
- `app/api/assets/[id]/route.ts`
- `app/api/inbox/[id]/route.ts`
- `app/api/calendar/slots/[id]/route.ts`

---

## Success Criteria
- [ ] `briefed → archived` works via PUT /api/inbox/[id]
- [ ] `published → archived` works via PATCH /api/assets/[id]
- [ ] `failed → draft` works via PATCH /api/assets/[id]
- [ ] `skipped → planned` works via PATCH /api/calendar/slots/[id]
- [ ] `published → produced` works via PATCH /api/assets/[id]
- [ ] ProductionBatch auto-transitions to `done` or `failed`
- [ ] ProductionBatch can be manually `cancelled`
