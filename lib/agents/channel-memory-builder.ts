// Channel Memory Builder — computes per-channel learning state for ChannelMemory model
import { prisma } from "@/lib/db";
import { callAI } from "@/lib/ai/call-ai";

export interface ChannelMemoryData {
  totalVideos: number;
  totalOrders: number;
  avgReward: number;
  winningCombos: Array<{ hookType: string; format: string; category: string; winRate: number; sampleSize: number }>;
  losingCombos: Array<{ hookType: string; format: string; category: string; winRate: number; sampleSize: number }>;
  usedAngles: string[];
  usedHooks: Array<{ hookText: string; avgReward: number; count: number }>;
}

/**
 * Build channel memory from content assets + metrics.
 * Groups by hookType × format, computes win/loss combos, extracts used angles/hooks.
 */
export async function buildChannelMemory(channelId: string): Promise<ChannelMemoryData> {
  const assets = await prisma.contentAsset.findMany({
    where: { channelId, metrics: { some: {} } },
    include: {
      metrics: { orderBy: { capturedAt: "desc" }, take: 1 },
      productIdentity: { select: { category: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  if (assets.length === 0) {
    return { totalVideos: 0, totalOrders: 0, avgReward: 0, winningCombos: [], losingCombos: [], usedAngles: [], usedHooks: [] };
  }

  // Aggregate totals
  let totalOrders = 0;
  let totalReward = 0;
  for (const a of assets) {
    const m = a.metrics[0];
    if (m) {
      totalOrders += m.orders ?? 0;
      totalReward += Number(m.rewardScore ?? 0);
    }
  }
  const avgReward = totalReward / assets.length;

  // Group by hookType × format × category
  const groups = new Map<string, typeof assets>();
  for (const a of assets) {
    const hook = a.actualHookType || a.hookType || "unknown";
    const fmt = a.actualFormat || a.format || "unknown";
    const cat = a.productIdentity?.category || "unknown";
    const key = `${hook}::${fmt}::${cat}`;
    const arr = groups.get(key) || [];
    arr.push(a);
    groups.set(key, arr);
  }

  const winningCombos: ChannelMemoryData["winningCombos"] = [];
  const losingCombos: ChannelMemoryData["losingCombos"] = [];

  for (const [key, groupAssets] of groups) {
    if (groupAssets.length < 2) continue;
    const [hookType, format, category] = key.split("::");
    const rewards = groupAssets.map((a) => Number(a.metrics[0]?.rewardScore ?? 0));
    const wins = rewards.filter((r) => r > avgReward * 1.5).length;
    const winRate = Math.round((wins / rewards.length) * 100) / 100;

    const combo = { hookType, format, category, winRate, sampleSize: groupAssets.length };
    if (winRate >= 0.5) winningCombos.push(combo);
    else if (winRate < 0.3) losingCombos.push(combo);
  }

  // Sort and limit
  winningCombos.sort((a, b) => b.winRate - a.winRate);
  losingCombos.sort((a, b) => a.winRate - b.winRate);

  // Extract used angles (deduplicated)
  const angleSet = new Set<string>();
  for (const a of assets) {
    const angle = a.actualAngle || a.angle;
    if (angle) angleSet.add(angle);
  }

  // Extract hooks with avgReward
  const hookMap = new Map<string, { total: number; count: number }>();
  for (const a of assets) {
    const hook = a.hookText;
    if (!hook) continue;
    const existing = hookMap.get(hook) || { total: 0, count: 0 };
    existing.total += Number(a.metrics[0]?.rewardScore ?? 0);
    existing.count += 1;
    hookMap.set(hook, existing);
  }
  const usedHooks = Array.from(hookMap.entries())
    .map(([hookText, { total, count }]) => ({ hookText, avgReward: Math.round((total / count) * 100) / 100, count }))
    .sort((a, b) => b.avgReward - a.avgReward)
    .slice(0, 20);

  return {
    totalVideos: assets.length,
    totalOrders,
    avgReward: Math.round(avgReward * 100) / 100,
    winningCombos: winningCombos.slice(0, 5),
    losingCombos: losingCombos.slice(0, 5),
    usedAngles: Array.from(angleSet).slice(0, 20),
    usedHooks,
  };
}

/**
 * Generate AI insight summary for a channel's performance.
 * Returns 1-2 Vietnamese sentences summarizing learning state.
 */
export async function generateInsightSummary(
  channelName: string,
  memory: ChannelMemoryData
): Promise<string | null> {
  if (memory.totalVideos < 3) return null;

  const prompt = `Kênh "${channelName}": ${memory.totalVideos} video, ${memory.totalOrders} đơn, reward trung bình ${memory.avgReward}.
Combo thắng: ${memory.winningCombos.map((c) => `${c.hookType}+${c.format} (${Math.round(c.winRate * 100)}%)`).join(", ") || "chưa đủ data"}.
Combo thua: ${memory.losingCombos.map((c) => `${c.hookType}+${c.format}`).join(", ") || "không có"}.
Tóm tắt 1-2 câu bằng tiếng Việt: kênh này mạnh gì, nên tránh gì, cơ hội nào.`;

  try {
    const { text } = await callAI(
      "Bạn là AI phân tích hiệu suất content affiliate TikTok. Trả lời ngắn gọn 1-2 câu tiếng Việt.",
      prompt,
      200,
      "content_analysis"
    );
    return text.trim();
  } catch (err) {
    console.warn("[channel-memory-builder] AI insight failed:", err);
    return null;
  }
}
