import { GuideCallout } from "./guide-callout";

export function GuideSectionFeatures(): React.ReactElement {
  return (
    <>
      {/* Dashboard */}
      <section id="dashboard">
        <h2>3. Dashboard</h2>
        <p>Trang chính khi mở app. Gồm:</p>
        <ul>
          <li><strong>Morning Brief</strong> — AI tóm tắt tình hình mỗi ngày: sản phẩm nên quay, sự kiện sắp tới, phân tích nhanh.</li>
          <li><strong>Thêm sản phẩm nhanh</strong> — Dán link TikTok Shop / FastMoss &rarr; sản phẩm tự động vào Inbox và được chấm điểm.</li>
          <li><strong>Nên tạo content</strong> — Top sản phẩm score cao nhất chưa có brief.</li>
          <li><strong>Inbox Pipeline</strong> — Tổng quan: bao nhiêu SP mới, đã xử lý, đã brief.</li>
          <li><strong>Sắp tới</strong> — Lịch sự kiện (Mega Sale, ngày lễ) để chuẩn bị content trước.</li>
        </ul>
      </section>

      {/* Inbox */}
      <section id="inbox">
        <h2>4. Inbox</h2>
        <p>Nơi quản lý tất cả sản phẩm.</p>
        <h3>Thêm sản phẩm bằng link</h3>
        <p>Dán 1 hoặc nhiều link (mỗi link 1 dòng):</p>
        <ul>
          <li>Link TikTok Shop: <code>https://shop.tiktok.com/view/product/...</code></li>
          <li>Link FastMoss: <code>https://www.fastmoss.com/zh/e-commerce/detail/...</code></li>
          <li>Link video TikTok: <code>https://www.tiktok.com/@user/video/...</code></li>
        </ul>
        <h3>Score là gì?</h3>
        <p>AI chấm điểm 1-100 dựa trên: giá bán &amp; commission, số lượng bán, rating &amp; reviews, xu hướng thị trường, phù hợp với nội dung TikTok.</p>
        <GuideCallout variant="success">
          <strong>Khuyến nghị:</strong> Ưu tiên sản phẩm score &gt; 70. Dưới 50 thường không đáng quay video.
        </GuideCallout>
      </section>

      {/* Sync */}
      <section id="sync">
        <h2>5. Sync (Đồng bộ dữ liệu)</h2>
        <h3>Upload FastMoss</h3>
        <p>Vào FastMoss &rarr; Export danh sách sản phẩm &rarr; Download file XLSX &rarr; kéo thả file vào trang Sync. App tự nhận diện cột, map dữ liệu, import sản phẩm. Hỗ trợ: .csv, .xlsx, .xls</p>
        <h3>Upload TikTok Studio Analytics</h3>
        <p>Vào TikTok Studio &rarr; Analytics &rarr; Export. Kéo thả nhiều file cùng lúc. Data analytics giúp AI hiểu audience và tối ưu brief.</p>
        <GuideCallout variant="tip">
          Upload FastMoss mỗi ngày để data luôn mới nhất. Sản phẩm trending thay đổi nhanh.
        </GuideCallout>
      </section>

      {/* Sản xuất */}
      <section id="san-xuat">
        <h2>6. Sản xuất</h2>
        <p>Nơi tạo content brief bằng AI.</p>
        <ol>
          <li>Chọn sản phẩm (từ Inbox hoặc click &ldquo;Tạo Brief &rarr;&rdquo; ở Dashboard)</li>
          <li>Click <strong>Tạo Brief AI</strong></li>
          <li>AI generate: 3 hooks mở đầu, script chi tiết (15-60s), góc quay gợi ý, hashtags, CTA</li>
          <li>Đọc brief &rarr; chọn hook &rarr; quay video</li>
        </ol>
        <p><strong>Mẹo:</strong> Dùng model Sonnet hoặc Opus cho brief sáng tạo hơn. Tạo nhiều brief cho cùng 1 SP &rarr; chọn brief hay nhất.</p>
      </section>

      {/* Log */}
      <section id="log">
        <h2>7. Log</h2>
        <p>Ghi nhận video đã sản xuất: sản phẩm đã quay, link video TikTok, trạng thái (đã quay / đã đăng / đang edit), ghi chú cá nhân.</p>
        <p><strong>Tại sao log quan trọng?</strong> Data từ log giúp AI biết sản phẩm nào đã quay, học pattern bạn hay chọn, tính toán năng suất.</p>
      </section>

      {/* Insights */}
      <section id="insights">
        <h2>8. Insights</h2>
        <p>Trung tâm phân tích AI:</p>
        <ul>
          <li><strong>Tổng quan</strong> — Số liệu chính: tổng SP, shop đánh giá, thu chi tháng.</li>
          <li><strong>Thu chi</strong> — Theo dõi thu nhập affiliate và chi phí. Tính lợi nhuận tự động.</li>
          <li><strong>Lịch sự kiện</strong> — Mega Sale, ngày lễ, campaign. Thêm sự kiện tùy chỉnh.</li>
          <li><strong>Feedback</strong> — Đánh giá kết quả video, SP bán tốt/tệ.</li>
          <li><strong>Learning</strong> — AI học từ feedback. Chạy Learning để cập nhật trọng số.</li>
          <li><strong>Playbook</strong> — Bài học tổng hợp: chiến lược nào thắng, thua, insight.</li>
        </ul>
        <GuideCallout variant="info">
          <strong>Quy trình Learning:</strong> Log video &rarr; Ghi feedback (bán tốt/tệ) &rarr; Chạy Learning &rarr; AI cập nhật score &rarr; Brief ngày mai chính xác hơn
        </GuideCallout>
      </section>
    </>
  );
}
