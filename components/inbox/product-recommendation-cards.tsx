"use client";

import { useState, useEffect } from "react";
import { Sparkles, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { scoreColor, scoreBgClass } from "@/lib/niche-scoring/score-colors";
import { ProductImage } from "@/components/products/product-image";
import { cn } from "@/lib/utils";

// --- Types ---

export interface RecommendedProduct {
  id: string;
  title: string | null;
  shopName: string | null;
  imageUrl: string | null;
  price: number | null;
  commissionRate: number | null;
  day28SoldCount: number | null;
  relateVideoCount: number | null;
  deltaType: string | null;
  nicheRecommendScore: number;
  pillarScores: {
    opportunity: number;
    revenue: number;
    momentum: number;
    accessibility: number;
  };
  primaryTag: { emoji: string; label: string; pillar: string };
  secondaryTags: Array<{ emoji: string; label: string; pillar: string }>;
}

interface Props {
  recommendations: RecommendedProduct[];
  onSelectProduct: (id: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
}

// --- Component ---

export function ProductRecommendationCards({ recommendations, onSelectProduct, onLoadMore, hasMore, loadingMore }: Props): React.ReactElement | null {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("recommend-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  const toggleCollapse = (): void => {
    setCollapsed((prev) => {
      sessionStorage.setItem("recommend-collapsed", (!prev).toString());
      return !prev;
    });
  };

  if (recommendations.length === 0) return null;

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-4 sm:p-5">
      {/* Header */}
      <button
        onClick={toggleCollapse}
        className="flex items-center justify-between w-full text-left mb-3"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Top sản phẩm ngách
          </h3>
          <span className="text-xs text-gray-400">
            ({recommendations.length} SP)
          </span>
        </div>
        <span className="text-xs text-gray-400 flex items-center gap-0.5">
          {collapsed ? (
            <><ChevronDown className="w-3.5 h-3.5" /> Mở rộng</>
          ) : (
            <><ChevronUp className="w-3.5 h-3.5" /> Thu gọn</>
          )}
        </span>
      </button>

      {/* Cards */}
      {!collapsed && (
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-700">
          {recommendations.map((product, idx) => (
            <RecommendCard
              key={product.id}
              product={product}
              rank={idx + 1}
              onSelect={onSelectProduct}
            />
          ))}
          {hasMore && onLoadMore && (
            <button
              onClick={(e) => { e.stopPropagation(); onLoadMore(); }}
              disabled={loadingMore}
              className={cn(
                "flex-shrink-0 w-[120px] sm:w-[140px] flex flex-col items-center justify-center gap-2",
                "bg-gray-50 dark:bg-slate-800/60 rounded-xl p-3.5",
                "hover:bg-gray-100 dark:hover:bg-slate-700/60 transition-colors",
                "border border-dashed border-gray-200 dark:border-slate-600 snap-start",
                loadingMore && "opacity-50",
              )}
            >
              <Plus className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {loadingMore ? "Đang tải..." : "Xem thêm"}
              </span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}

// --- Card ---

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

function RecommendCard({
  product,
  rank,
  onSelect,
}: {
  product: RecommendedProduct;
  rank: number;
  onSelect: (id: string) => void;
}): React.ReactElement {
  return (
    <button
      onClick={() => onSelect(product.id)}
      className={cn(
        "flex-shrink-0 w-[200px] sm:w-[220px] flex flex-col",
        "bg-gray-50 dark:bg-slate-800/60 rounded-xl p-3.5",
        "hover:shadow-md hover:-translate-y-0.5 transition-all",
        "text-left snap-start border border-gray-100 dark:border-slate-700/50",
      )}
    >
      {/* Rank + Score */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-bold text-orange-500">
          {RANK_MEDALS[rank - 1] ?? `#${rank}`}
        </span>
        <span
          className={cn(
            "rounded-lg px-2 py-0.5 text-sm font-bold tabular-nums",
            scoreBgClass(product.nicheRecommendScore),
            scoreColor(product.nicheRecommendScore),
          )}
        >
          {product.nicheRecommendScore}
        </span>
      </div>

      {/* Image + Title */}
      <div className="flex items-start gap-2.5 mb-2">
        <ProductImage src={product.imageUrl} alt={product.title || ""} size={48} noPreview />
        <div className="min-w-0">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-50 line-clamp-2 leading-tight">
            {product.title || "Chưa có tên"}
          </h4>
          {product.shopName && (
            <p className="text-xs text-gray-400 truncate mt-0.5">{product.shopName}</p>
          )}
        </div>
      </div>

      {/* Primary Tag */}
      <div className="mb-1.5">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight">
          {product.primaryTag.emoji} {product.primaryTag.label}
        </span>
      </div>

      {/* Secondary Tags */}
      {product.secondaryTags.length > 0 && (
        <div className="space-y-0.5 mb-2">
          {product.secondaryTags.map((tag, i) => (
            <span key={i} className="block text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
              {tag.emoji} {tag.label}
            </span>
          ))}
        </div>
      )}

      {/* Price + Commission */}
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-auto pt-2 border-t border-gray-100 dark:border-slate-700/50">
        {product.price != null && product.price > 0 && (
          <span>{(product.price / 1000).toFixed(0)}K</span>
        )}
        {product.commissionRate != null && (
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            {Number(product.commissionRate)}%
          </span>
        )}
        {product.day28SoldCount != null && product.day28SoldCount > 0 && (
          <span className="ml-auto">
            {product.day28SoldCount >= 1000
              ? `${(product.day28SoldCount / 1000).toFixed(1)}K`
              : product.day28SoldCount}{" "}
            đơn
          </span>
        )}
      </div>
    </button>
  );
}
