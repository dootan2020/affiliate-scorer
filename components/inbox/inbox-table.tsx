"use client";

import Link from "next/link";
import { MoreHorizontal, ChevronUp, ChevronDown } from "lucide-react";
import { ProductImage } from "@/components/products/product-image";
import { formatVND, formatNumber } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export interface InboxIdentity {
  id: string;
  canonicalUrl: string | null;
  productIdExternal: string | null;
  title: string | null;
  shopName: string | null;
  category: string | null;
  price: number | null;
  commissionRate: string | null;
  imageUrl: string | null;
  inboxState: string;
  marketScore: string | null;
  contentPotentialScore: string | null;
  combinedScore: string | null;
  deltaType: string | null;
  personalRating: number | null;
  createdAt: string;
  product: {
    id: string;
    aiScore: number | null;
    aiRank: number | null;
    sales7d: number | null;
    totalKOL: number | null;
    imageUrl: string | null;
  } | null;
}

function ScoreBadge({ score }: { score: number | null }): React.ReactElement {
  if (score === null) return <span className="text-xs text-gray-400 dark:text-gray-500">—</span>;
  const rounded = Math.round(score);
  const cls =
    rounded >= 85
      ? "bg-rose-500 text-white"
      : rounded >= 70
        ? "bg-emerald-500 text-white"
        : rounded >= 50
          ? "bg-amber-500 text-white"
          : "bg-gray-400 text-white";
  return (
    <span className={cn("inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-xs font-bold min-w-[32px]", cls)}>
      {rounded}
    </span>
  );
}

function DeltaBadge({ type }: { type: string | null }): React.ReactElement {
  if (!type) return <span className="text-xs text-gray-400 dark:text-gray-500">—</span>;
  const styles: Record<string, string> = {
    NEW: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300",
    SURGE: "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300",
    COOL: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
    STABLE: "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400",
    REAPPEAR: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", styles[type] ?? styles.STABLE)}>
      {type}
    </span>
  );
}

export interface SortState {
  field: string;
  order: "asc" | "desc";
}

