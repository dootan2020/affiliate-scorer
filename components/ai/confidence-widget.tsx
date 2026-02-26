"use client";

import { useEffect, useState } from "react";
import { Brain, Circle } from "lucide-react";

interface ConfidenceMetrics {
  productsCount: number;
  productsWithNotes: number;
  assetsLogged: number;
  assetsPublished: number;
  financialRecords: number;
  contentAssets: number;
  shopsRated: number;
  daysActive: number;
  uploadsCount: number;
}

interface ConfidenceData {
  level: number;
  label: string;
  percent: number;
  metrics: ConfidenceMetrics;
  nextLevel: {
    label: string;
    needs: string[];
  } | null;
}

interface MetricRow {
  label: string;
  current: number;
  required: number;
}

const METRIC_THRESHOLDS: { key: keyof ConfidenceMetrics; label: string; required: number }[] = [
  { key: "productsCount", label: "Sản phẩm", required: 50 },
  { key: "productsWithNotes", label: "Ghi chú", required: 10 },
  { key: "assetsLogged", label: "Videos đã log", required: 10 },
  { key: "contentAssets", label: "Content assets", required: 10 },
  { key: "financialRecords", label: "Thu chi", required: 20 },
  { key: "daysActive", label: "Ngày active", required: 30 },
];

function getLevelColor(level: number): string {
  if (level >= 4) return "text-emerald-600 dark:text-emerald-400";
  if (level >= 3) return "text-orange-600 dark:text-orange-400";
  if (level >= 2) return "text-amber-600 dark:text-amber-400";
  return "text-gray-600 dark:text-gray-400";
}

function getBarGradient(percent: number): string {
  if (percent >= 70) return "from-emerald-400 to-emerald-600";
  if (percent >= 40) return "from-amber-400 to-amber-600";
  return "from-gray-400 to-gray-500";
}

export function ConfidenceWidget(): React.ReactElement {
  const [data, setData] = useState<ConfidenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchData(): Promise<void> {
      try {
        const res = await fetch("/api/ai/confidence");
        if (!res.ok) throw new Error("Không thể tải dữ liệu");
        const json = await res.json();
        if (!cancelled) setData(json.data ?? null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Lỗi không xác định");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-6 space-y-4 animate-pulse">
        <div className="h-5 w-56 bg-gray-200 dark:bg-slate-700 rounded-lg" />
        <div className="h-3 w-full bg-gray-200 dark:bg-slate-700 rounded-full" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
          {error ?? "Chưa có báo cáo. Bấm \"Tạo báo cáo\" để bắt đầu."}
        </p>
      </div>
    );
  }

  const pct = Math.round(data.percent);

  // Build metric rows from metrics data
  const rows: MetricRow[] = METRIC_THRESHOLDS.map((t) => ({
    label: t.label,
    current: data.metrics[t.key],
    required: t.required,
  }));

  const nextLevelNum = data.level + 1;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center flex-wrap gap-2">
        <Brain className="w-5 h-5 text-purple-500" />
        <span className="text-sm font-medium text-gray-900 dark:text-gray-50">AI Confidence:</span>
        <span className={`text-sm font-bold ${getLevelColor(data.level)}`}>
          Level {data.level} — {data.label}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">({pct}/100)</span>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getBarGradient(pct)} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Next level criteria */}
      {data.nextLevel && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Để lên Level {nextLevelNum} ({data.nextLevel.label}), cần thêm:
          </p>
          <div className="space-y-1.5 pl-1">
            {rows.map((row, i) => {
              const met = row.current >= row.required;
              const isLast = i === rows.length - 1;
              const connector = isLast ? "\u2514\u2500\u2500" : "\u251C\u2500\u2500";
              const remaining = row.required - row.current;
              return (
                <div key={row.label} className="flex items-center gap-2 text-xs">
                  <span className="text-gray-300 dark:text-gray-600 font-mono">{connector}</span>
                  {met ? (
                    <span className="text-emerald-500 shrink-0">&#9745;</span>
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0" />
                  )}
                  <span className={met ? "text-emerald-600 dark:text-emerald-400" : "text-gray-600 dark:text-gray-400"}>
                    {row.label}: {row.current}/{row.required}
                  </span>
                  {met ? (
                    <span className="text-emerald-500 text-[10px] font-medium">OK</span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 text-[10px]">
                      (cần thêm {remaining})
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
