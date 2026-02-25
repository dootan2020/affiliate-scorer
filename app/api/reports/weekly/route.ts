// Phase 5: POST generate + GET list weekly reports
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateWeeklyReport } from "@/lib/reports/generate-weekly-report";

export async function POST(): Promise<NextResponse> {
  try {
    const reportId = await generateWeeklyReport();
    if (!reportId) {
      return NextResponse.json(
        { error: "Cần ít nhất 5 video đã publish trong tuần để tạo report" },
        { status: 400 },
      );
    }
    return NextResponse.json({
      data: { id: reportId },
      message: "Đã tạo báo cáo tuần",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;
    const limit = Math.min(20, parseInt(searchParams.get("limit") || "10", 10));

    // Weekly reports are stored as DailyBrief where content.type = "weekly_report"
    const briefs = await prisma.dailyBrief.findMany({
      orderBy: { briefDate: "desc" },
      take: limit * 2, // fetch extra to filter
    });

    const weeklyReports = briefs
      .filter((b) => {
        const content = b.content as Record<string, unknown>;
        return content?.type === "weekly_report";
      })
      .slice(0, limit);

    return NextResponse.json({ data: weeklyReports });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
