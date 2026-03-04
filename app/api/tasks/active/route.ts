// GET /api/tasks/active — active or recently completed background tasks
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const STUCK_THRESHOLD_MS = 3 * 60_000; // 3 min — after() killed by Vercel timeout

export async function GET(): Promise<NextResponse> {
  try {
    const recentCutoff = new Date(Date.now() - 10_000);
    const stuckCutoff = new Date(Date.now() - STUCK_THRESHOLD_MS);

    const tasks = await prisma.backgroundTask.findMany({
      where: {
        OR: [
          { status: { in: ["pending", "processing"] } },
          { status: { in: ["completed", "failed"] }, updatedAt: { gte: recentCutoff } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Auto-fail stuck tasks (processing with no update for 3+ min)
    const stuckIds: string[] = [];
    for (const t of tasks) {
      if (t.status === "processing" && t.updatedAt < stuckCutoff) {
        stuckIds.push(t.id);
        t.status = "failed";
        t.error = "Timeout — vui lòng thử lại";
      }
    }

    if (stuckIds.length > 0) {
      await prisma.backgroundTask.updateMany({
        where: { id: { in: stuckIds } },
        data: { status: "failed", error: "Timeout — vui lòng thử lại" },
      });
    }

    return NextResponse.json({ data: tasks });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
