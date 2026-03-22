// Nightly Learning Agent — regenerates per-channel patterns + updates ChannelMemory
import { prisma } from "@/lib/db";
import { regeneratePatterns } from "@/lib/learning/pattern-detection";
import { buildChannelMemory, generateInsightSummary } from "@/lib/agents/channel-memory-builder";

interface NightlyLearningResult {
  channelsProcessed: number;
  patternsGenerated: number;
  memoriesUpdated: number;
  skipped: number;
}

/**
 * Run nightly learning cycle:
 * 1. For each active channel with recent data: regenerate per-channel patterns + update ChannelMemory
 * 2. Regenerate global patterns
 */
export async function runNightlyLearning(): Promise<NightlyLearningResult> {
  const result: NightlyLearningResult = { channelsProcessed: 0, patternsGenerated: 0, memoriesUpdated: 0, skipped: 0 };

  // Get all active channels
  const channels = await prisma.tikTokChannel.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    // Fix F10: Process all active channels, not just first 10
    take: 50,
  });

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  for (const channel of channels) {
    try {
      // Check if channel has recent metrics (last 24h)
      const recentMetrics = await prisma.assetMetric.count({
        where: {
          contentAsset: { channelId: channel.id },
          capturedAt: { gte: oneDayAgo },
        },
      });

      // Check if ChannelMemory already up-to-date
      const existingMemory = await prisma.channelMemory.findUnique({
        where: { channelId: channel.id },
        select: { lastUpdated: true },
      });

      if (recentMetrics === 0 && existingMemory) {
        result.skipped++;
        continue;
      }

      // Regenerate per-channel patterns
      const patternResult = await regeneratePatterns(channel.id);
      result.patternsGenerated += patternResult.patterns;

      // Build channel memory data
      const memoryData = await buildChannelMemory(channel.id);

      // Generate AI insight (only if new data)
      let insightSummary: string | null | undefined = existingMemory ? undefined : null;
      if (recentMetrics > 0 && memoryData.totalVideos >= 3) {
        insightSummary = await generateInsightSummary(channel.name, memoryData);
      }

      // Upsert ChannelMemory
      await prisma.channelMemory.upsert({
        where: { channelId: channel.id },
        create: {
          channelId: channel.id,
          totalVideos: memoryData.totalVideos,
          totalOrders: memoryData.totalOrders,
          avgReward: memoryData.avgReward,
          winningCombos: memoryData.winningCombos,
          losingCombos: memoryData.losingCombos,
          usedAngles: memoryData.usedAngles,
          usedHooks: memoryData.usedHooks,
          ...(insightSummary !== undefined ? { insightSummary } : {}),
        },
        update: {
          totalVideos: memoryData.totalVideos,
          totalOrders: memoryData.totalOrders,
          avgReward: memoryData.avgReward,
          winningCombos: memoryData.winningCombos,
          losingCombos: memoryData.losingCombos,
          usedAngles: memoryData.usedAngles,
          usedHooks: memoryData.usedHooks,
          ...(insightSummary !== undefined ? { insightSummary } : {}),
        },
      });

      result.memoriesUpdated++;
      result.channelsProcessed++;
    } catch (err) {
      console.error(`[nightly-learning] Error for channel ${channel.name}:`, err);
      result.channelsProcessed++;
    }
  }

  // Regenerate global patterns
  try {
    const globalPatterns = await regeneratePatterns();
    result.patternsGenerated += globalPatterns.patterns;
  } catch (err) {
    console.error("[nightly-learning] Global patterns error:", err);
  }

  console.log("[nightly-learning] Result:", result);
  return result;
}
