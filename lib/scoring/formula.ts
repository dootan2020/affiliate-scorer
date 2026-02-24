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

/** PRD 4.1 - Commission Score (20%) */
function scoreCommission(rate: number, commissionVND: number): number {
  let base = 0;
  if (rate >= 15) base = 100;
  else if (rate >= 10) base = 80;
  else if (rate >= 7) base = 60;
  else if (rate >= 4) base = 40;
  else if (rate >= 1) base = 20;

  // Bonus: commission VND in 30K-80K sweet spot
  const bonus = commissionVND >= 30000 && commissionVND <= 80000 ? 10 : 0;
  return Math.min(100, base + bonus);
}

/**
 * PRD 4.1 - Trending Score (20%)
 *
 * FastMoss has NO growth rate column. Estimation strategy:
 *
 * First upload (no history): estimate trending_ratio = sales7d / salesTotal
 *   High ratio (e.g. 8351/61766 = 13.5%) → product is hot
 *   Low ratio  (e.g. 100/500000 = 0.02%) → product is cooling
 *
 * From 2nd upload: use real growth from historical snapshots
 *   trending = (sales7d_now - sales7d_prev) / sales7d_prev * 100
 */
function scoreTrending(product: ProductModel): number {
  // If we have actual growth data (from history or KaloData), use PRD thresholds
  if (product.salesGrowth7d !== null) {
    const g = product.salesGrowth7d;
    if (g < 0) return 0;
    if (g <= 9) return 20;
    if (g <= 49) return 40;
    if (g <= 99) return 60;
    if (g <= 199) return 80;
    if (g <= 500) return 100;
    return 80; // > 500% = spike risk
  }

  // Estimate from sales7d / salesTotal ratio
  const sales7d = product.sales7d ?? 0;
  const salesTotal = product.salesTotal ?? 0;
  if (salesTotal <= 0 || sales7d <= 0) return 20;

  const ratio = sales7d / salesTotal;
  // ratio interpretation:
  // > 0.5  → almost all sales in last 7d = brand new & hot
  // > 0.2  → very high recent momentum
  // > 0.1  → strong recent sales
  // > 0.05 → moderate
  // > 0.02 → average
  // < 0.02 → cooling down
  if (ratio > 0.5) return 80; // too new, spike risk
  if (ratio > 0.2) return 100; // sweet spot — bùng
  if (ratio > 0.1) return 80;
  if (ratio > 0.05) return 60;
  if (ratio > 0.02) return 40;
  return 20;
}

/**
 * PRD 4.1 - Competition Score (20%)
 *
 * Updated: uses 3 inputs from FastMoss:
 *   - totalKOL: number of KOLs selling this product
 *   - totalVideos: total selling videos
 *   - kolOrderRate: KOL order conversion rate (%)
 *
 * High KOL count + high videos = saturated market
 * Low KOL + high order rate = opportunity
 */
function scoreCompetition(product: ProductModel): number {
  const kol = product.totalKOL ?? product.affiliateCount ?? 0;
  const videos = product.totalVideos ?? 0;
  const kolRate = product.kolOrderRate ?? 0;

  // Base score from KOL count (primary metric)
  let kolScore: number;
  if (kol <= 5) kolScore = 100;
  else if (kol <= 15) kolScore = 80;
  else if (kol <= 30) kolScore = 60;
  else if (kol <= 60) kolScore = 40;
  else if (kol <= 100) kolScore = 20;
  else kolScore = 0;

  // Video competition penalty
  let videoPenalty = 0;
  if (videos > 500) videoPenalty = -15;
  else if (videos > 200) videoPenalty = -10;
  else if (videos > 50) videoPenalty = -5;

  // KOL order rate bonus (high conversion = proven product, less risk)
  let rateBonus = 0;
  if (kolRate > 60) rateBonus = 10;
  else if (kolRate > 40) rateBonus = 5;

  return Math.max(0, Math.min(100, kolScore + videoPenalty + rateBonus));
}

/** PRD 4.1 - Price Score (15%) */
function scorePrice(priceVND: number): number {
  if (priceVND >= 150000 && priceVND <= 500000) return 100;
  if (priceVND > 500000 && priceVND <= 1000000) return 70;
  if (priceVND >= 50000 && priceVND < 150000) return 60;
  if (priceVND > 1000000 && priceVND <= 2000000) return 40;
  return 20;
}

/** Vietnamese category matching for Content Fit */
const HOT_CATEGORIES = new Set([
  "chăm sóc sắc đẹp & chăm sóc cá nhân",
  "chăm sóc sắc đẹp",
  "beauty",
  "health",
  "sức khỏe",
  "làm đẹp",
  "mỹ phẩm",
  "thời trang",
  "fashion",
  "thời trang nữ",
  "thời trang nam",
  "công nghệ",
  "điện tử",
  "thiết bị gia dụng",
  "gia dụng",
  "đồ gia dụng",
  "nhà cửa & đời sống",
  "phụ kiện",
  "đồ ăn & đồ uống",
]);

/** PRD 4.1 - Content Fit Score (15%) - AI đánh giá dựa trên product attributes */
function scoreContentFit(product: ProductModel): number {
  let score = 50;

  // Category hotness
  const lowerCat = product.category.toLowerCase();
  if (HOT_CATEGORIES.has(lowerCat)) score += 20;
  else {
    // Partial match
    for (const hot of HOT_CATEGORIES) {
      if (lowerCat.includes(hot) || hot.includes(lowerCat)) {
        score += 15;
        break;
      }
    }
  }

  // Price range appeal (impulse buy range)
  if (product.price >= 150000 && product.price <= 500000) score += 15;
  else if (product.price >= 50000 && product.price < 150000) score += 5;

  // Sales volume indicates market validation
  const sales7d = product.sales7d ?? 0;
  if (sales7d > 5000) score += 15;
  else if (sales7d > 1000) score += 10;
  else if (sales7d > 100) score += 5;

  return Math.min(100, score);
}

/** PRD 4.1 - Platform Advantage Score (10%) */
function scorePlatform(
  platform: string,
  commissionRate: number
): number {
  const lower = platform.toLowerCase();
  if (
    lower === "both" ||
    (lower.includes("shopee") && lower.includes("tiktok"))
  ) {
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
  const trendingScore = scoreTrending(product);
  const competitionScore = scoreCompetition(product);
  const contentFitScore = scoreContentFit(product);
  const priceScore = scorePrice(product.price);
  const platformScore = scorePlatform(
    product.platform,
    product.commissionRate
  );

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
