"use client";

import { Copy, Eye, ExternalLink } from "lucide-react";
import { ProductImage } from "@/components/products/product-image";

interface AssetMetric {
  views: number | null;
  likes: number | null;
  shares: number | null;
  capturedAt: string;
}

interface ProductIdentity {
  id: string;
  title: string;
  imageUrl: string | null;
}

export interface AssetCardData {
  id: string;
  assetCode: string | null;
  format: string | null;
  hookText: string | null;
  status: string;
  publishedUrl: string | null;
  createdAt: string;
  productIdentity: ProductIdentity;
  metrics: AssetMetric[];
}

interface AssetCardProps {
  asset: AssetCardData;
  onCopyScript?: (id: string) => void;
}

const FORMAT_LABELS: Record<string, string> = {
  review_short: "Review",
  demo: "Demo",
  compare: "So sánh",
  unbox: "Unbox",
  lifestyle: "Lifestyle",
  greenscreen: "Greenscreen",
  problem_solution: "Vấn đề",
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  produced: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  published: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  archived: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  logged: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Bản nháp",
  produced: "Đã sản xuất",
  published: "Đã đăng",
  archived: "Lưu trữ",
  logged: "Đã log",
};

function formatNumber(n: number | null): string {
  if (!n) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function AssetCard({ asset, onCopyScript }: AssetCardProps): React.ReactElement {
  const latestMetric = asset.metrics[0] ?? null;
  const hookPreview = asset.hookText
    ? asset.hookText.slice(0, 60) + (asset.hookText.length > 60 ? "…" : "")
    : null;
  const statusStyle = STATUS_STYLES[asset.status] ?? STATUS_STYLES.draft;
  const statusLabel = STATUS_LABELS[asset.status] ?? asset.status;
  const formatLabel = asset.format ? (FORMAT_LABELS[asset.format] ?? asset.format) : null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3">
      {/* Product thumbnail + name */}
      <div className="flex items-center gap-3">
        <ProductImage
          src={asset.productIdentity.imageUrl}
          alt={asset.productIdentity.title}
          size={40}
          className="rounded-xl"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate font-mono">
            {asset.assetCode ?? "—"}
          </p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">
            {asset.productIdentity.title}
          </p>
        </div>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}>
          {statusLabel}
        </span>
        {formatLabel && (
          <span className="inline-flex items-center rounded-full bg-orange-50 dark:bg-orange-950 px-2.5 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-400">
            {formatLabel}
          </span>
        )}
      </div>

      {/* Hook preview */}
      {hookPreview ? (
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
          {hookPreview}
        </p>
      ) : (
        <p className="text-xs text-gray-400 dark:text-gray-600 italic">Chưa có hook text</p>
      )}

      {/* Metrics */}
      {latestMetric && (
        <div className="flex items-center gap-3 pt-1 border-t border-gray-50 dark:border-slate-800">
          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {formatNumber(latestMetric.views)}
          </span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ♥ {formatNumber(latestMetric.likes)}
          </span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ↗ {formatNumber(latestMetric.shares)}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        {onCopyScript && (
          <button
            onClick={() => onCopyScript(asset.id)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-gray-50 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            Sao chép script
          </button>
        )}
        {asset.publishedUrl && (
          <a
            href={asset.publishedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400 hover:underline ml-auto"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Xem video
          </a>
        )}
      </div>
    </div>
  );
}
