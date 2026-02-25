import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { formatVND, formatPlatform } from "@/lib/utils/format";
import { CampaignFilters } from "@/components/campaigns/campaign-filters";
import { Megaphone, Plus, ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Campaigns | AffiliateScorer",
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  planning: {
    label: "Planning",
    className:
      "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400",
  },
  creating_content: {
    label: "Creating Content",
    className:
      "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
  },
  running: {
    label: "Running",
    className:
      "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300",
  },
  paused: {
    label: "Paused",
    className:
      "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300",
  },
  completed: {
    label: "Completed",
    className:
      "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300",
  },
  cancelled: {
    label: "Cancelled",
    className:
      "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300",
  },
};

interface PageProps {
  searchParams: Promise<{
    status?: string;
    platform?: string;
    sort?: string;
  }>;
}

export default async function CampaignsPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const statusFilter = params.status ?? "";
  const platformFilter = params.platform ?? "";
  const sort = params.sort ?? "newest";

  // Build where clause
  const whereClause: Record<string, unknown> = {};
  if (statusFilter) {
    whereClause.status = statusFilter;
  }
  if (platformFilter) {
    whereClause.platform = platformFilter;
  }

  // Build orderBy
  type OrderByValue = Record<string, "asc" | "desc">;
  let orderBy: OrderByValue = { createdAt: "desc" };
  if (sort === "roas") {
    orderBy = { roas: "desc" };
  } else if (sort === "profit") {
    orderBy = { profitLoss: "desc" };
  }

  // Fetch campaigns and status counts in parallel
  const [campaigns, statusCounts] = await Promise.all([
    prisma.campaign.findMany({
      where: whereClause,
      orderBy,
      include: {
        product: { select: { name: true } },
      },
    }),
    prisma.campaign.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
  ]);

  // Compute summary
  const totalCampaigns = campaigns.length;
  const activeCampaigns = statusCounts
    .filter((s) => s.status === "running")
    .reduce((sum, s) => sum + s._count.status, 0);
  const totalProfit = campaigns.reduce((sum, c) => sum + c.profitLoss, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
            Campaigns
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý các chiến dịch quảng cáo và organic
          </p>
        </div>
        <Link
          href="/campaigns?create=1"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm hover:shadow transition-all w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          Tạo mới
        </Link>
      </div>

      {/* Filter bar */}
      <Suspense
        fallback={
          <div className="h-10 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        }
      >
        <CampaignFilters />
      </Suspense>

      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        <span>
          Tổng:{" "}
          <span className="font-medium text-gray-900 dark:text-gray-50">
            {totalCampaigns}
          </span>{" "}
          campaigns
        </span>
        <span className="text-gray-300 dark:text-slate-700">|</span>
        <span>
          Active:{" "}
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            {activeCampaigns}
          </span>
        </span>
        <span className="text-gray-300 dark:text-slate-700">|</span>
        <span>
          Lợi nhuận:{" "}
          <span
            className={
              totalProfit >= 0
                ? "font-medium text-emerald-600 dark:text-emerald-400"
                : "font-medium text-rose-600 dark:text-rose-400"
            }
          >
            {totalProfit >= 0 ? "+" : ""}
            {formatVND(totalProfit)}
          </span>
        </span>
      </div>

      {/* Campaign list */}
      {campaigns.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-800">
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4 pt-4">
                    Tên
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4 pt-4 hidden sm:table-cell">
                    Sản phẩm
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4 pt-4 hidden md:table-cell">
                    Platform
                  </th>
                  <th className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4 pt-4">
                    Trạng thái
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4 pt-4 hidden sm:table-cell">
                    Chi phí
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4 pt-4">
                    ROAS
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4 pt-4">
                    Lãi/Lỗ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {campaigns.map((campaign) => {
                  const statusInfo = STATUS_LABELS[campaign.status] ?? {
                    label: campaign.status,
                    className:
                      "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400",
                  };
                  return (
                    <tr
                      key={campaign.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <Link
                          href={`/campaigns/${campaign.id}`}
                          className="text-sm font-medium text-gray-900 dark:text-gray-50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1"
                        >
                          {campaign.name}
                          <ArrowUpRight className="w-3 h-3 opacity-50" />
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                        {campaign.product?.name ? (
                          <span className="truncate block max-w-[180px]">
                            {campaign.product.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">
                            —
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">
                        {formatPlatform(campaign.platform)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                        {formatVND(campaign.totalSpend)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-medium text-gray-900 dark:text-gray-50">
                        {campaign.roas !== null
                          ? `${campaign.roas.toFixed(2)}x`
                          : "—"}
                      </td>
                      <td
                        className={`py-3 px-4 text-right text-sm font-medium ${
                          campaign.profitLoss >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {campaign.profitLoss >= 0 ? "+" : ""}
                        {formatVND(campaign.profitLoss)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <Megaphone className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-1">
            Chưa có campaign nào
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
            {statusFilter || platformFilter
              ? "Thử bỏ bộ lọc để xem tất cả campaigns"
              : "Tạo campaign đầu tiên để bắt đầu theo dõi hiệu quả"}
          </p>
          <Link
            href={
              statusFilter || platformFilter
                ? "/campaigns"
                : "/campaigns?create=1"
            }
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm hover:shadow transition-all"
          >
            {statusFilter || platformFilter ? "Xóa bộ lọc" : "Tạo campaign"}
          </Link>
        </div>
      )}
    </div>
  );
}
