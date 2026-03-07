"use client";

import { useState } from "react";
import {
  Trophy,
  TrendingUp,
  Lightbulb,
  Loader2,
  RotateCcw,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NicheRecommendation } from "@/lib/niche-intelligence/types";

interface NicheRecommendationsProps {
  recommendations: NicheRecommendation[];
  summary: string;
  onSelect: (nicheKey: string, nicheLabel: string) => Promise<void>;
  onRetry: () => void;
}

const COMPETITION_CONFIG = {
  low: { label: "Cạnh tranh thấp", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" },
  medium: { label: "Cạnh tranh vừa", cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" },
  high: { label: "Cạnh tranh cao", cls: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400" },
};

export function NicheRecommendations({
  recommendations,
  summary,
  onSelect,
  onRetry,
}: NicheRecommendationsProps): React.ReactElement {
  const [selecting, setSelecting] = useState<string | null>(null);

  const handleSelect = async (rec: NicheRecommendation): Promise<void> => {
    if (selecting !== null) return;
    setSelecting(rec.nicheKey);
    try {
      await onSelect(rec.nicheKey, rec.nicheLabel);
    } finally {
      setSelecting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      {summary && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0 mt-0.5">
              <Lightbulb className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-1">
                Phân tích tổng hợp
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {summary}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendation cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((rec, idx) => {
          const isTop = idx === 0;
          const competition = COMPETITION_CONFIG[rec.competitionLevel] ?? COMPETITION_CONFIG.medium;

          return (
            <div
              key={rec.nicheKey}
              className={cn(
                "bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 flex flex-col transition-all hover:shadow-md",
                isTop && "ring-2 ring-orange-500/50 shadow-md"
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  {isTop && (
                    <div className="w-6 h-6 rounded-lg bg-orange-500 flex items-center justify-center">
                      <Trophy className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                    {rec.nicheLabel}
                  </h3>
                </div>
                <span className={cn("text-xs font-medium rounded-full px-2.5 py-1", competition.cls)}>
                  {competition.label}
                </span>
              </div>

              {/* Score bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Độ phù hợp</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-50">
                    {rec.score}/100
                  </span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      rec.score >= 80
                        ? "bg-emerald-500"
                        : rec.score >= 60
                          ? "bg-orange-500"
                          : "bg-amber-500"
                    )}
                    style={{ width: `${rec.score}%` }}
                  />
                </div>
              </div>

              {/* Reasoning */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                {rec.reasoning}
              </p>

              {/* Market insight */}
              <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/20 rounded-xl p-3 mb-3">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  {rec.marketInsight}
                </p>
              </div>

              {/* Estimated earning */}
              {rec.estimatedEarning && (
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Ước tính: <span className="font-medium text-gray-700 dark:text-gray-300">{rec.estimatedEarning}</span>
                  </span>
                </div>
              )}

              {/* Content ideas */}
              {rec.contentIdeas.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Ý tưởng nội dung:
                  </p>
                  <ul className="space-y-1">
                    {rec.contentIdeas.slice(0, 3).map((idea, i) => (
                      <li
                        key={i}
                        className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1.5"
                      >
                        <span className="text-orange-500 mt-0.5">&#8226;</span>
                        {idea}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA */}
              <div className="mt-auto pt-4">
                <button
                  type="button"
                  onClick={() => handleSelect(rec)}
                  disabled={selecting !== null}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
                    isTop
                      ? "bg-orange-500 hover:bg-orange-600 text-white shadow-sm hover:shadow"
                      : "bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300",
                    selecting !== null && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {selecting === rec.nicheKey ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang tạo kênh...
                    </>
                  ) : (
                    "Chọn ngách này"
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Retry button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Làm lại từ đầu
        </button>
      </div>
    </div>
  );
}
