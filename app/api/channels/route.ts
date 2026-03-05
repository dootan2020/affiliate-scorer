import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toJsonValue } from "@/lib/utils/typed-json";
import type { InputJsonValue } from "@/app/generated/prisma/internal/prismaNamespace";
import { JsonNull } from "@/app/generated/prisma/internal/prismaNamespace";
import { z } from "zod";
import { normalizeNicheKey } from "@/lib/suggestions/niche-category-map";

/** Convert nullable JSON fields to Prisma-compatible values */
function toNullableJson(val: unknown): InputJsonValue | typeof JsonNull | undefined {
  if (val === undefined) return undefined;
  if (val === null) return JsonNull;
  return toJsonValue(val);
}

const createChannelSchema = z.object({
  name: z.string().min(1).max(100),
  handle: z.string().max(100).optional(),
  niche: z.string().default("beauty_skincare"),
  personaName: z.string().min(1).max(100),
  personaDesc: z.string().min(1).max(500),
  voiceStyle: z.enum(["casual", "professional", "energetic", "calm"]).default("casual"),
  targetAudience: z.string().max(200).optional(),
  colorPrimary: z.string().max(7).optional(),
  colorSecondary: z.string().max(7).optional(),
  fontStyle: z.enum(["modern", "elegant", "playful", "minimal"]).optional(),
  editingStyle: z.enum(["fast_cut", "smooth", "cinematic", "minimal"]).optional(),
  // New expert fields
  subNiche: z.string().max(200).optional(),
  usp: z.string().max(500).optional(),
  contentPillars: z.array(z.string()).optional(),
  hookBank: z.array(z.string()).optional(),
  contentMix: z.record(z.string(), z.number()).optional(),
  postsPerDay: z.number().int().min(1).max(10).optional(),
  postingSchedule: z.record(z.string(), z.unknown()).optional(),
  seriesSchedule: z.array(z.object({
    name: z.string(),
    dayOfWeek: z.string(),
    contentPillar: z.string(),
  })).optional(),
  contentPillarDetails: z.array(z.object({
    pillar: z.string(),
    aiFeasibility: z.enum(["high", "medium", "low"]),
    recommendedFormats: z.array(z.string()),
    productionNotes: z.string(),
  })).optional(),
  videoFormats: z.array(z.object({
    contentType: z.string(),
    primaryFormat: z.string(),
    secondaryFormat: z.string(),
    aiToolSuggestion: z.string(),
    productionNotes: z.string(),
  })).optional(),
  productionStyle: z.enum(["voiceover_broll", "talking_head", "product_showcase", "hybrid"]).optional(),
  productionStyleReason: z.string().max(500).optional(),
  ctaTemplates: z.record(z.string(), z.string()).optional(),
  competitorChannels: z.array(z.object({
    handle: z.string(),
    followers: z.string(),
    whyReference: z.string(),
  })).optional(),
  generatedByAi: z.boolean().optional(),
  aiGeneratedAt: z.string().datetime().optional(),
});

/** GET — list channels. ?active=true → only active channels */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";

    const channels = await prisma.tikTokChannel.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: channels });
  } catch {
    return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 });
  }
}

/** POST — create new channel */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const {
      contentPillars, hookBank, contentMix, postingSchedule,
      seriesSchedule, ctaTemplates, competitorChannels,
      contentPillarDetails, videoFormats,
      aiGeneratedAt, ...rest
    } = createChannelSchema.parse(body);

    // Normalize niche key for consistent matching
    if (rest.niche) rest.niche = normalizeNicheKey(rest.niche);

    const channel = await prisma.tikTokChannel.create({
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
        aiGeneratedAt: aiGeneratedAt ? new Date(aiGeneratedAt) : undefined,
      },
    });

    return NextResponse.json({ data: channel }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create channel" }, { status: 500 });
  }
}
