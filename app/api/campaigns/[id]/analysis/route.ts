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
        { error: "Khong tim thay campaign hoac campaign chua hoan thanh" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: analysis });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Loi khong xac dinh";
    console.error("Loi khi phan tich win/loss:", error);
    return NextResponse.json(
      { error: message, code: "ANALYSIS_ERROR" },
      { status: 500 }
    );
  }
}
