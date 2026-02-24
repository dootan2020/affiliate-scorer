"use client";

import { useEffect, useState, useCallback } from "react";
import { Trophy, XCircle, RefreshCw, BookOpen } from "lucide-react";
import { formatVND } from "@/lib/utils/format";

interface PatternItem {
  id: string;
  label: string;
  patternType: string;
  winRate: number;
  avgROAS: number;
  totalProfit: number;
  sampleSize: number;
}

export function PlaybookSection(): React.ReactElement {
  const [patterns, setPatterns] = useState<PatternItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPatterns = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch("/api/ai/patterns");
      if (!res.ok) throw new Error("Khong the tai du lieu");
      const json = await res.json();
      setPatterns(json.data ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Loi khong xac dinh");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatterns();
  }, [fetchPatterns]);

  async function handleRefresh(): Promise<void> {
    setRefreshing(true);
    try {
      const res = await fetch("/api/ai/patterns", { method: "POST" });
      if (!res.ok) throw new Error("Khong the refresh");
      const json = await res.json();
      setPatterns(json.data ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Loi khong xac dinh");
    } finally {
      setRefreshing(false);
    }
  }

  const winning = patterns.filter((p) => p.patternType === "winning");
  const losing = patterns.filter((p) => p.patternType === "losing");

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-6 space-y-4 animate-pulse">
        <div className="h-5 w-40 bg-gray-200 dark:bg-slate-700 rounded-lg" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-50">Playbook</span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Playbook
        </button>
      </div>

      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
      )}

      {patterns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-3">
            <BookOpen className="w-7 h-7 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-1">Chua co playbook</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
            Can it nhat 3 campaigns hoan thanh de tao playbook.
          </p>
        </div>
      ) : (
        <>
          {/* Winning patterns */}
          {winning.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Winning Patterns
              </p>
              {winning.map((p, i) => (
                <PatternCard key={p.id} pattern={p} rank={i + 1} type="winning" />
              ))}
            </div>
          )}

          {/* Losing patterns */}
          {losing.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Losing Patterns
              </p>
              {losing.map((p, i) => (
                <PatternCard key={p.id} pattern={p} rank={i + 1} type="losing" />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PatternCard({
  pattern,
  rank,
  type,
}: {
  pattern: PatternItem;
  rank: number;
  type: "winning" | "losing";
}): React.ReactElement {
  const isWin = type === "winning";
  const borderClass = isWin
    ? "border-emerald-100 dark:border-emerald-900/50"
    : "border-rose-100 dark:border-rose-900/50";
  const bgClass = isWin
    ? "bg-emerald-50/50 dark:bg-emerald-950/30"
    : "bg-rose-50/50 dark:bg-rose-950/30";

  const winRatePct = Math.round(pattern.winRate * 100);

  return (
    <div className={`rounded-xl border ${borderClass} ${bgClass} p-4 space-y-2`}>
      <div className="flex items-start gap-2">
        {isWin ? (
          <Trophy className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
        ) : (
          <XCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
        )}
        <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
          #{rank}: {pattern.label}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400 pl-6">
        <span>
          {isWin ? "Win" : "Loss"} rate: {pattern.sampleSize > 0
            ? `${Math.round(pattern.winRate * pattern.sampleSize)}/${pattern.sampleSize}`
            : "0/0"
          } ({winRatePct}%)
        </span>
        <span>ROAS TB: {pattern.avgROAS.toFixed(1)}x</span>
        <span className={isWin ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-rose-600 dark:text-rose-400 font-medium"}>
          {pattern.totalProfit >= 0 ? "Lai" : "Lo"}: {pattern.totalProfit >= 0 ? "+" : ""}{formatVND(Math.abs(pattern.totalProfit))}
        </span>
      </div>
    </div>
  );
}
