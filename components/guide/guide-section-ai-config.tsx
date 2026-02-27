import { GuideCallout } from "./guide-callout";

export function GuideSectionAiConfig(): React.ReactElement {
  return (
    <section id="cau-hinh-ai">
      <h2>10. Cấu hình AI</h2>
      <p>Mọi tính năng AI (chấm điểm, tạo brief, bản tin sáng, báo cáo tuần) đều cần cấu hình trước khi dùng.</p>

      <h3>Cách cấu hình</h3>
      <ol>
        <li>Vào <strong>Cài đặt → API Keys</strong> → thêm ít nhất 1 khóa API (Anthropic, OpenAI, hoặc Google)</li>
        <li>Bấm <strong>Kiểm tra kết nối</strong> → phải hiện &ldquo;Đã kết nối&rdquo;</li>
        <li>Vào <strong>Cài đặt → AI Models</strong> → chọn model cho từng tác vụ:
          <ul>
            <li><strong>Chấm điểm SP</strong> (scoring)</li>
            <li><strong>Tạo Brief</strong> (content_brief)</li>
            <li><strong>Bản tin sáng</strong> (morning_brief)</li>
            <li><strong>Báo cáo tuần</strong> (weekly_report)</li>
          </ul>
        </li>
      </ol>
      <GuideCallout variant="warning">
        Nếu chưa cấu hình, app sẽ báo lỗi &ldquo;Chưa cấu hình AI model&rdquo; khi dùng bất kỳ tính năng AI nào. Không có model mặc định — bạn phải tự chọn.
      </GuideCallout>

      <h3>Preset khuyến nghị</h3>
      <p>3 preset tùy nhu cầu:</p>

      <h3>Nhanh &amp; Tiết kiệm — Cho người mới</h3>
      <div className="not-prose overflow-x-auto my-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-slate-700">
              <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Tác vụ</th>
              <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Model</th>
              <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Chi phí</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            <tr><td className="py-2 px-3 text-gray-900 dark:text-gray-100">Chấm điểm SP</td><td className="py-2 px-3">Haiku 4.5</td><td className="py-2 px-3">~$0.001/SP</td></tr>
            <tr><td className="py-2 px-3 text-gray-900 dark:text-gray-100">Tạo Brief</td><td className="py-2 px-3">Haiku 4.5</td><td className="py-2 px-3">~$0.002/brief</td></tr>
            <tr><td className="py-2 px-3 text-gray-900 dark:text-gray-100">Morning Brief</td><td className="py-2 px-3">Haiku 4.5</td><td className="py-2 px-3">~$0.003/ngày</td></tr>
            <tr><td className="py-2 px-3 text-gray-900 dark:text-gray-100">Báo cáo tuần</td><td className="py-2 px-3">Haiku 4.5</td><td className="py-2 px-3">~$0.005/tuần</td></tr>
            <tr className="font-medium"><td className="py-2 px-3 text-gray-900 dark:text-gray-100">Tổng ước tính</td><td className="py-2 px-3"></td><td className="py-2 px-3">~$2-5/tháng</td></tr>
          </tbody>
        </table>
      </div>

      <h3>Cân bằng — Khuyến nghị hàng ngày</h3>
      <div className="not-prose overflow-x-auto my-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-slate-700">
              <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Tác vụ</th>
              <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Model</th>
              <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Chi phí</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            <tr><td className="py-2 px-3 text-gray-900 dark:text-gray-100">Chấm điểm SP</td><td className="py-2 px-3">Haiku 4.5</td><td className="py-2 px-3">~$0.001/SP</td></tr>
            <tr><td className="py-2 px-3 text-gray-900 dark:text-gray-100">Tạo Brief</td><td className="py-2 px-3 font-medium text-orange-600 dark:text-orange-400">Sonnet 4.5</td><td className="py-2 px-3">~$0.01/brief</td></tr>
            <tr><td className="py-2 px-3 text-gray-900 dark:text-gray-100">Morning Brief</td><td className="py-2 px-3">Haiku 4.5</td><td className="py-2 px-3">~$0.003/ngày</td></tr>
            <tr><td className="py-2 px-3 text-gray-900 dark:text-gray-100">Báo cáo tuần</td><td className="py-2 px-3 font-medium text-orange-600 dark:text-orange-400">Sonnet 4.5</td><td className="py-2 px-3">~$0.02/tuần</td></tr>
            <tr className="font-medium"><td className="py-2 px-3 text-gray-900 dark:text-gray-100">Tổng ước tính</td><td className="py-2 px-3"></td><td className="py-2 px-3">~$10-15/tháng</td></tr>
          </tbody>
        </table>
      </div>

      <h3>Chất lượng tốt nhất — Brief hay, phân tích sâu</h3>
      <div className="not-prose overflow-x-auto my-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-slate-700">
              <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Tác vụ</th>
              <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Model</th>
              <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Chi phí</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            <tr><td className="py-2 px-3 text-gray-900 dark:text-gray-100">Chấm điểm SP</td><td className="py-2 px-3 font-medium text-orange-600 dark:text-orange-400">Sonnet 4.5</td><td className="py-2 px-3">~$0.005/SP</td></tr>
            <tr><td className="py-2 px-3 text-gray-900 dark:text-gray-100">Tạo Brief</td><td className="py-2 px-3 font-medium text-orange-600 dark:text-orange-400">Opus 4.6</td><td className="py-2 px-3">~$0.05/brief</td></tr>
            <tr><td className="py-2 px-3 text-gray-900 dark:text-gray-100">Morning Brief</td><td className="py-2 px-3 font-medium text-orange-600 dark:text-orange-400">Sonnet 4.5</td><td className="py-2 px-3">~$0.01/ngày</td></tr>
            <tr><td className="py-2 px-3 text-gray-900 dark:text-gray-100">Báo cáo tuần</td><td className="py-2 px-3 font-medium text-orange-600 dark:text-orange-400">Opus 4.6</td><td className="py-2 px-3">~$0.08/tuần</td></tr>
            <tr className="font-medium"><td className="py-2 px-3 text-gray-900 dark:text-gray-100">Tổng ước tính</td><td className="py-2 px-3"></td><td className="py-2 px-3">~$30-50/tháng</td></tr>
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
