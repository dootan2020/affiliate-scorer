import { prisma } from "@/lib/db";
import type { ChannelPerformanceData } from "./tactical-refresh-types";

/**
 * Query ContentAsset + VideoTracking by channelId,
 * aggregate by hookType, format, publish hour.
 */
export async function gatherChannelPerformance(
  channelId: string,
): Promise<ChannelPerformanceData> {
  const assets = await prisma.contentAsset.findMany({
    where: {
      channelId,
      tracking: { isNot: null },
    },
    select: {
      id: true,
      hookType: true,
      format: true,
      contentType: true,
      tracking: {
        select: {
          views24h: true,
          views7d: true,
          likes: true,
          publishedAt: true,
        },
      },
    },
  });

  const trackingData = assets.map((a) => ({
    assetId: a.id,
    hookType: a.hookType,
    format: a.format,
    contentType: a.contentType,
    views24h: a.tracking?.views24h ?? null,
    views7d: a.tracking?.views7d ?? null,
    likes: a.tracking?.likes ?? null,
    publishedAt: a.tracking?.publishedAt ?? null,
  }));

  // Group by hookType
  const hookMap = new Map<string, { totalViews: number; count: number }>();
  for (const t of trackingData) {
    if (!t.hookType || t.views24h == null) continue;
    const entry = hookMap.get(t.hookType) ?? { totalViews: 0, count: 0 };
    entry.totalViews += t.views24h;
    entry.count += 1;
    hookMap.set(t.hookType, entry);
  }
  const topHookTypes = [...hookMap.entries()]
    .map(([hookType, { totalViews, count }]) => ({
      hookType,
      avgViews: Math.round(totalViews / count),
      count,
    }))
    .sort((a, b) => b.avgViews - a.avgViews);

  // Group by format
  const formatMap = new Map<string, { totalViews: number; count: number }>();
  for (const t of trackingData) {
    if (!t.format || t.views24h == null) continue;
    const entry = formatMap.get(t.format) ?? { totalViews: 0, count: 0 };
    entry.totalViews += t.views24h;
    entry.count += 1;
    formatMap.set(t.format, entry);
  }
  const formatPerformance = [...formatMap.entries()]
    .map(([format, { totalViews, count }]) => ({
      format,
      avgViews: Math.round(totalViews / count),
      count,
    }))
    .sort((a, b) => b.avgViews - a.avgViews);

  // Group by publish hour
  const hourMap = new Map<number, { totalViews: number; count: number }>();
  for (const t of trackingData) {
    if (!t.publishedAt || t.views24h == null) continue;
    const hour = new Date(t.publishedAt).getHours();
    const entry = hourMap.get(hour) ?? { totalViews: 0, count: 0 };
    entry.totalViews += t.views24h;
    entry.count += 1;
    hourMap.set(hour, entry);
  }
  const bestPublishTimes = [...hourMap.entries()]
    .map(([hour, { totalViews, count }]) => ({
      hour,
      avgViews: Math.round(totalViews / count),
    }))
    .sort((a, b) => b.avgViews - a.avgViews);

  return {
    totalVideos: trackingData.length,
    trackingData,
    topHookTypes,
    formatPerformance,
    bestPublishTimes,
  };
}

/** Quick count of tracked videos for a channel */
export async function countTrackedVideos(channelId: string): Promise<number> {
  return prisma.contentAsset.count({
    where: {
      channelId,
      tracking: { isNot: null },
    },
  });
}
