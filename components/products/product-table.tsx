"use client";

import Link from "next/link";
import { formatVND, formatPercent } from "@/lib/utils/format";
import { Upload } from "lucide-react";

interface ProductRow {
  id: string;
  name: string;
  price: number;
  commissionRate: number;
  commissionVND: number;
  platform: string;
  aiScore: number | null;
  salesGrowth7d: number | null;
  aiRank: number | null;
}

interface ProductTableProps {
  products: ProductRow[];
}

function getScoreBadgeClass(score: number): string {
  if (score >= 85) return "bg-rose-500 text-white";
  if (score >= 70) return "bg-emerald-500 text-white";
  if (score >= 50) return "bg-amber-500 text-white";
  return "bg-gray-300 text-gray-600";
}

function ScoreBadge({ score }: { score: number | null }): React.ReactElement {
  if (score === null) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
        Chưa chấm
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getScoreBadgeClass(score)}`}
    >
      {Math.round(score)}
    </span>
  );
}

function PlatformBadge({ platform }: { platform: string }): React.ReactElement {
  const colors: Record<string, string> = {
    tiktok: "bg-pink-50 text-pink-700",
    shopee: "bg-orange-50 text-orange-700",
    lazada: "bg-blue-50 text-blue-700",
    facebook: "bg-indigo-50 text-indigo-700",
  };
  const key = platform.toLowerCase();
  const cls = colors[key] ?? "bg-gray-50 text-gray-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {platform}
    </span>
  );
}

export function ProductTable({ products }: ProductTableProps): React.ReactElement {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Upload className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          Chưa có sản phẩm nào
        </h3>
        <p className="text-sm text-gray-500 max-w-sm">
          Hãy upload CSV để bắt đầu.
        </p>
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-100">
          <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-4 w-12">#</th>
          <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-4 w-16">Điểm</th>
          <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-4">Tên sản phẩm</th>
          <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-4">Giá</th>
          <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-4">Hoa hồng</th>
          <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-4">Tăng trưởng</th>
          <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-4">Nền tảng</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {products.map((product, index) => (
          <tr key={product.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer">
            <td className="py-4 px-4 text-sm text-gray-400 font-medium">
              {product.aiRank ?? index + 1}
            </td>
            <td className="py-4 px-4 text-center">
              <ScoreBadge score={product.aiScore} />
            </td>
            <td className="py-4 px-4">
              <Link
                href={`/products/${product.id}`}
                className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-2 max-w-[280px] block transition-colors"
              >
                {product.name}
              </Link>
            </td>
            <td className="py-4 px-4 text-right text-sm text-gray-600">
              {formatVND(product.price)}
            </td>
            <td className="py-4 px-4 text-right text-sm text-gray-600">
              {formatPercent(product.commissionRate)}/{formatVND(product.commissionVND)}
            </td>
            <td className="py-4 px-4 text-right text-sm">
              {product.salesGrowth7d !== null && product.salesGrowth7d !== undefined ? (
                <span className={product.salesGrowth7d >= 0 ? "text-emerald-600" : "text-rose-600"}>
                  {product.salesGrowth7d >= 0 ? "+" : ""}
                  {formatPercent(product.salesGrowth7d)}
                </span>
              ) : (
                <span className="text-gray-300">—</span>
              )}
            </td>
            <td className="py-4 px-4 text-center">
              <PlatformBadge platform={product.platform} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
