import { prisma } from "@/lib/db";
import type { Product } from "@/lib/types/product";

export interface PersonalizationResult {
  historicalMatchScore: number;
  contentTypeScore: number;
  audienceScore: number;
  personalizedTotal: number;
}

export async function getFeedbackCount(): Promise<number> {
  return prisma.feedback.count();
}

export async function getPersonalizedScore(
  product: Product,
  baseScore: number
): Promise<PersonalizationResult | null> {
  const feedbackCount = await getFeedbackCount();

  if (feedbackCount < 30) return null;

  const successFeedbacks = await prisma.feedback.findMany({
    where: { overallSuccess: "success" },
    include: { product: true },
    take: 200,
  });

  // Historical Match: Compare with past successful products
  let historicalMatchScore = 50;
  if (successFeedbacks.length > 0) {
    let matches = 0;
    let total = 0;

    for (const fb of successFeedbacks) {
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
      Math.round((matches / Math.max(maxPossible, 1)) * 100)
    );
  }

  // Content Type Match: Bonus when we have known good patterns
  let contentTypeScore = 50;
  const successByType = await prisma.feedback.groupBy({
    by: ["videoType"],
    where: { overallSuccess: "success", videoType: { not: null } },
    _count: true,
  });
  if (successByType.length > 0) {
    contentTypeScore = 65;
  }

  // Audience Match: Check if product platform matches best-performing ad platform
  let audienceScore = 50;
  const platformPerf = await prisma.feedback.groupBy({
    by: ["adPlatform"],
    where: { adROAS: { not: null } },
    _avg: { adROAS: true },
  });

  if (platformPerf.length > 0) {
    const best = platformPerf.reduce((a, b) =>
      (b._avg.adROAS ?? 0) > (a._avg.adROAS ?? 0) ? b : a
    );
    if (
      best.adPlatform &&
      product.platform.toLowerCase().includes(best.adPlatform.toLowerCase())
    ) {
      audienceScore = 80;
    }
  }

  // PRD formula: 50% base + 30% historical + 10% content + 10% audience
  const personalizedTotal = Math.round(
    baseScore * 0.5 +
      historicalMatchScore * 0.3 +
      contentTypeScore * 0.1 +
      audienceScore * 0.1
  );

  return {
    historicalMatchScore,
    contentTypeScore,
    audienceScore,
    personalizedTotal: Math.min(100, personalizedTotal),
  };
}
