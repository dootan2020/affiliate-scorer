import {
  MousePointer, Play, Sparkles, FileText, Sun, Search, Video, Moon,
  ThumbsUp, RefreshCw, BookOpen, MessageSquare, Target,
  DollarSign, CreditCard, TrendingUp, Share2, BarChart3,
} from "lucide-react";
import { FlowDiagram } from "./flow-diagram";

export function GuideWorkflowsPart2(): React.ReactElement {
  return (
    <>
      {/* 3.7 Tạo Brief nội dung */}
      <div id="wf-brief">
        <h3>3.7 Tạo Brief nội dung bằng AI</h3>
        <FlowDiagram
          description="Quy trình từ chọn sản phẩm đến sản xuất video."
          steps={[
            { icon: MousePointer, title: "Chọn SP", description: "Tab Tạo mới → chọn SP điểm cao", type: "user", location: "Sản xuất" },
            { icon: Play, title: "Tạo Brief AI", description: "Brief lưu vào DB, không mất khi rời trang", type: "user", location: "Sản xuất" },
            { icon: Sparkles, title: "AI tạo nội dung", items: ["Hook + kịch bản", "Prompt Kling/Veo3 từng scene", "Caption + Hashtags + CTA"], type: "ai" },
            { icon: FileText, title: "Copy & quay", description: "Copy prompt từng scene → Quay/render → Cập nhật trạng thái", type: "output", location: "Sản xuất" },
          ]}
        />
      </div>

      {/* 3.8 Quy trình sản xuất ngày */}
      <div id="wf-san-xuat-ngay">
        <h3>3.8 Quy trình sản xuất 1 ngày</h3>
        <FlowDiagram
          description="Từ đọc bản tin sáng đến ghi nhật ký tối."
          steps={[
            { icon: Sun, title: "Sáng: Bản tin", description: "Tổng quan → Biết hôm nay làm gì", type: "user", location: "Tổng quan" },
            { icon: Search, title: "Trưa: Tìm SP mới", description: "Upload FastMoss hoặc dán link", type: "user", location: "Đồng bộ" },
            { icon: Video, title: "Chiều: Quay video", description: "Theo brief → Chỉnh sửa → Đăng TikTok", type: "user", location: "Ngoài app" },
            { icon: Moon, title: "Tối: Ghi nhật ký", description: "Link video, trạng thái, ghi chú", type: "user", location: "Nhật ký" },
          ]}
        />
      </div>

      {/* 3.9 Nhật ký & phản hồi */}
      <div id="wf-nhat-ky">
        <h3>3.9 Nhật ký &amp; phản hồi</h3>
        <FlowDiagram
          description="Log video → đánh giá kết quả → AI học."
          steps={[
            { icon: FileText, title: "Ghi nhận video", items: ["Sản phẩm", "Link TikTok", "Trạng thái", "Ghi chú"], type: "user", location: "Nhật ký" },
            { icon: ThumbsUp, title: "Đánh giá kết quả", description: "Bán tốt/tệ? Bao nhiêu đơn? Tại sao?", type: "user", location: "Phân tích" },
            { icon: RefreshCw, title: "AI cập nhật", description: "Trọng số thay đổi → Brief ngày mai tốt hơn", type: "ai" },
          ]}
        />
      </div>

      {/* 3.10 Vòng lặp học AI */}
      <div id="wf-hoc">
        <h3>3.10 Vòng lặp học &amp; tối ưu</h3>
        <FlowDiagram
          title="Giai đoạn 1: Thu thập"
          description="AI học từ phản hồi để cải thiện dần."
          steps={[
            { icon: BookOpen, title: "Nhật ký video", description: "Tích lũy dữ liệu hàng ngày", type: "input" },
            { icon: MessageSquare, title: "Phản hồi", description: "Đánh giá từng video: Tốt/Tệ", type: "user" },
            { icon: Play, title: "Chạy Học", description: "Cần 10+ phản hồi", type: "ai" },
          ]}
        />
        <FlowDiagram
          title="Giai đoạn 2: Cải thiện"
          steps={[
            { icon: RefreshCw, title: "AI cập nhật trọng số", description: "Pattern thắng/thua", type: "ai" },
            { icon: Target, title: "Điểm chính xác hơn", description: "Gợi ý SP phù hợp hơn", type: "output" },
            { icon: Sparkles, title: "Brief chất lượng hơn", description: "Quay lại giai đoạn 1", type: "output" },
          ]}
        />
      </div>

      {/* 3.11 Theo dõi thu chi */}
      <div id="wf-thu-chi">
        <h3>3.11 Theo dõi thu chi</h3>
        <FlowDiagram
          description="Ghi nhận thu nhập và chi phí affiliate."
          steps={[
            { icon: DollarSign, title: "Ghi thu nhập", items: ["Hoa hồng TikTok Shop", "Thưởng campaign"], type: "user", location: "Phân tích" },
            { icon: CreditCard, title: "Ghi chi phí", items: ["Quảng cáo", "Công cụ AI", "Mẫu sản phẩm"], type: "user", location: "Phân tích" },
            { icon: TrendingUp, title: "Xem lợi nhuận", description: "Tự động tính: Thu - Chi. Biểu đồ theo tháng", type: "output", location: "Phân tích" },
          ]}
        />
      </div>

      {/* 3.12 Chuẩn bị chiến dịch sale */}
      <div id="wf-chien-dich">
        <h3>3.12 Chuẩn bị chiến dịch sale</h3>
        <FlowDiagram
          description="Quy trình chuẩn bị nội dung trước mùa sale."
          steps={[
            { icon: Search, title: "7 ngày trước", description: "Xem lịch SK → Chọn SP phù hợp mùa sale", type: "user", location: "Phân tích" },
            { icon: Sparkles, title: "5 ngày trước", description: "Tạo brief nhiều SP → Quay video dự trữ", type: "ai", location: "Sản xuất" },
            { icon: Share2, title: "3 ngày trước", description: "Đăng 2-3 video/ngày để thuật toán đẩy kịp", type: "user", location: "Ngoài app" },
            { icon: BarChart3, title: "Ngày sale", description: "Video nào viral? SP bán chạy? Ghi phản hồi", type: "user", location: "Nhật ký" },
          ]}
        />
      </div>
    </>
  );
}
