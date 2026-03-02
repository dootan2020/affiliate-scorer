// GET, PUT, DELETE /api/channels/[id]/video-bible
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validations/validate-body";
import { upsertVideoBibleSchema } from "@/lib/validations/schemas-video-bible";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;
  try {
    const vb = await prisma.videoBible.findUnique({
      where: { channelId: id },
      include: { shotCodes: { orderBy: { sortOrder: "asc" } }, sceneTemplates: { orderBy: { sortOrder: "asc" } } },
    });
    return NextResponse.json({ data: vb ?? null });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;
  try {
    const channel = await prisma.tikTokChannel.findUnique({ where: { id } });
    if (!channel) return NextResponse.json({ error: "Không tìm thấy kênh" }, { status: 404 });

    // Check lock
    const existing = await prisma.videoBible.findUnique({ where: { channelId: id } });
    if (existing?.locked) {
      return NextResponse.json({ error: "Video Bible đã bị khóa. Tạo version mới để chỉnh sửa." }, { status: 403 });
    }

    const validation = await validateBody(req, upsertVideoBibleSchema);
    if (validation.error) return validation.error;

    const vb = await prisma.videoBible.upsert({
      where: { channelId: id },
      create: { channelId: id, ...validation.data },
      update: validation.data,
    });
    return NextResponse.json({ data: vb });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;
  try {
    await prisma.videoBible.deleteMany({ where: { channelId: id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
