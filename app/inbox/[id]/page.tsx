import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  Sparkles, ArrowLeft, ExternalLink, Video, Radio, Users, History,
  TrendingUp, Lightbulb, Globe, Trophy, CheckCircle2,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { ScoreBreakdown } from "@/components/products/score-breakdown";
import { SeasonalTagForm } from "@/components/products/seasonal-tag-form";
import { ProductImage } from "@/components/products/product-image";
import { ProfitEstimator } from "@/components/products/profit-estimator";
import { PersonalNotesSection } from "@/components/products/personal-notes-section";
import { AffiliateLinkSection } from "@/components/products/affiliate-link-section";
import { WinProbabilityCard } from "@/components/ai/win-probability-card";
import { LifecycleBadge } from "@/components/ai/lifecycle-badge";
import { ChannelRecommendations } from "@/components/ai/channel-recommendations";
import { getProductLifecycle } from "@/lib/ai/lifecycle";
import { getChannelRecommendations } from "@/lib/ai/recommendations";
import { calculateConfidence } from "@/lib/ai/confidence";
import { formatVND, formatPercent, formatNumber, formatPlatform, formatSource } from "@/lib/utils/format";
import { computeBadges } from "@/lib/utils/product-badges";
import { generateContentTips, generatePlatformStrategy } from "@/lib/utils/content-suggestions";

interface InboxDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: InboxDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const identity = await prisma.productIdentity.findUnique({
    where: { id },
    select: { title: true },
  });
  return {
    title: identity?.title ? `${identity.title} | Inbox` : "Chi tiết sản phẩm | Inbox",
  };
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
      <span className="font-medium text-gray-900 dark:text-gray-50">{value}</span>
    </div>
  );
}

