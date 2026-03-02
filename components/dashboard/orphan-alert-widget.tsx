"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface OrphanStats {
  briefsWithoutAssets: number;
  publishedWithoutTracking: number;
  overdueSlots: number;
  total: number;
}

export function OrphanAlertWidget(): React.ReactElement | null {
  const [stats, setStats] = useState<OrphanStats | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/orphan-stats")
      .then((r) => r.json())
      .then((json: { data?: OrphanStats }) => setStats(json.data ?? null))
      .catch((e) => console.error("[orphan-alert]", e));
  }, []);

  if (!stats || stats.total === 0) return null;

  const items = [
    { label: "Brief chưa sản xuất", count: stats.briefsWithoutAssets, href: "/production" },
    { label: "Video chưa tracking", count: stats.publishedWithoutTracking, href: "/production" },
    { label: "Slot quá hạn", count: stats.overdueSlots, href: "/channels" },
  ].filter((item) => item.count > 0);

  return (
    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
          {stats.total} mục cần xử lý
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="rounded-xl bg-white/60 dark:bg-slate-900/40 px-3 py-2 text-center hover:bg-white dark:hover:bg-slate-900/60 transition-colors"
          >
            <p className="text-lg font-semibold text-amber-700 dark:text-amber-400">{item.count}</p>
            <p className="text-[10px] text-amber-600/70 dark:text-amber-500">{item.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
