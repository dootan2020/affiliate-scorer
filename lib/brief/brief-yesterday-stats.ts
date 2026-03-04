// Yesterday performance stats for Morning Brief
import { prisma } from "@/lib/db";

export async function getYesterdayStats(): Promise<{
  published: number;
  totalViews: number;
  avgReward: number;
}> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const published = await prisma.contentAsset.count({
    where: { publishedAt: { gte: yesterday, lt: today } },
  });
  const metrics = await prisma.assetMetric.findMany({
    where: { capturedAt: { gte: yesterday, lt: today } },
    select: { views: true, rewardScore: true },
  });
  const totalViews = metrics.reduce((s, m) => s + (m.views || 0), 0);
  const avgReward = metrics.length > 0
    ? metrics.reduce((s, m) => s + Number(m.rewardScore), 0) / metrics.length
    : 0;
  return { published, totalViews, avgReward };
}
