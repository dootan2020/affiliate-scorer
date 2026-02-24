import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatVND, formatPlatform } from "@/lib/utils/format";
import {
  CampaignDetailClient,
  type DailyResultRow,
  type ChecklistItem,
  type ContentPostItem,
} from "@/components/campaigns/campaign-detail-client";
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Target,
  Calculator,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Chi tiet Campaign | AffiliateScorer",
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

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

/** Type guard to validate DailyResultRow array from JSON */
function parseDailyResults(raw: unknown): DailyResultRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is DailyResultRow =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as Record<string, unknown>).date === "string",
  );
}

/** Type guard to validate ChecklistItem array from JSON */
function parseChecklist(raw: unknown): ChecklistItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is ChecklistItem =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as Record<string, unknown>).id === "string" &&
      typeof (item as Record<string, unknown>).label === "string",
  );
}

export default async function CampaignDetailPage({
  params,
}: CampaignDetailPageProps): Promise<React.ReactElement> {
  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      product: { select: { id: true, name: true } },
      contentPosts: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!campaign) notFound();

  const statusInfo = STATUS_LABELS[campaign.status] ?? {
    label: campaign.status,
    className:
      "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400",
  };

  // Parse JSON columns with type safety
  const dailyResults = parseDailyResults(campaign.dailyResults);
  const checklist = parseChecklist(campaign.checklist);

  // Serialize content posts for client component (dates to ISO strings)
  const contentPosts: ContentPostItem[] = campaign.contentPosts.map((cp) => ({
    id: cp.id,
    url: cp.url,
    platform: cp.platform,
    contentType: cp.contentType,
    views: cp.views,
    likes: cp.likes,
    comments: cp.comments,
    shares: cp.shares,
    notes: cp.notes,
    postedAt: cp.postedAt?.toISOString() ?? null,
  }));

  // Compute ROAS display
  const roasDisplay =
    campaign.roas !== null ? `${campaign.roas.toFixed(2)}x` : "—";

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/campaigns"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-50 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Campaigns
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
              {campaign.name}
            </h1>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusInfo.className}`}
            >
              {statusInfo.label}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
            <span>{formatPlatform(campaign.platform)}</span>
            {campaign.product && (
              <>
                <span className="text-gray-300 dark:text-slate-700">·</span>
                <Link
                  href={`/products/${campaign.product.id}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {campaign.product.name}
                </Link>
              </>
            )}
            {campaign.startedAt && (
              <>
                <span className="text-gray-300 dark:text-slate-700">·</span>
                <span>
                  Bat dau:{" "}
                  {new Date(campaign.startedAt).toLocaleDateString("vi-VN")}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-rose-500" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Tong chi phi
            </p>
          </div>
          <p className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            {formatVND(campaign.totalSpend)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Tong doanh thu
            </p>
          </div>
          <p className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            {formatVND(campaign.totalRevenue)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="w-4 h-4 text-blue-500" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Tong don hang
            </p>
          </div>
          <p className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            {campaign.totalOrders}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-indigo-500" />
            <p className="text-xs text-gray-500 dark:text-gray-400">ROAS</p>
          </div>
          <p className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            {roasDisplay}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-4 h-4 text-amber-500" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Lai / Lo
            </p>
          </div>
          <p
            className={`text-xl font-semibold ${
              campaign.profitLoss >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {campaign.profitLoss >= 0 ? "+" : ""}
            {formatVND(campaign.profitLoss)}
          </p>
        </div>
      </div>

      {/* Tab content via client wrapper */}
      <CampaignDetailClient
        campaignId={campaign.id}
        status={campaign.status}
        dailyResults={dailyResults}
        checklist={checklist}
        contentPosts={contentPosts}
        verdict={campaign.verdict}
        lessonsLearned={campaign.lessonsLearned}
      />
    </div>
  );
}
