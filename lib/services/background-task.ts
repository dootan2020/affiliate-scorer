// Server-side helpers for BackgroundTask CRUD — no HTTP overhead
import { prisma } from "@/lib/db";
import type { InputJsonValue } from "@/app/generated/prisma/internal/prismaNamespace";

export interface CreateTaskInput {
  type: string;
  label: string;
  channelId?: string;
}

/** Create a new task in "processing" status. Returns task ID. */
export async function createTask(input: CreateTaskInput): Promise<string> {
  const task = await prisma.backgroundTask.create({
    data: {
      type: input.type,
      label: input.label,
      status: "processing",
      channelId: input.channelId,
    },
  });
  return task.id;
}

/** Update task progress. */
export async function updateTaskProgress(
  taskId: string,
  progress: number,
  detail?: string,
): Promise<void> {
  await prisma.backgroundTask.update({
    where: { id: taskId },
    data: { progress, detail },
  });
}

/** Mark task as completed. Optionally store a result payload. */
export async function completeTask(
  taskId: string,
  detail?: string,
  result?: unknown,
): Promise<void> {
  await prisma.backgroundTask.update({
    where: { id: taskId },
    data: {
      status: "completed",
      progress: 100,
      detail,
      ...(result !== undefined ? { result: result as InputJsonValue } : {}),
    },
  });
}

/** Mark task as failed. */
export async function failTask(taskId: string, error: string): Promise<void> {
  await prisma.backgroundTask.update({
    where: { id: taskId },
    data: { status: "failed", error },
  });
}
