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

function generateHighlights(
  breakdown: ScoreBreakdown,
  newSurgeRatio: number,
  hasProfile: boolean
): string[] {
  const h: string[] = [];
  if (breakdown.demandSignal > 70) h.push("Nhu cầu thị trường cao");
  if (breakdown.supplyGap > 70)
    h.push("Ít cạnh tranh, nhiều cơ hội");
  if (breakdown.unitEconomics > 70)
    h.push("Hoa hồng cao, ít video cần thiết");
  if (newSurgeRatio > 0.3) h.push("Thị trường đang tăng trưởng");
  if (hasProfile && breakdown.fitScore > 70)
    h.push("Phù hợp với phong cách nội dung của bạn");
  return h.slice(0, 3);
}

function generateRisks(
  breakdown: ScoreBreakdown,
  avgCommission: number,
  newSurgeRatio: number,
  feasibilityRatio: number
): string[] {
  const r: string[] = [];
  if (breakdown.supplyGap < 30) r.push("Cạnh tranh cao");
  if (avgCommission < 8) r.push("Hoa hồng thấp");
  if (newSurgeRatio < 0.1) r.push("Thị trường bão hòa");
  if (feasibilityRatio < 0.5) r.push("Cần nhiều video/ngày");
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
        : generateHighlights(
            breakdown,
            stats.newSurgeRatio,
            profile !== null
          ),
      risks: kill.killed
        ? kill.reasons
        : generateRisks(
            breakdown,
            stats.avgCommission,
            stats.newSurgeRatio,
            feasibility
          ),
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
