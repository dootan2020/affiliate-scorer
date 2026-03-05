// Phase 07: Tiered Personalization — starts learning at 5 feedback (not 30)
// BASIC=5: category preferences
// STANDARD=15: category + price + commission
// FULL=30: full historical matching

import { prisma } from "@/lib/db";
import type { Product } from "@/lib/types/product";

export interface PersonalizationResult {
  historicalMatchScore: number;
  contentTypeScore: number;
  audienceScore: number;
  personalizedTotal: number;
}

const FEEDBACK_TIERS = {
  BASIC: 5,
  STANDARD: 15,
  FULL: 30,
} as const;

// Module-level feedback summary cache (5-minute TTL)
interface FeedbackSummaryCache {
  feedbackCount: number;
  successFeedbacks: Array<{
    product: {
      category: string;
      price: number;
      commissionRate: number;
      platform: string;
    };
  }>;
  successByType: Array<{ videoType: string | null; _count: number }>;
  platformPerf: Array<{
    adPlatform: string | null;
    _avg: { adROAS: number | null };
  }>;
  timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
let feedbackCache: FeedbackSummaryCache | null = null;

export function invalidatePersonalizationCache(): void {
  feedbackCache = null;
}

async function getCachedFeedbackSummary(): Promise<FeedbackSummaryCache> {
  const now = Date.now();
  if (feedbackCache && now - feedbackCache.timestamp < CACHE_TTL_MS) {
    return feedbackCache;
  }

  const [feedbackCount, successFeedbacks, successByType, platformPerf] =
    await Promise.all([
      prisma.feedback.count(),
      prisma.feedback.findMany({
        where: { overallSuccess: "success" },
        include: {
          product: {
            select: {
              category: true,
              price: true,
              commissionRate: true,
              platform: true,
            },
          },
        },
        orderBy: { feedbackDate: "desc" },
        take: 100,
      }),
      prisma.feedback.groupBy({
        by: ["videoType"],
        where: { overallSuccess: "success", videoType: { not: null } },
        _count: true,
      }),
      prisma.feedback.groupBy({
        by: ["adPlatform"],
        where: { adROAS: { not: null } },
        _avg: { adROAS: true },
      }),
    ]);

  feedbackCache = {
    feedbackCount,
    successFeedbacks,
    successByType,
    platformPerf,
    timestamp: now,
  };
  return feedbackCache;
}

export async function getFeedbackCount(): Promise<number> {
  const cached = await getCachedFeedbackSummary();
  return cached.feedbackCount;
}

/** Compute category preference bonus from feedback history */
function computeCategoryPreference(
  category: string | null,
  cached: FeedbackSummaryCache,
): number {
  if (!category) return 50;
  const catLower = category.toLowerCase();
  let matches = 0;
  let total = 0;
  for (const fb of cached.successFeedbacks) {
    total++;
    if (fb.product.category.toLowerCase() === catLower) matches++;
  }
  if (total === 0) return 50;
  // Higher ratio = stronger preference. Scale 0-100
  return Math.min(100, Math.round((matches / total) * 200));
}

/** Compute price range preference from feedback history */
function computePricePreference(
  price: number,
  cached: FeedbackSummaryCache,
): number {
  if (cached.successFeedbacks.length === 0) return 50;
  let closeCount = 0;
  for (const fb of cached.successFeedbacks) {
    const diff =
      Math.abs(fb.product.price - price) /
      Math.max(fb.product.price, price, 1);
    if (diff < 0.3) closeCount++;
  }
  return Math.min(100, Math.round((closeCount / cached.successFeedbacks.length) * 150));
}

export async function getPersonalizedScore(
  product: Product,
  baseScore: number,
): Promise<PersonalizationResult | null> {
  const cached = await getCachedFeedbackSummary();

  if (cached.feedbackCount < FEEDBACK_TIERS.BASIC) return null;

  // BASIC tier (5+): just category weight
  if (cached.feedbackCount < FEEDBACK_TIERS.STANDARD) {
    const categoryBonus = computeCategoryPreference(product.category, cached);
    return {
      historicalMatchScore: 50,
      contentTypeScore: 50,
      audienceScore: 50,
      personalizedTotal: Math.round(baseScore * 0.9 + categoryBonus * 0.1),
    };
  }

  // STANDARD tier (15+): category + price + commission
  if (cached.feedbackCount < FEEDBACK_TIERS.FULL) {
    const catBonus = computeCategoryPreference(product.category, cached);
    const priceBonus = computePricePreference(product.price, cached);
    return {
      historicalMatchScore: 50,
      contentTypeScore: 50,
      audienceScore: 50,
      personalizedTotal: Math.round(
        baseScore * 0.8 + catBonus * 0.1 + priceBonus * 0.1,
      ),
    };
  }

  // FULL tier (30+): existing comprehensive logic
  let historicalMatchScore = 50;
  if (cached.successFeedbacks.length > 0) {
    let matches = 0;
    let total = 0;
    for (const fb of cached.successFeedbacks) {
      const past = fb.product;
      total++;
      if (past.category === product.category) matches += 3;
      const priceDiff =
        Math.abs(past.price - product.price) /
        Math.max(past.price, product.price, 1);
      if (priceDiff < 0.3) matches += 2;
      if (Math.abs(past.commissionRate - product.commissionRate) < 3)
        matches += 2;
      if (past.platform === product.platform) matches += 1;
    }
    const maxPossible = total * 8;
    historicalMatchScore = Math.min(
      100,
      Math.round((matches / Math.max(maxPossible, 1)) * 100),
    );
  }

  let contentTypeScore = 50;
  if (cached.successByType.length > 0) {
    contentTypeScore = 65;
  }

  let audienceScore = 50;
  if (cached.platformPerf.length > 0) {
    const best = cached.platformPerf.reduce((a, b) =>
      (b._avg.adROAS ?? 0) > (a._avg.adROAS ?? 0) ? b : a,
    );
    if (
      best.adPlatform &&
      product.platform.toLowerCase().includes(best.adPlatform.toLowerCase())
    ) {
      audienceScore = 80;
    }
  }

  const personalizedTotal = Math.round(
    baseScore * 0.5 +
      historicalMatchScore * 0.3 +
      contentTypeScore * 0.1 +
      audienceScore * 0.1,
  );

  return {
    historicalMatchScore,
    contentTypeScore,
    audienceScore,
    personalizedTotal: Math.min(100, personalizedTotal),
  };
}
