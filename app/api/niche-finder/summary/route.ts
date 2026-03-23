// GET /api/niche-finder/summary — aggregate FastMoss enriched products by category
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  const categories = await prisma.fastMossCategory.findMany({
    where: { level: 1, region: "VN" },
    orderBy: { rank: "asc" },
  });

  const results = await Promise.all(
    categories.map(async (cat) => {
      const [agg, withSales, withKOL, totalVideos] = await Promise.all([
        prisma.productIdentity.aggregate({
          where: {
            fastmossCategoryId: cat.code,
            fastmossProductId: { not: null },
          },
          _count: true,
          _avg: { price: true, commissionRate: true, productRating: true },
        }),
        prisma.productIdentity.count({
          where: {
            fastmossCategoryId: cat.code,
            fastmossProductId: { not: null },
            day28SoldCount: { gt: 0 },
          },
        }),
        prisma.productIdentity.count({
          where: {
            fastmossCategoryId: cat.code,
            fastmossProductId: { not: null },
            relateAuthorCount: { gt: 0 },
          },
        }),
        prisma.productIdentity.aggregate({
          where: {
            fastmossCategoryId: cat.code,
            fastmossProductId: { not: null },
          },
          _sum: { relateVideoCount: true },
        }),
      ]);

      const avgComm = Number(agg._avg.commissionRate ?? 0);
      const avgPrice = Number(agg._avg.price ?? 0);
      const revPerOrder = (avgPrice * avgComm) / 100;

      const passRevOrder = revPerOrder >= 8000;
      const passSales = withSales >= 20;
      const passKOL = withKOL >= 10;
      const passCount = [passRevOrder, passSales, passKOL].filter(Boolean).length;
      const verdict =
        passCount === 3 ? "PASS" : passCount >= 2 ? "CONSIDER" : "SKIP";

      return {
        categoryCode: cat.code,
        categoryName: cat.nameVi ?? cat.name,
        totalProducts: agg._count,
        withSales,
        withKOL,
        avgCommission: avgComm,
        avgPrice,
        avgRating: Number(agg._avg.productRating ?? 0),
        revPerOrder: Math.round(revPerOrder),
        totalVideos: totalVideos._sum.relateVideoCount ?? 0,
        verdict,
      };
    })
  );

  const lastSync = await prisma.fastMossSyncLog.findFirst({
    where: { status: "completed", syncType: "products" },
    orderBy: { completedAt: "desc" },
    select: { completedAt: true, recordCount: true },
  });

  const filtered = results
    .filter((r) => r.totalProducts > 0)
    .sort((a, b) => b.revPerOrder - a.revPerOrder);

  return NextResponse.json({
    niches: filtered,
    lastSync: lastSync?.completedAt ?? null,
    totalProducts: results.reduce((s, r) => s + r.totalProducts, 0),
  });
}
