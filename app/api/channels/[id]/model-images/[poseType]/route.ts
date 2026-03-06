// GET /api/channels/[id]/model-images/[poseType] — serve image binary
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface Ctx {
  params: Promise<{ id: string; poseType: string }>;
}

export async function GET(_req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id, poseType } = await ctx.params;

  const image = await prisma.channelModelImage.findUnique({
    where: { channelId_poseType: { channelId: id, poseType } },
    select: { imageData: true, mimeType: true },
  });

  if (!image) {
    return NextResponse.json({ error: "Không tìm thấy ảnh" }, { status: 404 });
  }

  return new NextResponse(image.imageData, {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
