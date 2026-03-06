// GET /api/channels/[id]/model-images — list all model images for a channel
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;

  const images = await prisma.channelModelImage.findMany({
    where: { channelId: id },
    select: {
      id: true,
      poseType: true,
      mimeType: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ data: images });
}
