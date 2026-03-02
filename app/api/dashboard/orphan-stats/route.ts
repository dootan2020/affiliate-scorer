import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface OrphanStats {
  briefsWithoutAssets: number;
  publishedWithoutTracking: number;
  overdueSlots: number;
  total: number;
}

/** GET — count genuinely orphaned records across the pipeline */
export async function GET(): Promise<NextResponse> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [briefsWithoutAssets, publishedWithoutTracking, overdueSlots] =
      await Promise.all([
        // 1. Briefs with 0 assets — created but never produced
        prisma.contentBrief.count({
          where: {
            assets: { none: {} },
          },
        }),
        // 2. Published assets with 0 tracking — missing performance data
        prisma.contentAsset.count({
          where: {
            status: "published",
            tracking: { is: null },
          },
        }),
        // 3. Overdue planned slots — scheduled date < today and still no content
        prisma.contentSlot.count({
          where: {
            contentAssetId: null,
            status: "planned",
            scheduledDate: { lt: today },
          },
        }),
      ]);

    const stats: OrphanStats = {
      briefsWithoutAssets,
      publishedWithoutTracking,
      overdueSlots,
      total: briefsWithoutAssets + publishedWithoutTracking + overdueSlots,
    };

    return NextResponse.json({ data: stats });
  } catch (e) {
    console.error("[orphan-stats]", e);
    return NextResponse.json({ error: "Failed to fetch orphan stats" }, { status: 500 });
  }
}
