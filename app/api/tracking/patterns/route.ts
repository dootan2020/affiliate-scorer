import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface PatternData {
  hasEnoughData: boolean;
  totalTracked: number;
  // Format performance
  formatStats: Array<{
    format: string;
    count: number;
    avgViews: number;
    avgOrders: number;
    winRate: number;
  }>;
  // Content type performance
  contentTypeStats: Array<{
    type: string;
    count: number;
    avgViews: number;
    avgEngagement: number;
  }>;
  // Top products
  topProducts: Array<{
    title: string;
    totalOrders: number;
    totalRevenue: number;
    totalCommission: number;
  }>;
  // Best posting time
  bestHook: { text: string; views: number } | null;
  // Winners count
  winnersCount: number;
  totalRevenue: number;
  totalCommission: number;
}

/** GET — analyze tracking data for winning patterns */
export async function GET(): Promise<NextResponse> {
  try {
    const allTracking = await prisma.videoTracking.findMany({
      include: {
        contentAsset: {
          select: {
            format: true,
            contentType: true,
            videoFormat: true,
            hookText: true,
            productIdentity: {
              select: { title: true },
            },
          },
        },
      },
    });

    const totalTracked = allTracking.length;
    const hasEnoughData = totalTracked >= 10;

    // Format stats
    const formatMap = new Map<string, { views: number[]; orders: number[]; wins: number }>();
    for (const t of allTracking) {
      const fmt = t.contentAsset.videoFormat || t.contentAsset.format || "unknown";
      const entry = formatMap.get(fmt) || { views: [], orders: [], wins: 0 };
      entry.views.push(t.views24h ?? 0);
      entry.orders.push(t.orders ?? 0);
      if (t.isWinner) entry.wins++;
      formatMap.set(fmt, entry);
    }
    const formatStats = [...formatMap.entries()]
      .map(([format, data]) => ({
        format,
        count: data.views.length,
        avgViews: Math.round(data.views.reduce((a, b) => a + b, 0) / data.views.length),
        avgOrders: Math.round((data.orders.reduce((a, b) => a + b, 0) / data.orders.length) * 10) / 10,
        winRate: Math.round((data.wins / data.views.length) * 100),
      }))
      .sort((a, b) => b.avgViews - a.avgViews);

    // Content type stats
    const typeMap = new Map<string, { views: number[]; engagement: number[] }>();
    for (const t of allTracking) {
      const ct = t.contentAsset.contentType || "unknown";
      const entry = typeMap.get(ct) || { views: [], engagement: [] };
      entry.views.push(t.views24h ?? 0);
      entry.engagement.push((t.likes ?? 0) + (t.comments ?? 0) + (t.shares ?? 0));
      typeMap.set(ct, entry);
    }
    const contentTypeStats = [...typeMap.entries()]
      .map(([type, data]) => ({
        type,
        count: data.views.length,
        avgViews: Math.round(data.views.reduce((a, b) => a + b, 0) / data.views.length),
        avgEngagement: Math.round(data.engagement.reduce((a, b) => a + b, 0) / data.engagement.length),
      }))
      .sort((a, b) => b.avgViews - a.avgViews);

    // Top products by revenue
    const productMap = new Map<string, { orders: number; revenue: number; commission: number }>();
    for (const t of allTracking) {
      const title = t.contentAsset.productIdentity?.title || "Unknown";
      const entry = productMap.get(title) || { orders: 0, revenue: 0, commission: 0 };
      entry.orders += t.orders ?? 0;
      entry.revenue += t.revenue ?? 0;
      entry.commission += t.commission ?? 0;
      productMap.set(title, entry);
    }
    const topProducts = [...productMap.entries()]
      .map(([title, data]) => ({ title, totalOrders: data.orders, totalRevenue: data.revenue, totalCommission: data.commission }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 3);

    // Best hook
    const bestEntry = [...allTracking].sort((a, b) => (b.views24h ?? 0) - (a.views24h ?? 0))[0];
    const bestHook = bestEntry?.contentAsset.hookText
      ? { text: bestEntry.contentAsset.hookText, views: bestEntry.views24h ?? 0 }
      : null;

    const winnersCount = allTracking.filter((t) => t.isWinner).length;
    const totalRevenue = allTracking.reduce((s, t) => s + (t.revenue ?? 0), 0);
    const totalCommission = allTracking.reduce((s, t) => s + (t.commission ?? 0), 0);

    const data: PatternData = {
      hasEnoughData,
      totalTracked,
      formatStats,
      contentTypeStats,
      topProducts,
      bestHook,
      winnersCount,
      totalRevenue,
      totalCommission,
    };

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed to analyze patterns" }, { status: 500 });
  }
}
