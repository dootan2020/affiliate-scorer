import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { refreshPatterns } from "@/lib/ai/patterns";
import { checkRateLimit } from "@/lib/utils/rate-limit";

export async function GET(): Promise<NextResponse> {
  try {
    const patterns = await prisma.winPattern.findMany({
      orderBy: [{ patternType: "asc" }, { winRate: "desc" }],
    });

    return NextResponse.json({ data: patterns });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi lấy patterns:", error);
    return NextResponse.json(
      { error: message, code: "PATTERNS_GET_ERROR" },
      { status: 500 }
    );
  }
}

export async function POST(): Promise<NextResponse> {
  const rl = checkRateLimit("ai:patterns", 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Quá nhiều yêu cầu. Vui lòng thử lại sau.", code: "RATE_LIMIT" },
      { status: 429 }
    );
  }

  try {
    await refreshPatterns();

    const patterns = await prisma.winPattern.findMany({
      orderBy: [{ patternType: "asc" }, { winRate: "desc" }],
    });

    return NextResponse.json({
      data: patterns,
      message: `Đã tạo ${patterns.length} patterns từ campaigns`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi refresh patterns:", error);
    return NextResponse.json(
      { error: message, code: "PATTERNS_REFRESH_ERROR" },
      { status: 500 }
    );
  }
}
