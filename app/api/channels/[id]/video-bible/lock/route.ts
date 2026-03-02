// POST /api/channels/[id]/video-bible/lock — Lock/unlock version
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;
  try {
    const existing = await prisma.videoBible.findUnique({ where: { channelId: id } });
    if (!existing) {
      return NextResponse.json({ error: "Chưa có Video Bible" }, { status: 404 });
    }

    const body = (await req.json()) as { locked?: boolean };
    const locked = body.locked ?? !existing.locked;

    const updated = await prisma.videoBible.update({
      where: { channelId: id },
      data: {
        locked,
        ...(locked && !existing.locked ? { version: existing.version + 1 } : {}),
      },
    });

    return NextResponse.json({
      data: updated,
      message: locked
        ? `Video Bible đã khóa tại version ${updated.version}`
        : "Video Bible đã mở khóa",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
