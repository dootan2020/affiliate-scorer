import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface BriefItem {
  priority: "urgent" | "opportunity" | "prepare" | "routine";
  icon: string;
  text: string;
  actionHref: string;
}

interface DailyResultEntry {
  date: string;
  spend: number;
  orders: number;
  revenue: number;
  clicks?: number;
  notes?: string;
}

interface ChecklistItem {
  label: string;
  dueDay: number;
  completed: boolean;
  completedAt: string | null;
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

    // 1. Fetch active campaigns (status = "running")
    const activeCampaigns = await prisma.campaign.findMany({
      where: { status: "running" },
      include: { product: { select: { name: true } } },
    });

    // Count paused campaigns
    const pausedCount = await prisma.campaign.count({
      where: { status: "paused" },
    });

    // Yesterday's date string (YYYY-MM-DD)
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // 2. Analyze each active campaign
    for (const campaign of activeCampaigns) {
      const results = (campaign.dailyResults as unknown as DailyResultEntry[]) ?? [];
      const campaignHref = `/campaigns/${campaign.id}`;

      // URGENT: last 3 daily results all have spend > revenue
      if (results.length >= 3) {
        const lastThree = results.slice(-3);
        const allLosing = lastThree.every((r) => r.spend > r.revenue);
        if (allLosing) {
          items.push({
            priority: "urgent",
            icon: "AlertTriangle",
            text: `${campaign.name}: 3 ngay lien tuc lo — nen tam dung`,
            actionHref: campaignHref,
          });
        }
      }

      // OPPORTUNITY: roas >= 2.5 and 3+ daily results
      if (campaign.roas !== null && campaign.roas >= 2.5 && results.length >= 3) {
        items.push({
          priority: "opportunity",
          icon: "TrendingUp",
          text: `${campaign.name}: ROAS ${campaign.roas} — co the tang budget`,
          actionHref: campaignHref,
        });
      }

      // ROUTINE: missing yesterday's result
      const hasYesterday = results.some((r) => r.date === yesterdayStr);
      if (!hasYesterday) {
        items.push({
          priority: "routine",
          icon: "ClipboardList",
          text: `${campaign.name}: chua nhap ket qua hom qua`,
          actionHref: `${campaignHref}#daily-results`,
        });
      }

      // Due checklist items from active campaigns
      const checklist = (campaign.checklist as unknown as ChecklistItem[]) ?? [];
      if (campaign.startedAt) {
        const startDate = new Date(campaign.startedAt);
        const daysSinceStart = Math.floor(
          (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        for (const item of checklist) {
          if (!item.completed && item.dueDay <= daysSinceStart) {
            items.push({
              priority: "routine",
              icon: "CheckSquare",
              text: `${campaign.name}: "${item.label}" da den han`,
              actionHref: campaignHref,
            });
          }
        }
      }
    }

    // 3. Upcoming events within 7 days
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const upcomingEvents = await prisma.calendarEvent.findMany({
      where: {
        OR: [
          // Events starting within 7 days
          { startDate: { gte: now, lte: sevenDaysLater } },
          // Events with prep starting within 7 days
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

    // 5. Weekly financial summary (this week: Mon to Sun)
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekRecords = await prisma.financialRecord.findMany({
      where: {
        date: { gte: weekStart, lt: weekEnd },
      },
    });

    const weekSpend = weekRecords
      .filter((r) => r.type === "ads_spend")
      .reduce((sum, r) => sum + r.amount, 0);

    const weekRevenue = weekRecords
      .filter((r) => r.type === "commission_received")
      .reduce((sum, r) => sum + r.amount, 0);

    const weekProfit = weekRevenue - weekSpend;

    // 6. Current goal progress
    const currentGoal = await prisma.userGoal.findFirst({
      where: {
        periodStart: { lte: now },
        periodEnd: { gte: now },
      },
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

    // Sort items by priority
    items.sort(
      (a, b) => (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99)
    );

    const summary = {
      activeCampaigns: activeCampaigns.length,
      pausedCampaigns: pausedCount,
      weekSpend: Math.round(weekSpend),
      weekRevenue: Math.round(weekRevenue),
      weekProfit: Math.round(weekProfit),
    };

    return NextResponse.json({
      data: {
        items,
        summary,
        goal: goalData,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Loi khong xac dinh";
    console.error("Loi khi tao morning brief:", error);
    return NextResponse.json(
      { error: message, code: "BRIEF_ERROR" },
      { status: 500 }
    );
  }
}
