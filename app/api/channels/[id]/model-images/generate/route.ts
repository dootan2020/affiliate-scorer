// POST /api/channels/[id]/model-images/generate — trigger model image generation
// Generates hero image directly, then fires 7 parallel internal requests.
// No after() — all work done before response to ensure reliability on Vercel.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { createTask, updateTaskProgress, failTask } from "@/lib/services/background-task";
import { getApiKey } from "@/lib/ai/providers";
import { generateGeminiImage } from "@/lib/ai/gemini-image-generator";
import { POSES, buildPrompt } from "@/lib/ai/model-image-config";

interface Ctx {
  params: Promise<{ id: string }>;
}

function getInternalUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL
    ?? (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
  ) + "/api/internal/generate-model-images";
}

export async function POST(_req: Request, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;

  const rl = checkRateLimit("ai:model-images", 3, 120_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Quá nhiều yêu cầu. Vui lòng thử lại sau." },
      { status: 429 },
    );
  }

  try {
    const channel = await prisma.tikTokChannel.findUnique({
      where: { id },
      select: { id: true, niche: true },
    });
    if (!channel) {
      return NextResponse.json({ error: "Không tìm thấy kênh" }, { status: 404 });
    }

    const apiKey = process.env.GEMINI_API_KEY ?? (await getApiKey("google"));
    if (!apiKey) {
      return NextResponse.json(
        { error: "Chưa cấu hình API key Gemini. Vào Settings → AI Models để thêm Google API key." },
        { status: 503 },
      );
    }

    const taskId = await createTask({
      type: "model_image_generation",
      label: "Đang tạo bộ hình nhân vật AI...",
      channelId: id,
    });

    // Phase 1: Generate hero image directly in this function (~44s)
    const heroPose = POSES[0];
    const heroPrompt = buildPrompt(heroPose, channel.niche, false);

    console.log("[model-images] Phase 1: generating hero...");
    const heroResult = await generateGeminiImage(apiKey, heroPrompt);

    if (!heroResult.imageBase64) {
      await failTask(taskId, `Hero generation failed: ${heroResult.error}`);
      return NextResponse.json({ taskId, error: heroResult.error }, { status: 500 });
    }

    // Save hero to DB
    const heroBuffer = Buffer.from(heroResult.imageBase64, "base64");
    await prisma.channelModelImage.upsert({
      where: { channelId_poseType: { channelId: id, poseType: heroPose.type } },
      create: { channelId: id, poseType: heroPose.type, imageData: heroBuffer, mimeType: "image/png", prompt: heroPrompt },
      update: { imageData: heroBuffer, mimeType: "image/png", prompt: heroPrompt, createdAt: new Date() },
    });

    await updateTaskProgress(taskId, 13, "Tạo hình nhân vật (1/8)");
    console.log(`[model-images] Hero done (${(heroResult.durationMs / 1000).toFixed(1)}s). Firing 7 parallel chunks...`);

    // Phase 2: Fire 7 parallel requests for remaining poses
    // These are fire-and-forget — they run as independent Vercel functions.
    // We do NOT use after() — we fire them BEFORE returning the response.
    const internalUrl = getInternalUrl();
    const firePromises = [];
    for (let i = 1; i < POSES.length; i++) {
      firePromises.push(
        fetch(internalUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channelId: id, taskId, chunkIndex: i, niche: channel.niche }),
        }).catch((err) => {
          console.error(`[model-images] Fire chunk ${i} error:`, err);
        }),
      );
    }

    // Wait for all fetch calls to be SENT (TCP established, not completed)
    // Promise.allSettled resolves when all fetches get their response headers
    // But we DON'T want to wait for all 7 to complete (~44s each)
    // So we use Promise.race with a timeout to ensure at least the requests are sent
    await Promise.race([
      Promise.allSettled(firePromises),
      new Promise(resolve => setTimeout(resolve, 5000)), // 5s max wait
    ]);

    return NextResponse.json({ taskId });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("[model-images/generate]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
