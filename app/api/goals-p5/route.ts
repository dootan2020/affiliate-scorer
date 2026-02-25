// Phase 5: POST /api/goals-p5 — Set goal (weekly/monthly)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validations/validate-body";
import { createGoalP5Schema } from "@/lib/validations/schemas-financial";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const validation = await validateBody(request, createGoalP5Schema);
    if (validation.error) return validation.error;
    const body = validation.data;

    const goal = await prisma.goalP5.upsert({
      where: {
        periodType_periodStart: {
          periodType: body.periodType,
          periodStart: new Date(body.periodStart),
        },
      },
      create: {
        periodType: body.periodType,
        periodStart: new Date(body.periodStart),
        periodEnd: new Date(body.periodEnd),
        targetVideos: body.targetVideos || null,
        targetCommission: body.targetCommission || null,
        targetViews: body.targetViews || null,
        notes: body.notes || null,
      },
      update: {
        periodEnd: new Date(body.periodEnd),
        targetVideos: body.targetVideos || null,
        targetCommission: body.targetCommission || null,
        targetViews: body.targetViews || null,
        notes: body.notes || null,
      },
    });

    return NextResponse.json({
      data: goal,
      message: "Đã lưu mục tiêu",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;
    const periodType = searchParams.get("periodType");

    const goals = await prisma.goalP5.findMany({
      where: periodType ? { periodType } : undefined,
      orderBy: { periodStart: "desc" },
      take: 20,
    });

    return NextResponse.json({ data: goals });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
