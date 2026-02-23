import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ScoreBreakdown } from "@/components/products/score-breakdown";
import { ContentSuggestion } from "@/components/products/content-suggestion";
import { SeasonalTagForm } from "@/components/products/seasonal-tag-form";
import { formatVND, formatPercent, formatNumber } from "@/lib/utils/format";
import { computeBadges } from "@/lib/utils/product-badges";
import { ArrowLeft, ExternalLink, Video, Radio, Users, History } from "lucide-react";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

function getScoreBadgeClass(score: number): string {
  if (score >= 85) return "bg-rose-500 text-white";
  if (score >= 70) return "bg-emerald-500 text-white";
  if (score >= 50) return "bg-amber-500 text-white";
  return "bg-gray-400 text-white";
}

interface InfoRowProps {
  label: string;
  value: string | number | null | undefined;
}

function InfoRow({ label, value }: InfoRowProps): React.ReactElement | null {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex justify-between py-3 text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-medium text-gray-900 dark:text-gray-50">
        {value}
      </span>
    </div>
  );
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps): Promise<React.ReactElement> {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      snapshots: {
        orderBy: { snapshotDate: "desc" },
        take: 5,
        select: {
          id: true,
          price: true,
          commissionRate: true,
          sales7d: true,
          salesTotal: true,
          totalKOL: true,
          totalVideos: true,
          kolOrderRate: true,
          snapshotDate: true,
        },
      },
    },
  });
  if (!product) notFound();

  const score = product.aiScore;
  const prevSnapshot = product.snapshots[0] ?? null;
  const badges = computeBadges(
    {
      price: product.price,
      commissionRate: product.commissionRate,
      sales7d: product.sales7d,
      salesTotal: product.salesTotal,
      totalKOL: product.totalKOL,
      firstSeenAt: product.firstSeenAt,
      lastSeenAt: product.lastSeenAt,
    },
    prevSnapshot
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-50 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại
      </Link>

      {/* Product Header with Image */}
      <div className="flex items-start gap-4">
        {product.imageUrl && (
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={80}
            height={80}
            className="w-20 h-20 rounded-xl object-cover shrink-0 bg-gray-100 dark:bg-slate-800"
            unoptimized
          />
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50 leading-tight">
            {product.name}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {product.category} · {product.shopName ?? product.platform}
            {product.productStatus && (
              <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">
                {product.productStatus}
              </span>
            )}
          </p>
        </div>
        {score !== null && (
          <div
            className={`shrink-0 flex flex-col items-center rounded-2xl px-4 py-3 font-bold shadow-sm ${getScoreBadgeClass(score)}`}
          >
            <span className="text-2xl leading-none">
              {Math.round(score)}
            </span>
            <span className="text-xs mt-0.5 opacity-80">điểm AI</span>
          </div>
        )}
      </div>

      {/* Change Badges */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              key={badge.type}
              className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300"
              title={badge.detail}
            >
              <span>{badge.emoji}</span>
              {badge.label}
              {badge.detail && (
                <span className="text-gray-400 dark:text-gray-500">{badge.detail}</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* KOL/Competition Stats */}
      {(product.totalKOL !== null ||
        product.totalVideos !== null ||
        product.totalLivestreams !== null) && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-slate-800/50 p-4 text-center">
            <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              {formatNumber(product.totalKOL ?? 0)}
            </p>
            <p className="text-xs text-gray-400">KOL</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-slate-800/50 p-4 text-center">
            <Video className="w-5 h-5 text-pink-500 mx-auto mb-1" />
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              {formatNumber(product.totalVideos ?? 0)}
            </p>
            <p className="text-xs text-gray-400">Video</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-slate-800/50 p-4 text-center">
            <Radio className="w-5 h-5 text-red-500 mx-auto mb-1" />
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              {formatNumber(product.totalLivestreams ?? 0)}
            </p>
            <p className="text-xs text-gray-400">Livestream</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Thông tin sản phẩm
          </p>
          <div className="divide-y divide-gray-50 dark:divide-slate-800">
            <InfoRow label="Giá bán" value={formatVND(product.price)} />
            <InfoRow
              label="Hoa hồng"
              value={`${formatPercent(product.commissionRate)} (${formatVND(product.commissionVND)})`}
            />
            <InfoRow label="Nền tảng" value={product.platform} />
            <InfoRow label="Danh mục" value={product.category} />
            <InfoRow label="Shop" value={product.shopName} />
            {product.kolOrderRate !== null && (
              <InfoRow
                label="Tỷ lệ chốt đơn KOL"
                value={`${product.kolOrderRate.toFixed(1)}%`}
              />
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Dữ liệu bán hàng
          </p>
          <div className="divide-y divide-gray-50 dark:divide-slate-800">
            {product.sales7d !== null && (
              <InfoRow
                label="Bán 7 ngày"
                value={formatNumber(product.sales7d)}
              />
            )}
            {product.salesTotal !== null && (
              <InfoRow
                label="Tổng bán"
                value={formatNumber(product.salesTotal)}
              />
            )}
            {product.revenue7d !== null && (
              <InfoRow
                label="Doanh thu 7 ngày"
                value={formatVND(product.revenue7d)}
              />
            )}
            {product.revenueTotal !== null && (
              <InfoRow
                label="Tổng doanh thu"
                value={formatVND(product.revenueTotal)}
              />
            )}
            <InfoRow label="Nguồn" value={product.source} />
            {product.aiRank !== null && (
              <InfoRow label="Xếp hạng AI" value={`#${product.aiRank}`} />
            )}
          </div>
        </div>
      </div>

      {product.scoreBreakdown && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Phân tích điểm (6 tiêu chí)
          </p>
          <ScoreBreakdown breakdown={product.scoreBreakdown} />
        </div>
      )}

      <ContentSuggestion
        suggestion={product.contentSuggestion ?? null}
        platformAdvice={product.platformAdvice ?? null}
      />

      {/* Seasonal Tag (B4) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
        <SeasonalTagForm
          productId={product.id}
          currentTag={product.seasonalTag}
          sellWindowStart={product.sellWindowStart}
          sellWindowEnd={product.sellWindowEnd}
        />
      </div>

      {/* Links */}
      <div className="flex flex-wrap gap-3 pt-2">
        {product.tiktokUrl && (
          <a
            href={product.tiktokUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-pink-50 dark:bg-pink-950 hover:bg-pink-100 dark:hover:bg-pink-900 text-pink-700 dark:text-pink-300 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            TikTok Shop
          </a>
        )}
        {product.fastmossUrl && (
          <a
            href={product.fastmossUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            FastMoss
          </a>
        )}
        {product.shopFastmossUrl && (
          <a
            href={product.shopFastmossUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Cửa hàng
          </a>
        )}
      </div>

      {/* Snapshot History */}
      {product.snapshots.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-gray-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Lịch sử thay đổi ({product.snapshots.length} lần cập nhật)
            </p>
          </div>
          <div className="space-y-3">
            {product.snapshots.map((snap) => (
              <div
                key={snap.id}
                className="flex items-center justify-between text-sm border-b border-gray-50 dark:border-slate-800 pb-3 last:border-0"
              >
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(snap.snapshotDate).toLocaleDateString("vi-VN")}
                </span>
                <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-300">
                  <span>{formatVND(snap.price)}</span>
                  <span>{formatPercent(snap.commissionRate)}</span>
                  {snap.sales7d !== null && (
                    <span>{formatNumber(snap.sales7d)} bán/7d</span>
                  )}
                  {snap.totalKOL !== null && (
                    <span>{snap.totalKOL} KOL</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
