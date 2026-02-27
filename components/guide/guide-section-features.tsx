import { GuideCallout } from "./guide-callout";

export function GuideSectionFeatures(): React.ReactElement {
  return (
    <>
      {/* Tổng quan */}
      <section id="tong-quan">
        <h2>4. Tổng quan (trang chính)</h2>
        <p>Trang chính khi mở app. Gồm:</p>
        <ul>
          <li><strong>Bản tin sáng</strong> — AI tóm tắt tình hình mỗi ngày: SP nên quay, sự kiện sắp tới, phân tích nhanh.</li>
          <li><strong>Thêm sản phẩm nhanh</strong> — Dán link TikTok Shop / FastMoss &rarr; SP tự động vào Hộp sản phẩm và được chấm điểm.</li>
          <li><strong>Nên tạo nội dung</strong> — Top SP điểm cao nhất chưa có brief.</li>
          <li><strong>Hộp sản phẩm</strong> — Tổng quan: bao nhiêu SP mới, đã xử lý, đã brief.</li>
          <li><strong>Sắp tới</strong> — Lịch sự kiện (Mega Sale, ngày lễ) để chuẩn bị nội dung trước.</li>
        </ul>
      </section>

      {/* Hộp sản phẩm */}
      <section id="hop-san-pham">
        <h2>5. Hộp sản phẩm</h2>
        <p>Nơi quản lý tất cả sản phẩm.</p>
        <h3>Thêm sản phẩm bằng link</h3>
        <p>Dán 1 hoặc nhiều link (mỗi link 1 dòng):</p>
        <ul>
          <li>Link TikTok Shop: <code>https://shop.tiktok.com/view/product/...</code></li>
          <li>Link FastMoss: <code>https://www.fastmoss.com/zh/e-commerce/detail/...</code></li>
          <li>Link video TikTok: <code>https://www.tiktok.com/@user/video/...</code></li>
        </ul>
        <h3>Điểm số là gì?</h3>
        <p>AI chấm điểm 1-100 dựa trên: giá bán &amp; hoa hồng, số lượng bán, đánh giá &amp; reviews, xu hướng thị trường, phù hợp với nội dung TikTok.</p>
        <GuideCallout variant="success">
          <strong>Khuyến nghị:</strong> Ưu tiên SP điểm &gt; 70. Dưới 50 thường không đáng quay video.
        </GuideCallout>
      </section>

      {/* Đồng bộ dữ liệu */}
      <section id="dong-bo">
        <h2>6. Đồng bộ dữ liệu</h2>
        <h3>Upload FastMoss</h3>
        <p>Vào FastMoss &rarr; Export danh sách SP &rarr; Download file XLSX &rarr; kéo thả file vào trang Đồng bộ. App tự nhận diện cột, ghép dữ liệu, import SP. Hỗ trợ: .csv, .xlsx, .xls</p>
        <h3>Upload TikTok Studio Analytics</h3>
        <p>Vào TikTok Studio &rarr; Phân tích &rarr; Export. Kéo thả nhiều file cùng lúc. Dữ liệu analytics giúp AI hiểu audience và tối ưu brief.</p>
        <GuideCallout variant="tip">
          Upload FastMoss mỗi ngày để dữ liệu luôn mới nhất. SP trending thay đổi nhanh.
        </GuideCallout>
      </section>

      {/* Sản xuất */}
      <section id="san-xuat">
        <h2>7. Sản xuất</h2>
        <p>Trung tâm sản xuất video — từ chọn sản phẩm đến xuất packs quay. Gồm 3 tab:</p>

        <h3>Tab &ldquo;Đang sản xuất&rdquo; (mặc định)</h3>
        <p>Hiện tất cả brief đang thực hiện. Mỗi brief gồm:</p>
        <ul>
          <li><strong>Thông tin SP:</strong> Ảnh, tên, giá, đánh giá shop, lượt bán, điểm tiềm năng</li>
          <li><strong>3 link SP:</strong> TikTok Shop, FastMoss SP, FastMoss Shop (mở tab mới)</li>
          <li><strong>Copy nhanh từng scene:</strong> Nút <code>Kling</code> / <code>Veo3</code> để copy prompt cho từng cảnh quay</li>
          <li><strong>Copy script &amp; caption:</strong> Nút <code>Copy script</code>, <code>Copy tất cả</code> (caption + hashtags)</li>
          <li><strong>Trạng thái video:</strong> Chưa quay → Đã quay → Đang edit → Đã đăng (hoặc Bỏ)</li>
          <li><strong>Xuất Packs:</strong> 3 file — Scripts (markdown), Prompts (JSON cho Kling/Veo3), Checklist (CSV)</li>
        </ul>

        <h3>Tab &ldquo;Tạo mới&rdquo;</h3>
        <p>Chọn SP có điểm tiềm năng từ Hộp sản phẩm → bấm <strong>Tạo Brief AI</strong>. AI tạo: câu mở đầu (hook), kịch bản chi tiết, prompt quay cho Kling/Veo3, caption, hashtags, CTA. Brief tự động lưu vào DB — không mất khi rời trang.</p>

        <h3>Tab &ldquo;Đã hoàn thành&rdquo;</h3>
        <p>Brief đã đăng video hoặc đã thay thế. Dùng để xem lại lịch sử.</p>

        <h3>Tạo lại brief</h3>
        <p>Brief không tốt? Bấm <strong>Tạo lại</strong> trên brief card. Brief cũ chuyển sang &ldquo;Đã hoàn thành&rdquo; với badge <em>(Đã thay thế)</em>, brief mới thay vào.</p>
        <GuideCallout variant="tip">
          Giới hạn: 3 lần tạo lại mỗi SP/ngày. Đổi model AI tại Cài đặt nếu muốn brief sáng tạo hơn.
        </GuideCallout>
      </section>

      {/* Nhật ký */}
      <section id="nhat-ky">
        <h2>8. Nhật ký</h2>
        <p>Ghi nhận video đã sản xuất: SP đã quay, link video TikTok, trạng thái (đã quay / đã đăng / đang chỉnh sửa), ghi chú cá nhân.</p>
        <p><strong>Tại sao nhật ký quan trọng?</strong> Dữ liệu từ nhật ký giúp AI biết SP nào đã quay, học pattern bạn hay chọn, tính toán năng suất.</p>
      </section>

      {/* Phân tích */}
      <section id="phan-tich">
        <h2>9. Phân tích</h2>
        <p>Trung tâm phân tích AI:</p>
        <ul>
          <li><strong>Tổng quan</strong> — Số liệu chính: tổng SP, shop đánh giá, thu chi tháng.</li>
          <li><strong>Thu chi</strong> — Theo dõi thu nhập affiliate và chi phí. Tính lợi nhuận tự động.</li>
          <li><strong>Lịch sự kiện</strong> — Mega Sale, ngày lễ, campaign. Thêm sự kiện tùy chỉnh.</li>
          <li><strong>Phản hồi</strong> — Đánh giá kết quả video, SP bán tốt/tệ.</li>
          <li><strong>Học</strong> — AI học từ phản hồi. Chạy Học để cập nhật trọng số.</li>
          <li><strong>Sổ tay chiến lược</strong> — Bài học tổng hợp: chiến lược nào thắng, thua, insight.</li>
        </ul>
        <GuideCallout variant="info">
          <strong>Quy trình Học:</strong> Ghi nhật ký video &rarr; Ghi phản hồi (bán tốt/tệ) &rarr; Chạy Học &rarr; AI cập nhật điểm &rarr; Brief ngày mai chính xác hơn
        </GuideCallout>
      </section>
    </>
  );
}
