// GET, PUT, DELETE /api/channels/[id]/series/[seriesId]
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validations/validate-body";
import { updateSeriesSchema } from "@/lib/validations/schemas-series";

interface Ctx {
  params: Promise<{ id: string; seriesId: string }>;
}

export async function GET(_req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id, seriesId } = await ctx.params;
  try {
    const series = await prisma.series.findFirst({
      where: { id: seriesId, channelId: id },
      include: { episodes: { orderBy: { episodeNumber: "asc" } } },
    });
    if (!series) return NextResponse.json({ error: "Không tìm thấy series" }, { status: 404 });
    return NextResponse.json({ data: series });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id, seriesId } = await ctx.params;
  try {
    const existing = await prisma.series.findFirst({ where: { id: seriesId, channelId: id } });
    if (!existing) return NextResponse.json({ error: "Không tìm thấy series" }, { status: 404 });

    const validation = await validateBody(req, updateSeriesSchema);
    if (validation.error) return validation.error;

    const updated = await prisma.series.update({
      where: { id: seriesId },
      data: validation.data,
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id, seriesId } = await ctx.params;
  try {
    const existing = await prisma.series.findFirst({ where: { id: seriesId, channelId: id } });
    if (!existing) return NextResponse.json({ error: "Không tìm thấy series" }, { status: 404 });

    await prisma.series.delete({ where: { id: seriesId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
