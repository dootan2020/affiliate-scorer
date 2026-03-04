// GET /api/tasks/active — active or recently completed background tasks
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    // Tasks that are processing OR completed/failed within last 10s
    const recentCutoff = new Date(Date.now() - 10_000);

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

    return NextResponse.json({ data: tasks });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
