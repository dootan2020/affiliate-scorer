// GET, PUT, DELETE /api/channels/[id]/series/[seriesId]/episodes/[episodeId]
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validations/validate-body";
import { updateEpisodeSchema } from "@/lib/validations/schemas-series";

interface Ctx {
  params: Promise<{ id: string; seriesId: string; episodeId: string }>;
}

export async function GET(_req: Request, ctx: Ctx): Promise<NextResponse> {
  const { seriesId, episodeId } = await ctx.params;
  try {
    const ep = await prisma.episode.findFirst({
      where: { id: episodeId, seriesId },
    });
    if (!ep) return NextResponse.json({ error: "Không tìm thấy episode" }, { status: 404 });
    return NextResponse.json({ data: ep });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: Request, ctx: Ctx): Promise<NextResponse> {
  const { seriesId, episodeId } = await ctx.params;
  try {
    const existing = await prisma.episode.findFirst({ where: { id: episodeId, seriesId } });
    if (!existing) return NextResponse.json({ error: "Không tìm thấy episode" }, { status: 404 });

    const validation = await validateBody(req, updateEpisodeSchema);
    if (validation.error) return validation.error;

    const updated = await prisma.episode.update({
      where: { id: episodeId },
      data: validation.data,
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx): Promise<NextResponse> {
  const { seriesId, episodeId } = await ctx.params;
  try {
    const existing = await prisma.episode.findFirst({ where: { id: episodeId, seriesId } });
    if (!existing) return NextResponse.json({ error: "Không tìm thấy episode" }, { status: 404 });

    await prisma.episode.delete({ where: { id: episodeId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
