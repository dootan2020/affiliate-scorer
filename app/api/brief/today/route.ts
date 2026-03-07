// Phase 5: GET /api/brief/today — Get cached brief for today (or generate)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateMorningBrief } from "@/lib/brief/generate-morning-brief";

// Simple in-memory lock to prevent concurrent brief generation
let generatingBrief = false;

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;
    const forceRefresh = searchParams.get("refresh") === "true";

    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Check cached
    let brief = await prisma.dailyBrief.findUnique({
      where: { briefDate: todayDate },
    });

    if (!brief || forceRefresh) {
      // Prevent concurrent AI calls — if already generating, return existing or wait
      if (generatingBrief) {
        if (brief) {
          return NextResponse.json({ data: brief, latestDataChange: null });
        }
        return NextResponse.json(
          { error: "Brief đang được tạo, vui lòng thử lại sau vài giây" },
          { status: 429 },
        );
      }

      generatingBrief = true;
      try {
        const briefId = await generateMorningBrief();
        brief = await prisma.dailyBrief.findUnique({ where: { id: briefId } });
      } finally {
        generatingBrief = false;
      }
    }

    if (!brief) {
      return NextResponse.json({ error: "Không tạo được brief" }, { status: 500 });
    }

    // Check if data changed after brief was generated (for freshness badge)
    const latestProduct = await prisma.productIdentity.findFirst({
      select: { updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
    const latestDataChange = latestProduct?.updatedAt ?? null;

    return NextResponse.json({ data: brief, latestDataChange });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
