// POST /api/channels/[id]/idea-matrix/generate — Generate/refresh idea matrix
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateIdeaMatrix } from "@/lib/content/generate-idea-matrix";
import type { CharacterBibleData } from "@/lib/content/character-bible-types";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { createTask, completeTask, failTask } from "@/lib/services/background-task";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;

  const rl = checkRateLimit("ai:idea-matrix", 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Quá nhiều yêu cầu. Vui lòng thử lại sau.", code: "RATE_LIMIT" },
      { status: 429 },
    );
  }

  let taskId: string | null = null;

  try {
    // Fetch channel + bible + formats
    const channel = await prisma.tikTokChannel.findUnique({ where: { id } });
    if (!channel) {
      return NextResponse.json({ error: "Không tìm thấy kênh" }, { status: 404 });
    }

    const bible = await prisma.characterBible.findUnique({ where: { channelId: id } });
    if (!bible) {
      return NextResponse.json(
        { error: "Chưa có Character Bible. Tạo Character Bible trước khi generate Idea Matrix." },
        { status: 400 },
      );
    }

    const formats = await prisma.formatTemplate.findMany({
      where: { channelId: id, isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true, description: true },
    });

    if (formats.length === 0) {
      return NextResponse.json(
        { error: "Chưa có Format Template. Seed format mặc định trước." },
        { status: 400 },
      );
    }

    // Create background task for tracking
    taskId = await createTask({
      type: "idea_matrix",
      label: "Đang tạo Idea Matrix...",
      channelId: id,
    });

    // Generate ideas via AI
    const ideas = await generateIdeaMatrix(
      bible as unknown as CharacterBibleData,
      formats,
      channel.personaName,
    );

    // Delete old "fresh" ideas (keep picked/briefed)
    await prisma.ideaMatrixItem.deleteMany({
      where: { channelId: id, status: "fresh" },
    });

    // Save new ideas
    await prisma.ideaMatrixItem.createMany({
      data: ideas.map((idea) => ({
        channelId: id,
        bibleLayer: idea.bibleLayer,
        layerDetail: idea.layerDetail,
        formatSlug: idea.formatSlug,
        ideaTitle: idea.ideaTitle,
        hookSuggestions: idea.hookSuggestions,
        angle: idea.angle,
        notes: idea.notes,
        status: "fresh",
      })),
    });

    await completeTask(taskId, `${ideas.length} ý tưởng`).catch(() => {});

    return NextResponse.json({
      data: { created: ideas.length },
      message: `Đã tạo ${ideas.length} ý tưởng mới`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("[idea-matrix/generate]", msg);
    if (taskId) await failTask(taskId, msg).catch(() => {});
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
