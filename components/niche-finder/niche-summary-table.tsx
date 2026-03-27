"use client";

import { ChevronUp, ChevronDown, ArrowRight, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { scoreColor, scoreBgClass } from "@/lib/niche-scoring/score-colors";
import type { ScoredNiche, ScoreBreakdown } from "@/lib/niche-scoring/types";

export type SortKey = keyof Pick<
  ScoredNiche,
  | "totalProducts"
  | "withSales"
  | "withKOL"
  | "avgCommission"
  | "avgPrice"
  | "revPerOrder"
  | "totalVideos"
  | "nicheScore"
>;

interface Props {
  niches: ScoredNiche[];
  sortKey: SortKey;
  sortAsc: boolean;
  onSort: (key: SortKey) => void;
  onSelect: (code: number) => void;
}

function breakdownTooltip(b: ScoreBreakdown): string {
  return (
    `Demand: ${b.demandSignal} | Supply Gap: ${b.supplyGap} | Economics: ${b.unitEconomics}\n` +
    `Opportunity: ${b.opportunityScore} | Fit: ${b.fitScore}`
  );
}

function SortHeader({
  label,
  sortKey: key,
  currentKey,
  asc,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  asc: boolean;
  onSort: (k: SortKey) => void;
}): React.ReactElement {
  const active = currentKey === key;
  return (
    <th
      onClick={() => onSort(key)}
      className="text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider pb-3 px-3 cursor-pointer select-none hover:text-gray-900 dark:hover:text-gray-50 transition-colors whitespace-nowrap"
    >
      <span className="inline-flex items-center gap-0.5 justify-end">
        {label}
        {active ? (
          asc ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )
        ) : (
          <ChevronDown className="w-3 h-3 opacity-30" />
        )}
      </span>
    </th>
  );
}

export function NicheSummaryTable({
  niches,
  sortKey,
  sortAsc,
  onSort,
  onSelect,
}: Props): React.ReactElement {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px]">
        <thead>
          <tr className="border-b border-gray-100 dark:border-slate-800">
            <th className="text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider pb-3 px-3">
              Ngách
            </th>
            <SortHeader
              label="SP"
              sortKey="totalProducts"
              currentKey={sortKey}
              asc={sortAsc}
              onSort={onSort}
            />
            <SortHeader
              label="Có sales"
              sortKey="withSales"
              currentKey={sortKey}
              asc={sortAsc}
              onSort={onSort}
            />
            <SortHeader
              label="KOL"
              sortKey="withKOL"
              currentKey={sortKey}
              asc={sortAsc}
              onSort={onSort}
            />
            <SortHeader
              label="Comm%"
              sortKey="avgCommission"
              currentKey={sortKey}
              asc={sortAsc}
              onSort={onSort}
            />
            <SortHeader
              label="Giá TB"
              sortKey="avgPrice"
              currentKey={sortKey}
              asc={sortAsc}
              onSort={onSort}
            />
            <SortHeader
              label="Rev/Đơn"
              sortKey="revPerOrder"
              currentKey={sortKey}
              asc={sortAsc}
              onSort={onSort}
            />
            <SortHeader
              label="Videos"
              sortKey="totalVideos"
              currentKey={sortKey}
              asc={sortAsc}
              onSort={onSort}
            />
            <SortHeader
              label="Score"
              sortKey="nicheScore"
              currentKey={sortKey}
              asc={sortAsc}
              onSort={onSort}
            />
            <th className="text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider pb-3 px-3 w-20" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60">
          {niches.map((niche) => {
            const killed = niche.kill.killed;
            return (
              <tr
                key={niche.categoryCode}
                onClick={() => onSelect(niche.categoryCode)}
                className={cn(
                  "cursor-pointer hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors",
                  killed && "opacity-40"
                )}
              >
                <td className="py-3 px-3 text-sm font-medium text-gray-900 dark:text-gray-50">
                  <div className="flex items-center gap-2">
                    <span>{niche.categoryName}</span>
                    {killed && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap"
                        title={niche.kill.reasons.join("; ")}
                      >
                        <Ban className="w-2.5 h-2.5" />
                        Không phù hợp
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-3 text-sm text-right text-gray-700 dark:text-gray-300">
                  {niche.totalProducts.toLocaleString("vi-VN")}
                </td>
                <td className="py-3 px-3 text-sm text-right text-gray-700 dark:text-gray-300">
                  {niche.withSales.toLocaleString("vi-VN")}
                </td>
                <td className="py-3 px-3 text-sm text-right text-gray-700 dark:text-gray-300">
                  {niche.withKOL.toLocaleString("vi-VN")}
                </td>
                <td className="py-3 px-3 text-sm text-right text-gray-700 dark:text-gray-300">
                  {niche.avgCommission.toFixed(1)}%
                </td>
                <td className="py-3 px-3 text-sm text-right text-gray-700 dark:text-gray-300">
                  {niche.avgPrice >= 1000
                    ? `${(niche.avgPrice / 1000).toFixed(0)}k`
                    : niche.avgPrice.toFixed(0)}
                </td>
                <td className="py-3 px-3 text-sm text-right font-semibold text-gray-900 dark:text-gray-50">
                  {niche.revPerOrder >= 1000
                    ? `${(niche.revPerOrder / 1000).toFixed(1)}k`
                    : niche.revPerOrder.toFixed(0)}
                </td>
                <td className="py-3 px-3 text-sm text-right text-gray-700 dark:text-gray-300">
                  {niche.totalVideos >= 1000
                    ? `${(niche.totalVideos / 1000).toFixed(0)}k`
                    : niche.totalVideos}
                </td>
                <td className="py-3 px-3 text-right">
                  {killed ? (
                    <span className="text-xs text-gray-400">—</span>
                  ) : (
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums",
                        scoreBgClass(niche.nicheScore),
                        scoreColor(niche.nicheScore)
                      )}
                      title={breakdownTooltip(niche.breakdown)}
                    >
                      {niche.nicheScore}
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="inline-flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 font-medium hover:underline">
                    Xem SP <ArrowRight className="w-3 h-3" />
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
