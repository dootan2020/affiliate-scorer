// GET /api/imports/active — Return most recent active or recently completed ImportBatch.
// Used by the global ImportProgressWidget on every page.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  try {
    const recentCutoff = new Date(Date.now() - 2 * 60_000); // 2 min

    const batch = await prisma.importBatch.findFirst({
      where: {
        OR: [
          // Still in progress (import or scoring)
          { status: { in: ["pending", "processing"] } },
          {
            status: { in: ["completed", "partial"] },
            scoringStatus: { in: ["pending", "processing"] },
          },
          // Recently completed/failed (within 2 min) — so widget can show result
          {
            completedAt: { gte: recentCutoff },
            status: { in: ["completed", "partial", "failed"] },
          },
        ],
      },
      orderBy: { importDate: "desc" },
      select: {
        id: true,
        fileName: true,
        source: true,
        recordCount: true,
        status: true,
        rowsProcessed: true,
        rowsCreated: true,
        rowsUpdated: true,
        rowsError: true,
        scoringStatus: true,
        completedAt: true,
      },
    });

    return NextResponse.json({ data: batch });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
