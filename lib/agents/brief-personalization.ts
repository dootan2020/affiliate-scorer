// Brief Personalization Agent — builds channel performance context for brief prompt injection
// Cost: $0 — pure DB queries, no AI calls
import { prisma } from "@/lib/db";

export interface PersonalizationContext {
  promptBlock: string;
  channelName: string;
  totalBriefs: number;
  totalPublished: number;
  topHooks: Array<{ type: string; avgReward: number; sampleCount: number }>;
  avoidHooks: Array<{ type: string; avgReward: number }>;
  usedAngles: string[];
  winningCombos: Array<{ hook: string; format: string; category: string; winRate: number }>;
}

/**
 * Build personalization context from ChannelMemory + learning data.
 * Returns null if channel has no ChannelMemory (new channel, no data yet).
 */
export async function buildBriefPersonalization(channelId: string): Promise<PersonalizationContext | null> {
  // 1. Get ChannelMemory
  const memory = await prisma.channelMemory.findUnique({
    where: { channelId },
    include: { channel: { select: { name: true } } },
  });

  if (!memory) return null;

  // 2. Get top/bottom weights for hook_type
  const topWeights = await prisma.learningWeightP4.findMany({
    where: { channelId, scope: "hook_type" },
    orderBy: { weight: "desc" },
    take: 5,
  });

  const bottomWeights = await prisma.learningWeightP4.findMany({
    where: { channelId, scope: "hook_type" },
    orderBy: { weight: "asc" },
    take: 3,
  });

  // 3. Get last 10 briefs for angle dedup
  const recentBriefs = await prisma.contentBrief.findMany({
    where: { channelId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { angles: true },
  });

  const usedAngles = new Set<string>();
  for (const brief of recentBriefs) {
    const angles = brief.angles as string[];
    if (Array.isArray(angles)) {
      for (const a of angles) usedAngles.add(a);
    }
  }

  // 4. Get winning patterns for this channel
  const winPatterns = await prisma.userPattern.findMany({
    where: { channelId, patternType: "winning" },
    take: 5,
    orderBy: { updatedAt: "desc" },
  });

  // 5. Build results
  const topHooks = topWeights.map((w) => ({
    type: w.key,
    avgReward: Number(w.weight),
    sampleCount: w.sampleCount,
  }));

  const avoidHooks = bottomWeights
    .filter((w) => Number(w.weight) < 1)
    .map((w) => ({ type: w.key, avgReward: Number(w.weight) }));

  const winningCombos = (memory.winningCombos as Array<{ hookType: string; format: string; category: string; winRate: number }>)
    .slice(0, 5)
    .map((c) => ({ hook: c.hookType, format: c.format, category: c.category, winRate: c.winRate }));

  // Count totals
  const totalBriefs = await prisma.contentBrief.count({ where: { channelId } });
  const totalPublished = await prisma.contentAsset.count({
    where: { channelId, status: { in: ["published", "logged"] } },
  });

  // 6. Build prompt block
  const anglesArr = Array.from(usedAngles).slice(0, 20);
  const promptLines: string[] = [
    `LỊCH SỬ KÊNH: ${memory.channel.name}`,
    `- Đã tạo ${totalBriefs} briefs, ${totalPublished} videos published, ${memory.totalVideos} videos logged`,
  ];

  if (anglesArr.length > 0) {
    promptLines.push(`- Angles đã dùng (KHÔNG lặp lại): ${anglesArr.slice(0, 10).join("; ")}`);
  }

  if (topHooks.length > 0) {
    promptLines.push(`- Hooks đang thắng: ${topHooks.map((h) => `"${h.type}" (reward ${h.avgReward.toFixed(1)}, ${h.sampleCount} mẫu)`).join(", ")}`);
  }

  if (avoidHooks.length > 0) {
    promptLines.push(`- Hooks nên tránh: ${avoidHooks.map((h) => `"${h.type}" (reward ${h.avgReward.toFixed(1)})`).join(", ")}`);
  }

  if (winningCombos.length > 0) {
    promptLines.push(`- Combos thắng: ${winningCombos.map((c) => `${c.hook}+${c.format} (winRate ${Math.round(c.winRate * 100)}%)`).join(", ")}`);
  }

  // Trending insights from competitor analysis
  const trending = memory.trendingInsights as Array<{ hook?: string; format?: string; angle?: string }>;
  if (Array.isArray(trending) && trending.length > 0) {
    const trendParts = trending.slice(0, 3).map((t) => [t.hook, t.format, t.angle].filter(Boolean).join("+"));
    promptLines.push(`- Xu hướng đối thủ: ${trendParts.join(", ")}`);
  }

  if (memory.insightSummary) {
    promptLines.push(`- Ghi chú AI: "${memory.insightSummary}"`);
  }

  promptLines.push("→ Ưu tiên dùng hooks/formats đang thắng. Tránh lặp angles cũ. Thử hooks mới nếu phù hợp.");

  return {
    promptBlock: promptLines.join("\n"),
    channelName: memory.channel.name,
    totalBriefs,
    totalPublished,
    topHooks,
    avoidHooks,
    usedAngles: anglesArr,
    winningCombos,
  };
}
