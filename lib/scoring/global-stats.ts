// Phase 01: Global Running Statistics + Cross-batch Normalization
// Uses z-score + sigmoid for absolute score meaning:
//   Score 50 = average product, Score 80+ = top 10%, Score 30- = bottom 10%

import { prisma } from "@/lib/db";

export interface GlobalStats {
  count: number;
  mean: number;
  stddev: number;
  globalMin: number;
  globalMax: number;
}

/** Get or initialize global stats singleton */
export async function getGlobalStats(): Promise<GlobalStats> {
  const row = await prisma.scoringGlobalStats.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });

  const mean = row.count > 0 ? row.sumRaw / row.count : 50;
  const variance =
    row.count > 1
      ? (row.sumSqRaw - (row.sumRaw * row.sumRaw) / row.count) / (row.count - 1)
      : 100;
  const stddev = Math.sqrt(Math.max(0, variance));

  return {
    count: row.count,
    mean,
    stddev: stddev || 10, // fallback to avoid division by zero
    globalMin: row.globalMin,
    globalMax: row.globalMax,
  };
}

/** Update global stats incrementally with a new batch of raw scores (Welford's) */
export async function updateGlobalStats(rawScores: number[]): Promise<void> {
  if (rawScores.length === 0) return;

  const batchSum = rawScores.reduce((s, v) => s + v, 0);
  const batchSumSq = rawScores.reduce((s, v) => s + v * v, 0);
  const batchMin = Math.min(...rawScores);
  const batchMax = Math.max(...rawScores);

  // Ensure singleton exists before atomic update
  await prisma.scoringGlobalStats.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });

  await prisma.$executeRaw`
    UPDATE "ScoringGlobalStats"
    SET
      count = count + ${rawScores.length},
      "sumRaw" = "sumRaw" + ${batchSum},
      "sumSqRaw" = "sumSqRaw" + ${batchSumSq},
      "globalMin" = LEAST("globalMin", ${batchMin}),
      "globalMax" = GREATEST("globalMax", ${batchMax}),
      "updatedAt" = NOW()
    WHERE id = 'singleton'
  `;
}

/**
 * Normalize a raw score to 0-100 using global z-score + sigmoid.
 *
 * K=1.5 gives nice spread:
 *   z=-2 -> ~5, z=-1 -> ~18, z=0 -> 50, z=1 -> ~82, z=2 -> ~95
 *
 * Properties:
 * - Score 50 ALWAYS = average product (at global mean)
 * - Score 80+ ALWAYS = top ~10% (>1 stddev above mean)
 * - Score 30- ALWAYS = bottom ~10% (<1 stddev below mean)
 */
export function normalizeWithGlobalStats(
  rawScore: number,
  stats: GlobalStats,
): number {
  if (stats.count < 10 || stats.stddev < 1) {
    // Cold start: not enough data, use raw score clamped
    return Math.max(0, Math.min(100, Math.round(rawScore)));
  }

  const z = (rawScore - stats.mean) / stats.stddev;
  const K = 1.5;
  const sigmoid = 1 / (1 + Math.exp(-K * z));
  return Math.max(0, Math.min(100, Math.round(sigmoid * 100)));
}

/** Reset global stats (for migration or testing) */
export async function resetGlobalStats(): Promise<void> {
  await prisma.scoringGlobalStats.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: { count: 0, sumRaw: 0, sumSqRaw: 0, globalMin: 100, globalMax: 0 },
  });
}
