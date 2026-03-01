# Fix State Machine Issues — Toàn bộ hệ thống

## Tham khảo
Đọc `docs/state-machines.md` để hiểu toàn bộ state machines hiện tại.

## Vấn đề cần fix

### CRITICAL

**1. Learning Loop không per-channel**
`updateLearningWeights()` tính reward chung, không phân biệt kênh. Khi có nhiều kênh (khác persona, format) → weight trung bình vô nghĩa. Cần learning weights per-channel.

**2. Race condition brief generation**
`generateBrief()` tạo brief + assets + update inboxState không trong transaction. 2 tab cùng generate cho 1 SP → 2 briefs, data inconsistent. Cần wrap trong transaction + check-before-write.

### HIGH

**3. Thiếu transitions quan trọng**
Thêm các transitions còn thiếu:
- `briefed → archived` (bỏ SP đã brief)
- `published → archived` (gỡ video)
- `failed → draft` (retry asset lỗi)
- `skipped → planned` (reactivate slot)
- `published → produced` (unpublish sửa lại)

**4. ProductionBatch stuck forever**
Chỉ có `active → done`. Nếu 1 asset fail → batch không bao giờ done. Thêm `failed` và `cancelled` status. Logic: nếu tất cả assets completed/archived → done. Nếu có asset failed và không còn active → failed.

**5. `logged` terminal nhưng metrics thay đổi**
Video logged lúc đăng 1000 views, tuần sau 50000. Cần cơ chế re-capture metrics cho assets đã logged. Không phải new state — mà là cho phép update VideoTracking record của asset đã logged.

**6. Slot sync 2 chiều + phân biệt rendered**
- Sync phải hoạt động cả chiều ngược (asset `published → produced` → slot cũng quay về)
- Thêm slot status `rendered` để phân biệt với `produced` trên Calendar

### MEDIUM

**7. Campaign `paused → cancelled`**
Thêm transition trực tiếp, không cần resume trước.

**8. DataImport + InboxItem retry**
- DataImport: thêm `failed → pending` để retry
- InboxItem: thêm `failed → pending` để retry paste link
- DataImport partial: clarify — rows thành công đã commit hay rollback?

**9. Brief orphan cleanup**
Khi brief bị replaced → assets ở status `draft` của brief cũ nên tự chuyển `archived`. Không để orphan.

**10. Lifecycle + DeltaType auto-refresh**
Hiện tại chỉ tính khi có người gọi. Cần logic: mỗi lần import mới (DataImport completed) → tự recalculate lifecycle + deltaType cho tất cả SP affected.

### LOW

**11. Commission thêm pending**
Thêm `pending → confirmed` thay vì tạo thẳng confirmed. Cho phép review trước.

**12. Slot rendered vs produced**
Thêm status `rendered` vào ContentSlot enum để Calendar view phân biệt được.

## Yêu cầu

- Nghiên cứu code hiện tại trước khi sửa
- Trình bày kế hoạch phases cho tôi duyệt trước khi implement
- Update `docs/state-machines.md` sau khi fix để phản ánh state machines mới
- Đọc STANDARDS.md trước khi code
