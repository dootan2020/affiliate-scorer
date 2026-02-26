export function GuideSectionFaqTips(): React.ReactElement {
  return (
    <>
      <section id="faq">
        <h2>10. FAQ &amp; Troubleshooting</h2>

        <h3>Score chấm không chính xác?</h3>
        <p>
          Score ban đầu dựa trên data sản phẩm. Càng log nhiều feedback (bán tốt/tệ), AI càng
          học và score chính xác hơn. Chạy <strong>Learning</strong> trong Insights sau khi có
          10+ feedback.
        </p>

        <h3>Brief AI không hay, quá chung chung?</h3>
        <ul>
          <li>Đổi model sang Sonnet 4.5 hoặc Opus 4.6 tại Cài đặt</li>
          <li>Sản phẩm có mô tả chi tiết hơn &rarr; brief hay hơn</li>
        </ul>

        <h3>Upload FastMoss bị lỗi?</h3>
        <ul>
          <li>Đảm bảo file đúng format (.xlsx, .csv, .xls)</li>
          <li>File phải có các cột: tên SP, giá, link ảnh, commission</li>
          <li>Thử export lại từ FastMoss</li>
        </ul>

        <h3>Morning Brief không load?</h3>
        <ul>
          <li>Kiểm tra API key tại Cài đặt &rarr; phải hiện &ldquo;Đã kết nối&rdquo;</li>
          <li>Kiểm tra có sản phẩm trong Inbox không (cần ít nhất 1 SP)</li>
        </ul>

        <h3>Trang trắng / lỗi 500?</h3>
        <ul>
          <li>Kiểm tra API key còn hạn không</li>
          <li>Thử refresh trang (Ctrl+R)</li>
          <li>Nếu vẫn lỗi: vào Cài đặt &rarr; test lại kết nối</li>
        </ul>

        <h3>Chi phí AI quá cao?</h3>
        <ul>
          <li>Chuyển về preset &ldquo;Nhanh &amp; Tiết kiệm&rdquo; (tất cả Haiku)</li>
          <li>Chỉ dùng Sonnet/Opus cho task &ldquo;Tạo Brief&rdquo;</li>
          <li>Giảm số brief tạo mỗi ngày</li>
        </ul>
      </section>

      <section id="tips">
        <h2>11. Tips &amp; Tricks</h2>
        <ul>
          <li><strong>Upload FastMoss mỗi ngày</strong> — Data fresh = gợi ý chính xác hơn</li>
          <li><strong>Ưu tiên score &gt; 70</strong> — Dưới 50 thường không đáng quay</li>
          <li><strong>Tạo 2-3 brief cho 1 SP</strong> — Chọn brief hay nhất, kết hợp hooks</li>
          <li><strong>Log đều đặn</strong> — Dù video fail cũng log &rarr; AI học từ cả thất bại</li>
          <li><strong>Xem lịch sự kiện</strong> — Chuẩn bị content trước Mega Sale 3-5 ngày</li>
          <li><strong>Dùng hook câu hỏi</strong> — &ldquo;Bạn có biết...?&rdquo; luôn tạo curiosity cao trên TikTok</li>
          <li><strong>Đánh giá shop</strong> — SP tốt nhưng shop tệ = tỷ lệ hoàn cao, tránh</li>
          <li><strong>Haiku cho scoring, Sonnet cho brief</strong> — Tiết kiệm 80% chi phí AI mà brief vẫn hay</li>
        </ul>
      </section>
    </>
  );
}
