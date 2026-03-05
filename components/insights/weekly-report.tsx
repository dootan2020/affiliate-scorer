"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { WeightMap } from "@/lib/ai/prompts";

interface WeeklyReportProps {
  currentAccuracy: number;
  previousAccuracy: number;
  insights: string;
  weightsBefore: WeightMap;
  weightsAfter: WeightMap;
  weekNumber: number;
}

function AccuracyTrend({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  const diff = current - previous;
  const pct = Math.round(diff * 100);
  const currentPct = Math.round(current * 100);

  if (Math.abs(diff) < 0.005) {
    return (
      <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
        <Minus className="h-5 w-5" />
        <span className="text-3xl font-semibold text-gray-900 dark:text-gray-50">{currentPct}%</span>
        <span className="text-sm">Không thay đổi</span>
      </div>
    );
  }

  if (diff > 0) {
    return (
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        <span className="text-3xl font-semibold text-gray-900 dark:text-gray-50">{currentPct}%</span>
        <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">+{pct}% so với tuần trước</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <TrendingDown className="h-5 w-5 text-rose-600 dark:text-rose-400" />
      <span className="text-3xl font-semibold text-gray-900 dark:text-gray-50">{currentPct}%</span>
      <span className="text-xs text-rose-600 dark:text-rose-400 mt-2">{pct}% so với tuần trước</span>
    </div>
  );
}

function formatWeight(value: number): string {
  return (value * 100).toFixed(0) + "%";
}

const WEIGHT_LABELS: Record<keyof WeightMap, string> = {
  commission: "Hoa hồng",
  trending: "Xu hướng",
  competition: "Cạnh tranh",
  priceAppeal: "Sức hút giá",
  salesVelocity: "Tốc độ bán",
};

export function WeeklyReport({
  currentAccuracy,
  previousAccuracy,
  insights,
  weightsBefore,
  weightsAfter,
  weekNumber,
}: WeeklyReportProps) {
  const changedWeights = (Object.keys(weightsBefore) as (keyof WeightMap)[]).filter(
    (key) => Math.abs(weightsAfter[key] - weightsBefore[key]) >= 0.005
  );

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Độ chính xác — Tuần {weekNumber}
        </p>
        <AccuracyTrend current={currentAccuracy} previous={previousAccuracy} />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Thay đổi trọng số
        </p>
        {changedWeights.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Không có thay đổi trọng số</p>
        ) : (
          <ul className="space-y-2">
            {changedWeights.map((key) => {
              const diff = weightsAfter[key] - weightsBefore[key];
              return (
                <li key={key} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{WEIGHT_LABELS[key]}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-50">
                    {formatWeight(weightsBefore[key])} →{" "}
                    <span className={diff > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                      {formatWeight(weightsAfter[key])}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6 md:col-span-2">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Chiến lược đề xuất
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{insights}</p>
      </div>
    </div>
  );
}
