"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Search, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { AssetCard, type AssetCardData } from "./asset-card";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "draft", label: "Bản nháp" },
  { value: "produced", label: "Đã sản xuất" },
  { value: "published", label: "Đã đăng" },
  { value: "logged", label: "Đã log" },
  { value: "archived", label: "Lưu trữ" },
];

const FORMAT_OPTIONS = [
  { value: "", label: "Tất cả định dạng" },
  { value: "review_short", label: "Review" },
  { value: "demo", label: "Demo" },
  { value: "compare", label: "So sánh" },
  { value: "unbox", label: "Unbox" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "greenscreen", label: "Greenscreen" },
  { value: "problem_solution", label: "Vấn đề - Giải pháp" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "views", label: "Views cao nhất" },
  { value: "reward", label: "Reward" },
];

const PAGE_LIMIT = 24;

interface LibraryResponse {
  data: AssetCardData[];
  total: number;
  page: number;
  limit: number;
}

function LibrarySkeleton(): React.ReactElement {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-4 animate-pulse">
          {/* Thumbnail placeholder */}
          <div className="h-32 bg-gray-100 dark:bg-slate-800 rounded-xl mb-3" />
          {/* Title placeholder */}
          <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded-lg mb-2 w-3/4" />
          {/* Subtitle placeholder */}
          <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded-lg w-1/2 mb-3" />
          {/* Badge row */}
          <div className="flex gap-2">
            <div className="h-5 w-14 bg-gray-100 dark:bg-slate-800 rounded-full" />
            <div className="h-5 w-12 bg-gray-100 dark:bg-slate-800 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LibraryPageClient(): React.ReactElement {
  const [assets, setAssets] = useState<AssetCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [format, setFormat] = useState("");
  const [sort, setSort] = useState("newest");
  const [productSearch, setProductSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const totalPages = Math.ceil(total / PAGE_LIMIT);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_LIMIT),
        sort,
      });
      if (status) params.set("status", status);
      if (format) params.set("format", format);
      if (productSearch) params.set("productSearch", productSearch);

      setFetchError(null);
      const res = await fetch(`/api/library?${params.toString()}`);
      const json = await res.json() as LibraryResponse;
      setAssets(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch (e) {
      setFetchError("Lỗi tải thư viện nội dung");
      console.error("[library-page-client]", e);
    } finally {
      setLoading(false);
    }
  }, [page, status, format, sort, productSearch]);

  useEffect(() => { void load(); }, [load]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [status, format, sort, productSearch]);

  function handleSearch(): void {
    setProductSearch(searchInput.trim());
  }

  async function handleCopyScript(id: string): Promise<void> {
    const asset = assets.find((a) => a.id === id);
    if (!asset) return;
    const text = [asset.hookText, "\n\n(script)"].filter(Boolean).join("");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-gray-900 dark:text-gray-50">
            Thư viện nội dung
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {loading ? "Đang tải…" : `${total} assets`}
          </p>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
        >
          {FORMAT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <div className="flex items-center gap-1.5 flex-1 min-w-[180px] max-w-xs">
          <input
            type="text"
            placeholder="Tìm sản phẩm…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
          />
          <Button
            size="icon"
            onClick={handleSearch}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Sort row */}
      <div className="flex items-center gap-1 bg-gray-100/80 dark:bg-slate-800/80 rounded-xl p-1 w-fit">
        {SORT_OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => setSort(o.value)}
            className={[
              "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              sort === o.value
                ? "bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-gray-50"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50",
            ].join(" ")}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {fetchError ? (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{fetchError}</p>
          <Button variant="link" onClick={() => void load()}>Thử lại</Button>
        </div>
      ) : loading ? (
        <LibrarySkeleton />
      ) : assets.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-8 h-8 text-gray-400 dark:text-gray-500" />}
          title="Chưa có assets"
          description="Tạo brief và sản xuất content để bắt đầu xây dựng thư viện."
          actionLabel="Đi tới Sản xuất"
          actionHref="/production"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <div key={asset.id} className="relative">
              {copiedId === asset.id && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 rounded-2xl backdrop-blur-sm">
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Đã sao chép!</span>
                </div>
              )}
              <AssetCard
                asset={asset}
                onCopyScript={(id) => void handleCopyScript(id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="text-gray-600 dark:text-gray-400"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[80px] text-center">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="text-gray-600 dark:text-gray-400"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
