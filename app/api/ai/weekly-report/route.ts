import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  generateWeeklyReport,
  saveWeeklyReport,
} from "@/lib/ai/weekly-report";

export async function GET(): Promise<NextResponse> {
  try {
    const latest = await prisma.weeklyReport.findFirst({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: latest });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Loi khong xac dinh";
    console.error("Loi khi lay weekly report:", error);
    return NextResponse.json(
      { error: message, code: "WEEKLY_REPORT_GET_ERROR" },
      { status: 500 }
    );
  }
}

export async function POST(): Promise<NextResponse> {
  try {
    const reportData = await generateWeeklyReport();
    const reportId = await saveWeeklyReport(reportData);

    return NextResponse.json({
      data: { id: reportId, ...reportData },
      message: "Da tao bao cao tuan",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Loi khong xac dinh";
    console.error("Loi khi tao weekly report:", error);
    return NextResponse.json(
      { error: message, code: "WEEKLY_REPORT_CREATE_ERROR" },
      { status: 500 }
    );
  }
}
