// GET, POST /api/channels/[id]/video-bible/scene-templates
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validations/validate-body";
import { createSceneTemplateSchema } from "@/lib/validations/schemas-video-bible";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;
  try {
    const vb = await prisma.videoBible.findUnique({ where: { channelId: id } });
    if (!vb) return NextResponse.json({ data: [] });

    const templates = await prisma.sceneTemplate.findMany({
      where: { videoBibleId: vb.id },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ data: templates });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;
  try {
    const vb = await prisma.videoBible.findUnique({ where: { channelId: id } });
    if (!vb) return NextResponse.json({ error: "Chưa có Video Bible" }, { status: 404 });

    const validation = await validateBody(req, createSceneTemplateSchema);
    if (validation.error) return validation.error;

    const existing = await prisma.sceneTemplate.findUnique({
      where: { videoBibleId_slug: { videoBibleId: vb.id, slug: validation.data.slug } },
    });
    if (existing) {
      return NextResponse.json({ error: `Template slug "${validation.data.slug}" đã tồn tại` }, { status: 409 });
    }

    const template = await prisma.sceneTemplate.create({
      data: { videoBibleId: vb.id, ...validation.data },
    });
    return NextResponse.json({ data: template }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
