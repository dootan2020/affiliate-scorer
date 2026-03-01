# Test: State Machine Fixes — Verification

## Tham khảo
- `lib/state-machines/transitions.ts` — validation engine
- `docs/state-machines.md` — state machines đã cập nhật

## Yêu cầu

Viết và chạy test script verify tất cả state machine fixes. Dùng approach phù hợp nhất với codebase hiện tại (unit test file hoặc script chạy trực tiếp).

---

## Test Cases

### 1. Validation Engine (Phase 1)

```
Test: validateTransition() cho phép transitions hợp lệ
Test: validateTransition() reject transitions không hợp lệ
Test: assertTransition() throw error với message rõ ràng

Cụ thể verify:
- inboxState: "briefed" → "archived" = valid (mới thêm)
- inboxState: "archived" → "new" = invalid (terminal)
- assetStatus: "failed" → "draft" = valid (retry, mới thêm)
- assetStatus: "published" → "produced" = valid (unpublish, mới thêm)
- assetStatus: "published" → "archived" = valid (gỡ video, mới thêm)
- assetStatus: "logged" → bất kỳ = invalid (terminal)
- slotStatus: "skipped" → "planned" = valid (reactivate, mới thêm)
- slotStatus: có "rendered" trong state machine
- batchStatus: "active" → "failed" = valid (mới thêm)
- batchStatus: "active" → "cancelled" = valid (mới thêm)
- campaignStatus: "paused" → "cancelled" = valid (mới thêm)
- commissionStatus: "pending" → "confirmed" = valid (mới thêm)
- importStatus: "failed" → "pending" = valid (retry, mới thêm)
- inboxItemStatus: "failed" → "pending" = valid (retry, mới thêm)
```

### 2. Race Condition Protection (Phase 3)

```
Test: generateBrief() dùng $transaction (verify code structure)
Test: Optimistic lock — updateMany với WHERE inboxState IN [...] 
Test: Orphan cleanup — brief replaced → draft assets archived
```

Cách test: Đọc code `lib/content/generate-brief.ts`, verify:
- Có `prisma.$transaction()` wrap brief + assets + inboxState
- Có `updateMany` với WHERE condition (không phải `update`)
- Có cleanup draft assets khi replace

### 3. Learning Per-Channel (Phase 4)

```
Test: Schema có channelId trong LearningWeightP4
Test: @@unique constraint gồm [scope, key, channelId]
Test: updateLearningWeights() nhận channelId parameter
Test: upsertWeight() ghi 2 records (channel + global) khi có channelId
Test: explore-exploit query fallback: channel-specific → global
```

Cách test: 
- Check `prisma/schema.prisma` — LearningWeightP4 model
- Check `lib/learning/update-weights.ts` — channelId trong function signature + dual write
- Check `lib/learning/explore-exploit.ts` — query có filter channelId

### 4. Batch Auto-Complete (Phase 2)

```
Test: checkBatchCompletion() exists trong lib/services/batch-status.ts
Test: Logic: tất cả assets terminal + có failed → batch "failed"
Test: Logic: tất cả assets terminal + không failed → batch "done"
Test: Logic: còn asset active → batch giữ "active"
Test: Được gọi sau mỗi asset status change
```

Cách test: Đọc code verify logic, check asset PATCH route có gọi checkBatchCompletion().

### 5. Slot Sync + Rendered (Phase 5)

```
Test: ASSET_TO_SLOT_STATUS mapping có rendered → "rendered" (không phải "produced")
Test: ASSET_TO_SLOT_STATUS mapping có failed → "skipped"
Test: slotStatus state machine có "rendered" state
Test: Calendar UI handle "rendered" status (badge color/label)
```

### 6. Medium Fixes (Phase 6)

```
Test: Metrics capture cho phép logged assets nhận metric mới
Test: Delta reward — có tính difference (new - old) khi re-capture
Test: InboxItem retry endpoint tồn tại (app/api/inbox/items/[id]/retry/)
Test: Commission tạo mới mặc định status = "pending" (không phải "confirmed")
Test: Commission PATCH endpoint validate transitions
```

### 7. API Integration

```
Test: PATCH /api/assets/[id] gọi assertTransition() trước update
Test: PUT /api/inbox/[id] gọi assertTransition() trước update  
Test: Asset PATCH với transition invalid → trả 400 + error message rõ
Test: Asset PATCH archived → draft → trả 400 (archived là terminal)
```

---

## Output mong đợi

Báo cáo dạng:
```
✅ PASS: [test name]
❌ FAIL: [test name] — [lý do]
⚠️ SKIP: [test name] — [lý do không test được]
```

Nếu có FAIL → liệt kê file + dòng code cần fix, nhưng KHÔNG tự fix. Báo cáo cho tôi trước.
