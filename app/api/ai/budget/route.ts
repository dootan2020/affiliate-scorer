import { NextResponse } from "next/server";
import { getBudgetPortfolio } from "@/lib/ai/recommendations";

export async function GET(): Promise<NextResponse> {
  try {
    const portfolio = await getBudgetPortfolio();

    return NextResponse.json({ data: portfolio });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Loi khong xac dinh";
    console.error("Loi khi lay budget portfolio:", error);
    return NextResponse.json(
      { error: message, code: "BUDGET_ERROR" },
      { status: 500 }
    );
  }
}
