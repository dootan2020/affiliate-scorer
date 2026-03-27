// GET /api/niche-finder/summary — aggregate FastMoss enriched products by category
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  try {
    const baseWhere = {
      fastmossProductId: { not: null as string | null },
      fastmossCategoryId: { not: null as number | null },
    };

    // 3 queries instead of 29×4=116
    const [categories, grouped, withSalesList, withKOLList, lastSync] =
      await Promise.all([
        prisma.fastMossCategory.findMany({
          where: { level: 1, region: "VN" },
          orderBy: { rank: "asc" },
        }),
        prisma.productIdentity.groupBy({
          by: ["fastmossCategoryId"],
          where: baseWhere,
          _count: true,
          _avg: { price: true, commissionRate: true, productRating: true },
          _sum: { relateVideoCount: true },
        }),
        prisma.productIdentity.groupBy({
          by: ["fastmossCategoryId"],
          where: { ...baseWhere, day28SoldCount: { gt: 0 } },
          _count: true,
        }),
        prisma.productIdentity.groupBy({
          by: ["fastmossCategoryId"],
          where: { ...baseWhere, relateAuthorCount: { gt: 0 } },
          _count: true,
        }),
        prisma.fastMossSyncLog.findFirst({
          where: { status: "completed", syncType: "products" },
          orderBy: { completedAt: "desc" },
          select: { completedAt: true, recordCount: true },
        }),
      ]);

    // Build lookup maps
    const aggMap = new Map(
      grouped.map((g) => [g.fastmossCategoryId, g])
    );
    const salesMap = new Map(
      withSalesList.map((g) => [g.fastmossCategoryId, g._count])
    );
    const kolMap = new Map(
      withKOLList.map((g) => [g.fastmossCategoryId, g._count])
    );

    const results = categories.map((cat) => {
      const agg = aggMap.get(cat.code);
      const totalProducts = agg?._count ?? 0;
      const withSales = salesMap.get(cat.code) ?? 0;
      const withKOL = kolMap.get(cat.code) ?? 0;

      const avgComm = Number(agg?._avg?.commissionRate ?? 0);
      const avgPrice = Number(agg?._avg?.price ?? 0);
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
        totalProducts,
        withSales,
        withKOL,
        avgCommission: avgComm,
        avgPrice,
        avgRating: Number(agg?._avg?.productRating ?? 0),
        revPerOrder: Math.round(revPerOrder),
        totalVideos: Number(agg?._sum?.relateVideoCount ?? 0),
        verdict,
      };
    });

    const filtered = results
      .filter((r) => r.totalProducts > 0)
      .sort((a, b) => b.revPerOrder - a.revPerOrder);

    return NextResponse.json({
      niches: filtered,
      lastSync: lastSync?.completedAt ?? null,
      totalProducts: results.reduce((s, r) => s + r.totalProducts, 0),
    });
  } catch (err) {
    console.error("[niche-finder/summary] error:", err);
    return NextResponse.json(
      { error: "Failed to aggregate niche data", detail: String(err) },
      { status: 500 }
    );
  }
}
