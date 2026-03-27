import type { CategoryStats } from "./types";

export interface OpportunityResult {
  demand: number; // 0-100
  supplyGap: number; // 0-100
  unitEcon: number; // 0-100
  total: number; // 0-100 weighted
}

/**
 * Z-score normalization mapped to 0-100 scale.
 * Better spread than percentile for small N (~27 categories).
 * Mean maps to 50, ±2σ maps to ~10-90.
 */
function zScoreNormalize(values: number[]): number[] {
  if (values.length <= 1) return values.map(() => 50);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance =
    values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);
  if (std === 0) return values.map(() => 50);

  // Map z-score to 0-100: z=0 → 50, z=±2 → 10/90
  return values.map((v) => {
    const z = (v - mean) / std;
    // Scale: 50 + z * 20 gives good spread, clamp to 0-100
    return Math.max(0, Math.min(100, Math.round(50 + z * 20)));
  });
}

/**
 * Compute opportunity scores for all categories at once (batch).
 * Z-score normalization for better spread across ~27 categories.
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

  // --- Raw values ---
  const marketVolumes = allStats.map((s) => s.totalKOL * s.avgSales28d);

  const supplyGapRaws = allStats.map((s) => {
    const videosPerKOL =
      s.totalKOL > 0 ? s.totalVideos / s.totalKOL : 0;
    return 1 / (videosPerKOL + 1); // higher = less saturated
  });

  const MAX_VIDEOS_MONTH = 450; // 15/day × 30
  const feasibilityRatios = allStats.map((s) => {
    if (s.revPerOrder <= 0 || conversionRate <= 0) return 0;
    const ordersNeeded = targetIncome / s.revPerOrder;
    const videosNeeded = ordersNeeded / conversionRate;
    return Math.min(1, MAX_VIDEOS_MONTH / videosNeeded);
  });

  // --- Z-score normalize each dimension ---
  const demandNorm = zScoreNormalize(marketVolumes);
  const supplyNorm = zScoreNormalize(supplyGapRaws);
  const econNorm = zScoreNormalize(feasibilityRatios);

  for (let i = 0; i < allStats.length; i++) {
    const s = allStats[i];

    const demand = demandNorm[i];

    // Bonus for growing markets
    let supplyGap = supplyNorm[i];
    if (s.newSurgeRatio > 0.3) {
      supplyGap = Math.min(100, supplyGap + 10);
    }

    const unitEcon = econNorm[i];

    const total = Math.round(
      demand * 0.35 + supplyGap * 0.3 + unitEcon * 0.35
    );

    results.set(s.categoryCode, {
      demand,
      supplyGap: Math.min(100, supplyGap),
      unitEcon,
      total,
    });
  }

  return results;
}
