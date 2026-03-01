// Phase 4: Learning weights update — running average + log-quantity bonus
// Supports per-channel AND global weights. Each metric update writes to both.
import { prisma } from "@/lib/db";

interface AssetContext {
  hookType: string | null;
  format: string | null;
  angle: string | null;
  category: string | null;
  channelId?: string | null;
}

/** Update learning weights khi có reward mới.
 *  Writes both channel-specific AND global weights. */
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
    // Channel-specific weight
    if (asset.channelId) {
      await upsertWeight(scope, key, reward, asset.channelId);
    }
    // "" = global weight (all channels), "clxxxx" = channel-specific
    await upsertWeight(scope, key, reward, "");
  }
}

async function upsertWeight(
  scope: string,
  key: string,
  reward: number,
  channelId: string, // "" = global weight (all channels), "clxxxx" = channel-specific
): Promise<void> {
  const existing = await prisma.learningWeightP4.findUnique({
    where: { scope_key_channelId: { scope, key, channelId } },
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
        channelId, // "" = global weight (all channels), "clxxxx" = channel-specific
        weight: reward,
        sampleCount: 1,
        avgReward: reward,
        lastRewardAt: new Date(),
      },
    });
  }
}

/** Get weights, optionally filtered by channelId.
 *  If channelId provided: returns channel + global weights (channel takes priority).
 *  If not: returns global weights only. */
export async function getWeights(channelId?: string): Promise<
  Array<{ scope: string; key: string; weight: number; sampleCount: number; avgReward: number; channelId: string }>
> {
  const where = channelId
    ? { channelId: { in: [channelId, ""] } }
    : { channelId: "" };

  const weights = await prisma.learningWeightP4.findMany({
    where,
    orderBy: { weight: "desc" },
  });

  // If channelId provided, deduplicate: prefer channel-specific over global
  if (channelId) {
    const seen = new Map<string, typeof weights[0]>();
    for (const w of weights) {
      const mapKey = `${w.scope}:${w.key}`;
      const existing = seen.get(mapKey);
      // Channel-specific wins over global ("")
      if (!existing || (w.channelId !== "" && existing.channelId === "")) {
        seen.set(mapKey, w);
      }
    }
    return Array.from(seen.values()).map((w) => ({
      scope: w.scope,
      key: w.key,
      weight: Number(w.weight),
      sampleCount: w.sampleCount,
      avgReward: Number(w.avgReward),
      channelId: w.channelId,
    }));
  }

  return weights.map((w) => ({
    scope: w.scope,
    key: w.key,
    weight: Number(w.weight),
    sampleCount: w.sampleCount,
    avgReward: Number(w.avgReward),
    channelId: w.channelId,
  }));
}
