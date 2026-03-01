// GET /api/channels/[id]/idea-matrix — List ideas with optional filters
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const layer = url.searchParams.get("layer");

  try {
    const where: Record<string, unknown> = { channelId: id };
    if (status) where.status = status;
    if (layer) where.bibleLayer = layer;

    const items = await prisma.ideaMatrixItem.findMany({
      where,
      orderBy: [{ bibleLayer: "asc" }, { formatSlug: "asc" }],
    });

    return NextResponse.json({ data: items });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
