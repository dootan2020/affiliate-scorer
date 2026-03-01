# Refactor PASTR: Kênh là trung tâm mọi thứ

## Vấn đề nghiêm trọng

PASTR đang hoạt động theo logic "tôi có đống sản phẩm, tạo brief cho từng cái". Sai. Logic đúng phải là "tôi có kênh, kênh cần content gì, sản phẩm nào phục vụ kênh".

Cụ thể:
- **Inbox**: SP import từ FastMoss nằm lơ lửng, không thuộc kênh nào
- **Production**: brief không bắt buộc gắn kênh
- **Calendar**: chung, không per kênh
- **Tracking**: chung, không per kênh
- **Dashboard**: không cho biết "hôm nay làm gì ở kênh nào"
- **SP và Kênh tách rời**: không có quan hệ nhiều-nhiều (1 SP thuộc nhiều kênh)

## Kết quả mong muốn

1. **Kênh = trung tâm.** Mọi thứ (SP, brief, calendar, tracking, insights) xoay quanh kênh.

2. **1 SP thuộc nhiều kênh.** Serum A có thể đăng trên kênh A (góc review) và kênh B (góc so sánh).

3. **Dashboard "Hôm nay làm gì?"** — Mở PASTR → thấy ngay từng kênh cần làm gì hôm nay: bao nhiêu brief cần tạo, video cần sản xuất, video cần đăng.

4. **Flow hàng ngày:** Dashboard → chọn kênh → thấy việc cần làm → làm.

5. **Brief bắt buộc thuộc kênh.** channelId required, không optional.

## Yêu cầu

Nghiên cứu toàn bộ codebase hiện tại (schema, API, pages, components). Đánh giá những gì cần thay đổi, những gì giữ nguyên được. Đưa ra giải pháp cụ thể rồi mới implement — đừng code ngay. Trình bày kế hoạch cho tôi duyệt trước.
