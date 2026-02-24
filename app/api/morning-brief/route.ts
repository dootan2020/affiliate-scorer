import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateConfidence } from "@/lib/ai/confidence";
import { analyzeCampaigns } from "./brief-campaign-analyzer";
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

export async function GET(): Promise<NextResponse> {
  try {
    const now = new Date();
    const items: BriefItem[] = [];

    // 1. Active campaigns analysis
    const activeCampaigns = await prisma.campaign.findMany({
      where: { status: "running" },
      include: { product: { select: { name: true } } },
    });

    const pausedCount = await prisma.campaign.count({
      where: { status: "paused" },
    });

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const campaignItems = analyzeCampaigns(
      activeCampaigns,
      yesterdayStr,
      now
    );
    items.push(...campaignItems);

    // 2. Upcoming events within 7 days
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const upcomingEvents = await prisma.calendarEvent.findMany({
      where: {
        OR: [
          { startDate: { gte: now, lte: sevenDaysLater } },
          { prepStartDate: { gte: now, lte: sevenDaysLater } },
        ],
      },
      orderBy: { startDate: "asc" },
    });

    for (const event of upcomingEvents) {
      const eventStart = new Date(event.startDate);
      const daysUntil = Math.ceil(
        (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      items.push({
        priority: "prepare",
        icon: "Calendar",
        text: `${event.name} trong ${daysUntil} ngay — chuan bi content`,
        actionHref: "/calendar",
      });
    }

    // 3. AI anomaly detection & new product discovery
    const [anomalyItems, newProductItems] = await Promise.all([
      getAnomalyItems(),
      getNewProductItems(now),
    ]);
    items.push(...anomalyItems, ...newProductItems);

    // 4. Weekly financial summary (Mon to Sun)
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekRecords = await prisma.financialRecord.findMany({
      where: { date: { gte: weekStart, lt: weekEnd } },
    });

    const weekSpend = weekRecords
      .filter((r) => r.type === "ads_spend")
      .reduce((sum, r) => sum + r.amount, 0);
    const weekRevenue = weekRecords
      .filter((r) => r.type === "commission_received")
      .reduce((sum, r) => sum + r.amount, 0);
    const weekProfit = weekRevenue - weekSpend;

    // 5. Current goal progress
    const currentGoal = await prisma.userGoal.findFirst({
      where: { periodStart: { lte: now }, periodEnd: { gte: now } },
      orderBy: { createdAt: "desc" },
    });

    let goalData: {
      type: string;
      targetAmount: number;
      currentAmount: number;
      progressPercent: number;
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
        type: currentGoal.type,
        targetAmount: currentGoal.targetAmount,
        currentAmount: currentGoal.currentAmount,
        progressPercent: currentGoal.progressPercent,
        daysRemaining,
      };
    }

    // 6. Sort by priority and build response
    items.sort(
      (a, b) =>
        (PRIORITY_ORDER[a.priority] ?? 99) -
        (PRIORITY_ORDER[b.priority] ?? 99)
    );

    const summary = {
      activeCampaigns: activeCampaigns.length,
      pausedCampaigns: pausedCount,
      weekSpend: Math.round(weekSpend),
      weekRevenue: Math.round(weekRevenue),
      weekProfit: Math.round(weekProfit),
    };

    const confidence = await calculateConfidence();

    return NextResponse.json({
      data: {
        items,
        summary,
        goal: goalData,
        confidenceLevel: confidence.level,
        confidenceLabel: confidence.label,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Loi khong xac dinh";
    console.error("Loi khi tao morning brief:", error);
    return NextResponse.json(
      { error: message, code: "BRIEF_ERROR" },
      { status: 500 }
    );
  }
}
