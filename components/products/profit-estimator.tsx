import { Calculator } from "lucide-react";

interface ProfitEstimatorProps {
  commissionVND: number;
}

const BUDGETS = [300_000, 500_000, 1_000_000] as const;
const CONVERSION_RATE = 0.03; // 3% default

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr`;
  if (n >= 1_000) return `${Math.round(n / 1_000).toLocaleString("vi-VN")}K`;
  return `${Math.round(n).toLocaleString("vi-VN")}đ`;
}

function fmtBudget(n: number): string {
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  return `${n / 1_000}K`;
}

export function ProfitEstimator({ commissionVND }: ProfitEstimatorProps): React.ReactElement {
  const rows = BUDGETS.map((budget) => {
    const breakevenOrders = Math.ceil(budget / commissionVND);
    const clicksNeeded = Math.ceil(breakevenOrders / CONVERSION_RATE);
    const cpc = Math.round(budget / clicksNeeded);
    return { budget, breakevenOrders, clicksNeeded, cpc };
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-orange-500" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Ước tính lợi nhuận (tham khảo)
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-slate-800">
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 py-2 pr-3">
                Budget/ngày
              </th>
              {rows.map((r) => (
                <th key={r.budget} className="text-right text-xs font-semibold text-gray-900 dark:text-gray-50 py-2 px-2 whitespace-nowrap">
                  {fmtBudget(r.budget)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
            <tr>
              <td className="py-2.5 pr-3 text-gray-500 dark:text-gray-400">Hoa hồng/đơn</td>
              {rows.map((r) => (
                <td key={r.budget} className="py-2.5 px-2 text-right font-medium text-gray-900 dark:text-gray-50 whitespace-nowrap">
                  {fmt(commissionVND)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2.5 pr-3 text-gray-500 dark:text-gray-400">Đơn hòa vốn</td>
              {rows.map((r) => (
                <td key={r.budget} className="py-2.5 px-2 text-right font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                  {r.breakevenOrders} đơn
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2.5 pr-3 text-gray-500 dark:text-gray-400">Clicks cần (~3%)</td>
              {rows.map((r) => (
                <td key={r.budget} className="py-2.5 px-2 text-right text-gray-600 dark:text-gray-300 whitespace-nowrap">
                  ~{r.clicksNeeded.toLocaleString("vi-VN")}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2.5 pr-3 text-gray-500 dark:text-gray-400">CPC ước tính</td>
              {rows.map((r) => (
                <td key={r.budget} className="py-2.5 px-2 text-right text-gray-600 dark:text-gray-300 whitespace-nowrap">
                  ~{fmt(r.cpc)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 leading-relaxed">
        Ước tính dựa trên tỷ lệ chuyển đổi TB 2-5%. Upload kết quả ads thật để AI tính chính xác hơn.
      </p>
    </div>
  );
}
