// Phase 4: Pattern detection — tìm winning/losing patterns từ data
import { prisma } from "@/lib/db";

interface PatternResult {
  patternType: "winning" | "losing";
  label: string;
  conditions: Record<string, string>;
  assetIds: string[];
  sampleSize: number;
  avgViews: number;
  avgReward: number;
  winRate: number;
}

/**
 * Regenerate patterns: group assets theo hook_type × format × category.
 * Pattern cần ≥ 2 assets. Win = reward > 1.5× avg, Loss = reward < 0.5× avg.
 * @param channelId — if provided, only process assets for this channel (per-channel patterns)
 */
export async function regeneratePatterns(channelId?: string): Promise<{ patterns: number }> {
  // Lấy assets có metrics, optionally filtered by channel
  const assets = await prisma.contentAsset.findMany({
    where: {
      metrics: { some: {} },
      ...(channelId ? { channelId } : {}),
    },
    include: {
      metrics: { orderBy: { capturedAt: "desc" }, take: 1 },
      productIdentity: { select: { category: true, price: true } },
    },
  });

  if (assets.length < 3) return { patterns: 0 };

  // Avg reward toàn hệ thống
  const allMetrics = await prisma.assetMetric.aggregate({
    _avg: { rewardScore: true },
  });
  const avgReward = Number(allMetrics._avg.rewardScore) || 1;

  // Group theo hook_type × format
  const groups = new Map<string, typeof assets>();
  for (const asset of assets) {
    const key = `${asset.hookType || "unknown"}::${asset.format || "unknown"}`;
    const arr = groups.get(key) || [];
    arr.push(asset);
    groups.set(key, arr);
  }

  // Detect patterns
  const results: PatternResult[] = [];

  for (const [key, groupAssets] of groups) {
    // Fix E3: Minimum 5 assets for statistically meaningful patterns (was 2)
    if (groupAssets.length < 5) continue;

    const [hookType, format] = key.split("::");
    const rewards = groupAssets.map((a) => Number(a.metrics[0]?.rewardScore || 0));
    const avgGroupReward = rewards.reduce((s, r) => s + r, 0) / rewards.length;
    const wins = rewards.filter((r) => r > avgReward * 1.5).length;
    const losses = rewards.filter((r) => r < avgReward * 0.5).length;
    const winRate = wins / rewards.length;
    const lossRate = losses / rewards.length;

    // Lấy category phổ biến nhất trong group
    const categories = groupAssets.map((a) => a.productIdentity?.category).filter(Boolean);
    const topCategory = categories.length > 0
      ? categories.sort((a, b) =>
          categories.filter((c) => c === b).length - categories.filter((c) => c === a).length
        )[0]
      : null;

    // Avg views
    const views = groupAssets
      .map((a) => a.metrics[0]?.views)
      .filter((v): v is number => v != null);
    const avgViews = views.length > 0 ? Math.round(views.reduce((s, v) => s + v, 0) / views.length) : 0;

    const conditions: Record<string, string> = {
      hook_type: hookType,
      format: format,
    };
    if (topCategory) conditions.category = topCategory;

    const label = [
      `Hook "${hookType}"`,
      format,
      topCategory || "",
    ].filter(Boolean).join(" + ");

    if (winRate >= 0.5 && groupAssets.length >= 5) {
      results.push({
        patternType: "winning",
        label,
        conditions,
        assetIds: groupAssets.map((a) => a.id),
        sampleSize: groupAssets.length,
        avgViews,
        avgReward: avgGroupReward,
        winRate,
      });
    } else if (lossRate >= 0.5 && groupAssets.length >= 5) {
      results.push({
        patternType: "losing",
        label,
        conditions,
        assetIds: groupAssets.map((a) => a.id),
        sampleSize: groupAssets.length,
        avgViews,
        avgReward: avgGroupReward,
        winRate,
      });
    }
  }

  // Clear old patterns (scoped to channel or global)
  await prisma.userPattern.deleteMany({
    where: { channelId: channelId ?? "" },
  });

  // Save new patterns
  for (const p of results) {
    await prisma.userPattern.create({
      data: {
        patternType: p.patternType,
        label: p.label,
        conditions: p.conditions,
        assetIds: p.assetIds,
        sampleSize: p.sampleSize,
        avgViews: p.avgViews,
        avgReward: p.avgReward,
        winRate: p.winRate,
        channelId: channelId ?? "",
      },
    });
  }

  return { patterns: results.length };
}
