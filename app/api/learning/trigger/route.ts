import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runLearningCycle } from "@/lib/ai/learning";

const MIN_FEEDBACK_COUNT = 5;

export async function POST(): Promise<NextResponse> {
  try {
    const feedbackCount = await prisma.feedback.count();

    if (feedbackCount < MIN_FEEDBACK_COUNT) {
      return NextResponse.json(
        {
          error: `Cần ít nhất ${MIN_FEEDBACK_COUNT} feedback để chạy learning. Hiện có ${feedbackCount}.`,
          code: "INSUFFICIENT_DATA",
        },
        { status: 400 }
      );
    }

    const result = await runLearningCycle();

    return NextResponse.json({
      data: result,
      message: `Learning cycle tuần ${result.weekNumber} đã hoàn thành`,
    });
  } catch (error) {
    console.error("Lỗi khi chạy learning cycle:", error);
    return NextResponse.json(
      {
        error: "Lỗi khi chạy learning cycle. Vui lòng thử lại.",
        code: "LEARNING_ERROR",
      },
      { status: 500 }
    );
  }
}
