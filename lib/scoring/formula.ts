import type { Product as ProductModel } from "@/lib/types/product";

export interface CriterionScore {
  score: number;
  weight: number;
  weighted: number;
}

export interface ScoreBreakdown {
  commission: CriterionScore;
  trending: CriterionScore;
  competition: CriterionScore;
  contentFit: CriterionScore;
  price: CriterionScore;
  platform: CriterionScore;
}

export interface BaseScoreResult {
  total: number;
  breakdown: ScoreBreakdown;
}

const DEFAULT_WEIGHTS: Record<keyof ScoreBreakdown, number> = {
  commission: 0.2,
  trending: 0.2,
  competition: 0.2,
  contentFit: 0.15,
  price: 0.15,
  platform: 0.1,
};

function scoreCommission(rate: number, commissionVND: number): number {
  let base = 0;
  if (rate >= 15) base = 100;
  else if (rate >= 10) base = 80;
  else if (rate >= 7) base = 60;
  else if (rate >= 4) base = 40;
  else if (rate >= 1) base = 20;
  else base = 0;

  const bonus = commissionVND >= 30000 && commissionVND <= 80000 ? 10 : 0;
  return Math.min(100, base + bonus);
}

function scoreTrending(growth7d: number | null): number {
  if (growth7d === null) return 30;
  if (growth7d < 0) return 0;
  if (growth7d <= 9) return 20;
  if (growth7d <= 49) return 40;
  if (growth7d <= 99) return 60;
  if (growth7d <= 199) return 80;
  if (growth7d <= 500) return 100;
  return 80;
}

function scoreCompetition(affiliateCount: number | null): number {
  if (affiliateCount === null) return 50;
  if (affiliateCount <= 5) return 100;
  if (affiliateCount <= 15) return 80;
  if (affiliateCount <= 30) return 60;
  if (affiliateCount <= 60) return 40;
  if (affiliateCount <= 100) return 20;
  return 0;
}

function scorePrice(priceVND: number): number {
  if (priceVND >= 150000 && priceVND <= 500000) return 100;
  if (priceVND > 500000 && priceVND <= 1000000) return 70;
  if (priceVND >= 50000 && priceVND < 150000) return 60;
  if (priceVND > 1000000 && priceVND <= 2000000) return 40;
  return 20;
}

const HOT_CATEGORIES = new Set([
  "beauty", "health", "sức khỏe", "làm đẹp", "mỹ phẩm",
  "thời trang", "fashion", "tech", "công nghệ", "điện tử",
  "gia dụng", "home", "đồ gia dụng", "phụ kiện",
]);

function scoreContentFit(
  category: string,
  price: number,
  growth7d: number | null
): number {
  let score = 50;

  const lowerCat = category.toLowerCase();
  if (HOT_CATEGORIES.has(lowerCat)) score += 20;

  if (price >= 150000 && price <= 500000) score += 15;
  else if (price >= 50000 && price < 150000) score += 5;

  if (growth7d != null && growth7d >= 100) score += 15;
  else if (growth7d != null && growth7d >= 50) score += 10;

  return Math.min(100, score);
}

function scorePlatform(platform: string, commissionRate: number): number {
  const lower = platform.toLowerCase();
  if (lower === "both" || (lower.includes("shopee") && lower.includes("tiktok"))) {
    return 100;
  }
  if (lower.includes("tiktok")) {
    return commissionRate >= 7 ? 80 : 60;
  }
  if (lower.includes("shopee")) {
    return commissionRate >= 7 ? 75 : 55;
  }
  return 50;
}

export function calculateBaseScore(
  product: ProductModel,
  weights: Partial<Record<keyof ScoreBreakdown, number>> = {}
): BaseScoreResult {
  const w = { ...DEFAULT_WEIGHTS, ...weights };

  const commissionScore = scoreCommission(
    product.commissionRate,
    product.commissionVND
  );
  const trendingScore = scoreTrending(product.salesGrowth7d);
  const competitionScore = scoreCompetition(product.affiliateCount);
  const contentFitScore = scoreContentFit(
    product.category,
    product.price,
    product.salesGrowth7d
  );
  const priceScore = scorePrice(product.price);
  const platformScore = scorePlatform(product.platform, product.commissionRate);

  const breakdown: ScoreBreakdown = {
    commission: {
      score: commissionScore,
      weight: w.commission,
      weighted: commissionScore * w.commission,
    },
    trending: {
      score: trendingScore,
      weight: w.trending,
      weighted: trendingScore * w.trending,
    },
    competition: {
      score: competitionScore,
      weight: w.competition,
      weighted: competitionScore * w.competition,
    },
    contentFit: {
      score: contentFitScore,
      weight: w.contentFit,
      weighted: contentFitScore * w.contentFit,
    },
    price: {
      score: priceScore,
      weight: w.price,
      weighted: priceScore * w.price,
    },
    platform: {
      score: platformScore,
      weight: w.platform,
      weighted: platformScore * w.platform,
    },
  };

  const total = Object.values(breakdown).reduce(
    (sum, c) => sum + c.weighted,
    0
  );

  return { total: Math.min(100, Math.round(total)), breakdown };
}
