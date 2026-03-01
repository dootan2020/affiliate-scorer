"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Inbox, ChevronLeft, ChevronRight } from "lucide-react";
import { PasteLinkBox } from "@/components/inbox/paste-link-box";
import { QuickEnrichModal } from "@/components/inbox/quick-enrich-modal";
import { InboxTable, type InboxIdentity } from "@/components/inbox/inbox-table";
import { cn } from "@/lib/utils";

const STATE_TABS = [
  { value: "", label: "Tất cả" },
  { value: "new", label: "Mới" },
  { value: "enriched", label: "Đã bổ sung" },
  { value: "scored", label: "Đã chấm" },
  { value: "briefed", label: "Đã brief" },
  { value: "published", label: "Đã xuất bản" },
];

const LIMIT = 20;

function TableSkeleton(): React.ReactElement {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 overflow-hidden">
      <div className="divide-y divide-gray-50 dark:divide-slate-800/60">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
            <div className="w-6 h-3 bg-gray-200 dark:bg-slate-800 rounded" />
            <div className="w-8 h-6 bg-gray-200 dark:bg-slate-800 rounded-lg" />
            <div className="w-9 h-9 bg-gray-200 dark:bg-slate-800 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-2/3" />
              <div className="h-3 bg-gray-100 dark:bg-slate-800/70 rounded w-1/3" />
            </div>
            <div className="w-16 h-4 bg-gray-100 dark:bg-slate-800/70 rounded hidden sm:block" />
            <div className="w-14 h-4 bg-gray-100 dark:bg-slate-800/70 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function InboxPageContent(): React.ReactElement {
  const [items, setItems] = useState<InboxIdentity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [enrichId, setEnrichId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      if (activeTab) params.set("state", activeTab);
      params.set("page", page.toString());
      params.set("limit", LIMIT.toString());

      const res = await fetch(`/api/inbox?${params}`);
      const json = await res.json();

      if (res.ok) {
        setItems(json.data);
        setTotalPages(json.pagination.totalPages);
        setTotal(json.pagination.total);
        setStats(json.stats);
      }
    } catch (e) {
      setFetchError("Lỗi tải danh sách sản phẩm");
      console.error("[inbox-page-content]", e);
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
  const startIndex = (page - 1) * LIMIT + 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-gray-900 dark:text-gray-50">
            Hộp sản phẩm
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {totalAll > 0 ? `${totalAll} sản phẩm` : "Dán links sản phẩm — tự nhận diện, dedupe, score"}
          </p>
        </div>
      </div>

      {/* Paste Links Box */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50 pb-3 mb-4 border-b border-gray-100 dark:border-slate-800">
          Dán links sản phẩm
        </h2>
        <PasteLinkBox onComplete={fetchItems} />
      </div>

      {/* State Tabs */}
      <div className="flex items-center gap-1 bg-gray-100/80 dark:bg-slate-800/80 rounded-xl p-1 overflow-x-auto scrollbar-none">
        {STATE_TABS.map((tab) => {
          const count = tab.value ? (stats[tab.value] ?? 0) : totalAll;
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
      {fetchError ? (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{fetchError}</p>
          <button onClick={() => void fetchItems()} className="text-sm text-blue-600 hover:underline">Thử lại</button>
        </div>
      ) : loading ? (
        <TableSkeleton />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-1">Inbox trống</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
            {activeTab
              ? "Không có sản phẩm nào trong trạng thái này"
              : "Dán links sản phẩm ở trên để bắt đầu. Mỗi link sẽ được nhận diện và thêm vào inbox."}
          </p>
        </div>
      ) : (
        <>
          <InboxTable items={items} startIndex={startIndex} onEnrich={setEnrichId} />

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Hiển thị {startIndex}–{Math.min(startIndex + LIMIT - 1, total)} / {total} sản phẩm
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-300 tabular-nums">
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
            )}
          </div>
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
