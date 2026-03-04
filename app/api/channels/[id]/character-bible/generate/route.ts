// POST /api/channels/[id]/character-bible/generate — AI generate (non-blocking)
import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/db";
import { generateCharacterBible } from "@/lib/content/generate-character-bible";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { createTask, completeTask, failTask } from "@/lib/services/background-task";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;

  const rl = checkRateLimit("ai:character-bible", 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Quá nhiều yêu cầu. Vui lòng thử lại sau.", code: "RATE_LIMIT" },
      { status: 429 },
    );
  }

  try {
    const channel = await prisma.tikTokChannel.findUnique({ where: { id } });
    if (!channel) {
      return NextResponse.json({ error: "Không tìm thấy kênh" }, { status: 404 });
    }

    const taskId = await createTask({
      type: "character_bible",
      label: "Đang tạo Character Bible...",
      channelId: id,
    });

    after(async () => {
      try {
        const bibleData = await generateCharacterBible({
          niche: channel.niche,
          personaName: channel.personaName,
          personaDesc: channel.personaDesc,
          voiceStyle: channel.voiceStyle,
          targetAudience: channel.targetAudience,
          subNiche: channel.subNiche,
          usp: channel.usp,
        });

        const jsonData = JSON.parse(JSON.stringify(bibleData)) as Record<string, unknown>;

        await prisma.characterBible.upsert({
          where: { channelId: id },
          create: { channelId: id, ...jsonData, generatedByAi: true, aiGeneratedAt: new Date() },
          update: { ...jsonData, generatedByAi: true, aiGeneratedAt: new Date() },
        });

        await completeTask(taskId, "Character Bible");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Lỗi tạo Character Bible";
        console.error("[character-bible/generate]", msg);
        await failTask(taskId, msg).catch(() => {});
      }
    });

    return NextResponse.json({ taskId });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("[character-bible/generate]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
