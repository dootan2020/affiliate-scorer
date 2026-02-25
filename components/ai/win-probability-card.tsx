"use client";

import { useEffect, useState } from "react";
import { Target, BarChart3, User, Calendar, AlertTriangle, Lightbulb, Brain } from "lucide-react";

interface ScoreRow {
  label: string;
  score: number;
  max: number;
  icon: React.ReactNode;
}

interface WinProbabilityData {
  total: number;
  market: number;
  personalFit: number;
  timing: number;
  risk: number;
  insights: string[];
  confidenceLevel: number;
}

interface WinProbabilityCardProps {
  productId: string;
}

function getBarColor(percent: number): string {
  if (percent >= 70) return "bg-emerald-500";
  if (percent >= 50) return "bg-amber-500";
  return "bg-rose-500";
}

function getTextColor(percent: number): string {
  if (percent >= 70) return "text-emerald-600 dark:text-emerald-400";
  if (percent >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

export function WinProbabilityCard({ productId }: WinProbabilityCardProps): React.ReactElement {
  const [data, setData] = useState<WinProbabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchData(): Promise<void> {
      try {
        const res = await fetch(`/api/ai/intelligence?productId=${productId}`);
        if (!res.ok) throw new Error("Không thể tải dữ liệu");
        const json = await res.json();
        if (!cancelled) setData(json.data?.winProbability ?? null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Lỗi không xác định");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [productId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-6 space-y-4 animate-pulse">
        <div className="h-5 w-48 bg-gray-200 dark:bg-slate-700 rounded-lg" />
        <div className="h-3 w-full bg-gray-200 dark:bg-slate-700 rounded-full" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 w-full bg-gray-100 dark:bg-slate-800 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {error ?? "Không có dữ liệu Win Probability"}
        </p>
      </div>
    );
  }

  const rows: ScoreRow[] = [
    { label: "Thị trường", score: data.market, max: 40, icon: <BarChart3 className="w-4 h-4 text-blue-500" /> },
    { label: "Phù hợp bạn", score: data.personalFit, max: 30, icon: <User className="w-4 h-4 text-purple-500" /> },
    { label: "Timing", score: data.timing, max: 15, icon: <Calendar className="w-4 h-4 text-cyan-500" /> },
    { label: "Rủi ro", score: data.risk, max: 15, icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> },
  ];

  const pct = Math.round(data.total);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-50">Win Probability</span>
        </div>
        <span className={`text-2xl font-bold ${getTextColor(pct)}`}>{pct}%</span>
      </div>

      {/* Main progress bar */}
      <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getBarColor(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Breakdown rows */}
      <div className="space-y-3">
        {rows.map((row) => {
          const rowPct = row.max > 0 ? Math.round((row.score / row.max) * 100) : 0;
          return (
            <div key={row.label} className="flex items-center gap-3">
              {row.icon}
              <span className="text-xs text-gray-500 dark:text-gray-400 w-24 shrink-0">{row.label}</span>
              <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${getBarColor(rowPct)}`} style={{ width: `${rowPct}%` }} />
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-14 text-right">
                {row.score}/{row.max}
              </span>
            </div>
          );
        })}
      </div>

      {/* Insights */}
      {data.insights.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Insights</span>
          </div>
          <ul className="space-y-1">
            {data.insights.map((insight, i) => (
              <li key={i} className="text-xs text-gray-600 dark:text-gray-400 pl-5 relative before:content-['•'] before:absolute before:left-1.5 before:text-gray-400">
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Confidence badge */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-slate-800">
        <Brain className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
        <span className="text-xs text-gray-400 dark:text-gray-500">
          AI Level: {data.confidenceLevel}
        </span>
      </div>
    </div>
  );
}
