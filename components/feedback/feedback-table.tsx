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
  success: { label: "Tốt", cls: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300" },
  moderate: { label: "Trung bình", cls: "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300" },
  poor: { label: "Kém", cls: "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300" },
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
      <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
        Chưa có dữ liệu feedback. Upload file để bắt đầu.
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-100 dark:border-slate-800">
          <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4">Sản phẩm</th>
          <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4 hidden sm:table-cell">Điểm AI</th>
          <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4 hidden md:table-cell">Platform</th>
          <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4">ROAS / DT</th>
          <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4">Kết quả</th>
          <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4 hidden sm:table-cell">Ngày</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
        {feedbacks.map((fb) => {
          const platform = fb.adPlatform ?? fb.salesPlatform ?? "—";
          const successInfo = SUCCESS_BADGE[fb.overallSuccess] ?? SUCCESS_BADGE.moderate;

          return (
            <tr key={fb.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
              <td className="py-4 px-4 text-sm font-medium text-gray-900 dark:text-gray-50 max-w-[200px] truncate">
                {fb.productName}
              </td>
              <td className="py-4 px-4 text-right text-sm tabular-nums text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                {fb.aiScoreAtSelection.toFixed(1)}
              </td>
              <td className="py-4 px-4 text-sm text-gray-500 dark:text-gray-400 capitalize hidden md:table-cell">
                {platform}
              </td>
              <td className="py-4 px-4 text-sm tabular-nums text-gray-600 dark:text-gray-300">
                {formatROASOrRevenue(fb.adROAS, fb.revenue)}
              </td>
              <td className="py-4 px-4">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${successInfo.cls}`}>
                  {successInfo.label}
                </span>
              </td>
              <td className="py-4 px-4 text-sm text-gray-400 dark:text-gray-500 hidden sm:table-cell">
                {formatDate(fb.feedbackDate)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
