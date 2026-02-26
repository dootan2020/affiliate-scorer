import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateConfidence } from "@/lib/ai/confidence";
import {
  getAnomalyItems,
  getNewProductItems,
} from "./brief-intelligence-enricher";

interface BriefItem {
  priority: "urgent" | "opportunity" | "prepare" | "routine";
  icon: string;
  text: string;
  actionHref: string;
}

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  opportunity: 1,
  prepare: 2,
  routine: 3,
};

// In-memory cache: 5-minute TTL
const CACHE_TTL_MS = 5 * 60 * 1000;
let briefCache: { data: unknown; timestamp: number } | null = null;

export async function GET(): Promise<NextResponse> {
  // Return cached response if still fresh
  if (briefCache && Date.now() - briefCache.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(briefCache.data, {
      headers: { "X-Cache": "HIT" },
    });
  }

  try {
    const now = new Date();
    const items: BriefItem[] = [];

    // Pre-compute week boundaries
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Run ALL independent queries in parallel
    const [
      topProducts,
      upcomingEvents,
      anomalyItems,
      newProductItems,
      weekRecords,
      currentGoal,
      accountStats,
      confidence,
    ] = await Promise.all([
      prisma.productIdentity.findMany({
        where: { inboxState: "scored", combinedScore: { not: null } },
        orderBy: { combinedScore: "desc" },
        take: 5,
        select: { id: true, title: true, combinedScore: true },
      }),
      prisma.calendarEvent.findMany({
        where: {
          OR: [
            { startDate: { gte: now, lte: sevenDaysLater } },
            { prepStartDate: { gte: now, lte: sevenDaysLater } },
          ],
        },
        orderBy: { startDate: "asc" },
      }),
      getAnomalyItems(),
      getNewProductItems(now),
      prisma.financialRecord.findMany({
        where: { date: { gte: weekStart, lt: weekEnd } },
      }),
      prisma.goalP5.findFirst({
        where: { periodStart: { lte: now }, periodEnd: { gte: now } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.accountDailyStat.findMany({
        where: { date: { gte: weekStart, lt: weekEnd } },
        orderBy: { date: "desc" },
      }),
      calculateConfidence(),
    ]);

    // Build brief items from query results
    if (topProducts.length > 0) {
      const names = topProducts
        .map((p) => (p.title ?? "SP").substring(0, 20))
        .join(", ");
      items.push({
        priority: "opportunity",
        icon: "Sparkles",
        text: `${topProducts.length} SP nên tạo content: ${names}`,
        actionHref: "/production",
      });
    }

    for (const event of upcomingEvents) {
      const eventStart = new Date(event.startDate);
      const daysUntil = Math.ceil(
        (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      items.push({
        priority: "prepare",
        icon: "Calendar",
        text: `${event.name} trong ${daysUntil} ngày — chuẩn bị content`,
        actionHref: "/insights?tab=calendar",
      });
    }

    items.push(...anomalyItems, ...newProductItems);

    // Financial summary
    const weekSpend = weekRecords
      .filter((r) => r.type === "ads_spend")
      .reduce((sum, r) => sum + r.amount, 0);
    const weekRevenue = weekRecords
      .filter((r) => r.type === "commission_received")
      .reduce((sum, r) => sum + r.amount, 0);
    const weekProfit = weekRevenue - weekSpend;

    // Goal progress
    let goalData: {
      periodType: string;
      targetVideos: number | null;
      targetCommission: number | null;
      actualVideos: number;
      actualCommission: number;
      daysRemaining: number;
    } | null = null;

    if (currentGoal) {
      const daysRemaining = Math.max(
        0,
        Math.ceil(
          (new Date(currentGoal.periodEnd).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
      goalData = {
        periodType: currentGoal.periodType,
        targetVideos: currentGoal.targetVideos,
        targetCommission: currentGoal.targetCommission,
        actualVideos: currentGoal.actualVideos,
        actualCommission: currentGoal.actualCommission,
        daysRemaining,
      };
    }

    // Account stats
    const accountSummary = accountStats.length > 0
      ? {
          totalViews: accountStats.reduce((s, r) => s + r.videoViews, 0),
          totalLikes: accountStats.reduce((s, r) => s + r.likes, 0),
          totalComments: accountStats.reduce((s, r) => s + r.comments, 0),
          totalShares: accountStats.reduce((s, r) => s + r.shares, 0),
          days: accountStats.length,
        }
      : null;

    // Sort by priority
    items.sort(
      (a, b) =>
        (PRIORITY_ORDER[a.priority] ?? 99) -
        (PRIORITY_ORDER[b.priority] ?? 99)
    );

    const summary = {
      topProductsCount: topProducts.length,
      weekSpend: Math.round(weekSpend),
      weekRevenue: Math.round(weekRevenue),
      weekProfit: Math.round(weekProfit),
    };

    const responseData = {
      data: {
        items,
        summary,
        goal: goalData,
        accountSummary,
        confidenceLevel: confidence.level,
        confidenceLabel: confidence.label,
      },
    };

    // Cache the response
    briefCache = { data: responseData, timestamp: Date.now() };

    return NextResponse.json(responseData, {
      headers: { "X-Cache": "MISS" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi tạo morning brief:", error);
    return NextResponse.json(
      { error: message, code: "BRIEF_ERROR" },
      { status: 500 }
    );
  }
}
