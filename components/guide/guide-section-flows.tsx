import { GuideWorkflowsPart1 } from "./guide-workflows-part1";
import { GuideWorkflowsPart2 } from "./guide-workflows-part2";

export function GuideSectionFlows(): React.ReactElement {
  return (
    <section id="luong-cong-viec">
      <h2>3. Luồng công việc</h2>
      <p>
        Tất cả luồng xử lý trong PASTR — từ nhập dữ liệu đến xuất video.
        Mỗi sơ đồ cho thấy dữ liệu đi qua những bước nào và ở trang nào trong app.
      </p>
      <GuideWorkflowsPart1 />
      <GuideWorkflowsPart2 />
    </section>
  );
}
