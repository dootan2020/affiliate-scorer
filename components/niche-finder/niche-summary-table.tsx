"use client";

import { ChevronUp, ChevronDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NicheSummary {
  categoryCode: number;
  categoryName: string;
  totalProducts: number;
  withSales: number;
  withKOL: number;
  avgCommission: number;
  avgPrice: number;
  avgRating: number;
  revPerOrder: number;
  totalVideos: number;
  verdict: "PASS" | "CONSIDER" | "SKIP";
}

export type SortKey = keyof Pick<
  NicheSummary,
  "totalProducts" | "withSales" | "withKOL" | "avgCommission" | "avgPrice" | "revPerOrder" | "totalVideos"
>;

interface Props {
  niches: NicheSummary[];
  sortKey: SortKey;
  sortAsc: boolean;
  onSort: (key: SortKey) => void;
  onSelect: (code: number) => void;
}

function VerdictBadge({ verdict }: { verdict: NicheSummary["verdict"] }): React.ReactElement {
  const cls =
    verdict === "PASS"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
      : verdict === "CONSIDER"
        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
        : "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold", cls)}>
      {verdict}
    </span>
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
          asc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3 opacity-30" />
        )}
      </span>
    </th>
  );
}

export function NicheSummaryTable({ niches, sortKey, sortAsc, onSort, onSelect }: Props): React.ReactElement {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[780px]">
        <thead>
          <tr className="border-b border-gray-100 dark:border-slate-800">
            <th className="text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider pb-3 px-3">
              Ngách
            </th>
            <SortHeader label="SP" sortKey="totalProducts" currentKey={sortKey} asc={sortAsc} onSort={onSort} />
            <SortHeader label="Có sales" sortKey="withSales" currentKey={sortKey} asc={sortAsc} onSort={onSort} />
            <SortHeader label="KOL" sortKey="withKOL" currentKey={sortKey} asc={sortAsc} onSort={onSort} />
            <SortHeader label="Comm%" sortKey="avgCommission" currentKey={sortKey} asc={sortAsc} onSort={onSort} />
            <SortHeader label="Giá TB" sortKey="avgPrice" currentKey={sortKey} asc={sortAsc} onSort={onSort} />
            <SortHeader label="Rev/Đơn" sortKey="revPerOrder" currentKey={sortKey} asc={sortAsc} onSort={onSort} />
            <SortHeader label="Videos" sortKey="totalVideos" currentKey={sortKey} asc={sortAsc} onSort={onSort} />
            <th className="text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider pb-3 px-3">
              Đánh giá
            </th>
            <th className="text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider pb-3 px-3 w-20" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60">
          {niches.map((niche) => (
            <tr
              key={niche.categoryCode}
              onClick={() => onSelect(niche.categoryCode)}
              className="cursor-pointer hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors"
            >
              <td className="py-3 px-3 text-sm font-medium text-gray-900 dark:text-gray-50">
                {niche.categoryName}
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
              <td className="py-3 px-3 text-center">
                <VerdictBadge verdict={niche.verdict} />
              </td>
              <td className="py-3 px-3 text-right">
                <span className="inline-flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 font-medium hover:underline">
                  Xem SP <ArrowRight className="w-3 h-3" />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
