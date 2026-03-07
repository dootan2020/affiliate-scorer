import Link from "next/link";

export function GuideSectionQuickStart(): React.ReactElement {
  return (
    <section id="bat-dau">
      <h2>1. Bắt đầu nhanh</h2>

      <h3>Bước 1: Tìm ngách sản phẩm (Niche Finder)</h3>
      <p>
        Vào <Link href="/niche-finder"><strong>Tìm ngách</strong></Link> (trong nhóm Công cụ).
        Hệ thống hướng dẫn 4 bước:
      </p>
      <ol>
        <li><strong>Khám phá:</strong> Chọn ngành hàng (gia dụng, mỹ phẩm, v.v.)</li>
        <li><strong>Phân tích:</strong> AI phân tích tiềm năng, cạnh tranh, lợi nhuận</li>
        <li><strong>Tạo kênh:</strong> Hệ thống tự động tạo TikTok channel cho ngách này</li>
        <li><strong>Hoàn thành:</strong> Kênh sẵn sàng, bắt đầu import sản phẩm</li>
      </ol>

      <h3>Bước 2: Kết nối khóa API</h3>
      <p>
        Vào <Link href="/settings"><strong>Cài đặt</strong></Link> (nhóm Cài đặt) &rarr; chọn nhà cung cấp AI
        (Anthropic, OpenAI, hoặc Google) &rarr; nhập khóa API &rarr; bấm{" "}
        <strong>Kiểm tra kết nối</strong>.
      </p>
      <p>Lấy khóa tại:</p>
      <ul>
        <li><strong>Anthropic:</strong> console.anthropic.com</li>
        <li><strong>OpenAI:</strong> platform.openai.com/api-keys</li>
        <li><strong>Google:</strong> aistudio.google.com/apikey</li>
      </ul>
      <p>Khuyến nghị: Dùng <strong>Claude Haiku</strong> cho nhanh + tiết kiệm, <strong>Sonnet</strong> cho tạo Brief.</p>

      <h3>Bước 3: Import sản phẩm</h3>
      <p>2 cách:</p>
      <ul>
        <li>
          <strong>Dán link:</strong> Tổng quan → "Thêm sản phẩm nhanh" → dán link TikTok Shop
        </li>
        <li>
          <strong>Upload file:</strong> <Link href="/sync"><strong>Đồng bộ dữ liệu</strong></Link> → kéo thả file .xlsx từ FastMoss hoặc KaloData
        </li>
      </ul>
      <p>Hệ thống tự động xử lý từng sản phẩm (300 SP/lần, có retry tự động nếu lỗi).</p>

      <h3>Bước 4: Chấm điểm &amp; Xem kết quả</h3>
      <p>
        Vào <Link href="/inbox"><strong>Hộp sản phẩm</strong></Link> (nhóm Sản xuất) → xem danh sách SP được chấm điểm.
        Mỗi SP có 3 loại điểm:
      </p>
      <ul>
        <li><strong>Market Score:</strong> Dựa vào hoa hồng, bán tốt, cạnh tranh</li>
        <li><strong>AI Score:</strong> AI phân tích tiềm năng quay video, lợi nhuận</li>
        <li><strong>Điểm kết hợp:</strong> Tổng điểm để so sánh (AI 55% + Market 45%)</li>
      </ul>

      <h3>Bước 5: Tạo brief đầu tiên</h3>
      <p>
        Vào <Link href="/production"><strong>Sản xuất</strong></Link> → tab "Tạo mới" → chọn SP điểm cao (70+) →
        bấm <strong>Tạo Brief AI</strong>.
      </p>
      <p>AI sẽ tự động tạo:</p>
      <ul>
        <li>5 góc quay (unbox, test, comparison, story, demo)</li>
        <li>10 hook hấp dẫn</li>
        <li>3 script sẵn sàng quay</li>
      </ul>
      <p>Brief tự lưu vào tab "Đang sản xuất" — không mất khi rời trang.</p>

      <h3>Bước 6: Quay video &amp; Ghi kết quả</h3>
      <p>
        Copy brief → quay video bằng hook + script → đăng TikTok → vào <Link href="/log"><strong>Nhật ký</strong></Link> →
        ghi nhận link video + kết quả (views, orders). AI sẽ học từ dữ liệu này!
      </p>
    </section>
  );
}
