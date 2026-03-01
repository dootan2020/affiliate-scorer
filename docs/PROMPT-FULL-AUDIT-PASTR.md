# Audit toàn diện PASTR — UI + Logic

## Yêu cầu

Quét toàn bộ codebase, mở từng trang trên app, đưa ra báo cáo chi tiết. Không fix gì cả, chỉ báo cáo.

## 1. Audit UI Consistency

Quét tất cả pages và components, so sánh:
- Font chữ, cỡ chữ, font weight heading/body
- Card style (border, radius, shadow, padding)
- Badge/Tag style
- Button style (primary, secondary, ghost)
- Icon library (Lucide? Mix?)
- Color usage (có dùng đúng design tokens không?)
- Spacing (padding, margin, gap)
- Table/List style
- Chart/Biểu đồ style
- Input/Form style
- Empty state design
- Loading state design
- Error state design

Đặc biệt: trang inbox/[id] (chi tiết sản phẩm) có vẻ thiết kế khác hẳn phần còn lại. Xác nhận và liệt kê cụ thể khác ở đâu.

Output: danh sách từng trang + đánh giá consistent hay không + chi tiết điểm lệch.

## 2. Audit Logic Blind Spots

Quét toàn bộ flow, tìm:
- **Bản tin sáng**: logic đề xuất SP hiện tại dựa trên gì? Có context kênh không? Trường hợp: chưa có kênh, có kênh nhưng chưa có video, có kênh có video có tracking data → mỗi trường hợp nên đề xuất gì?
- **Empty states**: mỗi trang khi không có data hiện gì? Có CTA hướng user bước tiếp theo không?
- **Navigation dead-ends**: sau khi hoàn thành action (tạo kênh, tạo brief, import CSV) → user được redirect đúng chỗ không?
- **Data consistency**: cùng 1 metric/SP hiện ở nhiều nơi (Dashboard, Inbox, Production, Channel detail) → có khớp nhau không?
- **channelId enforcement**: sau refactor, còn chỗ nào tạo brief/asset mà bypass channelId không?
- **Orphan data**: SP trong Inbox nhưng không có brief, brief không có asset, asset không có slot, slot không có tracking → có cách nào phát hiện và xử lý không?

Output: danh sách issues, mỗi cái ghi rõ file + dòng code + mô tả vấn đề + mức độ (critical/medium/low).

## 3. Responsive Check

Quét layout ở viewport 375px (mobile) và 768px (tablet):
- Sidebar có collapse không?
- Card grid có stack không?
- Table có scroll ngang không?
- Form có usable trên mobile không?
- Touch target size đủ 44px không?

## 4. Loading & Error States

Mỗi page/component có API call:
- Có loading indicator không?
- API lỗi → user thấy gì? Toast? Inline error? Blank?
- Retry mechanism?

## Format báo cáo

Tạo file `docs/audit-full-pastr.md` với structure:
1. UI Consistency Issues (bảng: trang | vấn đề | severity)
2. Logic Blind Spots (bảng: flow | vấn đề | severity)  
3. Responsive Issues (bảng: trang | vấn đề ở viewport nào)
4. Loading/Error Gaps (bảng: component | thiếu gì)
5. Recommendations (ưu tiên fix theo severity)
