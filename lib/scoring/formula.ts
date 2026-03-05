// Phase 03: Base Formula — 5 components, VN market validated
// Commission(25%) + Trending(25%) + Competition(20%) + PriceAppeal(15%) + SalesVelocity(15%)
// Removed: contentFit (redundant with AI), platform (no discrimination)

import type { Product as ProductModel } from "@/lib/types/product";

export interface ScoreBreakdown {
  commission: number;
  trending: number;
  competition: number;
  priceAppeal: number;
  salesVelocity: number;
}

export interface BaseScoreResult {
  total: number;
  breakdown: ScoreBreakdown;
}

/** Input for base formula — subset of Product fields needed */
export interface BaseScoreInput {
  commissionRate: number;
  commissionVND?: number;
  sales7d?: number | null;
  salesTotal?: number | null;
  salesGrowth7d?: number | null;
  totalKOL?: number | null;
  totalVideos?: number | null;
  kolOrderRate?: number | null;
  affiliateCount?: number | null;
  price: number;
  category?: string | null;
}

/** Commission Score (25%) — continuous curve for VN TikTok affiliate */
function scoreCommission(rate: number, commissionVND?: number): number {
  let base: number;
  if (rate <= 0) base = 0;
  else if (rate <= 3) base = rate * 7; // 0-21
  else if (rate <= 7) base = 21 + (rate - 3) * 8; // 21-53
  else if (rate <= 12) base = 53 + (rate - 7) * 7; // 53-88
  else if (rate <= 20) base = 88 + (rate - 12) * 1.5; // 88-100
  else base = 100;

  // VND bonus: commission per sale in sweet spot 20K-100K VND
  const vnd = commissionVND ?? 0;
  const vndBonus =
    vnd >= 20000 && vnd <= 100000 ? 5 : vnd > 100000 ? 3 : 0;

  return Math.min(100, Math.round(base + vndBonus));
}

/** Trending Score (25%) — growth data or sales ratio estimate */
function scoreTrending(
  salesGrowth7d: number | null | undefined,
  sales7d: number | null | undefined,
  salesTotal: number | null | undefined,
): number {
  // Priority 1: Real growth data
  if (salesGrowth7d != null) {
    const g = salesGrowth7d;
    if (g <= -30) return 0;
    if (g <= -10) return 15;
    if (g <= 0) return 25;
    if (g <= 10) return 35;
    if (g <= 30) return 50;
    if (g <= 80) return 70;
    if (g <= 200) return 90;
    if (g <= 500) return 100;
    return 75; // >500% = spike risk
  }

  // Priority 2: Estimate from sales7d/salesTotal ratio
  const s7d = sales7d ?? 0;
  const sTotal = salesTotal ?? 0;
  if (sTotal <= 0 || s7d <= 0) return 20;

  const ratio = s7d / sTotal;
  if (ratio > 0.5) return 70;
  if (ratio > 0.2) return 90;
  if (ratio > 0.1) return 75;
  if (ratio > 0.05) return 55;
  if (ratio > 0.02) return 35;
  return 15;
}

/** Competition Score (20%) — KOL count + video saturation + conversion */
function scoreCompetition(
  totalKOL: number | null | undefined,
  totalVideos: number | null | undefined,
  kolOrderRate: number | null | undefined,
  affiliateCount: number | null | undefined,
): number {
  const kol = totalKOL ?? affiliateCount ?? 0;
  const videos = totalVideos ?? 0;
  const kolRate = kolOrderRate ?? 0;

  let kolScore: number;
  if (kol <= 3) kolScore = 100;
  else if (kol <= 10) kolScore = 85;
  else if (kol <= 25) kolScore = 65;
  else if (kol <= 50) kolScore = 45;
  else if (kol <= 100) kolScore = 25;
  else kolScore = 10;

  let videoPenalty = 0;
  if (videos > 1000) videoPenalty = -20;
  else if (videos > 500) videoPenalty = -15;
  else if (videos > 200) videoPenalty = -10;
  else if (videos > 50) videoPenalty = -5;

  let rateBonus = 0;
  if (kolRate > 60) rateBonus = 15;
  else if (kolRate > 40) rateBonus = 10;
  else if (kolRate > 20) rateBonus = 5;

  return Math.max(0, Math.min(100, kolScore + videoPenalty + rateBonus));
}

/** Price Appeal (15%) — VN TikTok impulse buy sweet spot 80-200K */
function scorePriceAppeal(priceVND: number): number {
  if (priceVND >= 80000 && priceVND <= 200000) return 100;
  if (priceVND >= 50000 && priceVND < 80000) return 80;
  if (priceVND > 200000 && priceVND <= 400000) return 75;
  if (priceVND >= 30000 && priceVND < 50000) return 55;
  if (priceVND > 400000 && priceVND <= 800000) return 50;
  if (priceVND > 800000 && priceVND <= 1500000) return 35;
  if (priceVND < 30000) return 20;
  return 15; // >1.5M too expensive for TikTok
}

/** Sales Velocity (15%) — absolute sales7d volume = market validation */
function scoreSalesVelocity(sales7d: number | null | undefined): number {
  const s = sales7d ?? 0;
  if (s >= 10000) return 100;
  if (s >= 5000) return 90;
  if (s >= 2000) return 75;
  if (s >= 500) return 60;
  if (s >= 100) return 45;
  if (s >= 20) return 30;
  if (s > 0) return 15;
  return 5;
}

const WEIGHTS = {
  commission: 0.25,
  trending: 0.25,
  competition: 0.2,
  priceAppeal: 0.15,
  salesVelocity: 0.15,
};

/** Calculate base formula score from product data (no AI involved) */
export function calculateBaseScore(input: BaseScoreInput): BaseScoreResult {
  const commissionScore = scoreCommission(input.commissionRate, input.commissionVND);
  const trendingScore = scoreTrending(
    input.salesGrowth7d,
    input.sales7d,
    input.salesTotal,
  );
  const competitionScore = scoreCompetition(
    input.totalKOL,
    input.totalVideos,
    input.kolOrderRate,
    input.affiliateCount,
  );
  const priceScore = scorePriceAppeal(input.price);
  const velocityScore = scoreSalesVelocity(input.sales7d);

  const total = Math.min(
    100,
    Math.round(
      commissionScore * WEIGHTS.commission +
        trendingScore * WEIGHTS.trending +
        competitionScore * WEIGHTS.competition +
        priceScore * WEIGHTS.priceAppeal +
        velocityScore * WEIGHTS.salesVelocity,
    ),
  );

  return {
    total,
    breakdown: {
      commission: commissionScore,
      trending: trendingScore,
      competition: competitionScore,
      priceAppeal: priceScore,
      salesVelocity: velocityScore,
    },
  };
}

/**
 * Convenience: calculate from full Product model.
 * Used by lib/ai/scoring.ts mergeWithBaseScore.
 */
export function calculateBaseScoreFromProduct(product: ProductModel): BaseScoreResult {
  return calculateBaseScore({
    commissionRate: product.commissionRate,
    commissionVND: product.commissionVND,
    sales7d: product.sales7d,
    salesTotal: product.salesTotal,
    salesGrowth7d: product.salesGrowth7d,
    totalKOL: product.totalKOL,
    totalVideos: product.totalVideos,
    kolOrderRate: product.kolOrderRate,
    affiliateCount: product.affiliateCount,
    price: product.price,
    category: product.category,
  });
}
