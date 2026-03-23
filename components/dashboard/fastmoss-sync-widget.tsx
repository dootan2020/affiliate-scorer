"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { RefreshCw, CircleDot } from "lucide-react";

interface FastMossStatus {
  lastSync: {
    completedAt: string;
    recordCount: number;
  } | null;
  totalProducts: number;
  totalCategories: number;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

export function FastMossSyncWidget(): React.ReactElement | null {
  const [status, setStatus] = useState<FastMossStatus | null>(null);

  useEffect(() => {
    fetch("/api/fastmoss/status")
      .then((r) => r.json())
      .then((d: FastMossStatus) => setStatus(d))
      .catch(() => {});
  }, []);

  // Only show when at least 1 sync has occurred
  if (!status?.lastSync) return null;

  const syncedAt = new Date(status.lastSync.completedAt);
  const hoursSince = (Date.now() - syncedAt.getTime()) / 3_600_000;
  const fresh = hoursSince < 24;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-5">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-gray-400" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
            FastMoss
          </h3>
        </div>
        <Link
          href="/sync"
          className="text-xs text-orange-600 dark:text-orange-400 hover:underline"
        >
          Đồng bộ →
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            {status.totalProducts.toLocaleString("vi-VN")}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-slate-500">Sản phẩm</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            {status.totalCategories.toLocaleString("vi-VN")}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-slate-500">Danh mục</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            {status.lastSync.recordCount.toLocaleString("vi-VN")}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-slate-500">Lần cuối</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <CircleDot
          className={`w-3 h-3 ${fresh ? "text-emerald-500" : "text-amber-500"}`}
        />
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {relativeTime(status.lastSync.completedAt)}
          {!fresh && " — nên đồng bộ lại"}
        </span>
      </div>
    </div>
  );
}
