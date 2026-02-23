import { prisma } from "@/lib/db";
import type { WeightMap } from "@/lib/ai/prompts";

export const DEFAULT_WEIGHTS: WeightMap = {
  commission: 0.2,
  trending: 0.2,
  competition: 0.2,
  contentFit: 0.15,
  price: 0.15,
  platform: 0.1,
};

export async function getWeights(): Promise<WeightMap> {
  try {
    const latest = await prisma.learningLog.findFirst({
      orderBy: { runDate: "desc" },
      select: { weightsAfter: true },
    });

    if (!latest) return DEFAULT_WEIGHTS;

    const parsed = JSON.parse(latest.weightsAfter) as Partial<WeightMap>;

    const weights: WeightMap = {
      commission: parsed.commission ?? DEFAULT_WEIGHTS.commission,
      trending: parsed.trending ?? DEFAULT_WEIGHTS.trending,
      competition: parsed.competition ?? DEFAULT_WEIGHTS.competition,
      contentFit: parsed.contentFit ?? DEFAULT_WEIGHTS.contentFit,
      price: parsed.price ?? DEFAULT_WEIGHTS.price,
      platform: parsed.platform ?? DEFAULT_WEIGHTS.platform,
    };

    return weights;
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
  }
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
      scoringVersion: "v1",
    },
  });
}
