import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { AiTaskType } from "@/lib/ai/call-ai";

const VALID_TASK_TYPES: AiTaskType[] = [
  "scoring",
  "content_brief",
  "morning_brief",
  "weekly_report",
  "channel_profile",
  "niche_intelligence",
  "advisor",
];

const VALID_MODEL_PREFIXES = [
  "claude-",
  "gpt-",
  "gemini-",
  "o1-",
  "o1",
  "o3-",
  "o3",
  "o4-",
  "o4",
];

function isValidModelId(modelId: string): boolean {
  return VALID_MODEL_PREFIXES.some((p) => modelId.startsWith(p));
}

export async function GET(): Promise<NextResponse> {
  try {
    const configs = await prisma.aiModelConfig.findMany({ take: 50 });
    const map: Record<string, string> = {};
    for (const c of configs) {
      map[c.taskType] = c.modelId;
    }
    return NextResponse.json({ data: map });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as Record<string, string>;

    const updates: Array<{ taskType: string; modelId: string }> = [];
    for (const [taskType, modelId] of Object.entries(body)) {
      if (!VALID_TASK_TYPES.includes(taskType as AiTaskType)) continue;
      if (!isValidModelId(modelId)) continue;
      updates.push({ taskType, modelId });
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "Không có cấu hình hợp lệ" },
        { status: 400 }
      );
    }

    for (const { taskType, modelId } of updates) {
      await prisma.aiModelConfig.upsert({
        where: { taskType },
        update: { modelId },
        create: { taskType, modelId },
      });
    }

    return NextResponse.json({ message: "Đã lưu cấu hình AI" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi" },
      { status: 500 }
    );
  }
}
