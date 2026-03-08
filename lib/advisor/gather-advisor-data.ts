// ANALYST data gathering — queries DB for advisory context
import { prisma } from "@/lib/db";

export interface AdvisorData {
  topProducts: Array<{
    title: string;
    combinedScore: number | null;
    deltaType: string | null;
    category: string | null;
    commissionRate: number | null;
  }>;
  winningPatterns: Array<{
    label: string;
    winRate: number | null;
    avgViews: number | null;
    sampleSize: number;
  }>;
  losingPatterns: Array<{
    label: string;
    winRate: number | null;
    sampleSize: number;
  }>;
  channelMemories: Array<{
    channelName: string;
    totalVideos: number;
    totalOrders: number;
    avgReward: number;
    insightSummary: string | null;
  }>;
  recentMetrics: {
    totalProducts: number;
    scoredProducts: number;
    briefedProducts: number;
    publishedVideos: number;
  };
}

export async function gatherAdvisorData(): Promise<AdvisorData> {
  const [
    topProducts,
    winningPatterns,
    losingPatterns,
    channelMemories,
    totalProducts,
    scoredProducts,
    briefedProducts,
    publishedVideos,
  ] = await Promise.all([
    prisma.productIdentity.findMany({
      where: { combinedScore: { not: null } },
      orderBy: { combinedScore: "desc" },
      take: 10,
      select: {
        title: true,
        combinedScore: true,
        deltaType: true,
        category: true,
        commissionRate: true,
      },
    }),
    prisma.userPattern.findMany({
      where: { patternType: "winning", sampleSize: { gte: 2 } },
      orderBy: { winRate: "desc" },
      take: 5,
      select: { label: true, winRate: true, avgViews: true, sampleSize: true },
    }),
    prisma.userPattern.findMany({
      where: { patternType: "losing", sampleSize: { gte: 2 } },
      orderBy: { winRate: "asc" },
      take: 3,
      select: { label: true, winRate: true, sampleSize: true },
    }),
    prisma.channelMemory.findMany({
      take: 5,
      select: {
        totalVideos: true,
        totalOrders: true,
        avgReward: true,
        insightSummary: true,
        channel: { select: { name: true } },
      },
    }),
    prisma.productIdentity.count(),
    prisma.productIdentity.count({ where: { inboxState: "scored" } }),
    prisma.productIdentity.count({ where: { inboxState: "briefed" } }),
    prisma.contentAsset.count({ where: { status: "published" } }),
  ]);

  return {
    topProducts: topProducts.map((p) => ({
      title: p.title || "Không tên",
      combinedScore: p.combinedScore ? Number(p.combinedScore) : null,
      deltaType: p.deltaType,
      category: p.category,
      commissionRate: p.commissionRate ? Number(p.commissionRate) : null,
    })),
    winningPatterns: winningPatterns.map((p) => ({
      label: p.label,
      winRate: p.winRate ? Number(p.winRate) : null,
      avgViews: p.avgViews ? Number(p.avgViews) : null,
      sampleSize: p.sampleSize,
    })),
    losingPatterns: losingPatterns.map((p) => ({
      label: p.label,
      winRate: p.winRate ? Number(p.winRate) : null,
      sampleSize: p.sampleSize,
    })),
    channelMemories: channelMemories.map((m) => ({
      channelName: m.channel?.name ?? "Kênh đã xoá",
      totalVideos: m.totalVideos,
      totalOrders: m.totalOrders,
      avgReward: Number(m.avgReward),
      insightSummary: m.insightSummary,
    })),
    recentMetrics: {
      totalProducts,
      scoredProducts,
      briefedProducts,
      publishedVideos,
    },
  };
}

export function formatDataBriefing(data: AdvisorData): string {
  const lines: string[] = [];

  lines.push("=== DỮ LIỆU HỆ THỐNG ===");
  lines.push("");

  // Metrics
  const m = data.recentMetrics;
  lines.push(`📊 Tổng quan: ${m.totalProducts} SP | ${m.scoredProducts} đã chấm | ${m.briefedProducts} đã brief | ${m.publishedVideos} đã xuất bản`);
  lines.push("");

  // Top products
  if (data.topProducts.length > 0) {
    lines.push("🏆 Top sản phẩm:");
    for (const p of data.topProducts.slice(0, 5)) {
      const score = p.combinedScore !== null ? `${p.combinedScore.toFixed(1)}đ` : "chưa chấm";
      const delta = p.deltaType ? ` [${p.deltaType}]` : "";
      const comm = p.commissionRate !== null ? ` | HH ${p.commissionRate}%` : "";
      lines.push(`  - ${p.title} (${score}${delta}${comm})`);
    }
    lines.push("");
  }

  // Winning patterns
  if (data.winningPatterns.length > 0) {
    lines.push("✅ Pattern thắng:");
    for (const p of data.winningPatterns) {
      const wr = p.winRate !== null ? `WR ${(p.winRate * 100).toFixed(0)}%` : "";
      const views = p.avgViews !== null ? ` | ~${p.avgViews.toLocaleString()} views` : "";
      lines.push(`  - ${p.label} (${wr}${views}, n=${p.sampleSize})`);
    }
    lines.push("");
  }

  // Losing patterns
  if (data.losingPatterns.length > 0) {
    lines.push("❌ Pattern thua:");
    for (const p of data.losingPatterns) {
      const wr = p.winRate !== null ? `WR ${(p.winRate * 100).toFixed(0)}%` : "";
      lines.push(`  - ${p.label} (${wr}, n=${p.sampleSize})`);
    }
    lines.push("");
  }

  // Channel memories
  if (data.channelMemories.length > 0) {
    lines.push("📺 Kênh:");
    for (const ch of data.channelMemories) {
      lines.push(`  - ${ch.channelName}: ${ch.totalVideos} video, ${ch.totalOrders} đơn, reward TB ${ch.avgReward.toFixed(0)}đ`);
      if (ch.insightSummary) {
        lines.push(`    Insight: ${ch.insightSummary.substring(0, 100)}`);
      }
    }
  }

  return lines.join("\n");
}
