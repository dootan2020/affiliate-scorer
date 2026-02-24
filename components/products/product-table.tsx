"use client";

import Link from "next/link";
import { ProductImage } from "@/components/products/product-image";
import { formatVND, formatPercent, formatPlatform } from "@/lib/utils/format";
import { Upload } from "lucide-react";

interface ProductBadge {
  type: string;
  emoji: string;
  label: string;
  detail?: string;
}

interface ProductRow {
  id: string;
  name: string;
  price: number;
  commissionRate: number;
  commissionVND: number;
  platform: string;
  aiScore: number | null;
  aiRank: number | null;
  sales7d: number | null;
  totalKOL: number | null;
  imageUrl: string | null;
  category: string;
  badges?: ProductBadge[];
}

interface ProductTableProps {
  products: ProductRow[];
}

function getScoreBadgeClass(score: number): string {
  if (score >= 85) return "bg-rose-500 text-white";
  if (score >= 70) return "bg-emerald-500 text-white";
  if (score >= 50) return "bg-amber-500 text-white";
  return "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300";
}

function ScoreBadge({
  score,
}: {
  score: number | null;
}): React.ReactElement {
  if (score === null) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
        —
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

function PlatformBadge({
  platform,
}: {
  platform: string;
}): React.ReactElement {
  const colors: Record<string, string> = {
    tiktok_shop:
      "bg-pink-50 dark:bg-pink-950 text-pink-700 dark:text-pink-300",
    tiktok:
      "bg-pink-50 dark:bg-pink-950 text-pink-700 dark:text-pink-300",
    shopee:
      "bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300",
    both: "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300",
  };
  const key = platform.toLowerCase();
  const cls =
    colors[key] ??
    "bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300";
  const label = formatPlatform(platform);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  );
}

function formatNumber(n: number | null): string {
  if (n === null || n === undefined) return "—";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toLocaleString("vi-VN");
}

export function ProductTable({
  products,
}: ProductTableProps): React.ReactElement {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-1">
          Chưa có sản phẩm nào
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          Hãy upload CSV để bắt đầu.
        </p>
      </div>
    );
  }

  return (
    <table className="w-full table-fixed">
      <colgroup>
        <col className="w-10" />
        <col className="w-14" />
        <col />
        <col className="w-24 hidden sm:table-column" />
        <col className="w-32 hidden md:table-column" />
        <col className="w-20 hidden lg:table-column" />
        <col className="w-16 hidden lg:table-column" />
        <col className="w-20 hidden sm:table-column" />
      </colgroup>
      <thead>
        <tr className="border-b border-gray-100 dark:border-slate-800">
          <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-3 px-3 whitespace-nowrap">
            #
          </th>
          <th className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-3 px-2 whitespace-nowrap">
            Điểm
          </th>
          <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-3 px-3 whitespace-nowrap">
            Sản phẩm
          </th>
          <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-3 px-3 hidden sm:table-cell whitespace-nowrap">
            Giá
          </th>
          <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-3 px-3 hidden md:table-cell whitespace-nowrap">
            Hoa hồng
          </th>
          <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-3 px-3 hidden lg:table-cell whitespace-nowrap">
            Bán 7d
          </th>
          <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-3 px-3 hidden lg:table-cell whitespace-nowrap">
            KOL
          </th>
          <th className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-3 px-2 hidden sm:table-cell whitespace-nowrap">
            Platform
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
        {products.map((product, index) => (
          <tr
            key={product.id}
            className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <td className="py-3 px-3 text-sm text-gray-400 dark:text-gray-500 font-medium">
              {product.aiRank ?? index + 1}
            </td>
            <td className="py-3 px-2 text-center">
              <ScoreBadge score={product.aiScore} />
            </td>
            <td className="py-3 px-3">
              <Link
                href={`/products/${product.id}`}
                className="flex items-center gap-3 group"
              >
                <ProductImage
                  src={product.imageUrl}
                  alt={product.name}
                  size={40}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-1 transition-colors">
                      {product.name}
                    </p>
                    {product.badges && product.badges.length > 0 && (
                      <span className="shrink-0 text-xs" title={product.badges.map((b) => `${b.emoji} ${b.label}`).join(", ")}>
                        {product.badges.map((b) => b.emoji).join("")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1">
                    {product.category}
                  </p>
                </div>
              </Link>
            </td>
            <td className="py-3 px-3 text-right text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell whitespace-nowrap">
              {formatVND(product.price)}
            </td>
            <td className="py-3 px-3 text-right text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell whitespace-nowrap">
              <span>{formatPercent(product.commissionRate)}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                /{formatVND(product.commissionVND)}
              </span>
            </td>
            <td className="py-3 px-3 text-right text-sm text-gray-600 dark:text-gray-300 hidden lg:table-cell whitespace-nowrap">
              {formatNumber(product.sales7d)}
            </td>
            <td className="py-3 px-3 text-right text-sm text-gray-600 dark:text-gray-300 hidden lg:table-cell whitespace-nowrap">
              {formatNumber(product.totalKOL)}
            </td>
            <td className="py-3 px-2 text-center hidden sm:table-cell">
              <PlatformBadge platform={product.platform} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
