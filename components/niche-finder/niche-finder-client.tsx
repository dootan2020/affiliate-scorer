"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, BarChart3, Package } from "lucide-react";
import { NicheSummaryTable, type NicheSummary, type SortKey } from "./niche-summary-table";
import { NicheProductShortlist, type NicheProduct } from "./niche-product-shortlist";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

interface SummaryResponse {
  niches: NicheSummary[];
  lastSync: string | null;
  totalProducts: number;
}

interface ProductsResponse {
  products: NicheProduct[];
  category: number;
}

export function NicheDataClient(): React.ReactElement {
  const [niches, setNiches] = useState<NicheSummary[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedCode, setSelectedCode] = useState<number | null>(null);
  const [selectedName, setSelectedName] = useState("");
  const [products, setProducts] = useState<NicheProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const [sortKey, setSortKey] = useState<SortKey>("revPerOrder");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch("/api/niche-finder/summary")
      .then((r) => r.json())
      .then((d: SummaryResponse) => {
        setNiches(d.niches ?? []);
        setLastSync(d.lastSync ?? null);
        setTotalProducts(d.totalProducts ?? 0);
      })
      .catch(() => setError("Không thể tải dữ liệu ngách."))
      .finally(() => setLoading(false));
  }, []);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) { setSortAsc((a) => !a); return key; }
      setSortAsc(false);
      return key;
    });
  }, []);

  const handleSelect = useCallback((code: number) => {
    if (selectedCode === code) { setSelectedCode(null); setProducts([]); return; }
    const niche = niches.find((n) => n.categoryCode === code);
    setSelectedCode(code);
    setSelectedName(niche?.categoryName ?? "");
    setProductsLoading(true);
    setProducts([]);
    fetch(`/api/niche-finder/products?category=${code}`)
      .then((r) => r.json())
      .then((d: ProductsResponse) => setProducts(d.products ?? []))
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  }, [selectedCode, niches]);

  const sorted = [...niches].sort((a, b) => {
    const v = a[sortKey] - b[sortKey];
    return sortAsc ? v : -v;
  });

  // ─── Loading skeleton ───
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 rounded-xl bg-gray-100 dark:bg-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  // ─── Error state ───
  if (error) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-8 text-center">
        <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
      </div>
    );
  }

  // ─── Empty — no FastMoss data synced yet ───
  if (niches.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <BarChart3 className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-1">Chưa có dữ liệu ngách</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
          Đồng bộ dữ liệu FastMoss trước, sau đó quay lại đây để so sánh các ngách.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          <Package className="w-4 h-4" />
          <span>{totalProducts.toLocaleString("vi-VN")} sản phẩm FastMoss</span>
        </div>
        {lastSync && (
          <div className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-slate-500">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Cập nhật {relativeTime(lastSync)}</span>
          </div>
        )}
      </div>

      {/* Niche summary table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-4 sm:p-6">
        <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">
          Nhấn vào hàng để xem danh sách sản phẩm trong ngách đó.
        </p>
        <NicheSummaryTable
          niches={sorted}
          selectedCode={selectedCode}
          sortKey={sortKey}
          sortAsc={sortAsc}
          onSort={handleSort}
          onSelect={handleSelect}
        />
      </div>

      {/* Product shortlist */}
      {selectedCode !== null && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-4 sm:p-6">
          <NicheProductShortlist
            products={products}
            loading={productsLoading}
            categoryName={selectedName}
          />
        </div>
      )}
    </div>
  );
}
