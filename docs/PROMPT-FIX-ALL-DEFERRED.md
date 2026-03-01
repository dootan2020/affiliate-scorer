# Fix tất cả Deferred Items từ Audit

## Danh sách 14 items cần fix

### Logic (ưu tiên cao)

**L10 — Morning brief channel awareness**
Bản tin sáng đang đề xuất SP ngẫu nhiên, không liên quan kênh. Cần:
- Query active channels + slots hôm nay + draft assets
- AI prompt phải biết: kênh nào cần làm gì, SP nào đang chờ brief, video nào cần sản xuất
- Trường hợp chưa có kênh → đề xuất tạo kênh đầu tiên
- Trường hợp có kênh chưa có video → đề xuất tạo brief đầu tiên
- Trường hợp có kênh có tracking data → đề xuất dựa trên data

**L5 — Orphan data detection**
Cần cơ chế phát hiện data mồ côi:
- SP trong Inbox không có brief nào
- Brief không có asset
- Asset không có slot
- Slot không có tracking
Hiển thị warning hoặc badge ở nơi phù hợp (dashboard hoặc channel detail).

**L9 — Channel aggregate stats**
Channel detail thiếu tổng quan. Thêm:
- Tổng videos (by status: draft/produced/published)
- Tổng views, avg views (từ tracking)
- Tổng/avg conversion (từ tracking)
- Winning products count

### UI Consistency (batch fix)

**U2 — Migrate inline buttons → shared Button component**
Scan toàn bộ, thay thế inline button/a tags bằng Button component từ ui/button. Làm theo batch, không cần perfect — chỉ cần consistent.

**U3 — Card padding standardization**
Chọn 1 convention (p-4 cho compact, p-6 cho spacious) và apply toàn bộ.

**U4 — Badge padding standardization**
Chọn 1 convention và apply toàn bộ.

**U8 — Empty state icon sizes**
Standardize w-12 h-12 cho tất cả empty states.

**U9 — Mixed skeleton + spinner loading**
Chọn 1 pattern: skeleton cho page load, spinner cho action loading. Apply toàn bộ.

### Responsive

**R1 — Button min touch target 44px**
Buttons nhỏ hơn 44px → thêm min-h-[44px] min-w-[44px]. Test không break layout.

**R7 — MetricBadge grid trên mobile**
Fix responsive breakpoint.

### Error Handling (còn lại)

**4b — 11 silent catches còn lại**
Thay tất cả empty catch blocks bằng console.error + toast.error hoặc inline error state.

**4c — Missing error UI trên 3+ widgets**
Thêm error state hiển thị cho user.

**4d — Retry buttons cho remaining components**
Thêm nút retry ở các component còn thiếu.

**4e — Remaining misleading empty states**
Phân biệt "đang tải" vs "không có data" vs "lỗi" cho các component còn lại.

## Yêu cầu

Fix tất cả 14 items. Ưu tiên logic (L10, L5, L9) trước, UI batch sau, responsive + error handling cuối. Trình bày kế hoạch phases rồi chạy.
