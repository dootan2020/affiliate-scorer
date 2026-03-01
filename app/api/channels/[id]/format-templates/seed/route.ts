// POST /api/channels/[id]/format-templates/seed — Seed 10 default formats (idempotent)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEFAULT_FORMAT_TEMPLATES } from "@/lib/content/default-format-templates";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;
  try {
    const channel = await prisma.tikTokChannel.findUnique({ where: { id } });
    if (!channel) {
      return NextResponse.json({ error: "Không tìm thấy kênh" }, { status: 404 });
    }

    // Get existing slugs to avoid duplicates
    const existing = await prisma.formatTemplate.findMany({
      where: { channelId: id },
      select: { slug: true },
    });
    const existingSlugs = new Set(existing.map((t) => t.slug));

    // Only create missing templates
    const toCreate = DEFAULT_FORMAT_TEMPLATES.filter((t) => !existingSlugs.has(t.slug));

    if (toCreate.length === 0) {
      return NextResponse.json({
        data: { created: 0, total: existing.length },
        message: "Tất cả format mặc định đã tồn tại",
      });
    }

    await prisma.formatTemplate.createMany({
      data: toCreate.map((t, i) => ({
        channelId: id,
        name: t.name,
        slug: t.slug,
        description: t.description,
        goal: t.goal,
        hookTemplate: t.hookTemplate,
        bodyTemplate: t.bodyTemplate,
        proofTemplate: t.proofTemplate,
        ctaTemplate: t.ctaTemplate,
        exampleScript: t.exampleScript,
        isDefault: true,
        sortOrder: i,
      })),
    });

    return NextResponse.json({
      data: { created: toCreate.length, total: existing.length + toCreate.length },
      message: `Đã tạo ${toCreate.length} format mặc định`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
