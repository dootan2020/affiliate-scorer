"use client";

import { useEffect, useState } from "react";
import { Trophy, TrendingUp, BarChart3, Loader2 } from "lucide-react";

interface FormatStat {
  format: string;
  count: number;
  avgViews: number;
  winRate: number;
}

interface TopProduct {
  title: string;
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

const TYPE_LABELS: Record<string, string> = {
  entertainment: "Giải trí",
  education: "Giáo dục",
  review: "Review",
  selling: "Bán hàng",
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
    fetch("/api/tracking/patterns")
      .then((r) => r.json())
      .then((json: { data?: PatternData }) => setData(json.data ?? null))
      .catch((e) => { console.error("[winning-patterns-widget]", e); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!data || data.totalTracked === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">Winning Patterns</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Chưa có data tracking. Đăng video và nhập kết quả để xem phân tích.
        </p>
      </div>
    );
  }

  if (!data.hasEnoughData) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">Winning Patterns</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Đã track <strong>{data.totalTracked}</strong> video. Cần ít nhất 10 video để có insights đáng tin cậy.
        </p>
        <div className="mt-2 w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2">
          <div
            className="bg-amber-400 h-2 rounded-full transition-all"
            style={{ width: `${Math.min(100, (data.totalTracked / 10) * 100)}%` }}
          />
        </div>
        <p className="text-[10px] text-gray-400 mt-1">{data.totalTracked}/10 video</p>
      </div>
    );
  }

  const topFormat = data.formatStats[0];
  const topType = data.contentTypeStats[0];
  const topProduct = data.topProducts[0];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-slate-800">
        <TrendingUp className="w-5 h-5 text-amber-500" />
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">Winning Patterns</h3>
        <span className="text-xs text-gray-400 ml-auto">{data.totalTracked} video tracked</span>
      </div>

      {/* Key insights */}
      <div className="space-y-2.5">
        {topFormat && (
          <InsightRow
            icon={<BarChart3 className="w-3.5 h-3.5 text-blue-500" />}
            label="Format thắng"
            value={FORMAT_LABELS[topFormat.format] ?? topFormat.format}
            detail={`avg ${formatNum(topFormat.avgViews)} views, ${topFormat.winRate}% win rate`}
          />
        )}
        {topType && (
          <InsightRow
            icon={<BarChart3 className="w-3.5 h-3.5 text-violet-500" />}
            label="Content type tốt nhất"
            value={TYPE_LABELS[topType.type] ?? topType.type}
            detail={`avg ${formatNum(topType.avgViews)} views`}
          />
        )}
        {topProduct && topProduct.totalOrders > 0 && (
          <InsightRow
            icon={<Trophy className="w-3.5 h-3.5 text-amber-500" />}
            label="SP win"
            value={topProduct.title.length > 30 ? topProduct.title.slice(0, 30) + "..." : topProduct.title}
            detail={`${topProduct.totalOrders} đơn, ${formatVND(topProduct.totalCommission)} commission`}
          />
        )}
        {data.bestHook && (
          <InsightRow
            icon={<Trophy className="w-3.5 h-3.5 text-emerald-500" />}
            label="Hook tốt nhất"
            value={data.bestHook.text.length > 40 ? data.bestHook.text.slice(0, 40) + "..." : data.bestHook.text}
            detail={`${formatNum(data.bestHook.views)} views`}
          />
        )}
      </div>

      {/* Summary */}
      <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span>Winners: <strong className="text-amber-600">{data.winnersCount}</strong></span>
        <span>Revenue: <strong className="text-gray-900 dark:text-gray-50">{formatVND(data.totalRevenue)}</strong></span>
        <span>Commission: <strong className="text-emerald-600">{formatVND(data.totalCommission)}</strong></span>
      </div>
    </div>
  );
}

function InsightRow({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}): React.ReactElement {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <span className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</span>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{value}</p>
        <p className="text-[10px] text-gray-500 dark:text-gray-400">{detail}</p>
      </div>
    </div>
  );
}
