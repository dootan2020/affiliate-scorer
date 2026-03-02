import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** GET — yesterday's key metrics for dashboard stat cards */
export async function GET(): Promise<NextResponse> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const [videos, metrics] = await Promise.all([
      // Videos published yesterday
      prisma.contentAsset.count({
        where: {
          publishedAt: { gte: yesterday, lt: today },
        },
      }),
      // Views, orders, commission from AssetMetric captured yesterday
      prisma.assetMetric.aggregate({
        where: {
          capturedAt: { gte: yesterday, lt: today },
        },
        _sum: {
          views: true,
          orders: true,
          commissionAmount: true,
        },
      }),
    ]);

    return NextResponse.json({
      data: {
        videos,
        views: metrics._sum.views ?? 0,
        orders: metrics._sum.orders ?? 0,
        commission: metrics._sum.commissionAmount ?? 0,
      },
    });
  } catch (e) {
    console.error("[yesterday-stats]", e);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
