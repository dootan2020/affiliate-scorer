"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, TrendingUp, BarChart3 } from "lucide-react";

interface FormatStat {
  format: string;
  count: number;
  avgViews: number;
  winRate: number;
}

interface TopProduct {
  title: string;
  productIdentityId: string | null;
  totalOrders: number;
  totalRevenue: number;
  totalCommission: number;
}

interface PatternData {
  hasEnoughData: boolean;
  totalTracked: number;
  formatStats: FormatStat[];
  contentTypeStats: Array<{ type: string; count: number; avgViews: number }>;
  topProducts: TopProduct[];
  bestHook: { text: string; views: number } | null;
  winnersCount: number;
  totalRevenue: number;
  totalCommission: number;
}

const FORMAT_LABELS: Record<string, string> = {
  before_after: "Before/After",
  product_showcase: "Product Showcase",
  slideshow_voiceover: "Slideshow + VO",
  tutorial_steps: "Tutorial Steps",
  comparison: "Comparison",
  trending_hook: "Trending Hook",
};

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("vi-VN");
}

function formatVND(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString("vi-VN") + "đ";
}

export function WinningPatternsWidget(): React.ReactElement {
  const [data, setData] = useState<PatternData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tracking/patterns?days=30&limit=500")
      .then((r) => r.json())
      .then((json: { data?: PatternData }) => setData(json.data ?? null))
      .catch((e) => { console.error("[winning-patterns-widget]", e); })
      .finally(() => setLoading(false));
  }, []);

  // Hide completely when loading or no data
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-4 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 rounded bg-gray-200 dark:bg-slate-700" />
          <div className="h-4 w-32 bg-gray-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.totalTracked === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Hiệu suất</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Chưa có data tracking. Đăng video và nhập kết quả để xem phân tích.
        </p>
      </div>
    );
  }

  if (!data.hasEnoughData) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Hiệu suất</h3>
          </div>
          <span className="text-[10px] text-gray-400">{data.totalTracked}/10 video</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5">
          <div
            className="bg-amber-400 h-1.5 rounded-full transition-all"
            style={{ width: `${Math.min(100, (data.totalTracked / 10) * 100)}%` }}
          />
        </div>
      </div>
    );
  }

  const topFormat = data.formatStats[0];
  const topProduct = data.topProducts[0];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Hiệu suất 30 ngày</h3>
        </div>
        <Link
          href="/insights"
          className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          {data.totalTracked} video →
        </Link>
      </div>

      {/* Compact row of stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Winners */}
        <div className="rounded-xl bg-amber-50/50 dark:bg-amber-950/20 px-3 py-2 text-center">
          <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">{data.winnersCount}</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">Winners</p>
        </div>

        {/* Revenue */}
        <div className="rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 px-3 py-2 text-center">
          <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{formatVND(data.totalCommission)}</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">Commission</p>
        </div>

        {/* Top Format */}
        {topFormat && (
          <div className="rounded-xl bg-blue-50/50 dark:bg-blue-950/20 px-3 py-2 text-center">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 truncate">
              {FORMAT_LABELS[topFormat.format] ?? topFormat.format}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              <BarChart3 className="w-3 h-3 inline mr-0.5" />
              {formatNum(topFormat.avgViews)} avg views
            </p>
          </div>
        )}

        {/* Top Product */}
        {topProduct && topProduct.totalOrders > 0 && (
          <div className="rounded-xl bg-violet-50/50 dark:bg-violet-950/20 px-3 py-2 text-center">
            {topProduct.productIdentityId ? (
              <Link
                href={`/inbox/${topProduct.productIdentityId}`}
                className="text-sm font-semibold text-violet-700 dark:text-violet-300 truncate block hover:text-violet-900 dark:hover:text-violet-200 transition-colors"
                title={topProduct.title}
              >
                <Trophy className="w-3 h-3 inline mr-0.5" />
                {topProduct.title.length > 15 ? topProduct.title.slice(0, 15) + "…" : topProduct.title}
              </Link>
            ) : (
              <p className="text-sm font-semibold text-violet-700 dark:text-violet-300 truncate" title={topProduct.title}>
                <Trophy className="w-3 h-3 inline mr-0.5" />
                {topProduct.title.length > 15 ? topProduct.title.slice(0, 15) + "…" : topProduct.title}
              </p>
            )}
            <p className="text-[10px] text-gray-500 dark:text-gray-400">{topProduct.totalOrders} đơn</p>
          </div>
        )}
      </div>
    </div>
  );
}
