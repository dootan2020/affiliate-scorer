import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface OrphanStats {
  scoredWithoutBriefs: number;
  briefsWithoutAssets: number;
  publishedWithoutTracking: number;
  slotsWithoutAsset: number;
  total: number;
}

/** GET — count orphaned records across the pipeline */
export async function GET(): Promise<NextResponse> {
  try {
    const [scoredWithoutBriefs, briefsWithoutAssets, publishedWithoutTracking, slotsWithoutAsset] =
      await Promise.all([
        // 1. Scored/briefed products with 0 briefs
        prisma.productIdentity.count({
          where: {
            inboxState: { in: ["scored", "briefed"] },
            briefs: { none: {} },
          },
        }),
        // 2. Briefs with 0 assets
        prisma.contentBrief.count({
          where: {
            assets: { none: {} },
          },
        }),
        // 3. Published assets with 0 tracking (1:1 relation)
        prisma.contentAsset.count({
          where: {
            status: "published",
            tracking: { is: null },
          },
        }),
        // 4. Slots with no asset linked
        prisma.contentSlot.count({
          where: {
            contentAssetId: null,
            status: "planned",
          },
        }),
      ]);

    const stats: OrphanStats = {
      scoredWithoutBriefs,
      briefsWithoutAssets,
      publishedWithoutTracking,
      slotsWithoutAsset,
      total: scoredWithoutBriefs + briefsWithoutAssets + publishedWithoutTracking + slotsWithoutAsset,
    };

    return NextResponse.json({ data: stats });
  } catch (e) {
    console.error("[orphan-stats]", e);
    return NextResponse.json({ error: "Failed to fetch orphan stats" }, { status: 500 });
  }
}
