"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, CheckCircle } from "lucide-react";
import { ProductImage } from "@/components/products/product-image";
import { fetchWithRetry } from "@/lib/utils/fetch-with-retry";

interface ProductIdentityItem {
  id: string;
  title: string | null;
  category: string | null;
  imageUrl: string | null;
  combinedScore: number | null;
  contentPotentialScore: number | null;
  deltaType: string | null;
  inboxState: string;
  createdAt: string;
}

const EXCLUDED_STATES = ["briefed", "published"];

/** Composite ranking: combinedScore + bonus for breakout/surge + contentPotential + recency */
function rankProduct(p: ProductIdentityItem): number {
  let score = Number(p.combinedScore ?? 0);

  // Bonus for trending deltaType
  if (p.deltaType === "breakout") score += 15;
  else if (p.deltaType === "surge") score += 10;
  else if (p.deltaType === "rising") score += 5;

  // Blend contentPotentialScore
  if (p.contentPotentialScore != null) {
    score += Number(p.contentPotentialScore) * 0.3;
  }

  // Recency bonus: scored within last 3 days gets small boost
  const daysSinceCreated = (Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreated <= 3) score += 5;

  return score;
}

export function ContentSuggestionsWidget(): React.ReactElement {
  const [items, setItems] = useState<ProductIdentityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithRetry("/api/inbox?sort=score&limit=20")
      .then((r) => r.json())
      .then((d) => {
        if (!d.data) return;
        const filtered = (d.data as ProductIdentityItem[])
          .filter((p) => !EXCLUDED_STATES.includes(p.inboxState))
          .sort((a, b) => rankProduct(b) - rankProduct(a))
          .slice(0, 8);
        setItems(filtered);
      })
      .catch((e) => { console.error("[content-suggestions-widget]", e); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-5 h-full">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
            Nên tạo nội dung
          </h3>
        </div>
        <Link
          href="/inbox?state=scored"
          className="text-xs text-orange-600 dark:text-orange-400 hover:underline"
        >
          Xem tất cả →
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
              <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-slate-700 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-3/4 bg-gray-200 dark:bg-slate-700 rounded" />
                <div className="h-2.5 w-1/2 bg-gray-100 dark:bg-slate-800 rounded" />
              </div>
              <div className="w-10 h-5 bg-gray-100 dark:bg-slate-800 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CheckCircle className="w-8 h-8 text-emerald-400 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tất cả sản phẩm đã được brief!
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              {/* Thumbnail */}
              <ProductImage
                src={item.imageUrl}
                alt={item.title ?? "Sản phẩm"}
              />

              {/* Info — clickable product name */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/inbox/${item.id}`}
                  className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate block hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                >
                  {item.title ?? "Sản phẩm chưa đặt tên"}
                </Link>
                <div className="flex items-center gap-1.5">
                  {item.category && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                      {item.category}
                    </p>
                  )}
                  {item.deltaType && ["breakout", "surge"].includes(item.deltaType) && (
                    <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400">
                      {item.deltaType === "breakout" ? "🔥" : "📈"}
                    </span>
                  )}
                </div>
              </div>

              {/* Score */}
              {item.combinedScore != null && (
                <span className="shrink-0 inline-flex items-center rounded-full bg-orange-50 dark:bg-orange-950 px-2 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-300">
                  {Number(item.combinedScore).toFixed(1)}
                </span>
              )}

              {/* CTA */}
              <Link
                href={`/production?productId=${item.id}`}
                className="shrink-0 text-xs font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 whitespace-nowrap transition-colors"
              >
                Brief →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
