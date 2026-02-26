export function GuideSectionFaq(): React.ReactElement {
  return (
    <section id="cau-hoi">
      <h2>11. Câu hỏi thường gặp</h2>

      <h3>Điểm số chấm không chính xác?</h3>
      <p>
        Điểm ban đầu dựa trên dữ liệu sản phẩm. Càng ghi nhiều phản hồi (bán tốt/tệ), AI càng
        học và điểm chính xác hơn. Chạy <strong>Học</strong> trong Phân tích sau khi có 10+ phản hồi.
      </p>

      <h3>Brief AI không hay, quá chung chung?</h3>
      <ul>
        <li>Đổi mô hình sang Sonnet 4.5 hoặc Opus 4.6 tại Cài đặt</li>
        <li>SP có mô tả chi tiết hơn → brief hay hơn</li>
        <li>Thử tạo 2-3 brief và kết hợp phần hay nhất</li>
      </ul>

      <h3>Upload FastMoss bị lỗi?</h3>
      <ul>
        <li>Đảm bảo file đúng format (.xlsx, .csv, .xls)</li>
        <li>File phải có các cột: tên SP, giá, link ảnh, hoa hồng</li>
        <li>Thử export lại từ FastMoss</li>
      </ul>

      <h3>Bản tin sáng không load?</h3>
      <ul>
        <li>Kiểm tra khóa API tại Cài đặt → phải hiện &ldquo;Đã kết nối&rdquo;</li>
        <li>Kiểm tra có SP trong Hộp sản phẩm không (cần ít nhất 1 SP)</li>
      </ul>

      <h3>Trang trắng / lỗi 500?</h3>
      <ul>
        <li>Kiểm tra khóa API còn hạn không</li>
        <li>Thử refresh trang (Ctrl+R)</li>
        <li>Nếu vẫn lỗi: vào Cài đặt → test lại kết nối</li>
      </ul>

      <h3>Chi phí AI quá cao?</h3>
      <ul>
        <li>Chuyển về preset &ldquo;Nhanh &amp; Tiết kiệm&rdquo; (tất cả Haiku)</li>
        <li>Chỉ dùng Sonnet/Opus cho tác vụ &ldquo;Tạo Brief&rdquo;</li>
        <li>Giảm số brief tạo mỗi ngày</li>
      </ul>
    </section>
  );
}
