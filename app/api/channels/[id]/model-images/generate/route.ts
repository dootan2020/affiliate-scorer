// POST /api/channels/[id]/model-images/generate — trigger model image generation
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { createTask } from "@/lib/services/background-task";
import { getApiKey } from "@/lib/ai/providers";

interface Ctx {
  params: Promise<{ id: string }>;
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
      select: { id: true, niche: true, personaName: true, targetAudience: true },
    });
    if (!channel) {
      return NextResponse.json({ error: "Không tìm thấy kênh" }, { status: 404 });
    }

    // Check Gemini API key
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

    // Trigger first chunk of relay (index=0, generate hero image)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
      ?? (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    const internalUrl = `${baseUrl}/api/internal/generate-model-images`;

    // Fire-and-forget the first chunk
    fetch(internalUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channelId: id,
        taskId,
        chunkIndex: 0,
        niche: channel.niche,
      }),
    }).catch((err) => {
      console.error("[model-images/generate] Failed to start relay:", err);
    });

    return NextResponse.json({ taskId });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("[model-images/generate]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
