"use client";

import { useEffect, useState, useCallback } from "react";
import { Trophy, XCircle, RefreshCw, BookOpen } from "lucide-react";

interface PatternItem {
  id: string;
  label: string;
  patternType: string;
  winRate: number;
  avgReward: number;
  sampleCount: number;
}

interface InsightItem {
  label: string;
  detail: string;
}

interface PatternsResponse {
  winning: PatternItem[];
  losing: PatternItem[];
  insights: InsightItem[];
  totalLogged: number;
}

export function PlaybookSection(): React.ReactElement {
  const [data, setData] = useState<PatternsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPatterns = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch("/api/patterns");
      if (!res.ok) throw new Error("Không thể tải dữ liệu");
      const json = await res.json();
      setData(json.data ?? null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
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
      const res = await fetch("/api/patterns", { method: "POST" });
      if (!res.ok) throw new Error("Không thể refresh");
      // Re-fetch after regeneration
      await fetchPatterns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setRefreshing(false);
    }
  }

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

  const winning = data?.winning ?? [];
  const losing = data?.losing ?? [];
  const insights = data?.insights ?? [];
  const totalLogged = data?.totalLogged ?? 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-50">Playbook</span>
          {totalLogged > 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500">({totalLogged} videos)</span>
          )}
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

      {winning.length === 0 && losing.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-3">
            <BookOpen className="w-7 h-7 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-1">Chưa có playbook</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
            Cần log kết quả video tại trang Log để AI học patterns.
          </p>
        </div>
      ) : (
        <>
          {/* Insights */}
          {insights.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Insights
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {insights.map((insight) => (
                  <div key={insight.label} className="rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 p-3">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300">{insight.label}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{insight.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

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
          Win rate: {winRatePct}% ({pattern.sampleCount} videos)
        </span>
        <span>Avg reward: {Number(pattern.avgReward).toFixed(1)}</span>
      </div>
    </div>
  );
}
