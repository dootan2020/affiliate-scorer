// POST /api/channels/[id]/series/[seriesId]/episodes/generate — AI generate episodes
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateEpisodes } from "@/lib/content/generate-episodes";
import { validateBody } from "@/lib/validations/validate-body";
import { generateEpisodesSchema } from "@/lib/validations/schemas-series";
import { checkRateLimit } from "@/lib/utils/rate-limit";

interface Ctx {
  params: Promise<{ id: string; seriesId: string }>;
}

export async function POST(req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id, seriesId } = await ctx.params;

  const rl = checkRateLimit("ai:episodes", 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Quá nhiều yêu cầu.", code: "RATE_LIMIT" }, { status: 429 });
  }

  try {
    const [channel, series] = await Promise.all([
      prisma.tikTokChannel.findUnique({ where: { id } }),
      prisma.series.findFirst({ where: { id: seriesId, channelId: id } }),
    ]);
    if (!channel) return NextResponse.json({ error: "Không tìm thấy kênh" }, { status: 404 });
    if (!series) return NextResponse.json({ error: "Không tìm thấy series" }, { status: 404 });

    const validation = await validateBody(req, generateEpisodesSchema);
    if (validation.error) return validation.error;
    const { count, goalDistribution } = validation.data;

    // Get available format slugs
    const formats = await prisma.formatTemplate.findMany({
      where: { channelId: id, isActive: true },
      select: { slug: true },
    });

    const episodes = await generateEpisodes({
      seriesName: series.name,
      seriesType: series.type,
      premise: series.premise,
      personaName: channel.personaName,
      niche: channel.niche,
      formatSlugs: formats.map((f) => f.slug),
      count,
      goalDistribution,
    });

    // Save episodes to DB
    const created = [];
    for (const ep of episodes) {
      const record = await prisma.episode.create({
        data: {
          seriesId,
          episodeNumber: ep.episodeNumber,
          title: ep.title,
          goal: ep.goal ?? null,
          formatSlug: ep.formatSlug ?? null,
          pillar: ep.pillar ?? null,
          notes: ep.notes ?? null,
        },
      });
      created.push(record);
    }

    return NextResponse.json({
      data: created,
      message: `Đã tạo ${created.length} episodes bằng AI`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("[episodes/generate]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
