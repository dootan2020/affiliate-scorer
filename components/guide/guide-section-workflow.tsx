import { GuideCallout } from "./guide-callout";
import Link from "next/link";

export function GuideSectionWorkflow(): React.ReactElement {
  return (
    <section id="quy-trinh">
      <h2>2. Quy trình hàng ngày</h2>

      <GuideCallout variant="info">
        <strong>Quy trình khuyến nghị mỗi ngày:</strong>
        <br />
        Sáng đọc Bản tin → Trưa tìm SP mới → Chiều quay video → Tối ghi nhật ký → Cuối tuần chạy Learning
      </GuideCallout>

      <h3>Buổi sáng — Đọc Bản tin sáng</h3>
      <p>
        Mở <Link href="/"><strong>Tổng quan</strong></Link> (trang chủ). Bản tin sáng cho bạn:
      </p>
      <ul>
        <li>Top 5 sản phẩm nên quay hôm nay (dựa trên AI recommendation + learning history)</li>
        <li>Sản phẩm mới nào xuất hiện trong top 10</li>
        <li>Sự kiện sắp tới (Mega Sale, 8/3, Black Friday, v.v.)</li>
        <li>Số video đã quay và cần quay</li>
      </ul>
      <p>Widget Bản tin sáng cập nhật mỗi ngày 6h sáng, hoặc bấm "Làm mới" để update ngay.</p>

      <h3>Buổi trưa — Tìm &amp; Import sản phẩm mới</h3>
      <p>
        Vào <Link href="/sync"><strong>Đồng bộ dữ liệu</strong></Link> (nhóm Công cụ):
      </p>
      <ul>
        <li><strong>Upload FastMoss:</strong> Kéo file .xlsx mới nhất → chọn cột tương ứng → chấm điểm tự động (5 phút)</li>
        <li><strong>Upload KaloData:</strong> File .csv → import 300 SP/lần → có retry tự động nếu lỗi</li>
        <li><strong>Dán link:</strong> Copy link TikTok Shop → dán vào <Link href="/inbox"><strong>Hộp sản phẩm</strong></Link> → AI chấm điểm trong 10 giây</li>
      </ul>
      <p>
        <strong>Lưu ý:</strong> Sau upload, hãy kiểm tra <Link href="/inbox"><strong>Hộp sản phẩm</strong></Link> để xem kết quả chấm điểm.
        SP mới sẽ hiện ở đầu danh sách (sort theo điểm cao nhất).
      </p>

      <h3>Buổi chiều — Tạo Brief &amp; Sản xuất video</h3>
      <p>
        Vào <Link href="/production"><strong>Sản xuất</strong></Link> (nhóm Sản xuất):
      </p>
      <ol>
        <li>
          <strong>Tab "Tạo mới":</strong> Chọn SP từ danh sách (lọc theo điểm cao, ngành, hoặc channel)
        </li>
        <li>
          <strong>Tạo Brief AI:</strong> Bấm button "Tạo Brief AI" → AI sinh trong 30 giây:
          <ul>
            <li>5 góc quay (unbox product, test/demo, so sánh, story/scenario, insights)</li>
            <li>10 hook hấp dẫn (bắt đầu câu chuyện, highlight benefit, tạo FOMO, v.v.)</li>
            <li>3 script video sẵn sàng (15-30s, 30-60s, 60s+)</li>
            <li>Lời nói, B-roll list, hashtags</li>
          </ul>
        </li>
        <li>
          <strong>Tab "Đang sản xuất":</strong> Brief auto-save ở đây. Copy script → quay video dùng ứng dụng yêu thích (Capcut, VN, CapCut, v.v.)
        </li>
        <li>
          <strong>Cập nhật trạng thái:</strong> Quay xong → bấm "Đã quay" → đang edit → "Đã đăng" → copy caption + hashtags → post TikTok
        </li>
      </ol>

      <p><strong>Ví dụ brief cho nồi điện:</strong></p>
      <pre><code>{`Góc 1: Unbox — "Nồi điện này sắc nét hơn cái cũ 10x, lại rẻ hơn"
Góc 2: Test — "Test nấu cháo → cơm → canh → cơm cháy"
Góc 3: So sánh — "So vs nồi thường: tính năng, tốn điện, độ bền"

Hook 1: "Nồi điện chỉ 199k này đang bán chạy, mình test thử"
Hook 2: "Nấu cơm vừa nhanh, vừa cơm nó dẻo"
Hook 3: "Giá bằng 1 cái nồi thường, function hơn gấp đôi"

Script 15s: [Hook] Vào kình → nấu cháo 20 phút [Scene] Thử cháo ngon
            [CTA] Link ở bio, mua tại TikTok Shop"`}</code></pre>

      <h3>Buổi tối — Ghi nhật ký &amp; Tracking kết quả</h3>
      <p>
        Vào <Link href="/log"><strong>Nhật ký</strong></Link> (nhóm Theo dõi) → bấm "Ghi kết quả":
      </p>
      <ul>
        <li><strong>Link video:</strong> Copy URL TikTok video vừa đăng</li>
        <li><strong>Sản phẩm:</strong> Chọn SP trong brief</li>
        <li><strong>Kết quả:</strong> Ghi views (khoảng 1 giờ sau khi post) hoặc orders (sau 1–3 ngày)</li>
      </ul>
      <p>
        AI sẽ học từ data này: nếu video bán tốt, AI sẽ ưu tiên tương tự lần sau.
        Nếu flop, AI điều chỉnh góc quay, hook, format cho sản phẩm này.
      </p>

      <h3>Cuối tuần — Chạy Learning &amp; Xem Phân tích</h3>
      <p>
        Vào <Link href="/insights"><strong>Phân tích</strong></Link> (nhóm Theo dõi) → tab "Phân tích":
      </p>
      <ul>
        <li><strong>Bấm "Chạy Learning":</strong> AI phân tích 20+ video vừa quay, học cái nào hiệu quả</li>
        <li><strong>Xem mô hình thắng:</strong> Hook nào, format nào, category nào bán tốt nhất</li>
        <li><strong>Điều chỉnh chiến lược:</strong> Tăng tần suất quay video kiểu thắng, giảm kiểu flop</li>
        <li><strong>Cập nhật Character Bible &amp; Video Bible:</strong> Đổi hook style, frame, edit nếu cần</li>
      </ul>

    </section>
  );
}
