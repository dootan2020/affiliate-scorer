// GET /api/niche-finder/summary — aggregate FastMoss enriched products by category + niche scoring
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { scoreNiches } from "@/lib/niche-scoring/niche-scorer";
import type { CategoryStats, UserProfile } from "@/lib/niche-scoring/types";

const profileSchema = z.object({
  contentType: z.enum(["ai_video", "manual", "both"]),
  buyProduct: z.boolean(),
  targetIncome: z.number().positive(),
  experience: z.enum(["new", "experienced"]),
});

export async function GET(request: Request): Promise<NextResponse> {
  try {
    // Parse + validate optional user profile from query
    const url = new URL(request.url);
    const profileParam = url.searchParams.get("profile");
    let profile: UserProfile | null = null;
    if (profileParam) {
      try {
        const parsed = profileSchema.safeParse(JSON.parse(profileParam));
        profile = parsed.success ? parsed.data : null;
      } catch {
        // Invalid JSON — ignore, proceed without profile
      }
    }

    const baseWhere = {
      fastmossProductId: { not: null as string | null },
      fastmossCategoryId: { not: null as number | null },
    };

    const [
      categories,
      grouped,
      withSalesList,
      withKOLList,
      avgSalesList,
      totalKOLList,
      newSurgeList,
      lastSync,
    ] = await Promise.all([
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
      // NEW: Average sales per product (only products with sales)
      prisma.productIdentity.groupBy({
        by: ["fastmossCategoryId"],
        where: { ...baseWhere, day28SoldCount: { gt: 0 } },
        _avg: { day28SoldCount: true },
      }),
      // NEW: Total KOL (sum of relateAuthorCount)
      prisma.productIdentity.groupBy({
        by: ["fastmossCategoryId"],
        where: baseWhere,
        _sum: { relateAuthorCount: true },
      }),
      // NEW: Count of NEW/SURGE delta products
      prisma.productIdentity.groupBy({
        by: ["fastmossCategoryId"],
        where: { ...baseWhere, deltaType: { in: ["NEW", "SURGE"] } },
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
    const avgSalesMap = new Map(
      avgSalesList.map((g) => [
        g.fastmossCategoryId,
        g._avg?.day28SoldCount ?? 0,
      ])
    );
    const totalKOLMap = new Map(
      totalKOLList.map((g) => [
        g.fastmossCategoryId,
        g._sum?.relateAuthorCount ?? 0,
      ])
    );
    const newSurgeMap = new Map(
      newSurgeList.map((g) => [g.fastmossCategoryId, g._count])
    );

    // Build CategoryStats array
    const categoryStatsList: CategoryStats[] = categories
      .map((cat) => {
        const agg = aggMap.get(cat.code);
        const totalProducts = agg?._count ?? 0;
        if (totalProducts === 0) return null;

        const withSales = salesMap.get(cat.code) ?? 0;
        const withKOL = kolMap.get(cat.code) ?? 0;
        const avgComm = Number(agg?._avg?.commissionRate ?? 0);
        const avgPrice = Number(agg?._avg?.price ?? 0);
        const revPerOrder = (avgPrice * avgComm) / 100;
        const newSurgeCount = newSurgeMap.get(cat.code) ?? 0;

        return {
          categoryCode: cat.code,
          categoryName: cat.nameVi ?? cat.name,
          totalProducts,
          withSales,
          withKOL,
          avgCommission: avgComm,
          avgPrice,
          revPerOrder: Math.round(revPerOrder),
          totalVideos: Number(agg?._sum?.relateVideoCount ?? 0),
          avgRating: Number(agg?._avg?.productRating ?? 0),
          avgSales28d: Number(avgSalesMap.get(cat.code) ?? 0),
          newSurgeRatio:
            totalProducts > 0 ? newSurgeCount / totalProducts : 0,
          totalKOL: Number(totalKOLMap.get(cat.code) ?? 0),
        } satisfies CategoryStats;
      })
      .filter((s): s is CategoryStats => s !== null);

    // Score all niches
    const scored = scoreNiches(categoryStatsList, profile);

    return NextResponse.json({
      niches: scored,
      lastSync: lastSync?.completedAt ?? null,
      totalProducts: categoryStatsList.reduce(
        (s, r) => s + r.totalProducts,
        0
      ),
      hasProfile: profile !== null,
    });
  } catch (err) {
    console.error("[niche-finder/summary] error:", err);
    return NextResponse.json(
      { error: "Failed to aggregate niche data", detail: String(err) },
      { status: 500 }
    );
  }
}
