import { GuideCallout } from "./guide-callout";

export function GuideSectionWorkflow(): React.ReactElement {
  return (
    <section id="quy-trinh">
      <h2>2. Quy trình hàng ngày</h2>

      <GuideCallout variant="info">
        <strong>Quy trình khuyến nghị mỗi ngày:</strong>
        <br />
        Sáng đọc Bản tin &rarr; Trưa tìm SP mới &rarr; Chiều quay video &rarr; Tối ghi nhật ký
      </GuideCallout>

      <h3>Buổi sáng — Đọc Bản tin sáng</h3>
      <p>Mở <strong>Tổng quan</strong>. Bản tin sáng cho bạn biết:</p>
      <ul>
        <li>Hôm nay nên sản xuất video cho sản phẩm nào</li>
        <li>Bao nhiêu video cần quay</li>
        <li>Sản phẩm mới nào đáng chú ý</li>
        <li>Sự kiện sắp tới (Mega Sale, 8/3, v.v.)</li>
      </ul>

      <h3>Buổi trưa — Tìm sản phẩm mới</h3>
      <ul>
        <li>Upload file FastMoss mới nhất tại trang <strong>Đồng bộ dữ liệu</strong></li>
        <li>Hoặc dán link sản phẩm tiềm năng vào <strong>Hộp sản phẩm</strong></li>
        <li>AI chấm điểm tự động, sắp xếp theo điểm số</li>
      </ul>

      <h3>Buổi chiều — Sản xuất video</h3>
      <ul>
        <li>Vào <strong>Sản xuất</strong> → tab <strong>Tạo mới</strong> → chọn SP điểm cao → <strong>Tạo Brief AI</strong></li>
        <li>Chuyển sang tab <strong>Đang sản xuất</strong> → copy prompt Kling/Veo3 cho từng scene</li>
        <li>Quay/render video → cập nhật trạng thái (Đã quay → Đang edit → Đã đăng)</li>
        <li>Copy caption + hashtags → đăng TikTok</li>
      </ul>
      <p>Ví dụ brief:</p>
      <pre><code>{`Hook 1: "Bạn có biết vòng chu sa ngũ lộ là gì không?"
Hook 2: "Mình mới mua cái này 49k mà người quen hỏi han suốt"
Hook 3: "POV: Khi bạn đeo vòng phong thủy đi làm..."
Script: [15-30s] Mở bằng hook → Unbox → Highlight 2-3 điểm → CTA "Link ở bio"`}</code></pre>

      <h3>Buổi tối — Nhật ký &amp; Đánh giá</h3>
      <ul>
        <li>Vào <strong>Nhật ký</strong> &rarr; ghi nhận video đã quay (link video, sản phẩm, trạng thái)</li>
        <li>Dữ liệu nhật ký giúp AI học: video nào hiệu quả, sản phẩm nào bán tốt</li>
      </ul>
    </section>
  );
}
