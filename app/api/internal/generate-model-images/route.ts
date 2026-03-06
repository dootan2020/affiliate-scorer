// POST /api/internal/generate-model-images — generate a single non-hero pose
// Called in parallel by the generate endpoint after hero is saved.
// Each invocation is an independent Vercel function (~44s < 60s timeout).
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getApiKey } from "@/lib/ai/providers";
import { generateGeminiImage } from "@/lib/ai/gemini-image-generator";
import { POSES, buildPrompt } from "@/lib/ai/model-image-config";
import { updateTaskProgress, completeTask } from "@/lib/services/background-task";

interface ChunkPayload {
  channelId: string;
  taskId: string;
  chunkIndex: number;
  niche: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  const { channelId, taskId, chunkIndex, niche } = (await req.json()) as ChunkPayload;
  const totalPoses = POSES.length;
  const pose = POSES[chunkIndex];

  if (!pose) {
    return NextResponse.json({ error: "Invalid chunkIndex" }, { status: 400 });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY ?? (await getApiKey("google"));
    if (!apiKey) {
      return NextResponse.json({ error: "No API key" }, { status: 503 });
    }

    // Read hero from DB as reference
    let referenceBase64: string | undefined;
    const heroRecord = await prisma.channelModelImage.findUnique({
      where: { channelId_poseType: { channelId, poseType: "hero_fullbody" } },
      select: { imageData: true },
    });
    if (heroRecord?.imageData) {
      referenceBase64 = Buffer.from(heroRecord.imageData).toString("base64");
    }

    const prompt = buildPrompt(pose, niche, true);

    console.log(`[model-images] Chunk ${chunkIndex + 1}/${totalPoses}: ${pose.type}`);

    const result = await generateGeminiImage(apiKey, prompt, referenceBase64);

    if (result.imageBase64) {
      const imageBuffer = Buffer.from(result.imageBase64, "base64");
      await prisma.channelModelImage.upsert({
        where: { channelId_poseType: { channelId, poseType: pose.type } },
        create: { channelId, poseType: pose.type, imageData: imageBuffer, mimeType: "image/png", prompt },
        update: { imageData: imageBuffer, mimeType: "image/png", prompt, createdAt: new Date() },
      });
      console.log(`[model-images] Done ${pose.type} (${(result.durationMs / 1000).toFixed(1)}s)`);
    } else {
      console.error(`[model-images] Failed ${pose.type}: ${result.error}`);
    }

    // Count completed images and update progress
    const imageCount = await prisma.channelModelImage.count({ where: { channelId } });
    const progress = Math.round((imageCount / totalPoses) * 100);

    await updateTaskProgress(
      taskId,
      progress,
      `Tạo hình nhân vật (${imageCount}/${totalPoses})`,
    );

    // If all images are done, mark task complete
    if (imageCount >= totalPoses) {
      await completeTask(taskId, `${totalPoses} hình đã tạo`);
    }

    return NextResponse.json({
      chunk: chunkIndex,
      pose: pose.type,
      success: !!result.imageBase64,
      imageCount,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[model-images] Chunk ${chunkIndex} error:`, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
