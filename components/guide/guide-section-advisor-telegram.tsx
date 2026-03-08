import Link from "next/link";
import { GuideCallout } from "./guide-callout";

export function GuideSectionAdvisorTelegram(): React.ReactElement {
  return (
    <>
      {/* Kênh TikTok */}
      <section id="kenh-tiktok">
        <h2>10. Kênh TikTok</h2>
        <p>
          Quản lý kênh TikTok tại <Link href="/channels"><strong>Kênh TikTok</strong></Link> (nhóm Sản xuất).
          Mỗi kênh có persona và style guide riêng để AI tạo brief phù hợp.
        </p>

        <h3>Tạo kênh mới</h3>
        <ol>
          <li>Bấm <strong>+ Thêm kênh</strong></li>
          <li>Nhập tên kênh, @username, ngành hàng</li>
          <li>Chọn tính cách kênh (Tự nhiên, Năng động, Chuyên nghiệp)</li>
          <li>AI tự tạo <strong>Character Bible</strong> và <strong>Video Bible</strong> cho kênh</li>
        </ol>

        <h3>Character Bible &amp; Video Bible</h3>
        <ul>
          <li><strong>Character Bible:</strong> Giọng nói, phong cách, từ ngữ hay dùng — AI dùng khi viết script</li>
          <li><strong>Video Bible:</strong> Format video, thời lượng, nhịp edit — AI dùng khi tạo prompt quay</li>
        </ul>
        <p>Cập nhật Bible thường xuyên giúp brief ngày càng đúng phong cách bạn.</p>

        <h3>Tải kênh</h3>
        <p>
          Bấm <strong>Tải</strong> trên trang chi tiết kênh để xuất toàn bộ dữ liệu kênh ra file .json —
          dùng để backup hoặc phân tích offline.
        </p>

        <GuideCallout variant="tip">
          Nên tạo kênh riêng cho mỗi ngành hàng. VD: &ldquo;Gia dụng&rdquo; và &ldquo;Mỹ phẩm&rdquo; cần hook style khác nhau.
        </GuideCallout>
      </section>

      {/* Cố vấn AI */}
      <section id="co-van-ai">
        <h2>11. Cố vấn AI</h2>
        <p>
          <Link href="/advisor"><strong>Cố vấn AI</strong></Link> (nhóm Công cụ) — hệ thống ban lãnh đạo AI
          giúp ra quyết định chiến lược.
        </p>

        <h3>Cách hoạt động</h3>
        <p>Khi đặt câu hỏi, hệ thống chạy pipeline 3 bước:</p>
        <ol>
          <li><strong>Analyst</strong> thu thập dữ liệu từ hệ thống (top SP, pattern thắng/thua, dữ liệu kênh)</li>
          <li><strong>3 giám đốc phân tích song song:</strong>
            <ul>
              <li><strong>CMO</strong> (Marketing) — chiến lược nội dung, trend, audience</li>
              <li><strong>CFO</strong> (Tài chính) — chi phí, ROI, hiệu quả đầu tư</li>
              <li><strong>CTO</strong> (Công nghệ) — tối ưu quy trình, automation, dữ liệu</li>
            </ul>
          </li>
          <li><strong>CEO</strong> tổng hợp và ra quyết định cuối cùng</li>
        </ol>

        <h3>Câu hỏi gợi ý</h3>
        <ul>
          <li>&ldquo;Nên chọn ngách X hay Y?&rdquo;</li>
          <li>&ldquo;Chiến lược content tuần này nên làm gì?&rdquo;</li>
          <li>&ldquo;Video nào nên làm hôm nay?&rdquo;</li>
          <li>&ldquo;Budget quảng cáo tháng này nên phân bổ thế nào?&rdquo;</li>
          <li>&ldquo;Kênh nào đang hiệu quả nhất?&rdquo;</li>
        </ul>

        <h3>Đặt câu hỏi tiếp</h3>
        <p>
          Sau khi nhận quyết định, bấm <strong>Hỏi tiếp</strong> để đặt câu hỏi bổ sung —
          AI nhớ ngữ cảnh cuộc trò chuyện trước đó.
        </p>

        <GuideCallout variant="info">
          Cố vấn AI phân tích dựa trên <strong>dữ liệu thật</strong> trong hệ thống:
          điểm SP, pattern thắng/thua, lịch sử kênh. Càng nhiều dữ liệu, lời khuyên càng chính xác.
        </GuideCallout>
      </section>

      {/* Telegram Bot */}
      <section id="telegram-bot">
        <h2>12. Telegram Bot</h2>
        <p>
          Nhận thông báo và tương tác với PASTR qua Telegram.
          Cấu hình tại <Link href="/settings"><strong>Cài đặt</strong></Link> → mục <strong>Tích hợp Telegram</strong>.
        </p>

        <h3>Cài đặt</h3>
        <ol>
          <li>Tạo bot trên Telegram: tìm <code>@BotFather</code> → <code>/newbot</code> → lấy token</li>
          <li>Vào Cài đặt → Tích hợp Telegram → dán token → bấm <strong>Lưu &amp; Kích hoạt</strong></li>
          <li>Mở bot trên Telegram, gõ <code>/start</code> để kích hoạt</li>
        </ol>

        <h3>Tính năng</h3>
        <ul>
          <li><strong>Bản tin sáng:</strong> Nhận bản tin tự động mỗi sáng qua Telegram</li>
          <li><strong>Thông báo:</strong> Khi có SP mới điểm cao, khi Learning hoàn thành</li>
          <li><strong>Gửi link:</strong> Gửi link TikTok Shop trực tiếp qua chat → bot tự import và chấm điểm</li>
        </ul>

        <GuideCallout variant="tip">
          Token bot là bí mật — không chia sẻ với ai.
          Nếu cần đổi, vào Cài đặt → xóa token cũ → nhập token mới.
        </GuideCallout>
      </section>
    </>
  );
}
