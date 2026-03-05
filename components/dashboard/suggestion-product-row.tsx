"use client";

import Link from "next/link";
import { AlertTriangle, Sun } from "lucide-react";
import { ProductImage } from "@/components/products/product-image";
import type { SuggestedProduct } from "@/lib/suggestions/compute-smart-suggestions";

interface Props {
  product: SuggestedProduct;
  channelId?: string;
  isMorningBriefPick?: boolean;
}

function formatCompact(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function SuggestionProductRow({ product, channelId, isMorningBriefPick }: Props): React.ReactElement {
  const briefHref = channelId
    ? `/production?productId=${product.id}&channel=${channelId}`
    : `/production?productId=${product.id}`;


  return (
    <tr className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
      {/* Image — desktop only */}
      <td className="py-2 pr-2 hidden sm:table-cell">
        <ProductImage src={product.imageUrl} alt={product.title ?? "SP"} />
      </td>

      {/* Product info */}
      <td className="py-2 pr-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link href={`/inbox/${product.id}`} className="text-sm font-medium text-gray-900 dark:text-gray-50 hover:text-orange-600 dark:hover:text-orange-400 transition-colors line-clamp-1">
            {product.title ?? "Sản phẩm chưa đặt tên"}
          </Link>
          {product.tag === "proven" ? (
            <span className="shrink-0 inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">Đã CM</span>
          ) : (
            <span className="shrink-0 inline-flex items-center rounded-full bg-purple-50 dark:bg-purple-950 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 dark:text-purple-300">Khám phá</span>
          )}
          {product.lifecycleStage === "peak" && (
            <span title="Đang ở đỉnh — nên làm sớm"><AlertTriangle className="w-3 h-3 text-amber-500" /></span>
          )}
          {isMorningBriefPick && (
            <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-yellow-50 dark:bg-yellow-950 px-1.5 py-0.5 text-[10px] font-medium text-yellow-700 dark:text-yellow-300" title="Brief sáng đề xuất">
              <Sun className="w-2.5 h-2.5" /> Sáng
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-[11px] text-gray-400 dark:text-gray-500 line-clamp-1">{product.reason}</p>
          {product.commissionRate != null && (
            <span className="shrink-0 text-[10px] text-emerald-600 dark:text-emerald-400">{product.commissionRate}%</span>
          )}
        </div>
      </td>

      {/* Data column — desktop only */}
      <td className="py-2 pr-2 text-center hidden sm:table-cell">
        <div className="flex flex-col items-center gap-0.5">
          {(product.sales7d != null || product.totalKOL != null) && (
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              {product.sales7d != null && <>{formatCompact(product.sales7d)} bán</>}
              {product.sales7d != null && product.totalKOL != null && " · "}
              {product.totalKOL != null && <>{formatCompact(product.totalKOL)} KOL</>}
            </span>
          )}
        </div>
      </td>

      {/* Score — combinedScore primary, smartScore secondary */}
      <td className="py-2 pr-2 text-center">
        {product.combinedScore != null && (
          <span className="inline-flex items-center rounded-full bg-orange-50 dark:bg-orange-950 px-2 py-0.5 text-xs font-bold text-orange-700 dark:text-orange-300">
            {Math.round(product.combinedScore)}
          </span>
        )}
        <div className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">
          Gợi ý: {product.smartScore}
        </div>
      </td>

      {/* CTA */}
      <td className="py-2 text-right">
        <Link href={briefHref} className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 whitespace-nowrap transition-colors">
          Brief →
        </Link>
      </td>
    </tr>
  );
}
