import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  try {
    const now = new Date();

    // Find goal where periodStart <= now <= periodEnd
    const goal = await prisma.userGoal.findFirst({
      where: {
        periodStart: { lte: now },
        periodEnd: { gte: now },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!goal) {
      return NextResponse.json({ data: null });
    }

    // Auto-calculate currentAmount from campaign profits + financial records in period
    const periodStart = goal.periodStart;
    const periodEnd = goal.periodEnd;

    // Sum profitLoss from completed campaigns in period
    const completedCampaigns = await prisma.campaign.findMany({
      where: {
        status: "completed",
        endedAt: { gte: periodStart, lte: periodEnd },
      },
      select: { profitLoss: true },
    });
    const campaignProfit = completedCampaigns.reduce(
      (sum, c) => sum + c.profitLoss,
      0
    );

    // Sum financial records in period
    const financialRecords = await prisma.financialRecord.findMany({
      where: {
        date: { gte: periodStart, lte: periodEnd },
      },
    });

    const commissionTotal = financialRecords
      .filter((r) => r.type === "commission_received")
      .reduce((sum, r) => sum + r.amount, 0);

    const adsSpendTotal = financialRecords
      .filter((r) => r.type === "ads_spend")
      .reduce((sum, r) => sum + r.amount, 0);

    const financialProfit = commissionTotal - adsSpendTotal;

    // Use the larger of campaign-based or financial-record-based calculation
    // (they may overlap, so pick the financial records as source of truth)
    const currentAmount = Math.round(
      campaignProfit > 0 ? Math.max(campaignProfit, financialProfit) : financialProfit
    );
    const progressPercent =
      goal.targetAmount > 0
        ? Math.round((currentAmount / goal.targetAmount) * 10000) / 100
        : 0;

    // Update goal with recalculated values
    const updatedGoal = await prisma.userGoal.update({
      where: { id: goal.id },
      data: { currentAmount, progressPercent },
    });

    return NextResponse.json({ data: updatedGoal });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Loi khong xac dinh";
    console.error("Loi khi lay goal:", error);
    return NextResponse.json(
      { error: message, code: "FETCH_ERROR" },
      { status: 500 }
    );
  }
}

interface CreateGoalBody {
  type: string;
  targetAmount: number;
  periodStart: string;
  periodEnd: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as CreateGoalBody;

    // Validate required fields
    if (!body.type || body.targetAmount === undefined || !body.periodStart || !body.periodEnd) {
      return NextResponse.json(
        { error: "type, targetAmount, periodStart, va periodEnd la bat buoc", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    const periodStart = new Date(body.periodStart);
    const periodEnd = new Date(body.periodEnd);
    if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
      return NextResponse.json(
        { error: "periodStart hoac periodEnd khong hop le", code: "INVALID_DATE" },
        { status: 400 }
      );
    }

    if (periodEnd <= periodStart) {
      return NextResponse.json(
        { error: "periodEnd phai sau periodStart", code: "INVALID_DATE_RANGE" },
        { status: 400 }
      );
    }

    // Upsert by periodStart: find existing goal with same periodStart
    const existing = await prisma.userGoal.findFirst({
      where: { periodStart },
    });

    let goal;
    if (existing) {
      goal = await prisma.userGoal.update({
        where: { id: existing.id },
        data: {
          type: body.type,
          targetAmount: body.targetAmount,
          periodEnd,
        },
      });
    } else {
      goal = await prisma.userGoal.create({
        data: {
          type: body.type,
          targetAmount: body.targetAmount,
          periodStart,
          periodEnd,
        },
      });
    }

    return NextResponse.json(
      { message: existing ? "Da cap nhat goal" : "Da tao goal", data: goal },
      { status: existing ? 200 : 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Loi khong xac dinh";
    console.error("Loi khi tao/cap nhat goal:", error);
    return NextResponse.json(
      { error: message, code: "UPSERT_ERROR" },
      { status: 500 }
    );
  }
}
