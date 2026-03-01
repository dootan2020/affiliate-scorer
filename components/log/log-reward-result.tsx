"use client";

import Link from "next/link";
import { Trophy, TrendingDown, Minus } from "lucide-react";
import type { LogResult } from "./log-types";

interface Props {
  result: LogResult;
  onLogAnother?: () => void;
}

export function LogRewardResult({ result, onLogAnother }: Props): React.ReactElement {
  const { rewardScore, analysis } = result;
  const VerdictIcon = analysis.verdict === "win" ? Trophy :
    analysis.verdict === "loss" ? TrendingDown : Minus;
  const verdictColor = analysis.verdict === "win" ? "text-emerald-600 dark:text-emerald-400" :
    analysis.verdict === "loss" ? "text-rose-600 dark:text-rose-400" : "text-gray-500";
  const verdictLabel = analysis.verdict === "win" ? "WIN" :
    analysis.verdict === "loss" ? "LOSS" : "Trung bình";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          analysis.verdict === "win" ? "bg-emerald-50 dark:bg-emerald-950/30" :
          analysis.verdict === "loss" ? "bg-rose-50 dark:bg-rose-950/30" :
          "bg-gray-100 dark:bg-slate-800"
        }`}>
          <VerdictIcon className={`w-6 h-6 ${verdictColor}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{rewardScore}</p>
          <p className={`text-sm font-medium ${verdictColor}`}>{verdictLabel}</p>
        </div>
      </div>

      {analysis.factors.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase">Phân tích</p>
          {analysis.factors.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                f.impact === "positive" ? "bg-emerald-500" :
                f.impact === "negative" ? "bg-rose-500" : "bg-gray-300"
              }`} />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                <strong>{f.factor}:</strong> {f.value || "—"}
              </span>
              {f.detail && (
                <span className="text-xs text-gray-400 ml-auto">{f.detail}</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-slate-800">
        {onLogAnother && (
          <button
            onClick={onLogAnother}
            className="text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 transition-colors"
          >
            Log thêm
          </button>
        )}
        <Link
          href="/log"
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          Xem log →
        </Link>
      </div>
    </div>
  );
}
