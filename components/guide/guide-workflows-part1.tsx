import {
  Database, Brain, Sparkles, Settings, Key, Cpu, PlusCircle,
  Copy, Clipboard, CheckCircle2, Globe, Upload, BarChart3, TrendingUp, Target,
} from "lucide-react";
import { FlowDiagram } from "./flow-diagram";

export function GuideWorkflowsPart1(): React.ReactElement {
  return (
    <>
      {/* 3.1 Sơ đồ tổng quan hệ thống */}
      <div id="wf-tong-quan">
        <h3>3.1 Sơ đồ tổng quan hệ thống</h3>
        <FlowDiagram
          description="Toàn cảnh app — dữ liệu đi từ đâu, qua đâu, ra đâu."
          steps={[
            { icon: Database, title: "Nguồn dữ liệu", items: ["FastMoss", "TikTok Shop", "Dán link", "TikTok Studio"], type: "input" },
            { icon: Brain, title: "PASTR xử lý", items: ["Chấm điểm AI", "Tạo Brief AI", "Phân tích", "Học từ phản hồi"], type: "ai" },
            { icon: Sparkles, title: "Kết quả", items: ["Video TikTok", "Brief sáng tạo", "Báo cáo", "Chiến lược"], type: "output" },
          ]}
        />
      </div>

      {/* 3.2 Cài đặt ban đầu */}
      <div id="wf-cai-dat">
        <h3>3.2 Cài đặt ban đầu</h3>
        <FlowDiagram
          description="4 bước setup lần đầu sử dụng app."
          steps={[
            { icon: Settings, title: "Mở Cài đặt", description: "Chọn nhà cung cấp AI", type: "user", location: "Cài đặt" },
            { icon: Key, title: "Nhập khóa API", description: "Dán khóa → Bấm Kiểm tra", type: "user", location: "Cài đặt" },
            { icon: Cpu, title: "Chọn mô hình AI", description: "Haiku cho chấm điểm, Sonnet cho Brief", type: "user", location: "Cài đặt" },
            { icon: PlusCircle, title: "Thêm SP đầu tiên", description: "Dán link hoặc upload FastMoss", type: "user", location: "Tổng quan" },
          ]}
        />
      </div>

      {/* 3.3 Thêm SP bằng dán link */}
      <div id="wf-dan-link">
        <h3>3.3 Thêm sản phẩm bằng dán link</h3>
        <FlowDiagram
          description="Cách nhanh nhất để thêm 1 sản phẩm."
          steps={[
            { icon: Copy, title: "Sao chép link", items: ["TikTok Shop", "FastMoss", "Video TikTok"], type: "input", location: "Bên ngoài" },
            { icon: Clipboard, title: "Dán link vào ô", description: "Tổng quan hoặc Hộp SP → Dán link", type: "user", location: "Tổng quan" },
            { icon: Brain, title: "AI tự động", description: "Trích thông tin → Chấm điểm 1-100", type: "ai" },
            { icon: CheckCircle2, title: "Xem trong Hộp SP", description: "SP đã có điểm số 1-100", type: "output", location: "Hộp SP" },
          ]}
        />
      </div>

      {/* 3.4 Thêm SP hàng loạt qua FastMoss */}
      <div id="wf-fastmoss">
        <h3>3.4 Thêm sản phẩm hàng loạt qua FastMoss</h3>
        <FlowDiagram
          description="Upload file để thêm nhiều sản phẩm cùng lúc."
          steps={[
            { icon: Globe, title: "Vào FastMoss", description: "Tìm danh sách SP → Xuất file .xlsx", type: "input", location: "FastMoss" },
            { icon: Upload, title: "Kéo thả file", description: "Vào Đồng bộ → Thả file .xlsx/.csv", type: "user", location: "Đồng bộ" },
            { icon: Cpu, title: "App tự xử lý", description: "Nhận diện cột → Ghép dữ liệu", type: "ai" },
            { icon: CheckCircle2, title: "SP vào Hộp SP", description: "Chấm điểm AI → Sắp xếp theo điểm", type: "output", location: "Hộp SP" },
          ]}
        />
      </div>

      {/* 3.5 Đồng bộ TikTok Studio */}
      <div id="wf-tiktok-studio">
        <h3>3.5 Đồng bộ TikTok Studio</h3>
        <FlowDiagram
          description="Đồng bộ analytics từ TikTok để AI hiểu audience."
          steps={[
            { icon: BarChart3, title: "Vào TikTok Studio", description: "Phân tích → Xuất các file Excel", type: "input", location: "TikTok Studio" },
            { icon: Upload, title: "Kéo thả nhiều file", description: "Vào Đồng bộ → Thả cùng lúc", type: "user", location: "Đồng bộ" },
            { icon: Cpu, title: "Nhận diện loại file", description: "Nội dung, Tổng quan, Người theo dõi", type: "ai" },
            { icon: TrendingUp, title: "AI hiểu audience", description: "Tối ưu brief phù hợp hơn", type: "output", location: "Phân tích" },
          ]}
        />
      </div>

      {/* 3.6 Chấm điểm sản phẩm */}
      <div id="wf-cham-diem">
        <h3>3.6 Chấm điểm sản phẩm (AI Scoring)</h3>
        <FlowDiagram
          description="AI đánh giá sản phẩm dựa trên nhiều yếu tố."
          steps={[
            { icon: Database, title: "Dữ liệu đầu vào", items: ["Giá bán & Hoa hồng", "Lượt bán 7 ngày", "Đánh giá & Reviews", "Xu hướng thị trường", "Phù hợp TikTok"], type: "input" },
            { icon: Brain, title: "AI phân tích", description: "Xử lý tổng hợp toàn bộ yếu tố", type: "ai" },
            { icon: Target, title: "Điểm số 1-100", items: ["> 70: Nên quay", "50-70: Cân nhắc", "< 50: Bỏ qua"], type: "output" },
          ]}
        />
      </div>
    </>
  );
}
