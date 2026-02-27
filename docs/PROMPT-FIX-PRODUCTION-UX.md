# Cải thiện UX trang /production

## Vấn đề hiện tại

1. **Briefs biến mất khi rời trang** — Tạo brief xong, chuyển trang khác, quay lại /production thì brief mất hết
2. **Thiếu thông tin SP** — Muốn xem ảnh, giá, link SP phải quay /inbox
3. **Copy paste thủ công** — Không có nút copy nhanh cho prompt Kling/Veo3, caption, hashtags
4. **Không tạo lại brief được** — Brief không tốt thì phải xóa rồi làm lại từ đầu
5. **Không track tiến độ** — Không biết video nào đã quay, đã đăng, đã bỏ

## Kết quả cần đạt

### 1. Trang /production có 3 tab
- **"Tạo mới"**: Flow hiện tại (chọn SP → tạo brief)
- **"Đang sản xuất"**: Load briefs đã tạo từ DB, nhóm theo ngày. Mặc định mở tab này nếu có briefs
- **"Đã hoàn thành"**: Briefs đã đăng xong hoặc đã thay thế

### 2. Brief card hiện thông tin SP
Hiện ngay trong card: ảnh SP, tên, giá, rating, số đã bán, và 3 loại link:
- 🛒 **TikTok Shop**: `https://shop.tiktok.com/view/product/{externalId}?region=VN&local=en`
- 📊 **FastMoss SP**: `https://www.fastmoss.com/zh/e-commerce/detail/{externalId}`
- 🏪 **FastMoss Shop**: `https://www.fastmoss.com/zh/shop-marketing/detail/{shopId}`

Mỗi link mở tab mới. Có nút "📋 Copy link TikTok" riêng (dùng gắn giỏ hàng).

Kiểm tra DB có field `externalId` và `shopId` trong ProductIdentity chưa — nếu thiếu thì thêm migration + cập nhật parser FastMoss.

### 3. Nút copy cho từng phần
- Từng scene: nút **[📋 Kling]** và **[📋 Veo3]** copy prompt tương ứng
- **[📋 Copy script]** — copy toàn bộ script
- **[📋 Copy tất cả (caption + hashtags)]** — 1 click, paste thẳng lên TikTok

### 4. Nút "🔄 Tạo lại" brief
- Hiện trên mỗi brief card
- Bấm → confirm → tạo 3 brief mới cho cùng SP
- Brief cũ chuyển status "replaced", hiện trong Tab "Đã hoàn thành" với nhãn "(Đã thay thế)" — KHÔNG xóa
- Giới hạn 3 lần/SP/ngày

### 5. Tracking tiến độ từng video
Mỗi asset (video) có radio buttons trạng thái: **Chưa quay → Đã quay → Đang edit → Đã đăng → Bỏ**

Lưu DB, reload vẫn giữ. Khi tất cả assets "Đã đăng" hoặc "Bỏ" → brief tự chuyển sang Tab "Đã hoàn thành".

## Test

1. Tạo brief → rời trang → quay lại → brief vẫn còn
2. Brief card hiện ảnh + 3 link SP đúng format
3. Copy prompt Kling scene 1 → paste đúng nội dung
4. Copy caption + hashtags → paste đủ, cách 1 dòng
5. Tạo lại brief → brief cũ sang "Đã hoàn thành", brief mới hiện
6. Chọn status "Đã quay" → reload → status giữ nguyên
7. SP không có shopId → chỉ hiện 2 link, không lỗi

Build 0 lỗi.
