# Tải bộ ảnh sản phẩm chất lượng gốc

## Mục tiêu

Trong brief card ở trang Sản xuất, user cần tải được **toàn bộ gallery ảnh sản phẩm** (không chỉ 1 ảnh chính) với chất lượng gốc cao nhất. Ảnh này dùng làm reference material cho workflow tạo video bằng Kling, Higgsfield, Veo3.1, Freepik, Picsart, Weavy...

## Nguồn ảnh

Mỗi SP có 2 link chứa cùng bộ ảnh:
- **TikTok Shop**: `https://shop.tiktok.com/view/product/{productId}?region=VN&local=en`
- **FastMoss**: `https://www.fastmoss.com/zh/e-commerce/detail/{productId}`

Ví dụ test:
- https://www.fastmoss.com/zh/e-commerce/detail/1732875000708433686
- https://shop.tiktok.com/view/product/1732875000708433686?region=VN&local=en

## Yêu cầu cho ClaudeKit

### Bước 1: Nghiên cứu
- Mở 2 link trên, inspect cấu trúc HTML/API để tìm cách lấy **toàn bộ ảnh SP** (không chỉ ảnh chính)
- Tìm URL ảnh chất lượng cao nhất (không phải thumbnail)
- Xác định nguồn nào dễ lấy hơn (FastMoss hay TikTok Shop)
- Kiểm tra có API public nào trả về gallery ảnh không

### Bước 2: Đề xuất giải pháp
- Cách extract bộ ảnh gốc từ trang SP
- Nên dùng nguồn nào (FastMoss vs TikTok)
- Có cần proxy/auth không
- Giới hạn / rate limit nếu có

### Bước 3: Tích hợp vào app
Sau khi có giải pháp, tích hợp vào brief card:

**Kết quả cần đạt:**
- Brief card hiện gallery ảnh SP (tất cả ảnh, không chỉ 1 ảnh chính)
- Mỗi ảnh có nút "📥 Tải" download chất lượng gốc
- Nút "📥 Tải tất cả" download zip toàn bộ gallery
- Gallery fetch tự động khi mở brief card (dựa vào link TikTok/FastMoss đã có trong DB)

## Lưu ý
- Ưu tiên chất lượng ảnh cao nhất có thể (không thumbnail, không compressed)
- Nếu không lấy tự động được → fallback cho user tự upload ảnh vào brief (kéo thả)
- Không vi phạm rate limit, thêm cache nếu cần

## Test
1. Mở brief card → hiện gallery 5-10 ảnh SP chất lượng cao
2. Bấm tải 1 ảnh → download ảnh gốc về máy
3. Bấm "Tải tất cả" → download zip
4. SP không có gallery → hiện ảnh chính + cho phép upload thêm
