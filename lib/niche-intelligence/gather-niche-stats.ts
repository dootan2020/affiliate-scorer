import { prisma } from "@/lib/db";
import type { NicheStats } from "./types";

/**
 * Aggregate product and channel stats per niche from DB.
 * Returns stats for all niches that have data.
 */
export async function gatherNicheStats(): Promise<NicheStats[]> {
  // Get all channels grouped by niche
  const channels = await prisma.tikTokChannel.groupBy({
    by: ["niche"],
    _count: { id: true },
    where: { isActive: true },
  });

  const nicheChannelMap = new Map<string, number>();
  for (const ch of channels) {
    nicheChannelMap.set(ch.niche, ch._count.id);
  }

  // Get product stats per category (maps loosely to niches)
  const categories = await prisma.productIdentity.groupBy({
    by: ["category"],
    _count: { id: true },
    _avg: { combinedScore: true },
    where: {
      category: { not: null },
      inboxState: { not: "archived" },
    },
  });

  const stats: NicheStats[] = [];

  for (const cat of categories) {
    if (!cat.category) continue;

    // Get top 3 products in this category
    const topProducts = await prisma.productIdentity.findMany({
      where: {
        category: cat.category,
        combinedScore: { not: null },
      },
      select: { title: true, combinedScore: true },
      orderBy: { combinedScore: "desc" },
      take: 3,
    });

    const nicheKey = categoryToNicheKey(cat.category);

    stats.push({
      nicheKey,
      productCount: cat._count.id,
      avgScore: cat._avg.combinedScore
        ? Number(cat._avg.combinedScore)
        : null,
      topProducts: topProducts.map((p) => ({
        title: p.title ?? "Unknown",
        score: p.combinedScore ? Number(p.combinedScore) : 0,
      })),
      channelCount: nicheChannelMap.get(nicheKey) ?? 0,
    });
  }

  return stats;
}

/**
 * Map product category strings to niche keys.
 * Falls back to the category itself if no mapping found.
 */
function categoryToNicheKey(category: string): string {
  const lower = category.toLowerCase();
  const mapping: Record<string, string> = {
    "beauty": "beauty_skincare",
    "skincare": "beauty_skincare",
    "cosmetics": "beauty_skincare",
    "fashion": "fashion",
    "clothing": "fashion",
    "apparel": "fashion",
    "food": "food",
    "snack": "food",
    "beverage": "food",
    "home": "home_living",
    "household": "home_living",
    "kitchen": "home_living",
    "health": "health",
    "supplement": "health",
    "fitness": "health",
    "tech": "tech",
    "electronics": "tech",
    "gadget": "tech",
    "phone": "tech",
  };

  for (const [key, value] of Object.entries(mapping)) {
    if (lower.includes(key)) return value;
  }

  return lower.replace(/\s+/g, "_");
}
