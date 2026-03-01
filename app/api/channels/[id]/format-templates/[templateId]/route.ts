// PUT, DELETE /api/channels/[id]/format-templates/[templateId]
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validations/validate-body";
import { updateFormatTemplateSchema } from "@/lib/validations/schemas-character";

interface Ctx {
  params: Promise<{ id: string; templateId: string }>;
}

export async function PUT(req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id, templateId } = await ctx.params;
  try {
    const existing = await prisma.formatTemplate.findFirst({
      where: { id: templateId, channelId: id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy format template" }, { status: 404 });
    }

    const validation = await validateBody(req, updateFormatTemplateSchema);
    if (validation.error) return validation.error;
    const data = validation.data;

    // If slug changed, check uniqueness
    if (data.slug && data.slug !== existing.slug) {
      const conflict = await prisma.formatTemplate.findUnique({
        where: { channelId_slug: { channelId: id, slug: data.slug } },
      });
      if (conflict) {
        return NextResponse.json({ error: `Format "${data.slug}" đã tồn tại` }, { status: 409 });
      }
    }

    const updated = await prisma.formatTemplate.update({
      where: { id: templateId },
      data,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id, templateId } = await ctx.params;
  try {
    const existing = await prisma.formatTemplate.findFirst({
      where: { id: templateId, channelId: id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy format template" }, { status: 404 });
    }

    await prisma.formatTemplate.delete({ where: { id: templateId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
