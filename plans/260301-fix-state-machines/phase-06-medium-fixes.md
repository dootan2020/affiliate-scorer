# Phase 6: Medium Priority Fixes

**Priority:** MEDIUM
**Depends on:** Phase 1
**Issues:** #5, #7, #8, #9, #10
**Status:** Pending

---

## Issue #5: `logged` Terminal But Metrics Change

**Problem:** Video logged lúc 1K views, tuần sau 50K. Không có cách update metrics.

**Solution:** KHÔNG thay đổi state machine. `logged` vẫn terminal. Thay vào đó, cho phép tạo thêm `AssetMetric` records cho asset đã logged.

**File:** `app/api/metrics/capture/route.ts`

Hiện tại route có thể đã hỗ trợ (AssetMetric là 1:many). Cần verify và ensure:

```typescript
// Remove check that blocks metric capture for logged assets (if exists)
// Allow creating new AssetMetric for any asset regardless of status

// After creating new metric for logged asset:
// 1. Recalculate reward
// 2. Update learning weights with DELTA reward (new - old)
const deltaReward = newReward - previousReward;
if (Math.abs(deltaReward) > 0.01) {
  await updateLearningWeights(assetContext, deltaReward);
}
```

**VideoTracking update:** Allow PUT on `app/api/tracking/route.ts` to update existing VideoTracking records.

---

## Issue #7: Campaign `paused → cancelled`

**Problem:** Campaign paused không thể cancelled trực tiếp.

**Solution:** Already defined in Phase 1 state machine:
```typescript
paused: ["running", "completed", "cancelled"],  // cancelled added
```

**File:** `app/api/campaigns/[id]/route.ts` hoặc wherever campaign status is updated.

Cần verify campaign PATCH/PUT handler uses `assertTransition()` from Phase 1. Nếu chưa có handler — tạo minimal one:

```typescript
// PUT /api/campaigns/[id]
if (body.status) {
  assertTransition("campaignStatus", campaign.status, body.status);
  await prisma.campaign.update({
    where: { id },
    data: { status: body.status },
  });
}
```

---

## Issue #8: DataImport + InboxItem Retry

### DataImport retry: `failed → pending`

**File:** `app/api/upload/import/process-import.ts` hoặc tạo retry route.

Option: Thêm PATCH endpoint cho DataImport:

```typescript
// PATCH /api/upload/imports/[id]
// Allow: failed → pending (retry)
assertTransition("importStatus", dataImport.status, "pending");

await prisma.dataImport.update({
  where: { id },
  data: {
    status: "pending",
    errorLog: null,        // Clear old errors
    rowsImported: 0,       // Reset counters
    rowsError: 0,
  },
});

// Re-trigger processing
// Note: original file data might not be available — need to store file reference
```

**Caveat:** DataImport may not store the original file. If file is ephemeral (uploaded, processed, discarded), retry needs the file again. Check if file data is stored.

**DataImport partial clarification:** Research shows `process-import.ts` commits successful rows individually in a for-loop, then sets status `partial` if some failed. So: **successful rows ARE committed, failed rows are skipped.** Clarify this in docs.

### InboxItem retry: `failed → pending`

**File:** `app/api/inbox/route.ts` hoặc tạo retry endpoint.

```typescript
// PATCH /api/inbox/items/[id]/retry
assertTransition("inboxItemStatus", item.status, "pending");

await prisma.inboxItem.update({
  where: { id },
  data: { status: "pending" },
});

// Re-process the item
await processInboxItem(item.rawUrl);
```

---

## Issue #9: Brief Orphan Cleanup

**Problem:** Khi brief bị `replaced`, assets ở `draft` của brief cũ bị orphan.

**File:** `app/api/briefs/[id]/regenerate/route.ts`

Thêm cleanup logic SAU khi mark brief as replaced:

```typescript
// After: await tx.contentBrief.update({ data: { status: "replaced" } });

// Archive orphaned draft assets from replaced brief
await tx.contentAsset.updateMany({
  where: {
    briefId: oldBriefId,
    status: "draft",  // Only draft — produced/published assets should stay
  },
  data: { status: "archived" },
});
```

**Important:** Chỉ archive assets ở `draft`. Assets đã `produced`, `rendered`, `published` thuộc brief cũ vẫn giữ nguyên (đang dùng).

---

## Issue #10: Lifecycle + DeltaType Auto-Refresh

**Problem:** Lifecycle và deltaType chỉ tính khi import mới hoặc on-demand. Không auto-refresh khi data cũ.

**Current trigger points:**
- `syncProductIdentity()` — called on product import → computes deltaType
- `getProductLifecycle()` — called on-demand from `/api/ai/intelligence`
- NO scheduled recalculation

**Solution:** Trigger recalculation after DataImport completes.

**File:** `app/api/upload/products/route.ts` (lines 289-307)

Sau khi scoring completes, add lifecycle recalc:

```typescript
scoreProducts({ batchId: batch.id })
  .then(async () => {
    // Existing: sync scores to identities
    await syncIdentityScores(identityIds);

    // NEW: Recalculate lifecycle for all affected products
    for (const identityId of identityIds) {
      const identity = await prisma.productIdentity.findUnique({
        where: { id: identityId },
        include: { product: { select: { id: true } } },
      });
      if (identity?.product) {
        const lifecycle = await getProductLifecycle(identity.product.id);
        await prisma.productIdentity.update({
          where: { id: identityId },
          data: { lifecycleStage: lifecycle.stage },
        });
      }
    }
  })
  .catch((err) => {
    console.error("Post-import processing failed (non-blocking):", err);
  });
```

**Note:** Lifecycle dùng ProductSnapshot so sánh 2 snapshots gần nhất. Import mới tạo snapshot mới → lifecycle tự cập nhật. Chỉ cần ensure `lifecycleStage` field được persist vào ProductIdentity.

---

## Implementation Steps

- [ ] #5: Verify AssetMetric allows multiple records per asset. Allow re-capture for logged assets. Implement delta reward update.
- [ ] #7: Ensure campaign PATCH handler uses assertTransition. Verify paused→cancelled works.
- [ ] #8a: Create DataImport retry endpoint (or add to existing PATCH). Handle file re-upload requirement.
- [ ] #8b: Create InboxItem retry endpoint. Re-process rawUrl.
- [ ] #8: Document partial import behavior (successful rows committed).
- [ ] #9: Add draft asset cleanup in regenerate route (inside transaction from Phase 3).
- [ ] #10: Add lifecycle recalc after product import scoring completes.
- [ ] Compile check

---

## Files to Modify
- `app/api/metrics/capture/route.ts` (#5)
- `app/api/tracking/route.ts` (#5)
- `app/api/campaigns/[id]/route.ts` (#7)
- `app/api/upload/import/` — retry endpoint (#8a)
- `app/api/inbox/` — retry endpoint (#8b)
- `app/api/briefs/[id]/regenerate/route.ts` (#9)
- `app/api/upload/products/route.ts` (#10)

## Files to Create
- `app/api/upload/imports/[id]/retry/route.ts` (or PATCH on existing)
- `app/api/inbox/items/[id]/retry/route.ts` (or PATCH on existing)

---

## Success Criteria
- [ ] Logged assets can receive new metrics and update learning weights
- [ ] Paused campaigns can be directly cancelled
- [ ] Failed DataImport can be retried (with re-upload if needed)
- [ ] Failed InboxItem can be retried
- [ ] Replaced brief's draft assets auto-archived
- [ ] Lifecycle auto-recalculates after import
