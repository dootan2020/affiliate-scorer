"use client";

import { useState, useEffect } from "react";
import { Search, Check, Package } from "lucide-react";

interface ProductIdentityItem {
  id: string;
  title: string | null;
  category: string | null;
  price: number | null;
  imageUrl: string | null;
  contentScore: number | null;
  inboxState: string | null;
}

interface Props {
  selected: string[];
  onSelectionChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function ProductSelector({ selected, onSelectionChange, disabled }: Props): React.ReactElement {
  const [products, setProducts] = useState<ProductIdentityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
        // Sort by contentScore desc
        merged.sort((a, b) => (b.contentScore ?? 0) - (a.contentScore ?? 0));
        setProducts(merged);
      } catch {
        // ignore
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
        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-3">
          <Package className="w-7 h-7 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Chưa có sản phẩm đã scored/briefed/published. Vào Inbox để score sản phẩm trước.
        </p>
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
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
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
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-400"
                  : "border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-gray-200 dark:hover:border-slate-700"
              } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {/* Checkbox */}
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  isSelected
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-gray-300 dark:border-slate-600"
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">
                  {p.title || "Chưa có tên"}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">{p.category || "—"}</span>
                  <span className="text-xs text-gray-300 dark:text-slate-600">·</span>
                  <span className="text-xs text-gray-500">{formatPrice(p.price)}</span>
                </div>
              </div>

              {/* Score */}
              {p.contentScore != null && (
                <div className="flex-shrink-0 text-right">
                  <span className={`text-sm font-semibold ${
                    p.contentScore >= 80 ? "text-emerald-600 dark:text-emerald-400" :
                    p.contentScore >= 60 ? "text-amber-600 dark:text-amber-400" :
                    "text-gray-500"
                  }`}>
                    {p.contentScore}
                  </span>
                  <p className="text-[10px] text-gray-400 uppercase">Content</p>
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
