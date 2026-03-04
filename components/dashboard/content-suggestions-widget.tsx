"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Sparkles, CheckCircle, RefreshCw } from "lucide-react";
import { fetchWithRetry } from "@/lib/utils/fetch-with-retry";
import type { SuggestionsResult, SuggestedProduct } from "@/lib/suggestions/compute-smart-suggestions";
import { SuggestionCalendarBanner } from "./suggestion-calendar-banner";
import { SuggestionProductRow } from "./suggestion-product-row";

export function ContentSuggestionsWidget(): React.ReactElement {
  const [data, setData] = useState<SuggestionsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChannelIdx, setActiveChannelIdx] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetchWithRetry("/api/dashboard/suggestions")
      .then((r) => r.json())
      .then((d: SuggestionsResult) => setData(d))
      .catch((e) => console.error("[content-suggestions-widget]", e))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Determine which products to show
  const channels = data?.channels ?? [];
  const hasChannels = channels.length > 0;
  const activeChannel = hasChannels ? channels[Math.min(activeChannelIdx, channels.length - 1)] : null;
  const products: SuggestedProduct[] = activeChannel?.products ?? data?.flatList ?? [];
  const totalProducts = hasChannels
    ? channels.reduce((sum, ch) => sum + ch.products.length, 0)
    : (data?.flatList?.length ?? 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">Nên tạo nội dung</h3>
          {totalProducts > 0 && (
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              Còn {totalProducts} SP chờ brief
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            title="Làm mới"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link href="/inbox?state=scored" className="text-xs text-orange-600 dark:text-orange-400 hover:underline">
            Xem tất cả →
          </Link>
        </div>
      </div>

      {/* Calendar Banner */}
      {data?.calendarEvents && <SuggestionCalendarBanner events={data.calendarEvents} />}

      {/* Channel Tabs */}
      {hasChannels && channels.length > 1 && (
        <nav className="flex items-center gap-1 overflow-x-auto mb-3 pb-1">
          {channels.map((ch, idx) => (
            <button
              key={ch.channelId}
              onClick={() => { setActiveChannelIdx(idx); setExpanded(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                idx === activeChannelIdx
                  ? "bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              {ch.channelName} ({ch.products.length})
            </button>
          ))}
        </nav>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2.5">
              <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-slate-700 shrink-0 hidden sm:block" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-3/4 bg-gray-200 dark:bg-slate-700 rounded" />
                <div className="h-2.5 w-1/3 bg-gray-100 dark:bg-slate-800 rounded" />
              </div>
              <div className="w-10 h-5 bg-gray-100 dark:bg-slate-800 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CheckCircle className="w-8 h-8 text-emerald-400 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Tất cả sản phẩm đã được brief!</p>
          <Link href="/upload" className="text-xs text-orange-600 dark:text-orange-400 hover:underline mt-2">
            Thêm sản phẩm mới →
          </Link>
        </div>
      ) : (
        <>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800">
                <th className="text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider pb-2 pr-2 hidden sm:table-cell w-12" />
                <th className="text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider pb-2 pr-2">Sản phẩm</th>
                <th className="text-center text-[10px] font-medium text-gray-400 uppercase tracking-wider pb-2 pr-2 w-16">Score</th>
                <th className="text-right text-[10px] font-medium text-gray-400 uppercase tracking-wider pb-2 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
              {(expanded ? products : products.slice(0, 5)).map((p) => (
                <SuggestionProductRow key={p.id} product={p} channelId={activeChannel?.channelId} />
              ))}
            </tbody>
          </table>
          {products.length > 5 && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="w-full mt-2 py-1.5 text-xs text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/50 rounded-lg transition-colors"
            >
              Xem thêm {products.length - 5} SP →
            </button>
          )}
        </>
      )}
    </div>
  );
}
