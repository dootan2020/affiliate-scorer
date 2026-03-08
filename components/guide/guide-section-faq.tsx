export function GuideSectionFaq(): React.ReactElement {
  return (
    <section id="cau-hoi">
      <h2>14. Câu hỏi thường gặp</h2>

      <h3>Tại sao điểm sản phẩm thay đổi?</h3>
      <p>
        Điểm được tính dựa trên <strong>toàn bộ dataset</strong>. Khi bạn import thêm sản phẩm,
        hệ thống chuẩn hóa điểm (normalization) → các sản phẩm cũ điểm có thể thay đổi.
        Ví dụ: Nếu bạn import 100 SP mới, toàn bộ 394 SP cũ sẽ được chấm lại để so sánh công bằng.
        Điều này là bình thường — không phải lỗi.
      </p>

      <h3>Bao lâu Learning Engine mới hiệu quả?</h3>
      <ul>
        <li><strong>5+ feedback:</strong> Đủ để AI nhận ra pattern</li>
        <li><strong>15+ feedback:</strong> Tier thay đổi từ BASIC → STANDARD</li>
        <li><strong>30+ feedback:</strong> FULL tier, AI học đầy đủ</li>
        <li><strong>Tối ưu nhất:</strong> Sau ~50 feedback, AI lên lịch tối ưu hơn</li>
      </ul>
      <p>Chạy <strong>Learning</strong> mỗi tuần để AI cập nhật weight từ phản hồi mới.</p>

      <h3>Import FastMoss bị stuck/không quay lại?</h3>
      <ul>
        <li><strong>Kiểm tra trang Đồng bộ:</strong> Xem trạng thái batch (đang import hay hoàn thành)</li>
        <li><strong>Hệ thống retry tự động:</strong> Nếu stuck, cron chạy mỗi 5 phút để retry</li>
        <li><strong>Thủ công:</strong> Refresh trang Đồng bộ → nếu vẫn stuck, bấm "Retry" button</li>
        <li><strong>Kiểm tra file:</strong> Đảm bảo file .xlsx có headers đúng (Tên, Giá, Link, Hoa hồng)</li>
      </ul>

      <h3>Brief AI không hay, quá chung chung?</h3>
      <ul>
        <li><strong>Tạo lại:</strong> Bấm "Tạo lại" trên brief card (tối đa 3 lần/SP/ngày)</li>
        <li><strong>Đổi model:</strong> Dùng Sonnet 4.5 hoặc Opus 4.6 (chất lượng tốt hơn Haiku) tại Cài đặt</li>
        <li><strong>Cải thiện mô tả SP:</strong> SP có mô tả chi tiết hơn → brief hay hơn. Thêm vào note SP nếu cần.</li>
        <li><strong>Lọc hook hay nhất:</strong> Không cần dùng tất cả 10 hook, chọn 2–3 hay nhất</li>
        <li><strong>Cập nhật Character Bible:</strong> Nếu brief chung chung, hãy cập nhật channel Character Bible với personality riêng</li>
      </ul>

      <h3>AI không trả kết quả, hết token/balance?</h3>
      <ul>
        <li><strong>Kiểm tra API key:</strong> Vào Cài đặt → bấm "Kiểm tra kết nối"</li>
        <li><strong>Kiểm tra balance:</strong> Nếu balance hết, nạp thêm credits tại provider (Anthropic, OpenAI, Google)</li>
        <li><strong>Thay mô hình:</strong> Dùng Haiku (tiết kiệm) thay vì Sonnet/Opus</li>
        <li><strong>Chuyển provider:</strong> Cài đặt → chọn nhà cung cấp khác (có API key sẵn)</li>
      </ul>

      <h3>Trang bị lag, load chậm?</h3>
      <ul>
        <li><strong>Hộp sản phẩm:</strong> Nếu có 500+ SP, trang sẽ chậm. Lọc → hạn chế load</li>
        <li><strong>Refresh trang:</strong> Bấm Ctrl+R hoặc Cmd+R để làm mới</li>
        <li><strong>Xóa bộ nhớ cache:</strong> DevTools → Application → Clear Storage → reload trang</li>
        <li><strong>Kiểm tra internet:</strong> Kết nối WiFi hoặc 4G ổn định</li>
      </ul>

      <h3>Điểm SP = 0 hoặc null?</h3>
      <ul>
        <li><strong>SP chưa được chấm:</strong> Hệ thống đang xử lý. Đợi 1–2 phút, refresh trang</li>
        <li><strong>SP thiếu dữ liệu:</strong> Không có tên, giá, hoặc hoa hồng → không chấm được</li>
        <li><strong>Thủ công enrich:</strong> Vào detail SP → bổ sung dữ liệu thiếu → bấm "Chấm lại"</li>
        <li><strong>Cron retry:</strong> Hệ thống tự động retry mỗi 5 phút</li>
      </ul>

      <h3>Brief trống, không có nội dung?</h3>
      <ul>
        <li><strong>SP thiếu thông tin:</strong> Tên, mô tả, hoặc ảnh không đủ → AI không sinh được</li>
        <li><strong>Enrich trước:</strong> Vào Hộp sản phẩm → chọn SP → thêm note, ảnh, mô tả → tạo brief lại</li>
        <li><strong>Kiểm tra model:</strong> Nếu dùng Haiku, chuyển sang Sonnet để kết quả tốt hơn</li>
      </ul>

      <h3>Chi phí AI quá cao?</h3>
      <ul>
        <li><strong>Tiết kiệm:</strong> Dùng Haiku cho tất cả tác vụ (ngoài tạo brief)</li>
        <li><strong>Tạo brief cẩn thận:</strong> Chỉ tạo brief cho SP điểm 70+ (khả năng bán cao)</li>
        <li><strong>Giảm tần suất:</strong> Tạo 2–3 brief/ngày thay vì 10</li>
        <li><strong>Batch generate:</strong> Tạo 5 brief 1 lần, copy prompt để edit sau (giải thích hơn dùng từng cái)</li>
      </ul>

      <h3>Sao badge sidebar không cập nhật?</h3>
      <ul>
        <li><strong>Refresh trang:</strong> Ctrl+R</li>
        <li><strong>Kiểm tra lại đầu:</strong> Hộp sản phẩm chắc còn SP chưa brief? Đánh dấu "Đã brief" để xóa khỏi badge</li>
        <li><strong>Cache issue:</strong> Clear application cache (DevTools → Application → Clear Storage)</li>
      </ul>

      <h3>Đã đăng video nhưng kết quả 0 views?</h3>
      <ul>
        <li><strong>Bình thường:</strong> Video mới cần 1–2 giờ để TikTok phát tán</li>
        <li><strong>Kiểm tra:</strong> Vào TikTok xem video đã live chưa, xem stats trong TikTok Studio</li>
        <li><strong>Hook không hay?</strong> Nếu 1000 views đầu mà jump low, hook cần cải thiện. Xem nó flop thế nào → update script sau</li>
      </ul>

      <h3>Cố vấn AI trả lời chung chung?</h3>
      <ul>
        <li><strong>Thêm dữ liệu:</strong> Import thêm SP, ghi nhật ký, chạy Learning — AI cần dữ liệu thật để tư vấn cụ thể</li>
        <li><strong>Đặt câu hỏi cụ thể:</strong> &ldquo;Nên quay SP nào hôm nay?&rdquo; tốt hơn &ldquo;Nên làm gì?&rdquo;</li>
        <li><strong>Dùng model mạnh:</strong> Cố vấn AI cần model Sonnet trở lên để phân tích sâu</li>
        <li><strong>Hỏi tiếp:</strong> Dùng nút Hỏi tiếp để đào sâu hơn</li>
      </ul>

      <h3>Telegram Bot không nhận tin nhắn?</h3>
      <ul>
        <li><strong>Kiểm tra token:</strong> Vào Cài đặt → Tích hợp Telegram → bấm Kiểm tra</li>
        <li><strong>Gõ /start:</strong> Mở bot trên Telegram, gõ <code>/start</code> để kích hoạt</li>
        <li><strong>Kiểm tra webhook:</strong> Nếu vẫn lỗi, xóa token → nhập lại → Lưu &amp; Kích hoạt</li>
      </ul>

      <h3>Muốn xóa toàn bộ SP?</h3>
      <p>
        Hiện tại không có nút "Xóa tất cả" để tránh xóa nhầm. Để xóa hàng loạt, liên hệ hỗ trợ hoặc xóa từng cái
        bằng action menu trên Hộp sản phẩm.
      </p>
    </section>
  );
}
