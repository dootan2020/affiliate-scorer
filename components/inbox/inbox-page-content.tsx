"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle, Inbox, ChevronLeft, ChevronRight,
  Search, X, Sparkles, RefreshCw, Archive, ChevronRight as ChevRight,
} from "lucide-react";
import { toast } from "sonner";
import { dispatchSuggestionEvent } from "@/lib/events/suggestion-events";
import { Button } from "@/components/ui/button";
import { QuickEnrichModal } from "@/components/inbox/quick-enrich-modal";
import { InboxTable, type InboxIdentity, type SortState } from "@/components/inbox/inbox-table";
import { PasteLinkModal } from "@/components/inbox/paste-link-modal";
import { cn } from "@/lib/utils";
import { ProductRecommendationCards, type RecommendedProduct } from "@/components/inbox/product-recommendation-cards";
import { loadProfileFromStorage } from "@/components/niche-finder/niche-profile-form";

// --- Constants ---

const STATE_TABS = [
  { value: "", label: "Tất cả" },
  { value: "new", label: "Mới" },
  { value: "enriched", label: "Đã bổ sung" },
  { value: "scored", label: "Đã chấm" },
  { value: "briefed", label: "Đã brief" },
  { value: "published", label: "Đã xuất bản" },
  { value: "archived", label: "Đã ẩn" },
];

const DELTA_OPTIONS = ["NEW", "SURGE", "COOL", "STABLE", "REAPPEAR"];

const PRICE_RANGES = [
  { label: "Dưới 100K", min: 0, max: 100000 },
  { label: "100K–500K", min: 100000, max: 500000 },
  { label: "Trên 500K", min: 500000, max: undefined },
];

const COMMISSION_OPTIONS = [
  { label: "Tất cả", value: "" },
  { label: "≥5%", value: "5" },
  { label: "≥8%", value: "8" },
  { label: "≥10%", value: "10" },
  { label: "≥15%", value: "15" },
];

interface NicheCategory {
  code: number;
  name: string;
  nameVi: string | null;
}

const SCORE_RANGES = [
  { label: "0–30", min: 0, max: 30 },
  { label: "30–50", min: 30, max: 50 },
  { label: "50–70", min: 50, max: 70 },
  { label: "70–100", min: 70, max: 100 },
];

const PAGE_SIZES = [20, 50, 100];

// --- Helpers ---

