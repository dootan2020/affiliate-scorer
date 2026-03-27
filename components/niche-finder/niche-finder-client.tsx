"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, BarChart3, Package } from "lucide-react";
import { NicheSummaryTable, type SortKey } from "./niche-summary-table";
import {
  NicheProfileForm,
  loadProfileFromStorage,
} from "./niche-profile-form";
import { NicheRecommendationCards } from "./niche-recommendation-cards";
import type { ScoredNiche } from "@/lib/niche-scoring/types";
import type { UserProfile } from "@/lib/niche-scoring/types";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

interface SummaryResponse {
  niches: ScoredNiche[];
  lastSync: string | null;
  totalProducts: number;
  hasProfile: boolean;
}

export function NicheDataClient(): React.ReactElement {
  const router = useRouter();
  const [niches, setNiches] = useState<ScoredNiche[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [sortKey, setSortKey] = useState<SortKey>("nicheScore");
  const [sortAsc, setSortAsc] = useState(false);

  // Load profile from localStorage on mount
  useEffect(() => {
    const saved = loadProfileFromStorage();
    if (saved) setProfile(saved);
  }, []);

  const fetchData = useCallback(
    async (p: UserProfile | null) => {
      setLoading(true);
      setError("");
      try {
        const params = p
          ? `?profile=${encodeURIComponent(JSON.stringify(p))}`
          : "";
        const res = await fetch(`/api/niche-finder/summary${params}`);
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const d: SummaryResponse = await res.json();
        setNiches(d.niches ?? []);
        setLastSync(d.lastSync ?? null);
        setTotalProducts(d.totalProducts ?? 0);
      } catch {
        setError("Không thể tải dữ liệu ngách.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Fetch on mount and when profile changes
  useEffect(() => {
    fetchData(profile);
  }, [profile, fetchData]);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortAsc((a) => !a);
        return key;
      }
      setSortAsc(false);
      return key;
    });
  }, []);

  const handleSelect = useCallback(
    (code: number) => {
      const niche = niches.find((n) => n.categoryCode === code);
      const name = niche?.categoryName ?? "";
      router.push(
        `/inbox?nicheCode=${code}&nicheName=${encodeURIComponent(name)}`
      );
    },
    [niches, router]
  );

  const handleProfileSave = useCallback((p: UserProfile) => {
    setProfile(p);
  }, []);

  // Sort niches: active first (by sortKey), killed at bottom
  const sorted = [...niches].sort((a, b) => {
    // Killed always at bottom
    if (a.kill.killed !== b.kill.killed) return a.kill.killed ? 1 : -1;
    const v = (a[sortKey] as number) - (b[sortKey] as number);
    return sortAsc ? v : -v;
  });

  // Top 3 non-killed for recommendation cards
  const top3 = niches
    .filter((n) => !n.kill.killed && n.nicheScore > 0)
    .slice(0, 3);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 h-14 animate-pulse" />
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-10 rounded-xl bg-gray-100 dark:bg-slate-800 animate-pulse"
            />
          ))}
        </div>
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
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-1">
          Chưa có dữ liệu ngách
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
          Đồng bộ dữ liệu FastMoss trước, sau đó quay lại đây để so sánh
          các ngách.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* User profile form */}
      <NicheProfileForm profile={profile} onSave={handleProfileSave} />

      {/* Top 3 Recommendation Cards */}
      {top3.length > 0 && (
        <NicheRecommendationCards
          recommendations={top3}
          onSelect={handleSelect}
        />
      )}

      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          <Package className="w-4 h-4" />
          <span>
            {totalProducts.toLocaleString("vi-VN")} sản phẩm FastMoss
          </span>
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
          Nhấn vào hàng hoặc &quot;Xem SP&quot; để mở Inbox với bộ lọc
          ngách. Hover score để xem chi tiết.
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
