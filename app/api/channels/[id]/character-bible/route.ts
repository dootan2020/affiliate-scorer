// GET, PUT, DELETE /api/channels/[id]/character-bible
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validations/validate-body";
import { upsertCharacterBibleSchema } from "@/lib/validations/schemas-character";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;
  try {
    const bible = await prisma.characterBible.findUnique({
      where: { channelId: id },
    });
    if (!bible) {
      return NextResponse.json({ data: null });
    }
    return NextResponse.json({ data: bible });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;
  try {
    // Verify channel exists
    const channel = await prisma.tikTokChannel.findUnique({ where: { id } });
    if (!channel) {
      return NextResponse.json({ error: "Không tìm thấy kênh" }, { status: 404 });
    }

    const validation = await validateBody(req, upsertCharacterBibleSchema);
    if (validation.error) return validation.error;
    const data = validation.data;

    const bible = await prisma.characterBible.upsert({
      where: { channelId: id },
      create: {
        channelId: id,
        ...data,
      },
      update: data,
    });

    return NextResponse.json({ data: bible });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;
  try {
    await prisma.characterBible.deleteMany({ where: { channelId: id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
