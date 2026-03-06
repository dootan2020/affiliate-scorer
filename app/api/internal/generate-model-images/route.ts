// POST /api/internal/generate-model-images — chunked relay: 1 image/chunk
// Each chunk generates 1 image (~44s < 60s Vercel timeout), then relays to self.
// Hero image is read from DB (not passed in payload) to keep request body small.
import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/db";
import { getApiKey } from "@/lib/ai/providers";
import { generateGeminiImage } from "@/lib/ai/gemini-image-generator";
import { POSES, buildPrompt } from "@/lib/ai/model-image-config";
import { updateTaskProgress, completeTask, failTask } from "@/lib/services/background-task";

interface ChunkPayload {
  channelId: string;
  taskId: string;
  chunkIndex: number; // 0-7, maps to POSES index
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

export async function POST(req: Request): Promise<NextResponse> {
  const payload = (await req.json()) as ChunkPayload;
  const { channelId, taskId, chunkIndex, niche } = payload;

  const totalPoses = POSES.length; // 8

  if (chunkIndex >= totalPoses) {
    await completeTask(taskId, `${totalPoses} hình đã tạo`);
    return NextResponse.json({ done: true });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY ?? (await getApiKey("google"));
    if (!apiKey) {
      await failTask(taskId, "Gemini API key not configured");
      return NextResponse.json({ error: "No API key" }, { status: 503 });
    }

    const pose = POSES[chunkIndex];
    const isHero = chunkIndex === 0;

    // For non-hero poses, read hero image from DB as reference
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

    console.log(`[model-images] Chunk ${chunkIndex + 1}/${totalPoses}: ${pose.type}`);

    const result = await generateGeminiImage(apiKey, prompt, referenceBase64);

    if (!result.imageBase64) {
      console.error(`[model-images] Failed ${pose.type}:`, result.error);
      await updateTaskProgress(
        taskId,
        Math.round(((chunkIndex + 1) / totalPoses) * 100),
        `${pose.type}: lỗi — ${result.error?.slice(0, 100)}`,
      );
    } else {
      const imageBuffer = Buffer.from(result.imageBase64, "base64");
      await prisma.channelModelImage.upsert({
        where: { channelId_poseType: { channelId, poseType: pose.type } },
        create: {
          channelId,
          poseType: pose.type,
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

      await updateTaskProgress(
        taskId,
        Math.round(((chunkIndex + 1) / totalPoses) * 100),
        `Tạo hình nhân vật (${chunkIndex + 1}/${totalPoses})`,
      );

      console.log(`[model-images] Done ${pose.type} (${(result.durationMs / 1000).toFixed(1)}s)`);
    }

    // If last chunk, complete
    if (chunkIndex + 1 >= totalPoses) {
      await completeTask(taskId, `${totalPoses} hình đã tạo`);
      return NextResponse.json({ done: true });
    }

    // Relay next chunk — small payload (no hero base64)
    const nextPayload: ChunkPayload = {
      channelId,
      taskId,
      chunkIndex: chunkIndex + 1,
      niche,
    };

    after(() => {
      fetch(getRelayUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextPayload),
      }).catch((err) => {
        console.error("[model-images] Relay error:", err);
        void failTask(taskId, `Relay failed at chunk ${chunkIndex + 1}`).catch(() => {});
      });
    });

    return NextResponse.json({ chunk: chunkIndex, next: chunkIndex + 1 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[model-images] Chunk error:", msg);
    await failTask(taskId, msg).catch(() => {});
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
