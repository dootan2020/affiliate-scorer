# Cập nhật trang Hướng dẫn (/guide)

## Lý do

Workflow trang Sản xuất đã thay đổi (3 tab mới, copy buttons, regenerate, status tracking). Trang Settings cũng đã thay đổi (AI config do user tự cấu hình, không còn hardcoded). Trang hướng dẫn cần phản ánh đúng thực tế.

## Cần cập nhật

### 1. Phần "Sản xuất" trong hướng dẫn
Mô tả đúng workflow mới:
- 3 tab: "Đang sản xuất" / "Tạo mới" / "Đã hoàn thành"
- Flow: chọn SP (có điểm tiềm năng) → tạo brief → copy prompt Kling/Veo3 từng scene → copy caption + hashtags → tracking trạng thái video → hoàn thành
- Nút "Tạo lại" khi brief không tốt (3 lần/ngày)
- 3 loại link SP (TikTok Shop, FastMoss SP, FastMoss Shop)
- Tải Packs sản xuất (3 file)
- Brief persist trong DB, không mất khi rời trang

### 2. Phần "Cấu hình AI" trong hướng dẫn
Mô tả đúng flow mới:
- User tự thêm API key trong Settings (không còn mặc định sẵn)
- Chọn provider + model cho từng task
- Phải cấu hình trước khi dùng bất kỳ tính năng AI nào

### 3. Kiểm tra toàn bộ các phần khác
Rà soát tất cả sections trong /guide — nếu có phần nào mô tả cũ không còn đúng thì cập nhật luôn.

## Test

1. Đọc phần Sản xuất trong hướng dẫn → mô tả đúng 3 tab, copy buttons, regenerate, status tracking
2. Đọc phần Cấu hình AI → mô tả đúng flow tự cấu hình, không đề cập hardcoded
3. Không còn thông tin cũ/sai ở bất kỳ phần nào

Build 0 lỗi.
