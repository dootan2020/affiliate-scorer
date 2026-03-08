import { GuideCallout } from "./guide-callout";

export function GuideSectionAiConfig(): React.ReactElement {
  return (
    <section id="cau-hinh-ai">
      <h2>13. Cấu hình AI</h2>
      <p>Mọi tính năng AI đều cần cấu hình trước khi dùng. Vào <strong>Cài đặt</strong> (nhóm Cài đặt).</p>

      <h3>Bước 1: Kết nối API Key</h3>
      <ol>
        <li>Chọn nhà cung cấp AI (Anthropic, OpenAI, hoặc Google)</li>
        <li>Nhập khóa API → bấm <strong>Kiểm tra kết nối</strong> → phải hiện &ldquo;Đã kết nối&rdquo;</li>
      </ol>

      <h3>Bước 2: Chọn model — dùng Preset hoặc chọn thủ công</h3>
      <p>Có 3 nút <strong>Preset</strong> để cấu hình nhanh tất cả 7 tác vụ cùng lúc:</p>
      <ul>
        <li><strong>Tiết kiệm:</strong> Model nhẹ cho mọi tác vụ — phù hợp người mới, ngân sách thấp</li>
        <li><strong>Cân bằng:</strong> Model mạnh cho tác vụ quan trọng (brief, báo cáo), nhẹ cho tác vụ lặp — <em>khuyến nghị</em></li>
        <li><strong>Chất lượng cao:</strong> Model mạnh nhất cho mọi tác vụ — brief hay nhất, chi phí cao nhất</li>
      </ul>
      <p>Sau khi chọn preset, vẫn có thể chỉnh tay model cho từng tác vụ riêng.</p>

      <h3>7 tác vụ AI</h3>
      <p>Chia thành 2 nhóm:</p>
      <p><strong>Sản xuất nội dung:</strong></p>
      <ul>
        <li><strong>Chấm điểm SP</strong> — Đánh giá sản phẩm 1-100. Chạy nhiều lần/ngày → nên dùng model nhẹ</li>
        <li><strong>Tạo Brief nội dung</strong> — Sinh script, hook, prompt quay. Chất lượng brief phụ thuộc model → nên dùng model mạnh</li>
        <li><strong>Hồ sơ kênh</strong> — Tạo Character Bible, Video Bible cho kênh TikTok. Chạy ít → model mạnh OK</li>
      </ul>
      <p><strong>Phân tích &amp; Quyết định:</strong></p>
      <ul>
        <li><strong>Bản tin sáng</strong> — Tóm tắt hàng ngày. Chạy 1 lần/ngày → model nhẹ đủ</li>
        <li><strong>Báo cáo tuần</strong> — Phân tích sâu mỗi tuần → model mạnh cho insight tốt hơn</li>
        <li><strong>Phân tích ngách</strong> — Tìm và đánh giá ngành hàng mới. Chạy ít → model mạnh OK</li>
        <li><strong>Cố vấn AI</strong> — Ban lãnh đạo AI (CMO, CFO, CTO, CEO). Quyết định chiến lược → nên dùng model mạnh</li>
      </ul>
      <GuideCallout variant="warning">
        Nếu chưa cấu hình, app sẽ báo lỗi &ldquo;Chưa cấu hình AI model&rdquo; khi dùng bất kỳ tính năng AI nào. Không có model mặc định — bạn phải tự chọn.
      </GuideCallout>

      <h3>Bảng so sánh 3 preset</h3>
      <div className="not-prose overflow-x-auto my-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-slate-700">
              <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Tác vụ</th>
              <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Tiết kiệm</th>
              <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Cân bằng</th>
              <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Chất lượng cao</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            <tr><td className="py-2 px-3 text-gray-900 dark:text-gray-100">Chấm điểm SP</td><td className="py-2 px-3">Haiku</td><td className="py-2 px-3">Haiku</td><td className="py-2 px-3 font-medium text-orange-600 dark:text-orange-400">Sonnet</td></tr>
            <tr><td className="py-2 px-3 text-gray-900 dark:text-gray-100">Tạo Brief</td><td className="py-2 px-3">Haiku</td><td className="py-2 px-3 font-medium text-orange-600 dark:text-orange-400">Sonnet</td><td className="py-2 px-3 font-medium text-orange-600 dark:text-orange-400">Opus</td></tr>
            <tr><td className="py-2 px-3 text-gray-900 dark:text-gray-100">Hồ sơ kênh</td><td className="py-2 px-3">Sonnet</td><td className="py-2 px-3 font-medium text-orange-600 dark:text-orange-400">Sonnet</td><td className="py-2 px-3 font-medium text-orange-600 dark:text-orange-400">Opus</td></tr>
            <tr><td className="py-2 px-3 text-gray-900 dark:text-gray-100">Bản tin sáng</td><td className="py-2 px-3">Haiku</td><td className="py-2 px-3">Haiku</td><td className="py-2 px-3 font-medium text-orange-600 dark:text-orange-400">Sonnet</td></tr>
            <tr><td className="py-2 px-3 text-gray-900 dark:text-gray-100">Báo cáo tuần</td><td className="py-2 px-3">Haiku</td><td className="py-2 px-3 font-medium text-orange-600 dark:text-orange-400">Sonnet</td><td className="py-2 px-3 font-medium text-orange-600 dark:text-orange-400">Opus</td></tr>
            <tr><td className="py-2 px-3 text-gray-900 dark:text-gray-100">Phân tích ngách</td><td className="py-2 px-3">Haiku</td><td className="py-2 px-3 font-medium text-orange-600 dark:text-orange-400">Sonnet</td><td className="py-2 px-3 font-medium text-orange-600 dark:text-orange-400">Opus</td></tr>
            <tr><td className="py-2 px-3 text-gray-900 dark:text-gray-100">Cố vấn AI</td><td className="py-2 px-3">Sonnet</td><td className="py-2 px-3 font-medium text-orange-600 dark:text-orange-400">Sonnet</td><td className="py-2 px-3 font-medium text-orange-600 dark:text-orange-400">Opus</td></tr>
            <tr className="font-medium"><td className="py-2 px-3 text-gray-900 dark:text-gray-100">Chi phí ước tính</td><td className="py-2 px-3">~$2-5/tháng</td><td className="py-2 px-3">~$10-15/tháng</td><td className="py-2 px-3">~$30-50/tháng</td></tr>
          </tbody>
        </table>
      </div>

      <GuideCallout variant="success">
        <strong>Khuyến nghị:</strong> Bắt đầu với preset &ldquo;Cân bằng&rdquo;. Chấm điểm dùng Haiku (nhanh, rẻ, đủ chính xác). Tạo Brief dùng Sonnet (sáng tạo hơn đáng kể). Nâng lên Opus khi cần brief đặc biệt hay.
      </GuideCallout>

      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        Danh sách model tự động cập nhật phiên bản mới nhất khi bạn kết nối API key.
      </p>

      <h3>So sánh model</h3>
      <div className="not-prose overflow-x-auto my-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-slate-700">
              <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Model</th>
              <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Tốc độ</th>
              <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Sáng tạo</th>
              <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Phù hợp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            <tr><td className="py-2 px-3 text-gray-900 dark:text-gray-100">Haiku 4.5</td><td className="py-2 px-3">Nhanh</td><td className="py-2 px-3">Tốt</td><td className="py-2 px-3">Scoring, tóm tắt</td></tr>
            <tr><td className="py-2 px-3 text-gray-900 dark:text-gray-100">Sonnet 4.5</td><td className="py-2 px-3">Khá</td><td className="py-2 px-3">Rất tốt</td><td className="py-2 px-3">Brief hàng ngày</td></tr>
            <tr><td className="py-2 px-3 text-gray-900 dark:text-gray-100">Opus 4.6</td><td className="py-2 px-3">Chậm</td><td className="py-2 px-3">Xuất sắc</td><td className="py-2 px-3">Brief chất lượng cao</td></tr>
            <tr><td className="py-2 px-3 text-gray-900 dark:text-gray-100">GPT-4o</td><td className="py-2 px-3">Khá</td><td className="py-2 px-3">Rất tốt</td><td className="py-2 px-3">Đa năng</td></tr>
            <tr><td className="py-2 px-3 text-gray-900 dark:text-gray-100">GPT-4o-mini</td><td className="py-2 px-3">Nhanh</td><td className="py-2 px-3">Khá</td><td className="py-2 px-3">Thay thế Haiku</td></tr>
            <tr><td className="py-2 px-3 text-gray-900 dark:text-gray-100">Gemini 2.0 Flash</td><td className="py-2 px-3">Nhanh</td><td className="py-2 px-3">Khá</td><td className="py-2 px-3">Nhanh</td></tr>
            <tr><td className="py-2 px-3 text-gray-900 dark:text-gray-100">Gemini 2.5 Pro</td><td className="py-2 px-3">Khá</td><td className="py-2 px-3">Rất tốt</td><td className="py-2 px-3">Phân tích</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
