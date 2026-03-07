import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const selectSchema = z.object({
  profileId: z.string().min(1),
  selectedNiche: z.string().min(1),
  channelId: z.string().min(1),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const parsed = selectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Du lieu khong hop le" },
        { status: 400 }
      );
    }

    const { profileId, selectedNiche, channelId } = parsed.data;

    await prisma.nicheProfile.update({
      where: { id: profileId },
      data: { selectedNiche, channelId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[niche-intelligence/select] Error:", error);
    return NextResponse.json(
      { error: "Khong the cap nhat niche profile" },
      { status: 500 }
    );
  }
}
