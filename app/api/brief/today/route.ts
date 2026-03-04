// Phase 5: GET /api/brief/today — Get cached brief for today (or generate)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateMorningBrief } from "@/lib/brief/generate-morning-brief";

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
      const briefId = await generateMorningBrief();
      brief = await prisma.dailyBrief.findUnique({ where: { id: briefId } });
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
