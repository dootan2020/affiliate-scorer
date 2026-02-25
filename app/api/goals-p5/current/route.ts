// Phase 5: GET /api/goals-p5/current — Active goals (weekly + monthly)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  try {
    const now = new Date();

    const [weekly, monthly] = await Promise.all([
      prisma.goalP5.findFirst({
        where: {
          periodType: "weekly",
          periodStart: { lte: now },
          periodEnd: { gte: now },
        },
      }),
      prisma.goalP5.findFirst({
        where: {
          periodType: "monthly",
          periodStart: { lte: now },
          periodEnd: { gte: now },
        },
      }),
    ]);

    return NextResponse.json({ data: { weekly, monthly } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
