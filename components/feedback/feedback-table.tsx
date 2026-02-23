"use client";

interface FeedbackRow {
  id: string;
  productName: string;
  aiScoreAtSelection: number;
  adPlatform: string | null;
  salesPlatform: string | null;
  adROAS: number | null;
  revenue: number | null;
  overallSuccess: string;
  feedbackDate: string;
}

interface FeedbackTableProps {
  feedbacks: FeedbackRow[];
}

const SUCCESS_BADGE: Record<string, { label: string; cls: string }> = {
  success: { label: "Tốt", cls: "bg-emerald-50 text-emerald-700" },
  moderate: { label: "Trung bình", cls: "bg-gray-100 text-gray-600" },
  poor: { label: "Kém", cls: "bg-rose-50 text-rose-700" },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatROASOrRevenue(roas: number | null, revenue: number | null): string {
  if (roas !== null) return `ROAS ${roas.toFixed(2)}x`;
  if (revenue !== null) return `${revenue.toLocaleString("vi-VN")} ₫`;
  return "—";
}

export function FeedbackTable({ feedbacks }: FeedbackTableProps): React.ReactElement {
  if (feedbacks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        Chưa có dữ liệu feedback. Upload file để bắt đầu.
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-100">
          <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-4">Sản phẩm</th>
          <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-4">Điểm AI lúc chọn</th>
          <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-4">Platform</th>
          <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-4">ROAS / Doanh thu</th>
          <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-4">Kết quả</th>
          <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-4">Ngày</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {feedbacks.map((fb) => {
          const platform = fb.adPlatform ?? fb.salesPlatform ?? "—";
          const successInfo = SUCCESS_BADGE[fb.overallSuccess] ?? SUCCESS_BADGE.moderate;

          return (
            <tr key={fb.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="py-4 px-4 text-sm font-medium text-gray-900 max-w-[200px] truncate">
                {fb.productName}
              </td>
              <td className="py-4 px-4 text-right text-sm tabular-nums text-gray-600">
                {fb.aiScoreAtSelection.toFixed(1)}
              </td>
              <td className="py-4 px-4 text-sm text-gray-500 capitalize">
                {platform}
              </td>
              <td className="py-4 px-4 text-sm tabular-nums text-gray-600">
                {formatROASOrRevenue(fb.adROAS, fb.revenue)}
              </td>
              <td className="py-4 px-4">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${successInfo.cls}`}>
                  {successInfo.label}
                </span>
              </td>
              <td className="py-4 px-4 text-sm text-gray-400">
                {formatDate(fb.feedbackDate)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