function TableSkeleton(): React.ReactElement {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 overflow-hidden">
      <div className="divide-y divide-gray-50 dark:divide-slate-800">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
            <div className="w-4 h-4 bg-gray-200 dark:bg-slate-800 rounded" />
            <div className="w-6 h-3 bg-gray-200 dark:bg-slate-800 rounded" />
            <div className="w-8 h-6 bg-gray-200 dark:bg-slate-800 rounded-lg" />
            <div className="w-9 h-9 bg-gray-200 dark:bg-slate-800 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-2/3" />
              <div className="h-3 bg-gray-100 dark:bg-slate-800/70 rounded w-1/3" />
            </div>
            <div className="w-14 h-4 bg-gray-100 dark:bg-slate-800/70 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main Component ---

export function InboxPageContent(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Niche filter (from niche-finder navigation)
  const [nicheCode, setNicheCode] = useState<number | null>(
    searchParams.get("nicheCode") ? parseInt(searchParams.get("nicheCode")!, 10) : null
  );
  const [nicheName, setNicheName] = useState(
    searchParams.get("nicheName") ? decodeURIComponent(searchParams.get("nicheName")!) : ""
  );

  // State from URL params
  const [activeTab, setActiveTab] = useState(searchParams.get("state") || "");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get("category")?.split(",").filter(Boolean) ?? []
  );
  const [selectedDeltas, setSelectedDeltas] = useState<string[]>(
    searchParams.get("delta")?.split(",").filter(Boolean) ?? []
  );
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number } | null>(null);
  const [minCommission, setMinCommission] = useState(searchParams.get("minCommission") || "");
  const [scoreRange, setScoreRange] = useState<{ min?: number; max?: number } | null>(null);
  const [nicheCategories, setNicheCategories] = useState<NicheCategory[]>([]);
  const [sort, setSort] = useState<SortState>({
    field: searchParams.get("sort") || "score",
    order: (searchParams.get("order") as "asc" | "desc") || "desc",
  });
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10));
  const [pageSize, setPageSize] = useState(parseInt(searchParams.get("pageSize") || "20", 10));

  // Data state
  const [items, setItems] = useState<InboxIdentity[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // UI state
  const [enrichId, setEnrichId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  // Niche recommendations
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [recHasMore, setRecHasMore] = useState(false);
  const [recLoadingMore, setRecLoadingMore] = useState(false);

  const fetchRecommendations = useCallback((offset: number, append: boolean) => {
    if (!nicheCode) return;
    const profile = loadProfileFromStorage();
    const params = new URLSearchParams({ nicheCode: nicheCode.toString(), offset: offset.toString() });
    if (profile) params.set("profile", encodeURIComponent(JSON.stringify(profile)));
    if (append) setRecLoadingMore(true);
    fetch(`/api/inbox/recommend?${params}`)
      .then((r) => r.json())
      .then((data) => {
        const items = data.recommendations ?? [];
        setRecommendations((prev) => append ? [...prev, ...items] : items);
        setRecHasMore(data.hasMore ?? false);
      })
      .catch(() => { if (!append) setRecommendations([]); })
      .finally(() => setRecLoadingMore(false));
  }, [nicheCode]);

  useEffect(() => {
    if (!nicheCode) { setRecommendations([]); setRecHasMore(false); return; }
    fetchRecommendations(0, false);
  }, [nicheCode, fetchRecommendations]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const activeFilterCount =
    (nicheCode ? 1 : 0) +
    selectedCategories.length +
    selectedDeltas.length +
    (priceRange ? 1 : 0) +
    (minCommission ? 1 : 0) +
    (scoreRange ? 1 : 0);

  // Fetch items
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      if (nicheCode) params.set("nicheCode", nicheCode.toString());
      if (nicheName) params.set("nicheName", nicheName);
      if (activeTab) params.set("state", activeTab);
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (selectedCategories.length > 0) params.set("category", selectedCategories.join(","));
      if (selectedDeltas.length > 0) params.set("delta", selectedDeltas.join(","));
      if (priceRange?.min != null) params.set("priceMin", priceRange.min.toString());
      if (priceRange?.max != null) params.set("priceMax", priceRange.max.toString());
      if (minCommission) params.set("minCommission", minCommission);
      if (scoreRange?.min != null) params.set("scoreMin", scoreRange.min.toString());
      if (scoreRange?.max != null) params.set("scoreMax", scoreRange.max.toString());
      params.set("sort", sort.field);
      params.set("order", sort.order);
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());

      // Sync URL
      router.replace(`/inbox?${params.toString()}`, { scroll: false });

      const res = await fetch(`/api/inbox?${params}`);
      const json = await res.json();

      if (res.ok) {
        setItems(json.data);
        setTotalPages(json.pagination.totalPages);
        setTotal(json.pagination.total);
        setStats(json.stats);

        // Extract distinct categories from stats or items for filter dropdown
        if (categories.length === 0) {
          const catRes = await fetch("/api/inbox?pageSize=1&state=");
          const catJson = await catRes.json();
          if (catJson.data) {
            // We'll collect categories from a separate lightweight call
          }
        }
      }
    } catch (e) {
      setFetchError("Lỗi tải danh sách sản phẩm");
      console.error("[inbox-page-content]", e);
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch, selectedCategories, selectedDeltas, priceRange, minCommission, scoreRange, sort, page, pageSize, router, categories.length, nicheCode, nicheName]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Load categories once
  useEffect(() => {
    fetch("/api/inbox/categories")
      .then((r) => r.json())
      .then((json: { data?: string[] }) => {
        if (json.data) setCategories(json.data);
      })
      .catch(() => { /* categories optional */ });
    // Load niche categories (FastMossCategory with Vietnamese names)
    fetch("/api/fastmoss/categories?region=VN")
      .then((r) => r.json())
      .then((json: { categories?: NicheCategory[] }) => {
        if (json.categories) setNicheCategories(json.categories);
      })
      .catch(() => { /* optional */ });
  }, []);

  // --- Handlers ---

  function handleTabChange(tab: string): void {
    setActiveTab(tab);
    setPage(1);
    setSelectedIds(new Set());
  }

  function handleSort(field: string): void {
    setSort((prev) => ({
      field,
      order: prev.field === field && prev.order === "desc" ? "asc" : "desc",
    }));
    setPage(1);
  }

  function resetFilters(): void {
    setSelectedCategories([]);
    setSelectedDeltas([]);
    setPriceRange(null);
    setMinCommission("");
    setScoreRange(null);
    setSearch("");
    setNicheCode(null);
    setNicheName("");
    setPage(1);
  }

  function toggleCategory(cat: string): void {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
    setPage(1);
  }

  function toggleDelta(d: string): void {
    setSelectedDeltas((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
    setPage(1);
  }

  function toggleSelect(id: string): void {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(): void {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  }

  async function handleBulkScore(): Promise<void> {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/inbox/score-all", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        toast.success(json.message || "Đã chấm điểm lại");
        dispatchSuggestionEvent("score-completed");
        setSelectedIds(new Set());
        fetchItems();
      } else {
        toast.error(json.error || "Lỗi chấm điểm");
      }
    } catch {
      toast.error("Không thể kết nối server");
    } finally {
      setBulkLoading(false);
    }
  }

  function handleBulkBrief(): void {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds).join(",");
    router.push(`/production?productIds=${ids}`);
  }

  async function handleBulkDelete(): Promise<void> {
    if (selectedIds.size === 0) return;
    if (!confirm(`Ẩn ${selectedIds.size} sản phẩm? Sản phẩm sẽ chuyển vào tab "Đã ẩn".`)) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/inbox/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (res.ok) {
        toast.success(`Đã ẩn ${selectedIds.size} sản phẩm`);
        setSelectedIds(new Set());
        fetchItems();
      } else {
        const json = await res.json();
        toast.error(json.error || "Lỗi ẩn sản phẩm");
      }
    } catch {
      toast.error("Không thể kết nối server");
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleArchiveSingle(id: string): Promise<void> {
    try {
      const res = await fetch("/api/inbox/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      if (res.ok) {
        toast.success("Đã ẩn sản phẩm");
        fetchItems();
      } else {
        toast.error("Lỗi ẩn sản phẩm");
      }
    } catch {
      toast.error("Không thể kết nối server");
    }
  }

  // Archived count is separate from totalAll (non-archived states only)
  const archivedCount = stats["archived"] ?? 0;
  const totalAll = Object.entries(stats)
    .filter(([key]) => key !== "archived")
    .reduce((a, [, b]) => a + b, 0);
  const startIndex = (page - 1) * pageSize + 1;

  return (
    <div className="space-y-4">
      {/* Niche breadcrumb (when navigated from niche-finder) */}
      {nicheCode && (
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => { setNicheCode(null); setNicheName(""); setPage(1); }}
            className="text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
          >
            Hộp sản phẩm
          </button>
          <ChevRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
          <span className="inline-flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 rounded-full px-3 py-1 text-xs font-medium">
            {nicheName || `Ngách #${nicheCode}`}
            {total > 0 && <span className="text-orange-500 dark:text-orange-400">({total} SP)</span>}
            <button
              onClick={() => { setNicheCode(null); setNicheName(""); setPage(1); }}
              className="ml-0.5 hover:text-orange-900 dark:hover:text-orange-200"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        </div>
      )}

      {/* Niche product recommendations */}
      {nicheCode && recommendations.length > 0 && (
        <ProductRecommendationCards
          recommendations={recommendations}
          onSelectProduct={(id) => router.push(`/inbox/${id}`)}
          hasMore={recHasMore}
          loadingMore={recLoadingMore}
          onLoadMore={() => fetchRecommendations(recommendations.length, true)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-gray-900 dark:text-gray-50">
            {nicheCode ? nicheName || "Ngách" : "Hộp sản phẩm"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {totalAll > 0 ? `${total > 0 ? total : totalAll} sản phẩm` : "Dán links sản phẩm — tự nhận diện, dedupe, score"}
          </p>
        </div>
        <PasteLinkModal onComplete={fetchItems} />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={searchRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm sản phẩm..."
          className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-9 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Always-visible filter bar */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        {/* Niche category dropdown */}
        <select
          value={nicheCode ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            if (!val) { setNicheCode(null); setNicheName(""); }
            else {
              const code = parseInt(val, 10);
              setNicheCode(code);
              const cat = nicheCategories.find((c) => c.code === code);
              setNicheName(cat?.nameVi ?? cat?.name ?? "");
            }
            setPage(1);
          }}
          className={cn(
            "rounded-lg border px-3 py-2 text-sm outline-none whitespace-nowrap min-w-[120px]",
            nicheCode
              ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300"
              : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300"
          )}
        >
          <option value="">Ngách</option>
          {nicheCategories.map((c) => (
            <option key={c.code} value={c.code}>{c.nameVi ?? c.name}</option>
          ))}
        </select>

        {/* Price range */}
        <select
          value={priceRange ? `${priceRange.min ?? ""}-${priceRange.max ?? ""}` : ""}
          onChange={(e) => {
            if (!e.target.value) { setPriceRange(null); setPage(1); return; }
            const found = PRICE_RANGES.find((r) => `${r.min}-${r.max ?? ""}` === e.target.value);
            if (found) { setPriceRange({ min: found.min, max: found.max }); setPage(1); }
          }}
          className={cn(
            "rounded-lg border px-3 py-2 text-sm outline-none whitespace-nowrap",
            priceRange
              ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300"
              : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300"
          )}
        >
          <option value="">Giá</option>
          {PRICE_RANGES.map((r) => (
            <option key={r.label} value={`${r.min}-${r.max ?? ""}`}>{r.label}</option>
          ))}
        </select>

        {/* Commission min */}
        <select
          value={minCommission}
          onChange={(e) => { setMinCommission(e.target.value); setPage(1); }}
          className={cn(
            "rounded-lg border px-3 py-2 text-sm outline-none whitespace-nowrap",
            minCommission
              ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300"
              : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300"
          )}
        >
          {COMMISSION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.value ? o.label : "Comm%"}</option>
          ))}
        </select>

        {/* Delta toggle pills */}
        <div className="flex items-center gap-1 shrink-0">
          {DELTA_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => { toggleDelta(d); setPage(1); }}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                selectedDeltas.includes(d)
                  ? d === "SURGE" ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                  : d === "NEW" ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                  : "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300"
                  : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700"
              )}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Score min */}
        <select
          value={scoreRange ? `${scoreRange.min}-${scoreRange.max}` : ""}
          onChange={(e) => {
            if (!e.target.value) { setScoreRange(null); setPage(1); return; }
            const found = SCORE_RANGES.find((r) => `${r.min}-${r.max}` === e.target.value);
            if (found) { setScoreRange(found); setPage(1); }
          }}
          className={cn(
            "rounded-lg border px-3 py-2 text-sm outline-none whitespace-nowrap",
            scoreRange
              ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300"
              : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300"
          )}
        >
          <option value="">Điểm</option>
          {SCORE_RANGES.map((r) => (
            <option key={r.label} value={`${r.min}-${r.max}`}>{r.label}</option>
          ))}
        </select>

        {/* Clear all */}
        {activeFilterCount > 0 && (
          <button
            onClick={resetFilters}
            className="shrink-0 text-xs text-orange-600 dark:text-orange-400 hover:underline whitespace-nowrap px-2"
          >
            Xóa lọc ({activeFilterCount})
          </button>
        )}
      </div>

      {/* State Tabs */}
      <div className="flex items-center gap-1 bg-gray-100/80 dark:bg-slate-800/80 rounded-xl p-1 overflow-x-auto scrollbar-none">
        {STATE_TABS.map((tab) => {
          const count = tab.value === "archived"
            ? archivedCount
            : tab.value
              ? (stats[tab.value] ?? 0)
              : totalAll;
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
              <span className={cn(
                "text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center",
                count > 0
                  ? "bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-300"
                  : "bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-10 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 rounded-xl px-4 py-2.5 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-orange-800 dark:text-orange-300">
            Đã chọn {selectedIds.size} sản phẩm
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button size="sm" onClick={handleBulkBrief} disabled={bulkLoading}>
              <Sparkles className="w-3.5 h-3.5" />
              Tạo Brief
            </Button>
            <Button size="sm" variant="secondary" onClick={handleBulkScore} disabled={bulkLoading}>
              <RefreshCw className={cn("w-3.5 h-3.5", bulkLoading && "animate-spin")} />
              Chấm lại
            </Button>
            <Button size="sm" variant="destructive" onClick={handleBulkDelete} disabled={bulkLoading}>
              <Archive className="w-3.5 h-3.5" />
              Ẩn
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      {fetchError ? (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{fetchError}</p>
          <Button variant="link" onClick={() => void fetchItems()}>Thử lại</Button>
        </div>
      ) : loading ? (
        <TableSkeleton />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <Inbox className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-1">
            {debouncedSearch || activeFilterCount > 0 ? "Không tìm thấy" : "Inbox trống"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
            {debouncedSearch || activeFilterCount > 0
              ? "Thử thay đổi từ khóa hoặc bộ lọc"
              : "Dán links sản phẩm bằng nút ở trên để bắt đầu."}
          </p>
          {(debouncedSearch || activeFilterCount > 0) && (
            <Button variant="link" onClick={resetFilters} className="mt-2">Xóa bộ lọc</Button>
          )}
        </div>
      ) : (
        <>
          <InboxTable
            items={items}
            startIndex={startIndex}
            onEnrich={setEnrichId}
            onArchive={activeTab !== "archived" ? handleArchiveSingle : undefined}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleAll={toggleAll}
            allSelected={items.length > 0 && selectedIds.size === items.length}
            sort={sort}
            onSort={handleSort}
          />

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Hiển thị {startIndex}–{Math.min(startIndex + pageSize - 1, total)} / {total}
              </p>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }}
                className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs outline-none"
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>{s}/trang</option>
                ))}
              </select>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  variant="secondary"
                  size="icon"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-300 tabular-nums">
                  {page} / {totalPages}
                </span>
                <Button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  variant="secondary"
                  size="icon"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
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

// --- Filter Dropdown (multi-select checkboxes) ---

function FilterDropdown({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}): React.ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1 block">{label}</label>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full text-left rounded-lg border px-3 py-2 text-sm outline-none transition-colors",
          selected.length > 0
            ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300"
            : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300",
        )}
      >
        {selected.length > 0 ? `${selected.length} đã chọn` : "Tất cả"}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto p-2">
            {options.length === 0 ? (
              <p className="text-xs text-gray-400 px-2 py-1">Không có tùy chọn</p>
            ) : (
              options.map((opt) => (
                <label key={opt} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={selected.includes(opt)}
                    onChange={() => onToggle(opt)}
                    className="rounded border-gray-300 dark:border-slate-600 text-orange-600 focus:ring-orange-500/20"
                  />
                  <span className="truncate">{opt}</span>
                </label>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
