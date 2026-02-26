"use client";

import Link from "next/link";
import { formatVND, formatPercent } from "@/lib/utils/format";

interface ProductCardData {
  id: string;
  name: string;
  price: number;
  commissionRate: number;
  commissionVND: number;
  platform: string;
  category: string;
  shopName: string | null;
  aiScore: number | null;
}

interface ProductCardProps {
  product: ProductCardData;
}

function getScoreStyle(score: number): { bg: string; text: string; label: string } {
  if (score >= 85) return { bg: "bg-rose-500", text: "text-white", label: "Hot" };
  if (score >= 70) return { bg: "bg-emerald-500", text: "text-white", label: "Tốt" };
  if (score >= 50) return { bg: "bg-amber-500", text: "text-white", label: "Khá" };
  return { bg: "bg-gray-400", text: "text-white", label: "Thấp" };
}

export function ProductCard({ product }: ProductCardProps): React.ReactElement {
  const score = product.aiScore;
  const scoreStyle = score !== null ? getScoreStyle(score) : null;

  return (
    <Link href={`/inbox/${product.id}`} className="block">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer h-full">
        <div className="flex items-start justify-between gap-2 mb-4">
          <p className="font-medium text-sm text-gray-900 dark:text-gray-50 line-clamp-2 flex-1">
            {product.name}
          </p>
          {score !== null && scoreStyle ? (
            <span
              className={`shrink-0 inline-flex flex-col items-center rounded-xl px-2.5 py-1.5 text-xs font-bold ${scoreStyle.bg} ${scoreStyle.text}`}
            >
              <span className="text-base leading-none">{Math.round(score)}</span>
              <span className="text-[10px] opacity-80">{scoreStyle.label}</span>
            </span>
          ) : (
            <span className="shrink-0 rounded-xl bg-gray-100 dark:bg-slate-800 px-2.5 py-1.5 text-xs text-gray-500 dark:text-gray-400">
              Chưa chấm
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mb-3">
          <div>
            <span className="text-gray-400 dark:text-gray-500">Giá: </span>
            <span className="font-medium text-gray-900 dark:text-gray-50">{formatVND(product.price)}</span>
          </div>
          <div>
            <span className="text-gray-400 dark:text-gray-500">HH: </span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              {formatPercent(product.commissionRate)}/{formatVND(product.commissionVND)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-gray-100 dark:bg-slate-800 px-2.5 py-0.5 font-medium text-gray-600 dark:text-gray-300">
            {product.platform}
          </span>
          <span className="text-gray-400 dark:text-gray-500 truncate">{product.category}</span>
        </div>
        {product.shopName && (
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-2">
            Shop: {product.shopName}
          </p>
        )}
      </div>
    </Link>
  );
}
