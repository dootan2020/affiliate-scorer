"use client";

import { ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { scoreColor, scoreBgClass } from "@/lib/niche-scoring/score-colors";
import type { ScoredNiche } from "@/lib/niche-scoring/types";

interface Props {
  recommendations: ScoredNiche[];
  onSelect: (code: number) => void;
}

const MEDALS = ["#1", "#2", "#3"];

export function NicheRecommendationCards({
  recommendations,
  onSelect,
}: Props): React.ReactElement | null {
  if (recommendations.length === 0) return null;

  const top3 = recommendations.slice(0, 3);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
        Ngách được khuyến nghị
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {top3.map((niche, idx) => (
          <button
            key={niche.categoryCode}
            onClick={() => onSelect(niche.categoryCode)}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-4 sm:p-5 hover:shadow-md hover:-translate-y-0.5 transition-all text-left group"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-xs font-semibold text-orange-500 dark:text-orange-400">
                  {MEDALS[idx]}
                </span>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mt-0.5">
                  {niche.categoryName}
                </h4>
              </div>
              <div
                className={cn(
                  "rounded-lg px-2.5 py-1 text-lg font-bold tabular-nums",
                  scoreBgClass(niche.nicheScore),
                  scoreColor(niche.nicheScore)
                )}
              >
                {niche.nicheScore}
              </div>
            </div>

            {/* Highlights */}
            <div className="space-y-1 mb-3">
              {niche.highlights.map((h) => (
                <div
                  key={h}
                  className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-300"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </div>
              ))}
              {niche.risks.map((r) => (
                <div
                  key={r}
                  className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400"
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{r}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex items-center gap-1 text-xs font-medium text-orange-600 dark:text-orange-400 group-hover:underline">
              Xem sản phẩm <ArrowRight className="w-3 h-3" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
