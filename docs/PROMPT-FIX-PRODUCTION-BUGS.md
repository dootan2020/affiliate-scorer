# Fix 3 lỗi trang /production

## Bug 1: Thiếu nút "Tải Packs sản xuất"

Tab "Đang sản xuất" không còn nút tải 3 file tổng hợp (checklist.csv, prompts.json, scripts.md) như trước. Nút này rất quan trọng — user cần export packs để làm việc offline.

**Cần:** Thêm lại nút "📥 Tải Packs sản xuất" vào mỗi brief card trong tab "Đang sản xuất". Giữ nguyên logic tạo 3 file như trước khi rewrite.

## Bug 2: Ảnh SP bị lỗi hiển thị

Tab "Đang sản xuất" và "Đã hoàn thành" đều hiện alt text thay vì ảnh (xem screenshot: "[Hộp đựng tiền tiết...]", "[GÓI LỚN]", "[Phân Bón Lá Siêu...]").

**Nguyên nhân có thể:** imageUrl null/undefined, hoặc src truyền sai field, hoặc ảnh bị CORS/broken link.

**Cần:** Kiểm tra imageUrl có đúng không. Nếu null thì hiện placeholder icon (Package hoặc ImageOff). Nếu có URL thì hiện ảnh đúng, thêm onError fallback.

## Bug 3: Tab "Tạo mới" không có ảnh SP

Danh sách chọn sản phẩm chỉ hiện tên + category + giá, không có ảnh thumbnail.

**Cần:** Thêm ảnh nhỏ (32x32 hoặc 40x40) bên trái mỗi item trong danh sách chọn SP. Nếu không có ảnh thì hiện placeholder.

## Test

1. Tab "Đang sản xuất": brief card có nút "📥 Tải Packs sản xuất", bấm tải được 3 file
2. Ảnh SP hiện đúng ở cả 3 tab (không hiện alt text)
3. SP không có imageUrl → hiện icon placeholder, không lỗi
4. Tab "Tạo mới": mỗi SP trong list có thumbnail ảnh bên trái

Build 0 lỗi.
