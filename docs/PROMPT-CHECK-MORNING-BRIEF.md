# Check Logic "Bản tin sáng" trên Dashboard

## Vấn đề

Sau khi xóa toàn bộ dữ liệu test, Bản tin sáng vẫn hiện nội dung cũ (đề xuất SP, số video, v.v.). Nghi cache chưa clear.

## Yêu cầu

1. Tìm xem Bản tin sáng được cache ở đâu (localStorage? database table? API cache? revalidate interval?)
2. Clear cache cũ
3. Verify: sau khi clear, reload Dashboard → Bản tin sáng phải generate mới dựa trên data thực tế hiện tại (database trống)
4. Kiểm tra logic generate: khi không có kênh, không có SP, không có video → bản tin nên nói gì? Phải phù hợp với trạng thái thực tế, không đề xuất SP không tồn tại.
