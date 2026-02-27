# Nghiên cứu & Lập Plan: PASTR — Hệ thống sản xuất video affiliate TikTok Shop

## Bối cảnh

PASTR là webapp hỗ trợ affiliate marketing TikTok Shop. Hiện tại đã có:
- Upload dữ liệu SP từ FastMoss (XLSX), scoring SP bằng AI
- Tạo brief sản xuất (prompt AI video + script + caption + hashtags)
- Trang sản xuất 3 tab (Tạo mới / Đang sản xuất / Đã hoàn thành)

Mục tiêu tiếp theo: Phát triển PASTR thành hệ thống sản xuất video affiliate hoàn chỉnh — từ xây 1 kênh TikTok mẫu → validate → nhân bản ra nhiều kênh.

## Yêu cầu

Dùng agent skill nghiên cứu (web search, đọc docs, phân tích) để tìm hiểu các chủ đề bên dưới, sau đó tổng hợp thành 1 PLAN chi tiết.

---

## Phần 1: Nghiên cứu

### 1.1 Cách xây kênh TikTok affiliate thành công

Nghiên cứu:
- Kênh TikTok affiliate VN thành công đang làm gì? Content mix ra sao?
- Tỷ lệ content hợp lý: giải trí / review / bán hàng trực tiếp
- Tần suất đăng bài tối ưu (bao nhiêu video/ngày)
- Cách xây nhân vật kênh (persona) để giữ follower
- Các niche affiliate nào đang hot trên TikTok Shop VN 2025-2026
- Thời gian trung bình từ tạo kênh → có đơn hàng đầu tiên
- Thời gian trung bình từ tạo kênh → thu nhập ổn định

### 1.2 Các kiểu video affiliate TikTok hiệu quả

Nghiên cứu:
- Liệt kê TẤT CẢ các kiểu video phổ biến cho affiliate TikTok Shop
- Ví dụ: unboxing, review, before/after, POV, storytelling, tutorial, trending sound, so sánh, Q&A, day-in-my-life có sản phẩm...
- Kiểu nào có conversion rate cao nhất? Kiểu nào kéo reach tốt nhất?
- Cấu trúc kịch bản cho từng kiểu: hook → body → CTA
- Góc máy phổ biến cho từng kiểu (talking head, flat lay, close-up, POV, split screen...)
- Thời lượng video tối ưu cho từng kiểu

### 1.3 Chiến lược nhân bản kênh TikTok (matrix)

Nghiên cứu:
- Mô hình "ma trận kênh TikTok" hoạt động thế nào?
- Cách tránh bị TikTok phát hiện trùng lặp content giữa các kênh
- Mỗi kênh cần khác nhau những gì? (nhân vật, giọng nói, style edit, font, màu sắc, góc máy...)
- Tools/phần mềm nào đang được dùng để quản lý nhiều kênh TikTok
- Rủi ro: ban tài khoản, giảm reach, vi phạm chính sách TikTok
- Bao nhiêu kênh là hợp lý để 1 người quản lý?

### 1.4 Workflow sản xuất video affiliate số lượng lớn

Nghiên cứu:
- Affiliate marketer chuyên nghiệp sản xuất 50-100 video/tháng thế nào?
- Quy trình batch production: chuẩn bị material → quay/tạo → edit → đăng
- Dùng AI tool nào ở bước nào (Kling, Picsart Flow, CapCut, ElevenLabs, Canva...)
- Cách tạo nhiều version video từ cùng 1 SP (đổi hook, đổi nhạc, đổi góc máy, đổi text)
- Cách quản lý asset (ảnh, video clip, nhạc, voiceover) cho nhiều SP × nhiều kênh

### 1.5 Tracking & Optimization

Nghiên cứu:
- Metrics nào quan trọng nhất cho affiliate TikTok? (views, CTR, conversion rate, RPM...)
- Cách xác định "SP win" — tiêu chí gì, sau bao nhiêu video, bao nhiêu ngày?
- Cách xác định "kịch bản thắng" — video nào perform tốt, tại sao?
- Tools tracking nào affiliate marketer đang dùng?
- TikTok Analytics đủ không hay cần tool bên ngoài?
- A/B testing video: cách làm hiệu quả trên TikTok

---

## Phần 2: Lập Plan cho PASTR

Dựa trên kết quả nghiên cứu, tạo PLAN chi tiết cho PASTR gồm:

### 2.1 Kiến trúc tổng thể PASTR mới

Vẽ sơ đồ các module chính:
- Module nào đã có (giữ nguyên)
- Module nào cần thêm mới
- Mối quan hệ giữa các module
- Data flow từ đầu đến cuối

### 2.2 Giai đoạn 1: Xây 1 kênh mẫu (MVP)

Chi tiết:
- Tính năng cần build cho PASTR (cụ thể, không chung chung)
- Thứ tự ưu tiên: build gì trước, gì sau
- Database schema cần thêm/sửa (khái quát)
- UI/UX: trang nào mới, trang nào sửa
- Timeline ước tính

Tính năng gợi ý (nghiên cứu rồi bổ sung/bỏ bớt):
- Quản lý kênh TikTok (profile kênh, nhân vật, style guide)
- Content calendar (lịch đăng bài, phân loại content types)
- Brief đa dạng theo content type (giải trí / review / bán hàng)
- Kịch bản chi tiết hơn (hook, góc máy, sequence, CTA, sound suggest)
- Material preparation (ảnh SP download, prompt cho AI tools)
- Tracking kết quả video (views, conversion, SP win)

### 2.3 Giai đoạn 2: Nhân bản kênh

Chi tiết:
- Tính năng clone kênh (đổi gì, giữ gì)
- Quản lý ma trận kênh
- Tạo variation video tự động (1 SP → nhiều version khác nhau)
- Phân phối content ra nhiều kênh
- Dashboard tổng quan nhiều kênh

### 2.4 Giai đoạn 3: Tự động hóa (tương lai)

Chi tiết:
- Khi nào nên bắt đầu tự động?
- API nào tích hợp (Kling, TTS, FFmpeg...)
- Auto-generate video end-to-end
- Auto-post lên TikTok (nếu có API)
- AI tự optimize dựa trên data

### 2.5 Chi phí & ROI

Ước tính:
- Chi phí tool/API cho mỗi giai đoạn
- Bao nhiêu video/tháng ở mỗi giai đoạn
- Revenue tiềm năng (dựa trên conversion rate trung bình ngành)
- Break-even point

---

## Output

Tạo file `PLAN-PASTR-TIKTOK-AFFILIATE.md` với:
- Phần 1: Kết quả nghiên cứu (tóm tắt, có source)
- Phần 2: Plan chi tiết (có timeline, ưu tiên, ước tính effort)
- Phần 3: Rủi ro & giải pháp
- Phần 4: Đề xuất bắt đầu từ đâu

Viết bằng tiếng Việt. Ưu tiên thực tế, cụ thể, không lý thuyết chung chung. Dựa trên data từ nghiên cứu, không đoán.
