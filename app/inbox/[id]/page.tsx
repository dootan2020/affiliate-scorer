import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Sparkles, Video, Radio, Users, History } from "lucide-react";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { ProductDetailHeader } from "@/components/products/product-detail-header";
import { ProductKeyMetrics } from "@/components/products/product-key-metrics";
import { ProductContentTips } from "@/components/products/product-content-tips";
import { ProductSimilarTable } from "@/components/products/product-similar-table";
import { ProductInfoGrid } from "@/components/products/product-info-grid";
import { ScoreBreakdown } from "@/components/products/score-breakdown";
import { SeasonalTagForm } from "@/components/products/seasonal-tag-form";
import { ProfitEstimator } from "@/components/products/profit-estimator";
import { PersonalNotesSection } from "@/components/products/personal-notes-section";
import { AffiliateLinkSection } from "@/components/products/affiliate-link-section";
import { WinProbabilityCard } from "@/components/ai/win-probability-card";
import { LifecycleBadge } from "@/components/ai/lifecycle-badge";
import { ChannelRecommendations } from "@/components/ai/channel-recommendations";
import { getProductLifecycle } from "@/lib/ai/lifecycle";
import { getChannelRecommendations } from "@/lib/ai/recommendations";
import { calculateConfidence } from "@/lib/ai/confidence";
import { formatVND, formatPercent, formatNumber } from "@/lib/utils/format";
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
    title: identity?.title ? `${identity.title} | Hộp sản phẩm` : "Chi tiết sản phẩm | Hộp sản phẩm",
  };
}

export default async function InboxDetailPage({ params }: InboxDetailPageProps): Promise<React.ReactElement> {
  const { id } = await params;

  const identity = await prisma.productIdentity.findUnique({
    where: { id },
    select: { product: { select: { id: true } }, title: true },
  });

  let productId: string;

  if (identity?.product?.id) {
    productId = identity.product.id;
  } else if (!identity) {
    const productWithIdentity = await prisma.product.findUnique({
      where: { id },
      select: { identityId: true },
    });
    if (productWithIdentity?.identityId) {
      redirect(`/inbox/${productWithIdentity.identityId}`);
    }
    notFound();
  } else {
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

  const shop = product.shopName
    ? await prisma.shop.findFirst({ where: { name: product.shopName }, select: { id: true } })
    : null;

  const [lifecycle, confidence] = await Promise.all([
    getProductLifecycle(product.id),
    calculateConfidence(),
  ]);
  const recommendations = await getChannelRecommendations(product.id, confidence.level);

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
      <Breadcrumb items={[
        { label: "Hộp sản phẩm", href: "/inbox" },
        ...(product.category ? [{ label: product.category, href: `/inbox?category=${encodeURIComponent(product.category)}` }] : []),
        { label: product.name },
      ]} />

      <ProductDetailHeader
        name={product.name}
        category={product.category}
        shopName={product.shopName}
        shopId={shop?.id ?? null}
        platform={product.platform}
        productStatus={product.productStatus}
        imageUrl={product.imageUrl}
        score={product.aiScore}
        badges={badges}
        tiktokUrl={product.tiktokUrl}
        fastmossUrl={product.fastmossUrl}
        shopFastmossUrl={product.shopFastmossUrl}
      />

      <ProductKeyMetrics
        commissionVND={product.commissionVND}
        commissionRate={product.commissionRate}
        sales7d={product.sales7d}
        price={product.price}
        aiRank={product.aiRank}
        totalProducts={totalProducts}
      />

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild className="w-full sm:w-auto">
          <Link href={`/production?productId=${product.id}`}>
            <Sparkles className="w-4 h-4" />
            Tạo Brief AI
          </Link>
        </Button>
      </div>

      {/* KOL/Competition Stats */}
      {(product.totalKOL !== null || product.totalVideos !== null || product.totalLivestreams !== null) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <CompetitionStat icon={<Users className="w-5 h-5 text-orange-500" />} value={product.totalKOL ?? 0} label="KOL" />
          <CompetitionStat icon={<Video className="w-5 h-5 text-pink-500" />} value={product.totalVideos ?? 0} label="Video" />
          <CompetitionStat icon={<Radio className="w-5 h-5 text-red-500" />} value={product.totalLivestreams ?? 0} label="Livestream" />
        </div>
      )}

      <ProductContentTips contentTips={contentTips} strategy={strategy} />

      {/* AI Intelligence */}
      <WinProbabilityCard productId={product.id} />
      <LifecycleBadge
        stage={lifecycle.stage}
        salesChange={lifecycle.salesChange}
        kolChange={lifecycle.kolChange}
        message={lifecycle.message}
      />
      <ChannelRecommendations recommendations={recommendations} />

      <PersonalNotesSection
        productId={product.id}
        initialNotes={product.personalNotes}
        initialRating={product.personalRating}
        initialTags={product.personalTags}
        affiliateLink={product.affiliateLink}
        affiliateLinkStatus={product.affiliateLinkStatus}
      />

      <AffiliateLinkSection
        productId={product.id}
        initialLink={product.affiliateLink}
        initialStatus={product.affiliateLinkStatus}
        initialCreatedAt={product.affiliateLinkCreatedAt?.toISOString() ?? null}
      />

      <ProfitEstimator commissionVND={product.commissionVND} />

      <ProductSimilarTable
        currentProduct={{
          name: product.name,
          price: product.price,
          commissionRate: product.commissionRate,
          sales7d: product.sales7d,
          aiScore: product.aiScore,
          category: product.category,
        }}
        similarProducts={similarProducts}
      />

      {/* Score Breakdown */}
      {product.scoreBreakdown && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Phân tích điểm (6 tiêu chí)</p>
          <ScoreBreakdown breakdown={product.scoreBreakdown} />
        </div>
      )}

      <ProductInfoGrid
        price={product.price}
        commissionRate={product.commissionRate}
        commissionVND={product.commissionVND}
        platform={product.platform}
        category={product.category}
        shopName={product.shopName}
        kolOrderRate={product.kolOrderRate}
        sales7d={product.sales7d}
        salesTotal={product.salesTotal}
        revenue7d={product.revenue7d}
        revenueTotal={product.revenueTotal}
        source={product.source}
      />

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

function CompetitionStat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }): React.ReactElement {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-slate-800/50 p-4 text-center">
      <div className="mx-auto mb-1 w-fit">{icon}</div>
      <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">{formatNumber(value)}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}
