// Phase 5: GET /api/commissions/summary — P&L summary
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;
    const month = searchParams.get("month"); // "2026-02" or null = current month

    // Determine date range
    const now = new Date();
    const monthStr = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const start = new Date(`${monthStr}-01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    // Commission by platform
    const commissions = await prisma.commission.findMany({
      where: {
        earnedDate: { gte: start, lt: end },
        status: { not: "rejected" },
      },
    });

    const byPlatform: Record<string, number> = {};
    let totalIncome = 0;
    for (const c of commissions) {
      const p = c.platform || "other";
      byPlatform[p] = (byPlatform[p] || 0) + c.amount;
      totalIncome += c.amount;
    }

    // Costs from FinancialRecord (existing model)
    const costs = await prisma.financialRecord.findMany({
      where: {
        date: { gte: start, lt: end },
        type: { in: ["ads_spend", "other_cost"] },
      },
    });

    let totalCost = 0;
    const costBreakdown: Record<string, number> = {};
    for (const c of costs) {
      totalCost += c.amount;
      costBreakdown[c.source] = (costBreakdown[c.source] || 0) + c.amount;
    }

    const profit = totalIncome - totalCost;
    const roi = totalCost > 0 ? Math.round((profit / totalCost) * 100) : 0;

    // Counts
    const totalCommissions = commissions.length;
    const videosPublished = await prisma.contentAsset.count({
      where: {
        status: "published",
        publishedAt: { gte: start, lt: end },
      },
    });
    const videosLogged = await prisma.contentAsset.count({
      where: {
        status: "logged",
        updatedAt: { gte: start, lt: end },
      },
    });

    return NextResponse.json({
      data: {
        month: monthStr,
        income: {
          total: totalIncome,
          byPlatform,
          count: totalCommissions,
        },
        cost: {
          total: totalCost,
          breakdown: costBreakdown,
        },
        profit,
        roi,
        videos: {
          published: videosPublished,
          logged: videosLogged,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
