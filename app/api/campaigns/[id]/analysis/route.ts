import { NextResponse } from "next/server";
import { analyzeWinLoss } from "@/lib/ai/win-loss-analysis";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const analysis = await analyzeWinLoss(id);

    if (!analysis) {
      return NextResponse.json(
        { error: "Không tìm thấy campaign hoặc campaign chưa hoàn thành" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: analysis });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi phân tích win/loss:", error);
    return NextResponse.json(
      { error: message, code: "ANALYSIS_ERROR" },
      { status: 500 }
    );
  }
}
