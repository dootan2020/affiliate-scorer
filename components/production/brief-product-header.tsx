"use client";

import { useState } from "react";
import { ExternalLink, RefreshCw, Star, ShoppingBag, Loader2 } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";
import type { BriefProductInfo, ProductLinks } from "@/lib/types/production";

interface Props {
  product: BriefProductInfo;
  onRegenerate?: () => Promise<void>;
  todayBriefCount?: number;
  maxDailyBriefs?: number;
}

function buildLinks(product: BriefProductInfo): ProductLinks {
  const extId = product.productIdExternal;

  const tiktokShop = extId
    ? `https://shop.tiktok.com/view/product/${extId}?region=VN&locale=en`
    : null;

  const fastmossProduct = extId
    ? `https://www.fastmoss.com/zh/e-commerce/detail/${extId}`
    : null;

  const shopUrl = product.urls.find(
    (u) => u.urlType === "shop" || u.url.includes("shop-marketing"),
  );
  const fastmossShop = shopUrl?.url ?? null;

  return { tiktokShop, fastmossProduct, fastmossShop };
}

function formatPrice(price: number | null): string {
  if (!price) return "—";
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `${Math.round(price / 1_000)}K`;
  return price.toLocaleString("vi-VN") + "đ";
}

function formatSales(n: number | null | undefined): string {
  if (!n) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function BriefProductHeader({
  product,
  onRegenerate,
  todayBriefCount = 0,
  maxDailyBriefs = 3,
}: Props): React.ReactElement {
  const [regenerating, setRegenerating] = useState(false);
  const links = buildLinks(product);
  const canRegenerate = todayBriefCount < maxDailyBriefs && !regenerating;

  async function handleRegenerate(): Promise<void> {
    if (!onRegenerate || !canRegenerate) return;
    setRegenerating(true);
    try {
      await onRegenerate();
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="flex gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
      {/* Product image */}
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.title || "SP"}
          className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-gray-100 dark:bg-slate-800"
        />
      ) : (
        <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
          <ShoppingBag className="w-6 h-6 text-gray-400" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        {/* Title + price */}
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">
          {product.title || "Sản phẩm"}
        </h3>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
            {formatPrice(product.price)}
          </span>
          {product.product?.shopRating && (
            <span className="inline-flex items-center gap-0.5 text-xs text-amber-600 dark:text-amber-400">
              <Star className="w-3 h-3 fill-current" />
              {product.product.shopRating.toFixed(1)}
            </span>
          )}
          {product.product?.salesTotal && (
            <span className="text-xs text-gray-400">
              {formatSales(product.product.salesTotal)} đã bán
            </span>
          )}
          {product.combinedScore && (
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
              {Number(product.combinedScore).toFixed(0)}đ
            </span>
          )}
        </div>

        {/* Links row */}
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {links.tiktokShop && (
            <>
              <a
                href={links.tiktokShop}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-[10px] font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-50 transition-colors"
              >
                <ExternalLink className="w-3 h-3" /> TikTok Shop
              </a>
              <CopyButton text={links.tiktokShop} label="Copy link" />
            </>
          )}
          {links.fastmossProduct && (
            <a
              href={links.fastmossProduct}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-[10px] font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-50 transition-colors"
            >
              <ExternalLink className="w-3 h-3" /> FastMoss SP
            </a>
          )}
          {links.fastmossShop && (
            <a
              href={links.fastmossShop}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-[10px] font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-50 transition-colors"
            >
              <ExternalLink className="w-3 h-3" /> FastMoss Shop
            </a>
          )}
        </div>
      </div>

      {/* Regenerate button */}
      {onRegenerate && (
        <div className="flex-shrink-0">
          <button
            onClick={() => void handleRegenerate()}
            disabled={!canRegenerate}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            title={`Tạo lại (${todayBriefCount}/${maxDailyBriefs} hôm nay)`}
          >
            {regenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Tạo lại
            <span className="text-[10px] text-gray-400">
              {todayBriefCount}/{maxDailyBriefs}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
