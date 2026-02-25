"use client";

import { useState, useEffect, useCallback } from "react";
import { PasteLinkBox } from "./paste-link-box";
import { InboxCard } from "./inbox-card";
import { QuickEnrichModal } from "./quick-enrich-modal";
import { Inbox, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface InboxIdentity {
  id: string;
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

const STATE_TABS = [
  { value: "", label: "Tất cả" },
  { value: "new", label: "Mới" },
  { value: "enriched", label: "Đã bổ sung" },
  { value: "scored", label: "Đã chấm" },
  { value: "briefed", label: "Đã brief" },
  { value: "published", label: "Đã xuất bản" },
];

export function InboxPageClient(): React.ReactElement {
  const [items, setItems] = useState<InboxIdentity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [enrichId, setEnrichId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab) params.set("state", activeTab);
      params.set("page", page.toString());
      params.set("limit", "20");

      const res = await fetch(`/api/inbox?${params}`);
      const json = await res.json();

      if (res.ok) {
        setItems(json.data);
        setTotalPages(json.pagination.totalPages);
        setTotal(json.pagination.total);
        setStats(json.stats);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  function handleTabChange(tab: string): void {
    setActiveTab(tab);
    setPage(1);
  }

  const totalAll = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Paste Links Box */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-6">
        <h2 className="text-base font-medium text-gray-900 dark:text-gray-50 mb-4">
          Dán links sản phẩm
        </h2>
        <PasteLinkBox onComplete={fetchItems} />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-gray-100/80 dark:bg-slate-800/80 rounded-xl p-1 overflow-x-auto scrollbar-none">
        {STATE_TABS.map((tab) => {
          const count = tab.value ? (stats[tab.value] || 0) : totalAll;
          return (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5",
                activeTab === tab.value
                  ? "bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-gray-50"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50",
              )}
            >
              {tab.label}
              {count > 0 && (
                <span className="text-xs bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-300 rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-5 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-16 mb-3" />
              <div className="flex gap-3 mb-3">
                <div className="w-14 h-14 rounded-xl bg-gray-200 dark:bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-1/2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="h-12 bg-gray-100 dark:bg-slate-800/50 rounded-lg" />
                <div className="h-12 bg-gray-100 dark:bg-slate-800/50 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-1">
            Inbox trống
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
            Dán links sản phẩm ở trên để bắt đầu. Mỗi link sẽ được nhận diện và thêm vào inbox.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <InboxCard
                key={item.id}
                identity={item}
                onEnrich={(id) => setEnrichId(id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {total} sản phẩm
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Quick Enrich Modal */}
      {enrichId && (
        <QuickEnrichModal
          identityId={enrichId}
          onClose={() => setEnrichId(null)}
          onSaved={() => {
            setEnrichId(null);
            fetchItems();
          }}
        />
      )}
    </div>
  );
}
