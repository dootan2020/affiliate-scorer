# Fix 2 lỗi trang Sản xuất

## Bug 1: Thứ tự tab sai

Hiện tại: "Đang sản xuất" / "Tạo mới" / "Đã hoàn thành"
Đúng phải là: **"Tạo mới" → "Đang sản xuất" → "Đã hoàn thành"**

Theo đúng workflow: tạo trước → đang làm → xong.

## Bug 2: Lỗi khi tạo brief

Chọn SP → bấm "Tạo Briefs" → lỗi: `Cannot read properties of undefined (reading 'find')`

Có thể do thay đổi lúc loại bỏ hardcoded AI config — code đang gọi `.find()` trên config/model list mà object undefined. Kiểm tra luồng tạo brief từ đầu đến cuối, đặc biệt chỗ đọc AI task config từ Settings DB.

## Test

1. Tab hiện đúng thứ tự: Tạo mới → Đang sản xuất → Đã hoàn thành
2. Chọn 1 SP → tạo brief → thành công, không lỗi
3. Brief mới hiện trong tab "Đang sản xuất"

Build 0 lỗi.
