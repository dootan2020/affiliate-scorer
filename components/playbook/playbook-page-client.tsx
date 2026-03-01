"use client";

import { useState, useEffect } from "react";
import {
  Trophy,
  XCircle,
  Lightbulb,
  RefreshCw,
  Loader2,
  BarChart3,
  Brain,
} from "lucide-react";

interface Pattern {
  id: string;
  patternType: string;
  label: string;
  sampleSize: number;
  avgViews: number | null;
  avgReward: string | number | null;
  winRate: string | number | null;
}

interface Insight {
  label: string;
  detail: string;
}

interface PlaybookData {
  winning: Pattern[];
  losing: Pattern[];
  insights: Insight[];
  totalLogged: number;
}

function formatViews(v: number | null): string {
  if (!v) return "—";
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return String(v);
}

interface PlaybookProps {
  channelId?: string;
}

export function PlaybookPageClient({ channelId }: PlaybookProps = {}): React.ReactElement {
  const [data, setData] = useState<PlaybookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  async function load(): Promise<void> {
    try {
      const params = channelId ? `?channelId=${channelId}` : "";
      const res = await fetch(`/api/patterns${params}`);
      const json = await res.json() as { data?: PlaybookData };
      if (json.data) setData(json.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerate(): Promise<void> {
    setRegenerating(true);
    try {
      const params = channelId ? `?channelId=${channelId}` : "";
      await fetch(`/api/patterns${params}`, { method: "POST" });
      await load();
    } catch {
      // ignore
    } finally {
      setRegenerating(false);
    }
  }

  useEffect(() => { void load(); }, [channelId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data || data.totalLogged === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <Brain className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-1">
          Chưa có dữ liệu học tập
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
          Vào trang Log kết quả để nhập metrics video. Cần ít nhất 5 videos để AI bắt đầu tìm patterns.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-orange-500" />
          <span className="text-sm text-gray-500">
            Từ <strong className="text-gray-900 dark:text-gray-50">{data.totalLogged}</strong> videos đã log
          </span>
        </div>
        <button
          onClick={() => void handleRegenerate()}
          disabled={regenerating}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-50 transition-colors"
        >
          {regenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Cập nhật patterns
        </button>
      </div>

      {/* Winning patterns */}
      {data.winning.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Trophy className="w-4 h-4" /> Winning Patterns
          </h3>
          {data.winning.map((p, i) => (
            <div key={p.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                #{i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{p.label}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">
                    Win rate: {p.winRate ? `${(Number(p.winRate) * 100).toFixed(0)}%` : "—"}
                  </span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-500">Avg views: {formatViews(p.avgViews)}</span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-500">{p.sampleSize} videos</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Losing patterns */}
      {data.losing.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <XCircle className="w-4 h-4" /> Losing Patterns
          </h3>
          {data.losing.map((p, i) => (
            <div key={p.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold text-sm">
                #{i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{p.label}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-rose-600 dark:text-rose-400">
                    Win rate: {p.winRate ? `${(Number(p.winRate) * 100).toFixed(0)}%` : "—"}
                  </span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-500">Avg views: {formatViews(p.avgViews)}</span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-500">{p.sampleSize} videos</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Insights */}
      {data.insights.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-5 space-y-3">
          <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4" /> Insights
          </h3>
          {data.insights.map((ins, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">·</span>
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-50">{ins.label}: </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{ins.detail}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {data.winning.length === 0 && data.losing.length === 0 && data.insights.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">
            Cần thêm dữ liệu. Log ít nhất 5 videos để bắt đầu thấy patterns.
          </p>
        </div>
      )}
    </div>
  );
}
