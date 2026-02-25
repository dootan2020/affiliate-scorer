import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  generateWeeklyReport,
  saveWeeklyReport,
} from "@/lib/ai/weekly-report";
import { checkRateLimit } from "@/lib/utils/rate-limit";

export async function GET(): Promise<NextResponse> {
  try {
    const latest = await prisma.weeklyReport.findFirst({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: latest });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi lấy weekly report:", error);
    return NextResponse.json(
      { error: message, code: "WEEKLY_REPORT_GET_ERROR" },
      { status: 500 }
    );
  }
}

export async function POST(): Promise<NextResponse> {
  const rl = checkRateLimit("ai:weekly-report", 3, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Quá nhiều yêu cầu. Vui lòng thử lại sau.", code: "RATE_LIMIT" },
      { status: 429 }
    );
  }

  try {
    const reportData = await generateWeeklyReport();
    const reportId = await saveWeeklyReport(reportData);

    return NextResponse.json({
      data: { id: reportId, ...reportData },
      message: "Đã tạo báo cáo tuần",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi tạo weekly report:", error);
    return NextResponse.json(
      { error: message, code: "WEEKLY_REPORT_CREATE_ERROR" },
      { status: 500 }
    );
  }
}
