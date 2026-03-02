// GET, POST /api/channels/[id]/series
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validations/validate-body";
import { createSeriesSchema } from "@/lib/validations/schemas-series";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;
  try {
    const url = new URL(_req.url);
    const status = url.searchParams.get("status");
    const where: Record<string, unknown> = { channelId: id };
    if (status) where.status = status;

    const seriesList = await prisma.series.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { episodes: true } } },
    });
    return NextResponse.json({ data: seriesList });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;
  try {
    const channel = await prisma.tikTokChannel.findUnique({ where: { id } });
    if (!channel) return NextResponse.json({ error: "Không tìm thấy kênh" }, { status: 404 });

    const validation = await validateBody(req, createSeriesSchema);
    if (validation.error) return validation.error;

    const series = await prisma.series.create({
      data: { channelId: id, ...validation.data },
    });
    return NextResponse.json({ data: series }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
