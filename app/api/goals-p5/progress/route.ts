// Phase 5: GET /api/goals-p5/progress — Auto-calculate progress
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  try {
    const now = new Date();

    // Find active goals
    const goals = await prisma.goalP5.findMany({
      where: {
        periodStart: { lte: now },
        periodEnd: { gte: now },
      },
    });

    if (goals.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const results = await Promise.all(
      goals.map(async (goal) => {
        // Count published videos in period
        const videosPublished = await prisma.contentAsset.count({
          where: {
            status: "published",
            publishedAt: { gte: goal.periodStart, lte: goal.periodEnd },
          },
        });

        // Sum commissions in period
        const commissions = await prisma.commission.findMany({
          where: {
            earnedDate: { gte: goal.periodStart, lte: goal.periodEnd },
            status: { not: "rejected" },
          },
          select: { amount: true },
        });
        const totalCommission = commissions.reduce((s, c) => s + c.amount, 0);

        // Sum views from metrics in period
        const metrics = await prisma.assetMetric.findMany({
          where: {
            capturedAt: { gte: goal.periodStart, lte: goal.periodEnd },
          },
          select: { views: true },
        });
        const totalViews = metrics.reduce((s, m) => s + (m.views || 0), 0);

        // Update goal actuals
        await prisma.goalP5.update({
          where: { id: goal.id },
          data: {
            actualVideos: videosPublished,
            actualCommission: totalCommission,
            actualViews: totalViews,
          },
        });

        // Calculate progress
        const daysTotal = Math.max(
          1,
          Math.ceil(
            (goal.periodEnd.getTime() - goal.periodStart.getTime()) / (1000 * 60 * 60 * 24),
          ),
        );
        const daysElapsed = Math.max(
          0,
          Math.ceil(
            (now.getTime() - goal.periodStart.getTime()) / (1000 * 60 * 60 * 24),
          ),
        );
        const daysRemaining = Math.max(0, daysTotal - daysElapsed);

        return {
          id: goal.id,
          periodType: goal.periodType,
          periodStart: goal.periodStart,
          periodEnd: goal.periodEnd,
          daysTotal,
          daysElapsed,
          daysRemaining,
          videos: {
            target: goal.targetVideos,
            actual: videosPublished,
            percent: goal.targetVideos && goal.targetVideos > 0
              ? Math.round((videosPublished / goal.targetVideos) * 100)
              : null,
            neededPerDay: goal.targetVideos && daysRemaining > 0
              ? Math.ceil((goal.targetVideos - videosPublished) / daysRemaining)
              : 0,
          },
          commission: {
            target: goal.targetCommission,
            actual: totalCommission,
            percent: goal.targetCommission && goal.targetCommission > 0
              ? Math.round((totalCommission / goal.targetCommission) * 100)
              : null,
          },
          views: {
            target: goal.targetViews,
            actual: totalViews,
            percent: goal.targetViews && goal.targetViews > 0
              ? Math.round((totalViews / goal.targetViews) * 100)
              : null,
          },
        };
      }),
    );

    return NextResponse.json({ data: results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
