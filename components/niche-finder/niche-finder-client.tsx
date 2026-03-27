"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, BarChart3, Package } from "lucide-react";
import { NicheSummaryTable, type NicheSummary, type SortKey } from "./niche-summary-table";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

interface SummaryResponse {
  niches: NicheSummary[];
  lastSync: string | null;
  totalProducts: number;
}

export function NicheDataClient(): React.ReactElement {
  const router = useRouter();
  const [niches, setNiches] = useState<NicheSummary[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sortKey, setSortKey] = useState<SortKey>("revPerOrder");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch("/api/niche-finder/summary")
      .then((r) => r.json())
      .then((d: SummaryResponse) => {
        setNiches(d.niches ?? []);
        setLastSync(d.lastSync ?? null);
        setTotalProducts(d.totalProducts ?? 0);
      })
      .catch(() => setError("Không thể tải dữ liệu ngách."))
      .finally(() => setLoading(false));
  }, []);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) { setSortAsc((a) => !a); return key; }
      setSortAsc(false);
      return key;
    });
  }, []);

  const handleSelect = useCallback((code: number) => {
    const niche = niches.find((n) => n.categoryCode === code);
    const name = niche?.categoryName ?? "";
    router.push(`/inbox?nicheCode=${code}&nicheName=${encodeURIComponent(name)}`);
  }, [niches, router]);

  const sorted = [...niches].sort((a, b) => {
    const v = a[sortKey] - b[sortKey];
    return sortAsc ? v : -v;
  });

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 rounded-xl bg-gray-100 dark:bg-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-8 text-center">
        <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
      </div>
    );
  }

  if (niches.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <BarChart3 className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-1">Chưa có dữ liệu ngách</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
          Đồng bộ dữ liệu FastMoss trước, sau đó quay lại đây để so sánh các ngách.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          <Package className="w-4 h-4" />
          <span>{totalProducts.toLocaleString("vi-VN")} sản phẩm FastMoss</span>
        </div>
        {lastSync && (
          <div className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-slate-500">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Cập nhật {relativeTime(lastSync)}</span>
          </div>
        )}
      </div>

      {/* Niche summary table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-4 sm:p-6">
        <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">
          Nhấn vào hàng hoặc &quot;Xem SP&quot; để mở Inbox với bộ lọc ngách.
        </p>
        <NicheSummaryTable
          niches={sorted}
          sortKey={sortKey}
          sortAsc={sortAsc}
          onSort={handleSort}
          onSelect={handleSelect}
        />
      </div>
    </div>
  );
}
