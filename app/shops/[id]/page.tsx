import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatPlatform, formatVND, formatPercent } from "@/lib/utils/format";
import { ShopEditForm } from "@/components/shops/shop-edit-form";
import { ArrowLeft, Star, Store } from "lucide-react";

export const metadata: Metadata = {
  title: "Chi tiết cửa hàng",
};

interface ShopDetailPageProps {
  params: Promise<{ id: string }>;
}

const SAMPLE_POLICY_LABELS: Record<string, { label: string; className: string }> = {
  sends_free: {
    label: "Gửi free",
    className: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300",
  },
  paid_sample: {
    label: "Mua sample",
    className: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300",
  },
  no_sample: {
    label: "Không sample",
    className: "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400",
  },
};

function StarDisplay({ value, label }: { value: number | null; label: string }): React.ReactElement {
  return (
    <div className="flex items-center justify-between py-3 text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      {value !== null ? (
        <span className="inline-flex items-center gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < value
                  ? "text-amber-400 fill-amber-400"
                  : "text-gray-200 dark:text-slate-700"
              }`}
            />
          ))}
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-1.5">
            ({value}/5)
          </span>
        </span>
      ) : (
        <span className="text-xs text-gray-400 dark:text-gray-500">Chưa đánh giá</span>
      )}
    </div>
  );
}

function formatNumber(n: number | null): string {
  if (n === null || n === undefined) return "--";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toLocaleString("vi-VN");
}

export default async function ShopDetailPage({
  params,
}: ShopDetailPageProps): Promise<React.ReactElement> {
  const { id } = await params;

  const shop = await prisma.shop.findUnique({ where: { id } });
  if (!shop) notFound();

  // Fetch products that belong to this shop (include identityId for routing)
  const products = await prisma.product.findMany({
    where: { shopName: shop.name },
    orderBy: { aiScore: "desc" },
    select: {
      id: true,
      name: true,
      price: true,
      commissionRate: true,
      commissionVND: true,
      sales7d: true,
      aiScore: true,
      category: true,
      identityId: true,
    },
  });

  const policyInfo = shop.samplePolicy
    ? SAMPLE_POLICY_LABELS[shop.samplePolicy]
    : null;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/shops"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-50 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại
      </Link>

      {/* Shop header */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950 flex items-center justify-center shrink-0">
          <Store className="w-7 h-7 text-orange-600 dark:text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-gray-900 dark:text-gray-50">
            {shop.name}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {formatPlatform(shop.platform)} · {products.length} sản phẩm
          </p>
        </div>
      </div>

      {/* Ratings & info card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
        <div className="divide-y divide-gray-50 dark:divide-slate-800">
          <StarDisplay value={shop.commissionReliability} label="Trả commission đúng hẹn" />
          <StarDisplay value={shop.supportQuality} label="Hỗ trợ affiliate" />

          {/* Chính sách mẫu */}
          <div className="flex items-center justify-between py-3 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Chính sách mẫu</span>
            {policyInfo ? (
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${policyInfo.className}`}
              >
                {policyInfo.label}
              </span>
            ) : (
              <span className="text-xs text-gray-400 dark:text-gray-500">Chưa có thông tin</span>
            )}
          </div>

          {/* Notes */}
          {shop.notes && (
            <div className="py-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ghi chú</p>
              <p className="text-sm text-gray-900 dark:text-gray-50 whitespace-pre-wrap">
                {shop.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit form */}
      <ShopEditForm
        shopId={shop.id}
        initialData={{
          commissionReliability: shop.commissionReliability,
          supportQuality: shop.supportQuality,
          samplePolicy: shop.samplePolicy,
          notes: shop.notes,
        }}
      />

      {/* Products from this shop */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Sản phẩm từ shop này ({products.length})
        </p>

        {products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col />
                <col className="w-20" />
                <col className="w-20" />
                <col className="w-16 hidden sm:table-column" />
                <col className="w-14" />
              </colgroup>
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-800">
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-2 pr-2">
                    Tên SP
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-2 px-2">
                    Giá
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-2 px-2">
                    HH
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-2 px-2 hidden sm:table-cell">
                    Ban 7D
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-2 pl-2">
                    Diem
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-2 pr-2 text-sm text-gray-900 dark:text-gray-50">
                      <Link
                        href={`/inbox/${product.identityId ?? product.id}`}
                        className="block truncate hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                        title={product.name}
                      >
                        {product.name}
                      </Link>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                        {product.category}
                      </p>
                    </td>
                    <td className="py-2 px-2 text-right text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {formatVND(product.price)}
                    </td>
                    <td className="py-2 px-2 text-right text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {formatPercent(product.commissionRate)}
                    </td>
                    <td className="py-2 px-2 text-right text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap hidden sm:table-cell">
                      {product.sales7d !== null ? formatNumber(product.sales7d) : "--"}
                    </td>
                    <td className="py-2 pl-2 text-right text-sm font-semibold text-gray-900 dark:text-gray-50">
                      {product.aiScore !== null ? Math.round(product.aiScore) : "--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
            Chưa có sản phẩm nào từ shop này.
          </p>
        )}
      </div>
    </div>
  );
}
