// POST /api/internal/generate-model-images — two-phase parallel architecture
// Phase 1 (chunkIndex=0): Generate hero image, then fire 7 parallel requests
// Phase 2 (chunkIndex=1-7): Each independently generates 1 pose using hero from DB
import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/db";
import { getApiKey } from "@/lib/ai/providers";
import { generateGeminiImage } from "@/lib/ai/gemini-image-generator";
import { POSES, buildPrompt } from "@/lib/ai/model-image-config";
import { updateTaskProgress, completeTask, failTask } from "@/lib/services/background-task";

interface ChunkPayload {
  channelId: string;
  taskId: string;
  chunkIndex: number;
  niche: string;
}

function getRelayUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL
    ?? (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
  ) + "/api/internal/generate-model-images";
}

async function generateAndSave(
  apiKey: string,
  channelId: string,
  chunkIndex: number,
  niche: string,
): Promise<{ success: boolean; error?: string; durationMs: number }> {
  const pose = POSES[chunkIndex];
  const isHero = chunkIndex === 0;

  // Read hero from DB for non-hero poses
  let referenceBase64: string | undefined;
  if (!isHero) {
    const heroRecord = await prisma.channelModelImage.findUnique({
      where: { channelId_poseType: { channelId, poseType: "hero_fullbody" } },
      select: { imageData: true },
    });
    if (heroRecord?.imageData) {
      referenceBase64 = Buffer.from(heroRecord.imageData).toString("base64");
    }
  }

  const prompt = buildPrompt(pose, niche, !isHero);
  const result = await generateGeminiImage(apiKey, prompt, referenceBase64);

  if (!result.imageBase64) {
    return { success: false, error: result.error ?? "No image", durationMs: result.durationMs };
  }

  const imageBuffer = Buffer.from(result.imageBase64, "base64");
  await prisma.channelModelImage.upsert({
    where: { channelId_poseType: { channelId, poseType: pose.type } },
    create: { channelId, poseType: pose.type, imageData: imageBuffer, mimeType: "image/png", prompt },
    update: { imageData: imageBuffer, mimeType: "image/png", prompt, createdAt: new Date() },
  });

  return { success: true, durationMs: result.durationMs };
}

export async function POST(req: Request): Promise<NextResponse> {
  const { channelId, taskId, chunkIndex, niche } = (await req.json()) as ChunkPayload;
  const totalPoses = POSES.length;

  try {
    const apiKey = process.env.GEMINI_API_KEY ?? (await getApiKey("google"));
    if (!apiKey) {
      await failTask(taskId, "Gemini API key not configured");
      return NextResponse.json({ error: "No API key" }, { status: 503 });
    }

    const pose = POSES[chunkIndex];
    console.log(`[model-images] Chunk ${chunkIndex + 1}/${totalPoses}: ${pose.type}`);

    const result = await generateAndSave(apiKey, channelId, chunkIndex, niche);

    if (result.success) {
      console.log(`[model-images] Done ${pose.type} (${(result.durationMs / 1000).toFixed(1)}s)`);
    } else {
      console.error(`[model-images] Failed ${pose.type}: ${result.error}`);
    }

    // Count how many images now exist for this channel
    const imageCount = await prisma.channelModelImage.count({ where: { channelId } });
    const progress = Math.round((imageCount / totalPoses) * 100);

    await updateTaskProgress(
      taskId,
      progress,
      `Tạo hình nhân vật (${imageCount}/${totalPoses})`,
    );

    // If all done, mark task complete
    if (imageCount >= totalPoses) {
      await completeTask(taskId, `${totalPoses} hình đã tạo`);
      return NextResponse.json({ done: true, imageCount });
    }

    // Phase 1: After hero is generated, fire 7 parallel requests for remaining poses
    if (chunkIndex === 0 && result.success) {
      after(() => {
        const relayUrl = getRelayUrl();
        for (let i = 1; i < totalPoses; i++) {
          fetch(relayUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ channelId, taskId, chunkIndex: i, niche } satisfies ChunkPayload),
          }).catch((err) => {
            console.error(`[model-images] Fire chunk ${i} error:`, err);
          });
        }
      });
    }

    return NextResponse.json({ chunk: chunkIndex, imageCount });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[model-images] Chunk error:", msg);
    await failTask(taskId, msg).catch(() => {});
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