interface InboxTableProps {
  items: InboxIdentity[];
  startIndex: number;
  onEnrich: (id: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleAll: () => void;
  allSelected: boolean;
  sort: SortState;
  onSort: (field: string) => void;
}

function SortIcon({ field, sort }: { field: string; sort: SortState }): React.ReactElement | null {
  if (sort.field !== field) return null;
  return sort.order === "asc"
    ? <ChevronUp className="w-3 h-3 inline ml-0.5" />
    : <ChevronDown className="w-3 h-3 inline ml-0.5" />;
}

interface ColHeaderProps {
  field: string;
  label: string;
  sort: SortState;
  onSort: (field: string) => void;
  className?: string;
}

function ColHeader({ field, label, sort, onSort, className }: ColHeaderProps): React.ReactElement {
  return (
    <th
      className={cn(
        "text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 pt-4 px-4 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 select-none transition-colors",
        className,
      )}
      onClick={() => onSort(field)}
    >
      {label}
      <SortIcon field={field} sort={sort} />
    </th>
  );
}

export function InboxTable({
  items, startIndex, onEnrich,
  selectedIds, onToggleSelect, onToggleAll, allSelected,
  sort, onSort,
}: InboxTableProps): React.ReactElement {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-100 dark:border-slate-800">
              {/* Checkbox */}
              <th className="pb-3 pt-4 px-4 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  className="rounded border-gray-300 dark:border-slate-600 text-orange-600 focus:ring-orange-500/20"
                />
              </th>
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 pt-4 px-4 w-10">#</th>
              <ColHeader field="score" label="Điểm" sort={sort} onSort={onSort} className="text-left w-14" />
              <ColHeader field="newest" label="Sản phẩm" sort={sort} onSort={onSort} className="text-left" />
              <ColHeader field="delta" label="Delta" sort={sort} onSort={onSort} className="text-left hidden md:table-cell" />
              <ColHeader field="content" label="Content" sort={sort} onSort={onSort} className="text-right hidden sm:table-cell" />
              <ColHeader field="price" label="Giá" sort={sort} onSort={onSort} className="text-right" />
              <ColHeader field="sales7d" label="Bán 7d" sort={sort} onSort={onSort} className="text-right hidden lg:table-cell" />
              <ColHeader field="kol" label="KOL" sort={sort} onSort={onSort} className="text-right hidden lg:table-cell" />
              <th className="pb-3 pt-4 px-4 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
            {items.map((item, idx) => {
              const aiScore = item.product?.aiScore ?? null;
              const imageUrl = item.imageUrl ?? item.product?.imageUrl ?? null;
              const name = item.title
                ?? (item.productIdExternal ? `SP #${item.productIdExternal.slice(-8)}` : null)
                ?? "(Chưa bổ sung)";
              const contentScore = item.contentPotentialScore ? parseFloat(item.contentPotentialScore) : null;
              const isSelected = selectedIds.has(item.id);

              return (
                <tr
                  key={item.id}
                  className={cn(
                    "hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors group",
                    isSelected && "bg-orange-50/50 dark:bg-orange-950/10",
                  )}
                >
                  {/* Checkbox */}
                  <td className="py-3.5 px-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(item.id)}
                      className="rounded border-gray-300 dark:border-slate-600 text-orange-600 focus:ring-orange-500/20"
                    />
                  </td>
                  {/* # */}
                  <td className="py-3.5 px-4 text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                    {startIndex + idx}
                  </td>
                  {/* Score */}
                  <td className="py-3.5 px-4">
                    <ScoreBadge score={aiScore} />
                  </td>
                  {/* Product info — wrap text, allow 2 lines */}
                  <td className="py-3.5 px-4">
                    <Link href={`/inbox/${item.id}`} className="flex items-center gap-2.5 group/link">
                      <ProductImage
                        src={imageUrl}
                        alt={name}
                        className="rounded-lg"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-50 line-clamp-2 group-hover/link:text-orange-600 dark:group-hover/link:text-orange-400 transition-colors">
                          {name}
                        </p>
                        {item.category ? (
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{item.category}</p>
                        ) : item.inboxState === "new" ? (
                          <p className="text-xs text-amber-500 dark:text-amber-400">Chưa bổ sung — bấm ⋯ để enrich</p>
                        ) : null}
                      </div>
                    </Link>
                  </td>
                  {/* Delta */}
                  <td className="py-3.5 px-4 hidden md:table-cell">
                    <DeltaBadge type={item.deltaType} />
                  </td>
                  {/* Content score */}
                  <td className="py-3.5 px-4 text-right hidden sm:table-cell">
                    {contentScore !== null ? (
                      <span className="text-sm text-gray-700 dark:text-gray-300 tabular-nums">
                        {Math.round(contentScore)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                    )}
                  </td>
                  {/* Price */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    {item.price !== null ? (
                      <span className="text-sm text-gray-700 dark:text-gray-300 tabular-nums">
                        {formatVND(item.price)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                    )}
                  </td>
                  {/* Sales 7d */}
                  <td className="py-3.5 px-4 text-right hidden lg:table-cell">
                    {item.product?.sales7d != null ? (
                      <span className="text-sm text-gray-700 dark:text-gray-300 tabular-nums">
                        {formatNumber(item.product.sales7d)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                    )}
                  </td>
                  {/* KOL */}
                  <td className="py-3.5 px-4 text-right hidden lg:table-cell">
                    {item.product?.totalKOL != null ? (
                      <span className="text-sm text-gray-700 dark:text-gray-300 tabular-nums">
                        {formatNumber(item.product.totalKOL)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                    )}
                  </td>
                  {/* Actions */}
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => onEnrich(item.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                      title="Bổ sung thông tin"
                    >
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </button>
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
