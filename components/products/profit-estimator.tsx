"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";

interface ProfitEstimatorProps {
  commissionVND: number;
}

const BUDGETS = [300_000, 500_000, 1_000_000] as const;
const CONVERSION_RATES = { low: 0.02, high: 0.05 };

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr`;
  if (n >= 1_000) return `${Math.round(n / 1_000).toLocaleString("vi-VN")}K`;
  return `${Math.round(n).toLocaleString("vi-VN")}đ`;
}

export function ProfitEstimator({ commissionVND }: ProfitEstimatorProps): React.ReactElement {
  const [budget, setBudget] = useState<number>(BUDGETS[1]);

  const breakevenOrders = Math.ceil(budget / commissionVND);
  const clicksLow = Math.ceil(breakevenOrders / CONVERSION_RATES.high);
  const clicksHigh = Math.ceil(breakevenOrders / CONVERSION_RATES.low);
  const cpcLow = Math.round(budget / clicksHigh);
  const cpcHigh = Math.round(budget / clicksLow);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-blue-500" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Ước tính lợi nhuận (TikTok Ads)
        </p>
      </div>

      {/* Budget selector */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xs text-gray-500 dark:text-gray-400">Budget/ngày:</span>
        <div className="flex items-center gap-1 bg-gray-100/80 dark:bg-slate-800/80 rounded-lg p-0.5">
          {BUDGETS.map((b) => (
            <button
              key={b}
              onClick={() => setBudget(b)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                budget === b
                  ? "bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-gray-50"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50"
              }`}
            >
              {fmt(b)}
            </button>
          ))}
        </div>
      </div>

      {/* Calculation */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Hoa hồng/đơn</span>
          <span className="font-semibold text-gray-900 dark:text-gray-50">{fmt(commissionVND)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Cần bán tối thiểu</span>
          <span className="font-semibold text-amber-600 dark:text-amber-400">
            {breakevenOrders} đơn để hòa vốn
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Tỷ lệ chuyển đổi TB</span>
          <span className="text-gray-600 dark:text-gray-300">~2-5% (TikTok Ads)</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Click cần thiết</span>
          <span className="text-gray-600 dark:text-gray-300">
            ~{clicksLow.toLocaleString("vi-VN")}-{clicksHigh.toLocaleString("vi-VN")} clicks
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">CPC ước tính</span>
          <span className="text-gray-600 dark:text-gray-300">~{fmt(cpcLow)}-{fmt(cpcHigh)}</span>
        </div>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 leading-relaxed">
        Đây là ước tính tham khảo, kết quả thật phụ thuộc vào content và targeting.
      </p>
    </div>
  );
}
