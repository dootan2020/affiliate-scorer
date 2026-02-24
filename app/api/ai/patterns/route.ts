import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { refreshPatterns } from "@/lib/ai/patterns";

export async function GET(): Promise<NextResponse> {
  try {
    const patterns = await prisma.winPattern.findMany({
      orderBy: [{ patternType: "asc" }, { winRate: "desc" }],
    });

    return NextResponse.json({ data: patterns });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Loi khong xac dinh";
    console.error("Loi khi lay patterns:", error);
    return NextResponse.json(
      { error: message, code: "PATTERNS_GET_ERROR" },
      { status: 500 }
    );
  }
}

export async function POST(): Promise<NextResponse> {
  try {
    await refreshPatterns();

    const patterns = await prisma.winPattern.findMany({
      orderBy: [{ patternType: "asc" }, { winRate: "desc" }],
    });

    return NextResponse.json({
      data: patterns,
      message: `Da tao ${patterns.length} patterns tu campaigns`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Loi khong xac dinh";
    console.error("Loi khi refresh patterns:", error);
    return NextResponse.json(
      { error: message, code: "PATTERNS_REFRESH_ERROR" },
      { status: 500 }
    );
  }
}
