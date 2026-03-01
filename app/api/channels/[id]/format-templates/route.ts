// GET, POST /api/channels/[id]/format-templates
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validations/validate-body";
import { createFormatTemplateSchema } from "@/lib/validations/schemas-character";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;
  try {
    const templates = await prisma.formatTemplate.findMany({
      where: { channelId: id },
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
    const channel = await prisma.tikTokChannel.findUnique({ where: { id } });
    if (!channel) {
      return NextResponse.json({ error: "Không tìm thấy kênh" }, { status: 404 });
    }

    const validation = await validateBody(req, createFormatTemplateSchema);
    if (validation.error) return validation.error;
    const data = validation.data;

    // Check slug uniqueness within channel
    const existing = await prisma.formatTemplate.findUnique({
      where: { channelId_slug: { channelId: id, slug: data.slug } },
    });
    if (existing) {
      return NextResponse.json({ error: `Format "${data.slug}" đã tồn tại trong kênh` }, { status: 409 });
    }

    const template = await prisma.formatTemplate.create({
      data: { channelId: id, ...data },
    });

    return NextResponse.json({ data: template }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
