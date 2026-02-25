// Phase 3: GET /api/briefs/[id] — Xem chi tiết brief
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const brief = await prisma.contentBrief.findUnique({
      where: { id },
      include: {
        productIdentity: true,
        assets: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!brief) {
      return NextResponse.json(
        { error: "Không tìm thấy brief" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: brief });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
