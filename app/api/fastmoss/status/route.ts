// GET /api/fastmoss/status — returns sync status and stats
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  const [lastSync, productCount, categoryCount, recentLogs] = await Promise.all([
    prisma.fastMossSyncLog.findFirst({
      where: { status: "completed" },
      orderBy: { completedAt: "desc" },
    }),
    prisma.productIdentity.count({
      where: { fastmossProductId: { not: null } },
    }),
    prisma.fastMossCategory.count(),
    prisma.fastMossSyncLog.findMany({
      orderBy: { startedAt: "desc" },
      take: 10,
    }),
  ]);

  return NextResponse.json({
    lastSync: lastSync
      ? {
          type: lastSync.syncType,
          completedAt: lastSync.completedAt,
          recordCount: lastSync.recordCount,
          newCount: lastSync.newCount,
          updatedCount: lastSync.updatedCount,
          duration: lastSync.duration,
        }
      : null,
    totalProducts: productCount,
    totalCategories: categoryCount,
    recentLogs,
  });
}
