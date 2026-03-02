// GET, POST /api/channels/[id]/series/[seriesId]/episodes
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validations/validate-body";
import { createEpisodeSchema } from "@/lib/validations/schemas-series";

interface Ctx {
  params: Promise<{ id: string; seriesId: string }>;
}

export async function GET(_req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id, seriesId } = await ctx.params;
  try {
    const series = await prisma.series.findFirst({ where: { id: seriesId, channelId: id } });
    if (!series) return NextResponse.json({ error: "Không tìm thấy series" }, { status: 404 });

    const episodes = await prisma.episode.findMany({
      where: { seriesId },
      orderBy: { episodeNumber: "asc" },
    });
    return NextResponse.json({ data: episodes });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id, seriesId } = await ctx.params;
  try {
    const series = await prisma.series.findFirst({ where: { id: seriesId, channelId: id } });
    if (!series) return NextResponse.json({ error: "Không tìm thấy series" }, { status: 404 });

    const validation = await validateBody(req, createEpisodeSchema);
    if (validation.error) return validation.error;

    const episode = await prisma.episode.create({
      data: { seriesId, ...validation.data },
    });
    return NextResponse.json({ data: episode }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
