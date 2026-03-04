// Phase 2: POST /api/inbox/score-all — tính Content Potential Score cho tất cả identities
import { NextResponse } from "next/server";
import { syncAllIdentityScores } from "@/lib/services/score-identity";
import { createTask, updateTaskProgress, completeTask, failTask } from "@/lib/services/background-task";

export async function POST(): Promise<NextResponse> {
  let taskId: string | null = null;

  try {
    taskId = await createTask({
      type: "score_all",
      label: "Đang chấm điểm inbox...",
    });

    const scored = await syncAllIdentityScores((done, total) => {
      const pct = Math.round((done / total) * 100);
      void updateTaskProgress(taskId!, pct, `${done}/${total}`);
    });

    await completeTask(taskId, `${scored} sản phẩm`).catch(() => {});

    return NextResponse.json({
      message: `Đã chấm Content Potential Score cho ${scored} sản phẩm`,
      scored,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    if (taskId) await failTask(taskId, message).catch(() => {});
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
