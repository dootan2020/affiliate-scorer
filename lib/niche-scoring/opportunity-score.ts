import type { CategoryStats } from "./types";

export interface OpportunityResult {
  demand: number; // 0-100
  supplyGap: number; // 0-100
  unitEcon: number; // 0-100
  total: number; // 0-100 weighted
}

/** Percentile rank using midpoint method — handles ties correctly */
function percentileRank(values: number[], value: number): number {
  if (values.length <= 1) return 50;
  const below = values.filter((v) => v < value).length;
  const equal = values.filter((v) => v === value).length;
  return ((below + equal * 0.5) / values.length) * 100;
}

/**
 * Compute opportunity scores for all categories at once (batch).
 * Percentile-based normalization across all categories.
 *
 * @param conversionRate - estimated conversion rate based on experience level
 *   new=0.005 (0.5%), experienced=0.02 (2%)
 */
export function computeOpportunityScores(
  allStats: CategoryStats[],
  targetIncome: number,
  conversionRate: number
): Map<number, OpportunityResult> {
  const results = new Map<number, OpportunityResult>();
  if (allStats.length === 0) return results;

  // --- Demand signal ---
  // marketVolume = totalKOL × avgSales28d
  const marketVolumes = allStats.map(
    (s) => s.totalKOL * s.avgSales28d
  );

  // --- Supply gap ---
  // videosPerKOL — lower = less saturated = better → invert
  const supplyGapRaws = allStats.map((s) => {
    const videosPerKOL =
      s.totalKOL > 0 ? s.totalVideos / s.totalKOL : 0;
    return 1 / (videosPerKOL + 1);
  });

  // --- Unit economics ---
  // feasibilityRatio = maxVideos / videosNeeded (capped at 1.0)
  const MAX_VIDEOS_MONTH = 450; // 15/day × 30
  const feasibilityRatios = allStats.map((s) => {
    if (s.revPerOrder <= 0 || conversionRate <= 0) return 0;
    const ordersNeeded = targetIncome / s.revPerOrder;
    const videosNeeded = ordersNeeded / conversionRate;
    return Math.min(1, MAX_VIDEOS_MONTH / videosNeeded);
  });

  // Compute percentile ranks
  for (let i = 0; i < allStats.length; i++) {
    const s = allStats[i];

    let demand = percentileRank(marketVolumes, marketVolumes[i]);

    let supplyGap = percentileRank(supplyGapRaws, supplyGapRaws[i]);
    // Bonus for growing markets
    if (s.newSurgeRatio > 0.3) {
      supplyGap = Math.min(100, supplyGap + 10);
    }

    const unitEcon = percentileRank(
      feasibilityRatios,
      feasibilityRatios[i]
    );

    const total = Math.round(
      demand * 0.35 + supplyGap * 0.3 + unitEcon * 0.35
    );

    results.set(s.categoryCode, {
      demand: Math.round(demand),
      supplyGap: Math.round(supplyGap),
      unitEcon: Math.round(unitEcon),
      total,
    });
  }

  return results;
}
