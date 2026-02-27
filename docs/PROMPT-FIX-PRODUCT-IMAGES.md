# Cải thiện ảnh sản phẩm toàn app

## Thay đổi

1. **Tăng kích thước ảnh SP từ 36px → 48px** — áp dụng tất cả nơi hiện ảnh SP: /inbox, /production (cả 3 tab), /dashboard, brief cards, v.v.

2. **Hover preview ảnh phóng to** — Di chuột vào ảnh SP nhỏ thì hiện tooltip/popover ảnh phóng to (~240px), có bo góc + shadow nhẹ. Ẩn khi rời chuột. Áp dụng toàn bộ app, bất kỳ chỗ nào hiện ảnh SP.

Nên tạo 1 component dùng chung (ví dụ ProductThumbnail) rồi replace tất cả chỗ đang render ảnh SP bằng component này. Tránh duplicate code.

## Test

1. Ảnh SP hiện 48x48 ở tất cả các trang
2. Hover vào ảnh → hiện preview lớn ~240px, mượt, không giật layout
3. SP không có ảnh → placeholder 48x48, hover không hiện gì
4. Mobile: không có hover → không ảnh hưởng gì

Build 0 lỗi.
