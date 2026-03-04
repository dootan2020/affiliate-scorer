import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { generateChannelProfile } from "@/lib/content/generate-channel-profile";
import { createTask, completeTask, failTask } from "@/lib/services/background-task";

const generateSchema = z.object({
  niche: z.string().min(1, "Niche không được để trống"),
  targetAudience: z.string().min(1, "Đối tượng mục tiêu không được để trống"),
  tone: z.string().min(1, "Tone không được để trống"),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const input = generateSchema.parse(body);

    const taskId = await createTask({
      type: "channel_generate",
      label: "Đang tạo profile kênh...",
    });

    after(async () => {
      try {
        const profile = await generateChannelProfile(input);
        await completeTask(taskId, "Hoàn thành", profile);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Lỗi tạo profile";
        await failTask(taskId, msg).catch(() => {});
      }
    });

    return NextResponse.json({ taskId });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 },
      );
    }
    const message =
      err instanceof Error ? err.message : "Lỗi không xác định khi tạo profile";
    console.error("[channels/generate] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
