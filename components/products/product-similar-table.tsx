import Link from "next/link";
import { Trophy } from "lucide-react";
import { formatVND, formatPercent, formatNumber } from "@/lib/utils/format";

interface SimilarProduct {
  id: string;
  name: string;
  price: number;
  commissionRate: number;
  commissionVND: number;
  sales7d: number | null;
  aiScore: number | null;
  identityId: string | null;
}

interface ProductSimilarTableProps {
  currentProduct: {
    name: string;
    price: number;
    commissionRate: number;
    sales7d: number | null;
    aiScore: number | null;
    category: string | null;
  };
  similarProducts: SimilarProduct[];
}

export function ProductSimilarTable({ currentProduct, similarProducts }: ProductSimilarTableProps): React.ReactElement | null {
  if (similarProducts.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-amber-500" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          SP tương tự (cùng {currentProduct.category}, giá {formatVND(currentProduct.price * 0.5)}–{formatVND(currentProduct.price * 1.5)})
        </p>
      </div>
      <table className="w-full table-fixed">
        <colgroup>
          <col /><col className="w-16" /><col className="w-16" />
          <col className="w-16 hidden sm:table-column" /><col className="w-14" />
        </colgroup>
        <thead>
          <tr className="border-b border-gray-100 dark:border-slate-800">
            <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-2 pr-2">Tên SP</th>
            <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-2 px-2">Giá</th>
            <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-2 px-2">HH</th>
            <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-2 px-2 hidden sm:table-cell">Bán 7D</th>
            <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-2 pl-2">Điểm</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
          <tr className="bg-orange-50/50 dark:bg-orange-950/30">
            <td className="py-2 pr-2 text-sm font-medium text-orange-700 dark:text-orange-300">
              <span className="block truncate" title={currentProduct.name}>{currentProduct.name}</span>
              <span className="text-xs text-orange-400">← đang xem</span>
            </td>
            <td className="py-2 px-2 text-right text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatVND(currentProduct.price)}</td>
            <td className="py-2 px-2 text-right text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatPercent(currentProduct.commissionRate)}</td>
            <td className="py-2 px-2 text-right text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap hidden sm:table-cell">{currentProduct.sales7d !== null ? formatNumber(currentProduct.sales7d) : "—"}</td>
            <td className="py-2 pl-2 text-right text-sm font-semibold text-gray-900 dark:text-gray-50">{currentProduct.aiScore !== null ? Math.round(currentProduct.aiScore) : "—"}</td>
          </tr>
          {similarProducts.map((sp) => (
            <tr key={sp.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50">
              <td className="py-2 pr-2 text-sm text-gray-900 dark:text-gray-50">
                <Link href={`/inbox/${sp.identityId ?? sp.id}`} className="block truncate hover:text-orange-600 dark:hover:text-orange-400 transition-colors" title={sp.name}>
                  {sp.name}
                </Link>
              </td>
              <td className="py-2 px-2 text-right text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatVND(sp.price)}</td>
              <td className="py-2 px-2 text-right text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatPercent(sp.commissionRate)}</td>
              <td className="py-2 px-2 text-right text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap hidden sm:table-cell">{sp.sales7d !== null ? formatNumber(sp.sales7d) : "—"}</td>
              <td className="py-2 pl-2 text-right text-sm font-semibold text-gray-900 dark:text-gray-50">{sp.aiScore !== null ? Math.round(sp.aiScore) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
