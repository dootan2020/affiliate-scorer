import { GuideCallout } from "./guide-callout";

export function GuideSectionWorkflow(): React.ReactElement {
  return (
    <section id="workflow">
      <h2>2. Workflow hàng ngày</h2>

      <GuideCallout variant="info">
        <strong>Quy trình khuyến nghị mỗi ngày:</strong>
        <br />
        Sáng đọc Brief &rarr; Trưa tìm SP mới &rarr; Chiều quay video &rarr; Tối log kết quả
      </GuideCallout>

      <h3>Buổi sáng — Đọc Morning Brief</h3>
      <p>Mở Dashboard. Morning Brief cho bạn biết:</p>
      <ul>
        <li>Hôm nay nên sản xuất video cho sản phẩm nào</li>
        <li>Bao nhiêu video cần quay</li>
        <li>Sản phẩm mới nào đáng chú ý</li>
        <li>Sự kiện sắp tới (Mega Sale, 8/3, v.v.)</li>
      </ul>

      <h3>Buổi trưa — Tìm sản phẩm mới</h3>
      <ul>
        <li>Upload file FastMoss mới nhất tại trang <strong>Sync</strong></li>
        <li>Hoặc paste link sản phẩm thấy tiềm năng vào <strong>Inbox</strong></li>
        <li>AI chấm điểm tự động, sắp xếp theo score</li>
      </ul>

      <h3>Buổi chiều — Sản xuất video</h3>
      <ul>
        <li>Vào <strong>Sản xuất</strong> &rarr; chọn sản phẩm &rarr; <strong>Tạo Brief AI</strong></li>
        <li>Brief gồm: 3 hooks mở đầu, script chi tiết, góc quay gợi ý, hashtags</li>
        <li>Quay video theo brief</li>
      </ul>
      <p>Ví dụ brief:</p>
      <pre><code>{`Hook 1: "Bạn có biết vòng chu sa ngũ lộ là gì không?"
Hook 2: "Mình mới mua cái này 49k mà người quen hỏi han suốt"
Hook 3: "POV: Khi bạn đeo vòng phong thủy đi làm..."
Script: [15-30s] Mở bằng hook → Unbox → Highlight 2-3 điểm → CTA "Link ở bio"`}</code></pre>

      <h3>Buổi tối — Log &amp; Review</h3>
      <ul>
        <li>Vào <strong>Log</strong> &rarr; ghi nhận video đã quay (link video, sản phẩm, trạng thái)</li>
        <li>Dữ liệu log giúp AI học: video nào hiệu quả, sản phẩm nào bán tốt</li>
      </ul>
    </section>
  );
}
