import Link from "next/link";
import { GuideCallout } from "./guide-callout";

export function GuideSectionQuickStart(): React.ReactElement {
  return (
    <section id="bat-dau">
      <h2>1. Bắt đầu nhanh</h2>

      <h3>Bước 1: Kết nối API key</h3>
      <p>
        Vào <Link href="/settings"><strong>Cài đặt</strong></Link> &rarr; chọn nhà cung cấp AI
        (Anthropic, OpenAI, hoặc Google) &rarr; nhập API key &rarr; click{" "}
        <strong>Kiểm tra kết nối</strong>.
      </p>
      <p>Lấy key tại:</p>
      <ul>
        <li>Anthropic: console.anthropic.com</li>
        <li>OpenAI: platform.openai.com/api-keys</li>
        <li>Google: aistudio.google.com/apikey</li>
      </ul>

      <h3>Bước 2: Chọn model AI</h3>
      <p>
        Mỗi tác vụ có thể dùng model khác nhau. Xem mục{" "}
        <strong>Cấu hình AI khuyến nghị</strong> bên dưới.
      </p>

      <h3>Bước 3: Thêm sản phẩm đầu tiên</h3>
      <p>2 cách:</p>
      <ul>
        <li>
          <strong>Paste link</strong>: Dashboard &rarr; &ldquo;Thêm sản phẩm nhanh&rdquo; &rarr;
          dán link TikTok Shop hoặc FastMoss
        </li>
        <li>
          <strong>Upload file</strong>: Sync &rarr; kéo thả file XLSX từ FastMoss
        </li>
      </ul>
      <p>AI sẽ tự động chấm điểm sản phẩm (1-100).</p>

      <h3>Bước 4: Tạo brief đầu tiên</h3>
      <p>
        Inbox &rarr; chọn sản phẩm score cao &rarr; click <strong>Tạo Brief</strong> &rarr;
        AI generate script, hooks, angles cho video TikTok.
      </p>
    </section>
  );
}
