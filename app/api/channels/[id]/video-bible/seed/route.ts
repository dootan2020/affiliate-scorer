// POST /api/channels/[id]/video-bible/seed — Seed default shot codes + scene templates
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEFAULT_SHOT_CODES } from "@/lib/content/default-shot-codes";
import { DEFAULT_SCENE_TEMPLATES } from "@/lib/content/default-scene-templates";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;
  try {
    // Ensure Video Bible exists — create minimal if not
    let vb = await prisma.videoBible.findUnique({ where: { channelId: id } });
    if (!vb) {
      const channel = await prisma.tikTokChannel.findUnique({ where: { id } });
      if (!channel) return NextResponse.json({ error: "Không tìm thấy kênh" }, { status: 404 });
      vb = await prisma.videoBible.create({ data: { channelId: id } });
    }

    // Seed shot codes (skip existing)
    let shotsCreated = 0;
    for (const sc of DEFAULT_SHOT_CODES) {
      const exists = await prisma.shotCode.findUnique({
        where: { videoBibleId_code: { videoBibleId: vb.id, code: sc.code } },
      });
      if (!exists) {
        await prisma.shotCode.create({ data: { videoBibleId: vb.id, ...sc } });
        shotsCreated++;
      }
    }

    // Seed scene templates (skip existing)
    let templatesCreated = 0;
    for (const st of DEFAULT_SCENE_TEMPLATES) {
      const exists = await prisma.sceneTemplate.findUnique({
        where: { videoBibleId_slug: { videoBibleId: vb.id, slug: st.slug } },
      });
      if (!exists) {
        await prisma.sceneTemplate.create({
          data: {
            videoBibleId: vb.id,
            name: st.name,
            slug: st.slug,
            description: st.description ?? null,
            blocks: JSON.parse(JSON.stringify(st.blocks)),
            defaultShotSequence: st.defaultShotSequence ?? [],
            rules: st.rules ? JSON.parse(JSON.stringify(st.rules)) : undefined,
          },
        });
        templatesCreated++;
      }
    }

    const totalShots = await prisma.shotCode.count({ where: { videoBibleId: vb.id } });
    const totalTemplates = await prisma.sceneTemplate.count({ where: { videoBibleId: vb.id } });

    return NextResponse.json({
      data: { shotsCreated, templatesCreated, totalShots, totalTemplates },
      message: shotsCreated + templatesCreated === 0
        ? "Tất cả shot codes và scene templates mặc định đã tồn tại"
        : `Đã tạo ${shotsCreated} shot codes, ${templatesCreated} scene templates`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
