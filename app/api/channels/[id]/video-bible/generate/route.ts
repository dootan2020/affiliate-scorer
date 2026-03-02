// POST /api/channels/[id]/video-bible/generate — AI generate video bible
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateVideoBible } from "@/lib/content/generate-video-bible";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import type { CharacterBibleData } from "@/lib/content/character-bible-types";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;

  const rl = checkRateLimit("ai:video-bible", 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Quá nhiều yêu cầu. Vui lòng thử lại sau.", code: "RATE_LIMIT" },
      { status: 429 },
    );
  }

  try {
    const channel = await prisma.tikTokChannel.findUnique({ where: { id } });
    if (!channel) return NextResponse.json({ error: "Không tìm thấy kênh" }, { status: 404 });

    // Check lock
    const existing = await prisma.videoBible.findUnique({ where: { channelId: id } });
    if (existing?.locked) {
      return NextResponse.json({ error: "Video Bible đã bị khóa. Tạo version mới trước." }, { status: 403 });
    }

    // Fetch character bible for context
    const bible = await prisma.characterBible.findUnique({ where: { channelId: id } });

    const vbData = await generateVideoBible({
      personaName: channel.personaName,
      voiceStyle: channel.voiceStyle,
      niche: channel.niche,
      editingStyle: channel.editingStyle,
      productionStyle: channel.productionStyle,
      characterBible: bible as unknown as CharacterBibleData | null,
    });

    const jsonData = JSON.parse(JSON.stringify(vbData)) as Record<string, unknown>;

    const vb = await prisma.videoBible.upsert({
      where: { channelId: id },
      create: { channelId: id, ...jsonData, generatedByAi: true, aiGeneratedAt: new Date() },
      update: { ...jsonData, generatedByAi: true, aiGeneratedAt: new Date() },
    });

    return NextResponse.json({ data: vb, message: "Đã tạo Video Bible bằng AI" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("[video-bible/generate]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
