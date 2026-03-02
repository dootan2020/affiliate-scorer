// GET, POST /api/channels/[id]/video-bible/shot-codes
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validations/validate-body";
import { createShotCodeSchema } from "@/lib/validations/schemas-video-bible";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;
  try {
    const vb = await prisma.videoBible.findUnique({ where: { channelId: id } });
    if (!vb) return NextResponse.json({ data: [] });

    const shots = await prisma.shotCode.findMany({
      where: { videoBibleId: vb.id },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ data: shots });
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

    const validation = await validateBody(req, createShotCodeSchema);
    if (validation.error) return validation.error;

    // Check uniqueness
    const existing = await prisma.shotCode.findUnique({
      where: { videoBibleId_code: { videoBibleId: vb.id, code: validation.data.code } },
    });
    if (existing) {
      return NextResponse.json({ error: `Shot code ${validation.data.code} đã tồn tại` }, { status: 409 });
    }

    const shot = await prisma.shotCode.create({
      data: { videoBibleId: vb.id, ...validation.data },
    });
    return NextResponse.json({ data: shot }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
