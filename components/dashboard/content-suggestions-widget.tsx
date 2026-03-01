"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles, CheckCircle } from "lucide-react";
import { ProductImage } from "@/components/products/product-image";
import { fetchWithRetry } from "@/lib/utils/fetch-with-retry";

interface ProductIdentityItem {
  id: string;
  title: string | null;
  category: string | null;
  imageUrl: string | null;
  combinedScore: number | null;
  inboxState: string;
}

const EXCLUDED_STATES = ["briefed", "published"];

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
          .slice(0, 8);
        setItems(filtered);
      })
      .catch((e) => { console.error("[content-suggestions-widget]", e); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-5">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
            Nên tạo nội dung
          </h3>
        </div>
        <Link
          href="/inbox"
          className="text-xs text-orange-600 dark:text-orange-400 hover:underline"
        >
          Xem tất cả →
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-400">Đang tải...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CheckCircle className="w-8 h-8 text-emerald-400 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tất cả sản phẩm đã được brief!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              {/* Thumbnail */}
              <ProductImage
                src={item.imageUrl}
                alt={item.title ?? "Sản phẩm"}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">
                  {item.title ?? "Sản phẩm chưa đặt tên"}
                </p>
                {item.category && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                    {item.category}
                  </p>
                )}
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
                Tạo Brief →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
