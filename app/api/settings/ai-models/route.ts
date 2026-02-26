import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { AiTaskType } from "@/lib/ai/claude";

const VALID_TASK_TYPES: AiTaskType[] = [
  "scoring",
  "content_brief",
  "morning_brief",
  "weekly_report",
];

const VALID_MODELS = [
  "claude-haiku-4-5-20251001",
  "claude-sonnet-4-6",
  "claude-opus-4-6",
  "gpt-4o",
  "gpt-4o-mini",
  "gemini-2.0-flash",
  "gemini-2.5-pro",
];

export async function GET(): Promise<NextResponse> {
  try {
    const configs = await prisma.aiModelConfig.findMany();
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
      if (!VALID_MODELS.includes(modelId)) continue;
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
