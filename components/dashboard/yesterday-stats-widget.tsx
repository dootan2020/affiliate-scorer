"use client";

import { useEffect, useState } from "react";
import { Video, Eye, ShoppingCart, Banknote } from "lucide-react";

interface YesterdayStats {
  videos: number;
  views: number;
  orders: number;
  commission: number;
}

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

const CARDS = [
  { key: "videos" as const, label: "Videos hôm qua", icon: Video, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30", format: formatNum },
  { key: "views" as const, label: "Views", icon: Eye, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/30", format: formatNum },
  { key: "orders" as const, label: "Đơn hàng", icon: ShoppingCart, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30", format: formatNum },
  { key: "commission" as const, label: "Hoa hồng", icon: Banknote, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", format: formatVND },
];

export function YesterdayStatsWidget(): React.ReactElement {
  const [stats, setStats] = useState<YesterdayStats>({ videos: 0, views: 0, orders: 0, commission: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/yesterday-stats")
      .then((r) => r.json())
      .then((json: { data?: YesterdayStats }) => {
        if (json.data) setStats(json.data);
      })
      .catch((e) => console.error("[yesterday-stats]", e))
      .finally(() => setLoading(false));
  }, []);

  const allZero = !loading && stats.videos === 0 && stats.views === 0 && stats.orders === 0 && stats.commission === 0;
  if (allZero) return <></>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {CARDS.map(({ key, label, icon: Icon, color, bg, format }) => (
        <div
          key={key}
          className={`${bg} rounded-2xl px-4 py-4 ${loading ? "animate-pulse" : ""}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Icon className={`w-4 h-4 ${color}`} />
            <span className="text-[11px] text-gray-500 dark:text-gray-400">{label}</span>
          </div>
          <p className={`text-2xl font-semibold ${color}`}>
            {loading ? "—" : format(stats[key])}
          </p>
        </div>
      ))}
    </div>
  );
}
