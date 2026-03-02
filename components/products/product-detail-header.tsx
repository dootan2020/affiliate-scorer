import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ProductImage } from "@/components/products/product-image";
import { formatPlatform } from "@/lib/utils/format";
import type { ProductBadge } from "@/lib/utils/product-badges";

function getScoreBadgeClass(score: number): string {
  if (score >= 85) return "bg-rose-500 text-white";
  if (score >= 70) return "bg-emerald-500 text-white";
  if (score >= 50) return "bg-amber-500 text-white";
  return "bg-gray-400 text-white";
}

interface ProductDetailHeaderProps {
  name: string;
  category: string | null;
  shopName: string | null;
  shopId: string | null;
  platform: string;
  productStatus: string | null;
  imageUrl: string | null;
  score: number | null;
  badges: ProductBadge[];
  tiktokUrl: string | null;
  fastmossUrl: string | null;
  shopFastmossUrl: string | null;
}

export function ProductDetailHeader({
  name, category, shopName, shopId, platform, productStatus,
  imageUrl, score, badges, tiktokUrl, fastmossUrl, shopFastmossUrl,
}: ProductDetailHeaderProps): React.ReactElement {
  return (
    <div className="flex items-start gap-4">
      <ProductImage src={imageUrl} alt={name} size={80} className="w-20 h-20 rounded-xl" />
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-gray-900 dark:text-gray-50 leading-tight">
          {name}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {category} ·{" "}
          {shopId ? (
            <Link href={`/shops/${shopId}`} className="text-orange-600 dark:text-orange-400 hover:underline">
              {shopName}
            </Link>
          ) : (
            shopName ?? formatPlatform(platform)
          )}
          {productStatus && (
            <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">{productStatus}</span>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-2.5">
          {badges.map((badge) => (
            <span key={badge.type} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300" title={badge.detail}>
              {badge.label}
            </span>
          ))}
          {tiktokUrl && (
            <ExternalLinkBadge href={tiktokUrl} label="TikTok Shop" />
          )}
          {fastmossUrl && (
            <ExternalLinkBadge href={fastmossUrl} label="FastMoss" />
          )}
          {shopFastmossUrl && (
            <ExternalLinkBadge href={shopFastmossUrl} label="Cửa hàng" />
          )}
        </div>
      </div>
      {score !== null && (
        <div className={`shrink-0 flex flex-col items-center rounded-2xl px-4 py-3 font-bold shadow-sm ${getScoreBadgeClass(score)}`}>
          <span className="text-2xl leading-none">{Math.round(score)}</span>
          <span className="text-xs mt-0.5 opacity-80">điểm AI</span>
        </div>
      )}
    </div>
  );
}

function ExternalLinkBadge({ href, label }: { href: string; label: string }): React.ReactElement {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-slate-700 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
      {label} <ExternalLink className="w-3 h-3" />
    </a>
  );
}
