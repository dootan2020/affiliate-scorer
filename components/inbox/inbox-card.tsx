"use client";

import Link from "next/link";
import { Package, TrendingUp, TrendingDown, Sparkles, Minus, RotateCcw, Star } from "lucide-react";

interface InboxCardProps {
  identity: {
    id: string;
    title: string | null;
    shopName: string | null;
    category: string | null;
    price: number | null;
    commissionRate: string | null; // Decimal comes as string
    imageUrl: string | null;
    inboxState: string;
    marketScore: string | null;
    contentPotentialScore: string | null;
    combinedScore: string | null;
    deltaType: string | null;
    personalRating: number | null;
    createdAt: string;
    product: {
      id: string;
      aiScore: number | null;
      aiRank: number | null;
      sales7d: number | null;
      totalKOL: number | null;
      imageUrl: string | null;
    } | null;
  };
  onEnrich?: (id: string) => void;
}

const STATE_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  new: { label: "Mới", bg: "bg-blue-50 dark:bg-blue-950", text: "text-blue-700 dark:text-blue-400" },
  enriched: { label: "Đã bổ sung", bg: "bg-cyan-50 dark:bg-cyan-950", text: "text-cyan-700 dark:text-cyan-400" },
  scored: { label: "Đã chấm điểm", bg: "bg-emerald-50 dark:bg-emerald-950", text: "text-emerald-700 dark:text-emerald-400" },
  briefed: { label: "Đã tạo brief", bg: "bg-purple-50 dark:bg-purple-950", text: "text-purple-700 dark:text-purple-400" },
  published: { label: "Đã xuất bản", bg: "bg-amber-50 dark:bg-amber-950", text: "text-amber-700 dark:text-amber-400" },
  archived: { label: "Lưu trữ", bg: "bg-gray-50 dark:bg-gray-800", text: "text-gray-500 dark:text-gray-400" },
};

const DELTA_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  NEW: { label: "Mới", icon: Sparkles, color: "text-blue-500" },
  SURGE: { label: "Tăng mạnh", icon: TrendingUp, color: "text-emerald-500" },
  COOL: { label: "Giảm", icon: TrendingDown, color: "text-rose-500" },
  STABLE: { label: "Ổn định", icon: Minus, color: "text-gray-400" },
  REAPPEAR: { label: "Xuất hiện lại", icon: RotateCcw, color: "text-amber-500" },
};

export function InboxCard({ identity, onEnrich }: InboxCardProps): React.ReactElement {
  const state = STATE_LABELS[identity.inboxState] || STATE_LABELS.new;
  const delta = identity.deltaType ? DELTA_CONFIG[identity.deltaType] : null;
  const DeltaIcon = delta?.icon;

  const displayImage = identity.imageUrl || identity.product?.imageUrl;
  const displayTitle = identity.title || "Sản phẩm chưa có tên";
  const marketScore = identity.marketScore ? parseFloat(identity.marketScore) : (identity.product?.aiScore ?? null);
  const contentScore = identity.contentPotentialScore ? parseFloat(identity.contentPotentialScore) : null;

  const formatPrice = (price: number): string => {
    if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}tr`;
    if (price >= 1_000) return `${Math.round(price / 1_000)}k`;
    return price.toLocaleString("vi-VN");
  };

  // Link đến product detail nếu có, ngược lại link đến inbox detail
  const detailHref = identity.product?.id
    ? `/products/${identity.product.id}`
    : `/inbox/${identity.id}`;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-5 hover:shadow-md transition-shadow">
      {/* Header: State badge + Delta */}
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${state.bg} ${state.text}`}>
          {state.label}
        </span>
        {delta && DeltaIcon && (
          <span className={`flex items-center gap-1 text-xs font-medium ${delta.color}`}>
            <DeltaIcon className="w-3.5 h-3.5" />
            {delta.label}
          </span>
        )}
      </div>

      {/* Product info */}
      <div className="flex gap-3 mb-3">
        {displayImage ? (
          <img
            src={displayImage}
            alt={displayTitle}
            className="w-14 h-14 rounded-xl object-cover bg-gray-100 dark:bg-slate-800 shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6 text-gray-300 dark:text-gray-600" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <Link href={detailHref} className="hover:underline">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-50 line-clamp-2 leading-snug">
              {displayTitle}
            </h3>
          </Link>
          {identity.shopName && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
              {identity.shopName}
            </p>
          )}
        </div>
      </div>

      {/* Price + Commission */}
      <div className="flex items-center gap-2 mb-3 text-xs">
        {identity.price ? (
          <span className="text-gray-900 dark:text-gray-50 font-medium">
            ₫{formatPrice(identity.price)}
          </span>
        ) : (
          <span className="text-gray-300 dark:text-gray-600">--</span>
        )}
        {identity.commissionRate && (
          <>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span className="text-emerald-600 dark:text-emerald-400">
              {parseFloat(identity.commissionRate)}%
            </span>
          </>
        )}
        {identity.personalRating && (
          <>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span className="flex items-center gap-0.5 text-amber-500">
              <Star className="w-3 h-3 fill-amber-500" />
              {identity.personalRating}
            </span>
          </>
        )}
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-2 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Market</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 mt-0.5">
            {marketScore !== null ? Math.round(marketScore) : "--"}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-2 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Content</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 mt-0.5">
            {contentScore !== null ? Math.round(contentScore) : "--"}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {identity.inboxState === "new" && (
          <button
            onClick={() => onEnrich?.(identity.id)}
            className="flex-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          >
            Bổ sung
          </button>
        )}
        <Link
          href={detailHref}
          className="flex-1 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-400 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors text-center"
        >
          Chi tiết
        </Link>
      </div>
    </div>
  );
}
