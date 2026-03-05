import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toJsonValue } from "@/lib/utils/typed-json";
import type { InputJsonValue } from "@/app/generated/prisma/internal/prismaNamespace";
import { JsonNull } from "@/app/generated/prisma/internal/prismaNamespace";
import { z } from "zod";
import { normalizeNicheKey } from "@/lib/suggestions/niche-category-map";

const updateChannelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  handle: z.string().max(100).nullable().optional(),
  niche: z.string().optional(),
  personaName: z.string().min(1).max(100).optional(),
  personaDesc: z.string().min(1).max(500).optional(),
  voiceStyle: z.enum(["casual", "professional", "energetic", "calm"]).optional(),
  targetAudience: z.string().max(200).nullable().optional(),
  colorPrimary: z.string().max(7).nullable().optional(),
  colorSecondary: z.string().max(7).nullable().optional(),
  fontStyle: z.enum(["modern", "elegant", "playful", "minimal"]).nullable().optional(),
  editingStyle: z.enum(["fast_cut", "smooth", "cinematic", "minimal"]).nullable().optional(),
  // New expert fields
  subNiche: z.string().max(200).nullable().optional(),
  usp: z.string().max(500).nullable().optional(),
  contentPillars: z.array(z.string()).nullable().optional(),
  hookBank: z.array(z.string()).nullable().optional(),
  contentMix: z.record(z.string(), z.number()).nullable().optional(),
  postsPerDay: z.number().int().min(1).max(10).nullable().optional(),
  postingSchedule: z.record(z.string(), z.unknown()).nullable().optional(),
  seriesSchedule: z.array(z.object({
    name: z.string(),
    dayOfWeek: z.string(),
    contentPillar: z.string(),
  })).nullable().optional(),
  contentPillarDetails: z.array(z.object({
    pillar: z.string(),
    aiFeasibility: z.enum(["high", "medium", "low"]),
    recommendedFormats: z.array(z.string()),
    productionNotes: z.string(),
  })).nullable().optional(),
  videoFormats: z.array(z.object({
    contentType: z.string(),
    primaryFormat: z.string(),
    secondaryFormat: z.string(),
    aiToolSuggestion: z.string(),
    productionNotes: z.string(),
  })).nullable().optional(),
  productionStyle: z.enum(["voiceover_broll", "talking_head", "product_showcase", "hybrid"]).nullable().optional(),
  productionStyleReason: z.string().max(500).nullable().optional(),
  ctaTemplates: z.record(z.string(), z.string()).nullable().optional(),
  competitorChannels: z.array(z.object({
    handle: z.string(),
    followers: z.string(),
    whyReference: z.string(),
  })).nullable().optional(),
  generatedByAi: z.boolean().optional(),
  aiGeneratedAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
});

/** Convert nullable JSON fields to Prisma-compatible values */
function toNullableJson(val: unknown): InputJsonValue | typeof JsonNull | undefined {
  if (val === undefined) return undefined;
  if (val === null) return JsonNull;
  return toJsonValue(val);
}

/** GET — single channel with aggregate stats */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const channel = await prisma.tikTokChannel.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            contentAssets: true,
            contentSlots: true,
            briefs: true,
            refreshLogs: true,
          },
        },
        contentAssets: {
          where: { status: "published" },
          select: { id: true },
        },
        refreshLogs: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
      },
    });
    if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

    const { _count, contentAssets: publishedAssets, refreshLogs, ...channelData } = channel;
    return NextResponse.json({
      data: {
        ...channelData,
        stats: {
          totalAssets: _count.contentAssets,
          publishedAssets: publishedAssets.length,
          totalSlots: _count.contentSlots,
          totalBriefs: _count.briefs,
          lastRefresh: refreshLogs[0]?.createdAt ?? null,
        },
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch channel" }, { status: 500 });
  }
}

/** PUT — update channel */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const body = await req.json();
    const {
      contentPillars, hookBank, contentMix, postingSchedule,
      seriesSchedule, ctaTemplates, competitorChannels,
      contentPillarDetails, videoFormats,
      aiGeneratedAt, ...rest
    } = updateChannelSchema.parse(body);

    // Normalize niche key for consistent matching
    if (rest.niche) rest.niche = normalizeNicheKey(rest.niche);

    const channel = await prisma.tikTokChannel.update({
      where: { id },
      data: {
        ...rest,
        contentPillars: toNullableJson(contentPillars),
        hookBank: toNullableJson(hookBank),
        contentMix: toNullableJson(contentMix),
        postingSchedule: toNullableJson(postingSchedule),
        seriesSchedule: toNullableJson(seriesSchedule),
        contentPillarDetails: toNullableJson(contentPillarDetails),
        videoFormats: toNullableJson(videoFormats),
        ctaTemplates: toNullableJson(ctaTemplates),
        competitorChannels: toNullableJson(competitorChannels),
        aiGeneratedAt: aiGeneratedAt ? new Date(aiGeneratedAt) : aiGeneratedAt === null ? null : undefined,
      },
    });

    return NextResponse.json({ data: channel });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update channel" }, { status: 500 });
  }
}

/** DELETE — delete channel */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    await prisma.tikTokChannel.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete channel" }, { status: 500 });
  }
}
