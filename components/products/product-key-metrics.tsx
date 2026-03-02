import { CheckCircle2 } from "lucide-react";
import { formatVND, formatPercent, formatNumber } from "@/lib/utils/format";

interface ProductKeyMetricsProps {
  commissionVND: number;
  commissionRate: number;
  sales7d: number | null;
  price: number;
  aiRank: number | null;
  totalProducts: number;
}

export function ProductKeyMetrics({
  commissionVND, commissionRate, sales7d, price, aiRank, totalProducts,
}: ProductKeyMetricsProps): React.ReactElement {
  const isSweetSpot = price >= 100_000 && price <= 500_000 && commissionRate > 8;

  return (
    <div className="bg-orange-50 dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-orange-100 dark:border-slate-700">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Hoa hồng/đơn</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-50">{formatVND(commissionVND)}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{formatPercent(commissionRate)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Bán 7 ngày</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-50">
            {sales7d !== null ? formatNumber(sales7d) : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Giá bán</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-50">{formatVND(price)}</p>
          {isSweetSpot && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Sweet spot
            </p>
          )}
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Xếp hạng</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-50">#{aiRank ?? "—"}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">/ {totalProducts} SP</p>
        </div>
      </div>
    </div>
  );
}
