"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export interface NicheProduct {
  id: string;
  title: string | null;
  imageUrl: string | null;
  price: number;
  commissionRate: number;
  day28SoldCount: number | null;
  relateAuthorCount: number | null;
  relateVideoCount: number | null;
  shopName: string | null;
  revPerOrder: number;
  nicheScore: number;
}

interface Props {
  products: NicheProduct[];
  loading: boolean;
  categoryName: string;
}

function fmt(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return String(n);
}

export function NicheProductShortlist({ products, loading, categoryName }: Props): React.ReactElement {
  if (loading) {
    return (
      <div className="space-y-2 mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="mt-4 py-10 text-center text-sm text-gray-400 dark:text-slate-500">
        Không có sản phẩm nào trong ngách này.
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Top sản phẩm — {categoryName}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px]">
          <thead>
            <tr className="border-b border-gray-100 dark:border-slate-800">
              {["#", "Sản phẩm", "Giá", "Comm%", "Rev/Đơn", "Sales 28d", "KOL", "Videos", "Score"].map((h) => (
                <th
                  key={h}
                  className={cn(
                    "text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider pb-2 px-2",
                    h === "Sản phẩm" ? "text-left" : "text-right"
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60">
            {products.map((p, idx) => {
              const commHigh = p.commissionRate >= 15;
              return (
                <tr
                  key={p.id}
                  className="hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-2.5 px-2 text-xs text-gray-400 dark:text-slate-500 text-right w-8">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-2 max-w-[200px]">
                    <div className="flex items-center gap-2">
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          alt={p.title ?? ""}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-lg object-cover shrink-0"
                          unoptimized
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 shrink-0" />
                      )}
                      <span className="text-sm text-gray-900 dark:text-gray-50 truncate" title={p.title ?? ""}>
                        {p.title ?? "—"}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-xs text-right text-gray-600 dark:text-gray-400">
                    {p.price >= 1000 ? `${(p.price / 1000).toFixed(0)}k` : p.price.toFixed(0)}
                  </td>
                  <td className={cn("py-2.5 px-2 text-xs text-right font-medium", commHigh ? "text-emerald-600 dark:text-emerald-400" : "text-gray-600 dark:text-gray-400")}>
                    {p.commissionRate.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-2 text-xs text-right font-semibold text-gray-900 dark:text-gray-50">
                    {fmt(p.revPerOrder)}
                  </td>
                  <td className="py-2.5 px-2 text-xs text-right text-gray-600 dark:text-gray-400">
                    {fmt(p.day28SoldCount ?? 0)}
                  </td>
                  <td className="py-2.5 px-2 text-xs text-right text-gray-600 dark:text-gray-400">
                    {fmt(p.relateAuthorCount ?? 0)}
                  </td>
                  <td className="py-2.5 px-2 text-xs text-right text-gray-600 dark:text-gray-400">
                    {fmt(p.relateVideoCount ?? 0)}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
                      {p.nicheScore}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
