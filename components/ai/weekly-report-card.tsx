"use client";

import { useEffect, useState, useCallback } from "react";
import { BarChart3, FileText, TrendingUp, TrendingDown, Lightbulb } from "lucide-react";
import { formatVND } from "@/lib/utils/format";

interface CampaignSummary {
  active: number;
  paused: number;
  completed: number;
  best: { name: string; roas: number; profit: number } | null;
  worst: { name: string; roas: number; profit: number } | null;
}

interface FinancialSummary {
  income: number;
  expense: number;
  netProfit: number;
  weekOverWeekChange: number | null;
}

interface ReportData {
  id: string;
  weekStart: string;
  weekEnd: string;
  reportData: {
    campaigns: CampaignSummary;
    financial: FinancialSummary;
    suggestions: string[];
  };
  createdAt: string;
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.getDate()}/${s.getMonth() + 1} - ${e.getDate()}/${e.getMonth() + 1}/${e.getFullYear()}`;
}

export function WeeklyReportCard(): React.ReactElement {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch("/api/ai/weekly-report");
      if (!res.ok) throw new Error("Không thể tải báo cáo");
      const json = await res.json();
      setReport(json.data ?? null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  async function handleGenerate(): Promise<void> {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/weekly-report", { method: "POST" });
      if (!res.ok) throw new Error("Không thể tạo báo cáo");
      const json = await res.json();
      setReport(json.data ?? null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-6 space-y-4 animate-pulse">
        <div className="h-5 w-48 bg-gray-200 dark:bg-slate-700 rounded-lg" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 w-full bg-gray-100 dark:bg-slate-800 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const data = report?.reportData;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
            {report ? `Báo cáo tuần — ${formatDateRange(report.weekStart, report.weekEnd)}` : "Báo cáo tuần"}
          </span>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 font-medium shadow-sm transition-all disabled:opacity-50"
        >
          <FileText className={`w-3.5 h-3.5 ${generating ? "animate-pulse" : ""}`} />
          {generating ? "Đang tạo..." : "Tạo báo cáo"}
        </button>
      </div>

      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}

      {!data ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-3">
            <BarChart3 className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Chưa có báo cáo. Bấm &quot;Tạo báo cáo&quot; để bắt đầu.
          </p>
        </div>
      ) : (
        <div className="space-y-4 text-xs">
          {/* Campaigns */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Campaigns</p>
            <p className="text-gray-600 dark:text-gray-400">
              Active: {data.campaigns.active} | Paused: {data.campaigns.paused} | Completed: {data.campaigns.completed}
            </p>
            {data.campaigns.best && (
              <p className="text-emerald-600 dark:text-emerald-400">
                Tốt nhất: {data.campaigns.best.name} (ROAS {data.campaigns.best.roas.toFixed(1)}x, +{formatVND(data.campaigns.best.profit)})
              </p>
            )}
            {data.campaigns.worst && (
              <p className="text-rose-600 dark:text-rose-400">
                Tệ nhất: {data.campaigns.worst.name} (ROAS {data.campaigns.worst.roas.toFixed(1)}x, {formatVND(data.campaigns.worst.profit)})
              </p>
            )}
          </div>

          {/* Financial */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Tài chính</p>
            <p className="text-gray-600 dark:text-gray-400">
              Thu: {formatVND(data.financial.income)} | Chi: {formatVND(data.financial.expense)}
            </p>
            <p className={data.financial.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-rose-600 dark:text-rose-400 font-medium"}>
              Lãi ròng: {data.financial.netProfit >= 0 ? "+" : ""}{formatVND(data.financial.netProfit)}
            </p>
            {data.financial.weekOverWeekChange !== null && (
              <p className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                So với tuần trước:
                {data.financial.weekOverWeekChange >= 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                    +{Math.round(data.financial.weekOverWeekChange)}% <TrendingUp className="w-3 h-3" />
                  </span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                    {Math.round(data.financial.weekOverWeekChange)}% <TrendingDown className="w-3 h-3" />
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Suggestions */}
          {data.suggestions.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Gợi ý</p>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-gray-600 dark:text-gray-400">
                {data.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
