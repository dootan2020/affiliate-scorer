// Phase 03+07: Learning weights with new 5-component formula

import { prisma } from "@/lib/db";
import type { WeightMap } from "@/lib/ai/prompts";

export const DEFAULT_WEIGHTS: WeightMap = {
  commission: 0.25,
  trending: 0.25,
  competition: 0.20,
  priceAppeal: 0.15,
  salesVelocity: 0.15,
};

export async function getWeights(): Promise<WeightMap> {
  try {
    const latest = await prisma.learningLog.findFirst({
      orderBy: { runDate: "desc" },
      select: { weightsAfter: true },
    });

    if (!latest) return DEFAULT_WEIGHTS;

    const parsed = JSON.parse(latest.weightsAfter) as Partial<WeightMap>;

    return {
      commission: parsed.commission ?? DEFAULT_WEIGHTS.commission,
      trending: parsed.trending ?? DEFAULT_WEIGHTS.trending,
      competition: parsed.competition ?? DEFAULT_WEIGHTS.competition,
      priceAppeal: parsed.priceAppeal ?? DEFAULT_WEIGHTS.priceAppeal,
      salesVelocity: parsed.salesVelocity ?? DEFAULT_WEIGHTS.salesVelocity,
    };
  } catch {
    return DEFAULT_WEIGHTS;
  }
}

export async function saveWeights(
  weights: WeightMap,
  context: {
    weekNumber: number;
    totalDataPoints: number;
    newDataPoints: number;
    accuracy: number;
    previousAccuracy: number;
    patterns: string[];
    insights: string;
    weightsBefore: WeightMap;
  },
): Promise<void> {
  await prisma.learningLog.create({
    data: {
      weekNumber: context.weekNumber,
      totalDataPoints: context.totalDataPoints,
      newDataPoints: context.newDataPoints,
      currentAccuracy: context.accuracy,
      previousAccuracy: context.previousAccuracy,
      weightsBefore: JSON.stringify(context.weightsBefore),
      weightsAfter: JSON.stringify(weights),
      patternsFound: JSON.stringify(context.patterns),
      insights: context.insights,
      scoringVersion: "v2-rubric",
    },
  });
}