export default async function InboxDetailPage({ params }: InboxDetailPageProps): Promise<React.ReactElement> {
  const { id } = await params;

  // Lookup ProductIdentity by id
  const identity = await prisma.productIdentity.findUnique({
    where: { id },
    select: { product: { select: { id: true } }, title: true },
  });

  let productId: string;

  if (identity?.product?.id) {
    // Normal path: identity found with linked product
    productId = identity.product.id;
  } else if (!identity) {
    // id might be a Product.id — find linked ProductIdentity and redirect
    const productWithIdentity = await prisma.product.findUnique({
      where: { id },
      select: { identityId: true },
    });
    if (productWithIdentity?.identityId) {
      redirect(`/inbox/${productWithIdentity.identityId}`);
    }
    // No identity linked — 404
    notFound();
  } else {
    // Identity exists but no linked product — show what we can
    productId = id;
  }

  const [product, totalProducts] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      include: {
        snapshots: {
          orderBy: { snapshotDate: "desc" },
          take: 5,
          select: {
            id: true, price: true, commissionRate: true,
            sales7d: true, salesTotal: true, totalKOL: true,
            totalVideos: true, kolOrderRate: true, snapshotDate: true,
          },
        },
      },
    }),
    prisma.product.count(),
  ]);
  if (!product) notFound();

  // Similar products — same category, price ±50%, with identity link for routing
  const similarSelect = {
    id: true, name: true, price: true, commissionRate: true, commissionVND: true,
    sales7d: true, aiScore: true, identityId: true,
  };
  let similarProducts = await prisma.product.findMany({
    where: {
      category: product.category,
      id: { not: product.id },
      identityId: { not: null },
      price: { gte: product.price * 0.5, lte: product.price * 1.5 },
    },
    orderBy: { aiScore: "desc" },
    take: 5,
    select: similarSelect,
  });
  if (similarProducts.length === 0) {
    similarProducts = await prisma.product.findMany({
      where: { category: product.category, id: { not: product.id }, identityId: { not: null } },
      orderBy: { aiScore: "desc" },
      take: 5,
      select: similarSelect,
    });
  }

  // Lookup shop for clickable shopName link
  const shop = product.shopName
    ? await prisma.shop.findFirst({ where: { name: product.shopName }, select: { id: true } })
    : null;

  // AI Intelligence
  const [lifecycle, confidence] = await Promise.all([
    getProductLifecycle(product.id),
    calculateConfidence(),
  ]);
  const recommendations = await getChannelRecommendations(product.id, confidence.level);

  const score = product.aiScore;
  const prevSnapshot = product.snapshots[0] ?? null;
  const badges = computeBadges(
    {
      price: product.price, commissionRate: product.commissionRate,
      sales7d: product.sales7d, salesTotal: product.salesTotal,
      totalKOL: product.totalKOL, firstSeenAt: product.firstSeenAt,
      lastSeenAt: product.lastSeenAt,
    },
    prevSnapshot,
  );

  const isSweetSpot = product.price >= 100_000 && product.price <= 500_000 && product.commissionRate > 8;

  const contentTips = generateContentTips({
    name: product.name, category: product.category, price: product.price,
    commissionRate: product.commissionRate, commissionVND: product.commissionVND,
    sales7d: product.sales7d, totalKOL: product.totalKOL,
    totalVideos: product.totalVideos, totalLivestreams: product.totalLivestreams,
    platform: product.platform,
  });
  const strategy = generatePlatformStrategy({
    name: product.name, category: product.category, price: product.price,
    commissionRate: product.commissionRate, commissionVND: product.commissionVND,
    sales7d: product.sales7d, totalKOL: product.totalKOL,
    totalVideos: product.totalVideos, totalLivestreams: product.totalLivestreams,
    platform: product.platform,
  });

  return (
    <div className="space-y-6">
      <Link
        href="/inbox"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-50 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại Inbox
      </Link>

      {/* Product Header */}
      <div className="flex items-start gap-4">
        <ProductImage src={product.imageUrl} alt={product.name} size={80} className="w-20 h-20 rounded-xl" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-gray-900 dark:text-gray-50 leading-tight">
            {product.name}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {product.category} ·{" "}
            {shop ? (
              <Link href={`/shops/${shop.id}`} className="text-orange-600 dark:text-orange-400 hover:underline">
                {product.shopName}
              </Link>
            ) : (
              product.shopName ?? formatPlatform(product.platform)
            )}
            {product.productStatus && (
              <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">{product.productStatus}</span>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            {badges.map((badge) => (
              <span key={badge.type} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300" title={badge.detail}>
                {badge.label}
              </span>
            ))}
            {product.tiktokUrl && (
              <a href={product.tiktokUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-slate-700 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                TikTok Shop <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {product.fastmossUrl && (
              <a href={product.fastmossUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-slate-700 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                FastMoss <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {product.shopFastmossUrl && (
              <a href={product.shopFastmossUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-slate-700 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                Cửa hàng <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
        {score !== null && (
          <div className={`shrink-0 flex flex-col items-center rounded-2xl px-4 py-3 font-bold shadow-sm ${getScoreBadgeClass(score)}`}>
            <span className="text-2xl leading-none">{Math.round(score)}</span>
            <span className="text-xs mt-0.5 opacity-80">điểm AI</span>
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-4 sm:p-5 border border-orange-100 dark:border-slate-700">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Hoa hồng/đơn</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-50">{formatVND(product.commissionVND)}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{formatPercent(product.commissionRate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Bán 7 ngày</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-50">
              {product.sales7d !== null ? formatNumber(product.sales7d) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Giá bán</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-50">{formatVND(product.price)}</p>
            {isSweetSpot && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Sweet spot
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Xếp hạng</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-50">#{product.aiRank ?? "—"}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">/ {totalProducts} SP</p>
          </div>
        </div>
      </div>

      {/* Create Brief Button */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={`/production?productId=${product.id}`}
          className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-400 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Tạo Brief AI
        </Link>
      </div>

      {/* KOL/Competition Stats */}
      {(product.totalKOL !== null || product.totalVideos !== null || product.totalLivestreams !== null) && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-slate-800/50 p-4 text-center">
            <Users className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">{formatNumber(product.totalKOL ?? 0)}</p>
            <p className="text-xs text-gray-400">KOL</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-slate-800/50 p-4 text-center">
            <Video className="w-5 h-5 text-pink-500 mx-auto mb-1" />
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">{formatNumber(product.totalVideos ?? 0)}</p>
            <p className="text-xs text-gray-400">Video</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-slate-800/50 p-4 text-center">
            <Radio className="w-5 h-5 text-red-500 mx-auto mb-1" />
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">{formatNumber(product.totalLivestreams ?? 0)}</p>
            <p className="text-xs text-gray-400">Livestream</p>
          </div>
        </div>
      )}

      {/* Content Tips */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Gợi ý nội dung</p>
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Dạng video phù hợp: </span>
            <span className="text-gray-900 dark:text-gray-50 font-medium">{contentTips.videoTypes.join(" / ")}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Góc quay: </span>
            <span className="text-gray-600 dark:text-gray-300">{contentTips.angles.join("; ")}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Hook gợi ý: </span>
            <span className="text-gray-600 dark:text-gray-300">{contentTips.hooks.join(", ")}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Độ dài: </span>
            <span className="text-gray-600 dark:text-gray-300">{contentTips.duration}</span>
          </div>
          {contentTips.opportunity && (
            <p className="text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> {contentTips.opportunity}
            </p>
          )}
        </div>
      </div>

      {/* Platform Strategy */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-orange-500" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Chiến lược nền tảng: {formatPlatform(strategy.platform)}
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Lý do: </span>
            <span className="text-gray-600 dark:text-gray-300">{strategy.reason}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Kênh ưu tiên: </span>
            <span className="text-gray-900 dark:text-gray-50 font-medium">{strategy.priorityChannel}</span>
          </div>
          {strategy.videoOpportunity && (
            <p className="text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> {strategy.videoOpportunity}
            </p>
          )}
          <div>
            <span className="text-gray-500 dark:text-gray-400">Cạnh tranh: </span>
            <span className="text-gray-600 dark:text-gray-300">{strategy.competition}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Budget gợi ý: </span>
            <span className="text-gray-600 dark:text-gray-300">{strategy.budgetSuggestion}</span>
          </div>
        </div>
      </div>

      {/* AI Intelligence */}
      <WinProbabilityCard productId={product.id} />
      <LifecycleBadge
        stage={lifecycle.stage}
        salesChange={lifecycle.salesChange}
        kolChange={lifecycle.kolChange}
        message={lifecycle.message}
      />
      <ChannelRecommendations recommendations={recommendations} />

      {/* Personal Notes */}
      <PersonalNotesSection
        productId={product.id}
        initialNotes={product.personalNotes}
        initialRating={product.personalRating}
        initialTags={product.personalTags}
        affiliateLink={product.affiliateLink}
        affiliateLinkStatus={product.affiliateLinkStatus}
      />

      {/* Affiliate Link */}
      <AffiliateLinkSection
        productId={product.id}
        initialLink={product.affiliateLink}
        initialStatus={product.affiliateLinkStatus}
        initialCreatedAt={product.affiliateLinkCreatedAt?.toISOString() ?? null}
      />

      {/* Profit Estimator */}
      <ProfitEstimator commissionVND={product.commissionVND} />

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-amber-500" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              SP tương tự (cùng {product.category}, giá {formatVND(product.price * 0.5)}–{formatVND(product.price * 1.5)})
            </p>
          </div>
          <table className="w-full table-fixed">
            <colgroup>
              <col /><col className="w-16" /><col className="w-16" />
              <col className="w-16 hidden sm:table-column" /><col className="w-14" />
            </colgroup>
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800">
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-2 pr-2">Tên SP</th>
                <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-2 px-2">Giá</th>
                <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-2 px-2">HH</th>
                <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-2 px-2 hidden sm:table-cell">Bán 7D</th>
                <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-2 pl-2">Điểm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
              <tr className="bg-orange-50/50 dark:bg-orange-950/30">
                <td className="py-2 pr-2 text-sm font-medium text-orange-700 dark:text-orange-300">
                  <span className="block truncate" title={product.name}>{product.name}</span>
                  <span className="text-xs text-orange-400">← đang xem</span>
                </td>
                <td className="py-2 px-2 text-right text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatVND(product.price)}</td>
                <td className="py-2 px-2 text-right text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatPercent(product.commissionRate)}</td>
                <td className="py-2 px-2 text-right text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap hidden sm:table-cell">{product.sales7d !== null ? formatNumber(product.sales7d) : "—"}</td>
                <td className="py-2 pl-2 text-right text-sm font-semibold text-gray-900 dark:text-gray-50">{score !== null ? Math.round(score) : "—"}</td>
              </tr>
              {similarProducts.map((sp) => (
                <tr key={sp.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50">
                  <td className="py-2 pr-2 text-sm text-gray-900 dark:text-gray-50">
                    <Link href={`/inbox/${sp.identityId ?? sp.id}`} className="block truncate hover:text-orange-600 dark:hover:text-orange-400 transition-colors" title={sp.name}>
                      {sp.name}
                    </Link>
                  </td>
                  <td className="py-2 px-2 text-right text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatVND(sp.price)}</td>
                  <td className="py-2 px-2 text-right text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatPercent(sp.commissionRate)}</td>
                  <td className="py-2 px-2 text-right text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap hidden sm:table-cell">{sp.sales7d !== null ? formatNumber(sp.sales7d) : "—"}</td>
                  <td className="py-2 pl-2 text-right text-sm font-semibold text-gray-900 dark:text-gray-50">{sp.aiScore !== null ? Math.round(sp.aiScore) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Score Breakdown */}
      {product.scoreBreakdown && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Phân tích điểm (6 tiêu chí)</p>
          <ScoreBreakdown breakdown={product.scoreBreakdown} />
        </div>
      )}

      {/* Product Info + Sales Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Thông tin sản phẩm</p>
          <div className="divide-y divide-gray-50 dark:divide-slate-800">
            <InfoRow label="Giá bán" value={formatVND(product.price)} />
            <InfoRow label="Hoa hồng" value={`${formatPercent(product.commissionRate)} (${formatVND(product.commissionVND)})`} />
            <InfoRow label="Nền tảng" value={formatPlatform(product.platform)} />
            <InfoRow label="Danh mục" value={product.category} />
            <InfoRow label="Shop" value={product.shopName} />
            {product.kolOrderRate !== null && (
              <InfoRow label="Tỷ lệ chốt đơn KOL" value={`${product.kolOrderRate.toFixed(1)}%`} />
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Dữ liệu bán hàng</p>
          <div className="divide-y divide-gray-50 dark:divide-slate-800">
            {product.sales7d !== null && <InfoRow label="Bán 7 ngày" value={formatNumber(product.sales7d)} />}
            {product.salesTotal !== null && <InfoRow label="Tổng bán" value={formatNumber(product.salesTotal)} />}
            {product.revenue7d !== null && <InfoRow label="Doanh thu 7 ngày" value={formatVND(product.revenue7d)} />}
            {product.revenueTotal !== null && <InfoRow label="Tổng doanh thu" value={formatVND(product.revenueTotal)} />}
            <InfoRow label="Nguồn" value={formatSource(product.source)} />
          </div>
        </div>
      </div>

      {/* Seasonal Tag */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
        <SeasonalTagForm
          productId={product.id}
          currentTag={product.seasonalTag}
          sellWindowStart={product.sellWindowStart}
          sellWindowEnd={product.sellWindowEnd}
        />
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
              <div key={snap.id} className="flex items-center justify-between text-sm border-b border-gray-50 dark:border-slate-800 pb-3 last:border-0">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(snap.snapshotDate).toLocaleDateString("vi-VN")}
                </span>
                <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-300">
                  <span>{formatVND(snap.price)}</span>
                  <span>{formatPercent(snap.commissionRate)}</span>
                  {snap.sales7d !== null && <span>{formatNumber(snap.sales7d)} bán/7d</span>}
                  {snap.totalKOL !== null && <span>{snap.totalKOL} KOL</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
