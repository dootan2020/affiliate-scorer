// Extracted helpers for building Prisma create/update data objects.
// Used by process-product-batch.ts for batch operations.
import type { NormalizedProduct } from "@/lib/utils/normalize";

/** Build data object for prisma.product.createMany */
export function buildCreateData(p: NormalizedProduct, batchId: string) {
  return {
    name: p.name,
    url: p.url,
    category: p.category,
    price: p.price,
    commissionRate: p.commissionRate,
    commissionVND: p.commissionVND,
    platform: p.platform,
    salesTotal: p.salesTotal,
    sales7d: p.sales7d,
    salesGrowth7d: p.salesGrowth7d,
    salesGrowth30d: p.salesGrowth30d,
    revenue7d: p.revenue7d,
    revenue30d: p.revenue30d,
    revenueTotal: p.revenueTotal,
    totalKOL: p.totalKOL,
    kolOrderRate: p.kolOrderRate,
    totalVideos: p.totalVideos,
    totalLivestreams: p.totalLivestreams,
    affiliateCount: p.affiliateCount,
    creatorCount: p.creatorCount,
    topVideoViews: p.topVideoViews,
    imageUrl: p.imageUrl,
    tiktokUrl: p.tiktokUrl,
    fastmossUrl: p.fastmossUrl,
    shopFastmossUrl: p.shopFastmossUrl,
    shopName: p.shopName,
    shopRating: p.shopRating,
    productStatus: p.productStatus,
    listingDate: p.listingDate,
    source: p.source,
    importBatchId: batchId,
    dataDate: p.dataDate,
  };
}

/** Build data object for prisma.product.update */
export function buildUpdateData(p: NormalizedProduct, batchId: string) {
  return {
    name: p.name,
    url: p.url,
    category: p.category,
    price: p.price,
    commissionRate: p.commissionRate,
    commissionVND: p.commissionVND,
    salesTotal: p.salesTotal,
    sales7d: p.sales7d,
    salesGrowth7d: p.salesGrowth7d,
    salesGrowth30d: p.salesGrowth30d,
    revenue7d: p.revenue7d,
    revenue30d: p.revenue30d,
    revenueTotal: p.revenueTotal,
    totalKOL: p.totalKOL,
    kolOrderRate: p.kolOrderRate,
    totalVideos: p.totalVideos,
    totalLivestreams: p.totalLivestreams,
    imageUrl: p.imageUrl,
    tiktokUrl: p.tiktokUrl,
    fastmossUrl: p.fastmossUrl,
    shopFastmossUrl: p.shopFastmossUrl,
    shopName: p.shopName ?? undefined,
    productStatus: p.productStatus,
    listingDate: p.listingDate,
    lastSeenAt: new Date(),
    importBatchId: batchId,
    dataDate: p.dataDate,
  };
}

/** Check if product data has changed (for snapshot decision) */
export function hasDataChanged(
  existing: {
    price: number | null;
    commissionRate: number | null;
    sales7d: number | null;
    salesTotal: number | null;
    revenue7d: number | null;
    revenueTotal: number | null;
    totalKOL: number | null;
    totalVideos: number | null;
    kolOrderRate: number | null;
    productStatus: string | null;
  },
  p: NormalizedProduct,
): boolean {
  return (
    existing.price !== p.price ||
    existing.commissionRate !== p.commissionRate ||
    existing.sales7d !== p.sales7d ||
    existing.salesTotal !== p.salesTotal ||
    existing.revenue7d !== p.revenue7d ||
    existing.revenueTotal !== p.revenueTotal ||
    existing.totalKOL !== p.totalKOL ||
    existing.totalVideos !== p.totalVideos ||
    existing.kolOrderRate !== p.kolOrderRate ||
    existing.productStatus !== p.productStatus
  );
}
