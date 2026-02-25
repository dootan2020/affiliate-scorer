// Phase 4: Learning weights update — running average + log-quantity bonus
import { prisma } from "@/lib/db";

interface AssetContext {
  hookType: string | null;
  format: string | null;
  angle: string | null;
  category: string | null;
}

/** Update learning weights khi có reward mới */
export async function updateLearningWeights(
  asset: AssetContext,
  reward: number,
): Promise<void> {
  const updates = [
    { scope: "hook_type", key: asset.hookType },
    { scope: "format", key: asset.format },
    { scope: "angle", key: asset.angle },
    { scope: "category", key: asset.category },
  ].filter((u): u is { scope: string; key: string } => Boolean(u.key));

  for (const { scope, key } of updates) {
    await upsertWeight(scope, key, reward);
  }
}

async function upsertWeight(scope: string, key: string, reward: number): Promise<void> {
  const existing = await prisma.learningWeightP4.findUnique({
    where: { scope_key: { scope, key } },
  });

  if (existing) {
    const newCount = existing.sampleCount + 1;
    const oldAvg = Number(existing.avgReward);
    const newAvg = (oldAvg * existing.sampleCount + reward) / newCount;
    // Weight = quality × log(quantity) — cả chất lượng lẫn số lượng
    const newWeight = newAvg * Math.log(1 + newCount);

    await prisma.learningWeightP4.update({
      where: { id: existing.id },
      data: {
        weight: newWeight,
        sampleCount: newCount,
        avgReward: newAvg,
        lastRewardAt: new Date(),
      },
    });
  } else {
    await prisma.learningWeightP4.create({
      data: {
        scope,
        key,
        weight: reward,
        sampleCount: 1,
        avgReward: reward,
        lastRewardAt: new Date(),
      },
    });
  }
}

/** Get all weights cho playbook/brief generation */
export async function getWeights(): Promise<
  Array<{ scope: string; key: string; weight: number; sampleCount: number; avgReward: number }>
> {
  const weights = await prisma.learningWeightP4.findMany({
    orderBy: { weight: "desc" },
  });
  return weights.map((w) => ({
    scope: w.scope,
    key: w.key,
    weight: Number(w.weight),
    sampleCount: w.sampleCount,
    avgReward: Number(w.avgReward),
  }));
}
