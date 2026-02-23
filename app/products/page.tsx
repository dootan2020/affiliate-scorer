import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductTable } from "@/components/products/product-table";
import { ShoppingBag } from "lucide-react";

export const metadata: Metadata = {
  title: "Sản phẩm | AffiliateScorer",
  description: "Danh sách tất cả sản phẩm đã upload và chấm điểm AI",
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    sortBy?: string;
    sortOrder?: string;
    scored?: string;
  }>;
}

async function getCategories(): Promise<string[]> {
  const results = await prisma.product.findMany({
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  return results.map((r) => r.category);
}

export default async function ProductsPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const limit = 20;
  const skip = (page - 1) * limit;
  const VALID_SORT_FIELDS = ["aiScore", "commissionRate", "price", "sales7d", "createdAt"] as const;
  const sortBy = VALID_SORT_FIELDS.includes(params.sortBy as (typeof VALID_SORT_FIELDS)[number])
    ? params.sortBy!
    : "aiScore";
  const sortOrder = (params.sortOrder ?? "desc") as "asc" | "desc";
  const category = params.category;
  const scoredFilter = params.scored;

  const whereClause: Record<string, unknown> = {};
  if (category) {
    whereClause.category = category;
  }
  if (scoredFilter === "yes") {
    whereClause.aiScore = { not: null };
  } else if (scoredFilter === "no") {
    whereClause.aiScore = null;
  }

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where: whereClause,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        price: true,
        commissionRate: true,
        commissionVND: true,
        platform: true,
        aiScore: true,
        aiRank: true,
        sales7d: true,
        totalKOL: true,
        imageUrl: true,
        category: true,
      },
    }),
    prisma.product.count({ where: whereClause }),
    getCategories(),
  ]);

  const totalPages = Math.ceil(total / limit);

  function buildUrl(overrides: Record<string, string | undefined>): string {
    const base: Record<string, string> = {};
    if (params.page) base.page = params.page;
    if (params.category) base.category = params.category;
    if (params.sortBy) base.sortBy = params.sortBy;
    if (params.sortOrder) base.sortOrder = params.sortOrder;
    if (params.scored) base.scored = params.scored;

    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined) {
        delete base[k];
      } else {
        base[k] = v;
      }
    }
    // Reset to page 1 when changing filters
    if ("category" in overrides || "scored" in overrides) {
      delete base.page;
    }

    const qs = new URLSearchParams(base).toString();
    return `/products${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
            Sản phẩm
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {total} sản phẩm{category ? ` trong "${category}"` : ""}
          </p>
        </div>
        <Link
          href="/upload"
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm hover:shadow transition-all w-full sm:w-auto text-center"
        >
          Upload thêm
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Category filter */}
        <div className="flex items-center gap-1 bg-gray-100/80 dark:bg-slate-800/80 rounded-xl p-1 overflow-x-auto scrollbar-none">
          <Link
            href={buildUrl({ category: undefined })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              !category
                ? "bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-gray-50"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50"
            }`}
          >
            Tất cả
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={buildUrl({ category: cat })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                category === cat
                  ? "bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-gray-50"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50"
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>

        {/* Scored filter */}
        <div className="flex items-center gap-1 bg-gray-100/80 dark:bg-slate-800/80 rounded-xl p-1">
          <Link
            href={buildUrl({ scored: undefined })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              !scoredFilter
                ? "bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-gray-50"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50"
            }`}
          >
            Tất cả
          </Link>
          <Link
            href={buildUrl({ scored: "yes" })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              scoredFilter === "yes"
                ? "bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-gray-50"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50"
            }`}
          >
            Đã chấm
          </Link>
          <Link
            href={buildUrl({ scored: "no" })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              scoredFilter === "no"
                ? "bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-gray-50"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50"
            }`}
          >
            Chưa chấm
          </Link>
        </div>
      </div>

      {/* Product table */}
      {products.length > 0 ? (
        <>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
                <ProductTable products={products} />
              </div>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {page > 1 && (
                <Link
                  href={buildUrl({ page: String(page - 1) })}
                  className="bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl px-4 py-2 text-sm font-medium transition-colors"
                >
                  Trước
                </Link>
              )}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Trang {page}/{totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={buildUrl({ page: String(page + 1) })}
                  className="bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl px-4 py-2 text-sm font-medium transition-colors"
                >
                  Tiếp
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <ShoppingBag className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-1">
            Không tìm thấy sản phẩm
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
            {category || scoredFilter
              ? "Thử bỏ bộ lọc để xem tất cả sản phẩm"
              : "Upload CSV từ FastMoss hoặc KaloData để bắt đầu"}
          </p>
          <Link
            href={category || scoredFilter ? "/products" : "/upload"}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm hover:shadow transition-all"
          >
            {category || scoredFilter ? "Xóa bộ lọc" : "Upload CSV"}
          </Link>
        </div>
      )}
    </div>
  );
}
