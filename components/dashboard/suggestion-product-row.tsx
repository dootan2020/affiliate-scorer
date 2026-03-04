"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { ProductImage } from "@/components/products/product-image";
import type { SuggestedProduct } from "@/lib/suggestions/compute-smart-suggestions";

interface SuggestionProductRowProps {
  product: SuggestedProduct;
  channelId?: string;
}

export function SuggestionProductRow({ product, channelId }: SuggestionProductRowProps): React.ReactElement {
  const briefHref = channelId
    ? `/production?productId=${product.id}&channel=${channelId}`
    : `/production?productId=${product.id}`;

  return (
    <tr className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
      <td className="py-2.5 pr-2 hidden sm:table-cell">
        <ProductImage src={product.imageUrl} alt={product.title ?? "SP"} />
      </td>
      <td className="py-2.5 pr-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link
            href={`/inbox/${product.id}`}
            className="text-sm font-medium text-gray-900 dark:text-gray-50 hover:text-orange-600 dark:hover:text-orange-400 transition-colors line-clamp-1"
          >
            {product.title ?? "Sản phẩm chưa đặt tên"}
          </Link>
          {product.tag === "proven" ? (
            <span className="shrink-0 inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
              Đã CM
            </span>
          ) : (
            <span className="shrink-0 inline-flex items-center rounded-full bg-purple-50 dark:bg-purple-950 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 dark:text-purple-300">
              Khám phá
            </span>
          )}
          {product.lifecycleStage === "peak" && (
            <span title="Đang ở đỉnh — nên làm sớm">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
            </span>
          )}
        </div>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">
          {product.reason}
        </p>
      </td>
      <td className="py-2.5 pr-2 text-center">
        <span className="inline-flex items-center rounded-full bg-orange-50 dark:bg-orange-950 px-2 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-300">
          {product.smartScore}
        </span>
      </td>
      <td className="py-2.5 text-right">
        <Link
          href={briefHref}
          className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 whitespace-nowrap transition-colors"
        >
          Brief →
        </Link>
      </td>
    </tr>
  );
}
