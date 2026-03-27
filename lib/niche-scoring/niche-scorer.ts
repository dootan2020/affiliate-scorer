import type {
  CategoryStats,
  UserProfile,
  ScoredNiche,
  ScoreBreakdown,
} from "./types";
import { getCategoryTags } from "./category-tags";
import { evaluateKillCriteria } from "./kill-criteria";
import { computeOpportunityScores } from "./opportunity-score";
import { computeFitScore } from "./fit-score";

function fmtK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(Math.round(n));
}

/**
 * Generate data-specific highlights — each niche gets unique bullets with real numbers.
 */
function generateHighlights(
  stats: CategoryStats,
  breakdown: ScoreBreakdown,
  hasProfile: boolean
): string[] {
  const h: string[] = [];

  // Data-specific highlights with actual numbers
  if (breakdown.unitEconomics > 60 && stats.revPerOrder > 0) {
    h.push(`Rev/đơn ${fmtK(stats.revPerOrder)} — ít video cần thiết`);
  }
  if (stats.avgCommission >= 10) {
    h.push(`Commission TB ${stats.avgCommission.toFixed(1)}% — mức cao`);
  }
  if (breakdown.demandSignal > 60 && stats.totalKOL > 50) {
    h.push(`${stats.totalKOL.toLocaleString("vi-VN")} KOL đang bán — thị trường proven`);
  }
  if (breakdown.supplyGap > 60) {
    const vpk = stats.totalKOL > 0 ? stats.totalVideos / stats.totalKOL : 0;
    h.push(`${vpk.toFixed(1)} video/KOL — ít cạnh tranh`);
  }
  if (stats.newSurgeRatio > 0.3) {
    h.push(
      `${Math.round(stats.newSurgeRatio * 100)}% SP mới/tăng trưởng`
    );
  }
  if (stats.avgPrice > 0 && stats.avgPrice < 200_000) {
    h.push(`Giá TB ${fmtK(stats.avgPrice)} — dễ convert`);
  }
  if (hasProfile && breakdown.fitScore > 70) {
    h.push("Phù hợp phong cách nội dung của bạn");
  }

  return h.slice(0, 3);
}

/**
 * Generate data-specific risk bullets with numbers.
 */
function generateRisks(
  stats: CategoryStats,
  breakdown: ScoreBreakdown,
  feasibilityRatio: number
): string[] {
  const r: string[] = [];

  if (breakdown.supplyGap < 30) {
    const vpk = stats.totalKOL > 0 ? stats.totalVideos / stats.totalKOL : 0;
    r.push(`${vpk.toFixed(1)} video/KOL — cạnh tranh cao`);
  }
  if (stats.avgCommission < 8) {
    r.push(`Commission chỉ ${stats.avgCommission.toFixed(1)}%`);
  }
  if (stats.newSurgeRatio < 0.1) {
    r.push("Thị trường bão hòa, ít SP mới");
  }
  if (feasibilityRatio < 0.5 && feasibilityRatio > 0) {
    const videosDay = Math.round(1 / (feasibilityRatio * 30));
    r.push(`Cần ~${videosDay > 100 ? "100+" : videosDay} video/ngày`);
  }
  if (stats.withSales < 30) {
    r.push(`Chỉ ${stats.withSales} SP có doanh số`);
  }

  return r.slice(0, 2);
}

/**
 * Score all niches. Pure function, no DB calls.
 *
 * @param allStats - category-level aggregated stats
 * @param profile - user profile (null = opportunity-only scoring)
 */
export function scoreNiches(
  allStats: CategoryStats[],
  profile: UserProfile | null
): ScoredNiche[] {
  // Determine conversion rate from experience
  const conversionRate =
    profile?.experience === "experienced" ? 0.02 : 0.005;

  const targetIncome = profile?.targetIncome ?? 30_000_000;

  // Batch compute opportunity scores
  const opportunityMap = computeOpportunityScores(
    allStats,
    targetIncome,
    conversionRate
  );

  // Compute median videosPerKOL for fit score reference
  const videosPerKOLs = allStats
    .filter((s) => s.totalKOL > 0)
    .map((s) => s.totalVideos / s.totalKOL);
  const sortedVPK = [...videosPerKOLs].sort((a, b) => a - b);
  const medianVPK =
    sortedVPK.length > 0
      ? sortedVPK[Math.floor(sortedVPK.length / 2)]
      : 0;

  // Pre-compute feasibility ratios for risk generation
  const MAX_VIDEOS_MONTH = 450;
  const feasibilityMap = new Map<number, number>();
  for (const s of allStats) {
    if (s.revPerOrder <= 0) {
      feasibilityMap.set(s.categoryCode, 0);
      continue;
    }
    const ordersNeeded = targetIncome / s.revPerOrder;
    const videosNeeded = ordersNeeded / conversionRate;
    feasibilityMap.set(
      s.categoryCode,
      Math.min(1, MAX_VIDEOS_MONTH / videosNeeded)
    );
  }

  const scored: ScoredNiche[] = allStats.map((stats) => {
    const tags = getCategoryTags(stats.categoryCode, stats.categoryName);
    const tagNames = tags.map(String);

    // Kill criteria
    const kill = evaluateKillCriteria(stats, profile, tags);

    // Opportunity
    const opp = opportunityMap.get(stats.categoryCode) ?? {
      demand: 0,
      supplyGap: 0,
      unitEcon: 0,
      total: 0,
    };

    // Fit score
    const fitScore = profile
      ? computeFitScore(stats, tags, profile, medianVPK)
      : 50; // Neutral when no profile

    // Final score
    const nicheScore = kill.killed
      ? 0
      : Math.round(opp.total * 0.6 + fitScore * 0.4);

    const breakdown: ScoreBreakdown = {
      demandSignal: opp.demand,
      supplyGap: opp.supplyGap,
      unitEconomics: opp.unitEcon,
      opportunityScore: opp.total,
      fitScore,
      nicheScore,
    };

    const feasibility = feasibilityMap.get(stats.categoryCode) ?? 0;

    return {
      categoryCode: stats.categoryCode,
      categoryName: stats.categoryName,
      totalProducts: stats.totalProducts,
      withSales: stats.withSales,
      withKOL: stats.withKOL,
      avgCommission: stats.avgCommission,
      avgPrice: stats.avgPrice,
      revPerOrder: stats.revPerOrder,
      totalVideos: stats.totalVideos,
      avgRating: stats.avgRating,
      nicheScore,
      opportunityScore: opp.total,
      fitScore,
      breakdown,
      kill,
      highlights: kill.killed
        ? []
        : generateHighlights(stats, breakdown, profile !== null),
      risks: kill.killed
        ? kill.reasons
        : generateRisks(stats, breakdown, feasibility),
      tags: tagNames,
    };
  });

  // Sort: active niches by score desc, killed at bottom
  scored.sort((a, b) => {
    if (a.kill.killed !== b.kill.killed)
      return a.kill.killed ? 1 : -1;
    return b.nicheScore - a.nicheScore;
  });

  return scored;
}
