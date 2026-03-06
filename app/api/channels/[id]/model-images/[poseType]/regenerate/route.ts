// POST /api/channels/[id]/model-images/[poseType]/regenerate — regenerate a single pose
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getApiKey } from "@/lib/ai/providers";
import { generateGeminiImage } from "@/lib/ai/gemini-image-generator";
import { POSES, buildPrompt } from "@/lib/ai/model-image-config";
import { checkRateLimit } from "@/lib/utils/rate-limit";

interface Ctx {
  params: Promise<{ id: string; poseType: string }>;
}

export async function POST(_req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id, poseType } = await ctx.params;

  const rl = checkRateLimit("ai:model-regen", 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Quá nhiều yêu cầu." }, { status: 429 });
  }

  const pose = POSES.find(p => p.type === poseType);
  if (!pose) {
    return NextResponse.json({ error: "Pose không hợp lệ" }, { status: 400 });
  }

  try {
    const channel = await prisma.tikTokChannel.findUnique({
      where: { id },
      select: { niche: true },
    });
    if (!channel) {
      return NextResponse.json({ error: "Không tìm thấy kênh" }, { status: 404 });
    }

    const apiKey = process.env.GEMINI_API_KEY ?? (await getApiKey("google"));
    if (!apiKey) {
      return NextResponse.json(
        { error: "Chưa cấu hình Gemini API key" },
        { status: 503 },
      );
    }

    // Get hero image as reference (unless regenerating hero itself)
    let referenceBase64: string | undefined;
    const isHero = poseType === "hero_fullbody";

    if (!isHero) {
      const heroImage = await prisma.channelModelImage.findUnique({
        where: { channelId_poseType: { channelId: id, poseType: "hero_fullbody" } },
        select: { imageData: true },
      });
      if (heroImage?.imageData) {
        referenceBase64 = Buffer.from(heroImage.imageData).toString("base64");
      }
    }

    const prompt = buildPrompt(pose, channel.niche, !isHero);
    const result = await generateGeminiImage(apiKey, prompt, referenceBase64);

    if (!result.imageBase64) {
      return NextResponse.json(
        { error: result.error ?? "Không thể tạo ảnh" },
        { status: 500 },
      );
    }

    const imageBuffer = Buffer.from(result.imageBase64, "base64");
    await prisma.channelModelImage.upsert({
      where: { channelId_poseType: { channelId: id, poseType } },
      create: {
        channelId: id,
        poseType,
        imageData: imageBuffer,
        mimeType: "image/png",
        prompt,
      },
      update: {
        imageData: imageBuffer,
        mimeType: "image/png",
        prompt,
        createdAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, durationMs: result.durationMs });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("[model-images/regenerate]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
