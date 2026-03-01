"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Inbox, Sparkles, TrendingUp, Package } from "lucide-react";
import { fetchWithRetry } from "@/lib/utils/fetch-with-retry";

interface InboxStats {
  new: number;
  enriched: number;
  scored: number;
  briefed: number;
  published: number;
}

export function InboxStatsWidget(): React.ReactElement {
  const [stats, setStats] = useState<InboxStats | null>(null);

  useEffect(() => {
    fetchWithRetry("/api/inbox?limit=1")
      .then((r) => r.json())
      .then((d) => {
        if (d.stats) setStats(d.stats);
      })
      .catch((e) => { console.error("[inbox-stats-widget]", e); });
  }, []);

  if (!stats) return <></>;

  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  if (total === 0) return <></>;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-5">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Inbox className="w-4 h-4 text-gray-400" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
            Hộp sản phẩm
          </h3>
        </div>
        <Link
          href="/inbox"
          className="text-xs text-orange-600 dark:text-orange-400 hover:underline"
        >
          Xem tất cả →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="text-center">
          <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950 flex items-center justify-center mx-auto mb-1">
            <Package className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            {stats.new || 0}
          </p>
          <p className="text-[10px] text-gray-400">Mới</p>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950 flex items-center justify-center mx-auto mb-1">
            <Sparkles className="w-4 h-4 text-cyan-500" />
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            {(stats.enriched || 0) + (stats.scored || 0)}
          </p>
          <p className="text-[10px] text-gray-400">Đã xử lý</p>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950 flex items-center justify-center mx-auto mb-1">
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            {stats.briefed || 0}
          </p>
          <p className="text-[10px] text-gray-400">Đã brief</p>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center mx-auto mb-1">
            <Inbox className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            {total}
          </p>
          <p className="text-[10px] text-gray-400">Tổng</p>
        </div>
      </div>
    </div>
  );
}
