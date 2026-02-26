import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPlatform } from "@/lib/utils/format";
import { Store, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "Quản lý cửa hàng",
  description: "Danh sách tất cả shop đã đánh giá",
};

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

function StarRating({ value }: { value: number | null }): React.ReactElement {
  if (value === null) {
    return <span className="text-xs text-gray-400 dark:text-gray-500">--</span>;
  }
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < value
              ? "text-amber-400 fill-amber-400"
              : "text-gray-200 dark:text-slate-700"
          }`}
        />
      ))}
    </span>
  );
}

export default async function ShopsPage(): Promise<React.ReactElement> {
  const shops = await prisma.shop.findMany({
    orderBy: { updatedAt: "desc" },
  });

  // Count products per shop by matching shopName
  const productCounts = await Promise.all(
    shops.map(async (shop) => {
      const count = await prisma.product.count({
        where: { shopName: shop.name },
      });
      return { shopId: shop.id, count };
    }),
  );

  const countMap = new Map(
    productCounts.map((pc) => [pc.shopId, pc.count]),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-gray-900 dark:text-gray-50">
          Danh sách Shop
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {shops.length} shop đã đánh giá
        </p>
      </div>

      {shops.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <table className="w-full table-fixed">
                <colgroup>
                  <col />
                  <col className="w-14" />
                  <col className="w-28 hidden sm:table-column" />
                  <col className="w-28 hidden sm:table-column" />
                  <col className="w-24 hidden md:table-column" />
                  <col className="w-32 hidden lg:table-column" />
                </colgroup>
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-800">
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-3 px-4 whitespace-nowrap">
                      Tên shop
                    </th>
                    <th className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-3 px-2 whitespace-nowrap">
                      SP
                    </th>
                    <th className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-3 px-2 hidden sm:table-cell whitespace-nowrap">
                      Tin cậy
                    </th>
                    <th className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-3 px-2 hidden sm:table-cell whitespace-nowrap">
                      Hỗ trợ
                    </th>
                    <th className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-3 px-2 hidden md:table-cell whitespace-nowrap">
                      Sample
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-3 px-3 hidden lg:table-cell whitespace-nowrap">
                      Ghi chú
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  {shops.map((shop) => {
                    const policyInfo = shop.samplePolicy
                      ? SAMPLE_POLICY_LABELS[shop.samplePolicy]
                      : null;
                    return (
                      <tr
                        key={shop.id}
                        className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <Link
                            href={`/shops/${shop.id}`}
                            className="group block min-w-0"
                          >
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-50 group-hover:text-orange-600 dark:group-hover:text-orange-400 truncate transition-colors">
                              {shop.name}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {formatPlatform(shop.platform)}
                            </p>
                          </Link>
                        </td>
                        <td className="py-3 px-2 text-center text-sm text-gray-600 dark:text-gray-300">
                          {countMap.get(shop.id) ?? 0}
                        </td>
                        <td className="py-3 px-2 text-center hidden sm:table-cell">
                          <StarRating value={shop.commissionReliability} />
                        </td>
                        <td className="py-3 px-2 text-center hidden sm:table-cell">
                          <StarRating value={shop.supportQuality} />
                        </td>
                        <td className="py-3 px-2 text-center hidden md:table-cell">
                          {policyInfo ? (
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${policyInfo.className}`}
                            >
                              {policyInfo.label}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-gray-500">--</span>
                          )}
                        </td>
                        <td className="py-3 px-3 hidden lg:table-cell">
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                            {shop.notes ?? "--"}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-1">
            Chưa đánh giá shop nào
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
            Đánh giá shop từ trang chi tiết sản phẩm.
          </p>
          <Link
            href="/inbox"
            className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-400 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm hover:shadow transition-all"
          >
            Xem sản phẩm
          </Link>
        </div>
      )}
    </div>
  );
}
