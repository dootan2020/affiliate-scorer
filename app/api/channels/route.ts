import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

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
  contentMix: z.record(z.string(), z.number()).optional(),
  postingSchedule: z.record(z.string(), z.array(z.string())).optional(),
});

/** GET — list all channels */
export async function GET(): Promise<NextResponse> {
  try {
    const channels = await prisma.tikTokChannel.findMany({
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
    const parsed = createChannelSchema.parse(body);

    const channel = await prisma.tikTokChannel.create({
      data: parsed,
    });

    return NextResponse.json({ data: channel }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create channel" }, { status: 500 });
  }
}
