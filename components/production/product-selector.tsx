"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Check, Package, Star, Inbox } from "lucide-react";
import { toast } from "sonner";
import { ProductImage } from "@/components/products/product-image";

interface ProductIdentityItem {
  id: string;
  title: string | null;
  category: string | null;
  price: number | null;
  imageUrl: string | null;
  combinedScore: number | null;
  contentPotentialScore: number | null;
  inboxState: string | null;
  product: {
    shopRating: number | null;
    salesTotal: number | null;
  } | null;
}

interface Props {
  selected: string[];
  onSelectionChange: (ids: string[]) => void;
  disabled?: boolean;
  initialProductId?: string | null;
}

export function ProductSelector({ selected, onSelectionChange, disabled, initialProductId }: Props): React.ReactElement {
  const [products, setProducts] = useState<ProductIdentityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [didAutoSelect, setDidAutoSelect] = useState(false);

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        // Lấy tất cả SP đã scored/briefed/published từ inbox — 3 requests song song
        const ALLOWED_STATES = ["scored", "briefed", "published"] as const;
        const responses = await Promise.all(
          ALLOWED_STATES.map((s) =>
            fetch(`/api/inbox?state=${s}&limit=50&sort=score`).then(
              (r) => r.json() as Promise<{ data?: ProductIdentityItem[] }>
            )
          )
        );
        const merged = responses.flatMap((j) => j.data || []);
        // Sort by combinedScore desc
        merged.sort((a, b) => (Number(b.combinedScore) || 0) - (Number(a.combinedScore) || 0));
        setProducts(merged);

        // Auto-select product from URL param (inbox → production flow)
        if (initialProductId && !didAutoSelect) {
          const found = merged.find((p) => p.id === initialProductId);
          if (found && !selected.includes(initialProductId)) {
            onSelectionChange([...selected, initialProductId]);
          }
          setDidAutoSelect(true);
        }
      } catch {
        toast.error("Không thể tải danh sách sản phẩm");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const filtered = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    );
  });

  function toggle(id: string): void {
    if (disabled) return;
    if (selected.includes(id)) {
      onSelectionChange(selected.filter((s) => s !== id));
    } else if (selected.length < 10) {
      onSelectionChange([...selected, id]);
    }
  }

  function formatPrice(price: number | null): string {
    if (!price) return "—";
    if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M`;
    if (price >= 1_000) return `${Math.round(price / 1_000)}K`;
    return price.toLocaleString("vi-VN") + "đ";
  }

  function formatSales(n: number | null | undefined): string {
    if (!n) return "";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-3">
          <Inbox className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Chưa có sản phẩm đã chấm điểm. Vào Inbox để paste link và score sản phẩm trước.
        </p>
        <Link
          href="/inbox"
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm hover:shadow transition-all"
        >
          Vào Inbox
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm sản phẩm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
        />
      </div>

      {/* List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {filtered.map((p) => {
          const isSelected = selected.includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              disabled={disabled}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                isSelected
                  ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-400"
                  : "border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-gray-200 dark:hover:border-slate-700"
              } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {/* Checkbox */}
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  isSelected
                    ? "bg-orange-600 border-orange-600 text-white"
                    : "border-gray-300 dark:border-slate-600"
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
              </div>

              {/* Thumbnail */}
              <ProductImage
                src={p.imageUrl}
                alt={p.title || "SP"}
                size={48}
                className="rounded-lg"
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">
                  {p.title || "Chưa có tên"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-xs text-gray-400">{p.category || "—"}</span>
                  <span className="text-xs text-gray-300 dark:text-slate-600">·</span>
                  <span className="text-xs text-gray-500">{formatPrice(p.price)}</span>
                  {p.product?.shopRating != null && p.product.shopRating > 0 && (
                    <>
                      <span className="text-xs text-gray-300 dark:text-slate-600">·</span>
                      <span className="inline-flex items-center gap-0.5 text-xs text-amber-600 dark:text-amber-400">
                        <Star className="w-3 h-3 fill-current" />
                        {p.product.shopRating.toFixed(1)}
                      </span>
                    </>
                  )}
                  {p.product?.salesTotal != null && p.product.salesTotal > 0 && (
                    <>
                      <span className="text-xs text-gray-300 dark:text-slate-600">·</span>
                      <span className="text-xs text-gray-500">
                        {formatSales(p.product.salesTotal)} đã bán
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Combined Score badge */}
              {p.combinedScore != null && (
                <div className="flex-shrink-0">
                  <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-lg ${
                    Number(p.combinedScore) >= 80
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                      : Number(p.combinedScore) >= 60
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                        : "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-gray-400"
                  }`}>
                    🔥 {Number(p.combinedScore).toFixed(0)}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 text-right">
        {selected.length} / 10 đã chọn · {selected.length * 3} video sẽ tạo
      </p>
    </div>
  );
}
