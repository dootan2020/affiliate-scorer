// Shared handler for advisor analyze/followup routes
import { NextResponse } from "next/server";
import { runAdvisorPipeline } from "@/lib/advisor/analyze-pipeline";

const MAX_QUESTION_LENGTH = 2000;
const MAX_CONTEXT_LENGTH = 8000;

export async function handleAdvisorRequest(
  req: Request,
  errorLabel: string,
): Promise<NextResponse> {
  try {
    const body = (await req.json()) as {
      question?: string;
      context?: string;
    };

    if (!body.question || typeof body.question !== "string" || body.question.trim().length === 0) {
      return NextResponse.json({ error: "Vui lòng nhập câu hỏi" }, { status: 400 });
    }

    const question = body.question.trim();
    if (question.length > MAX_QUESTION_LENGTH) {
      return NextResponse.json({ error: `Câu hỏi quá dài (tối đa ${MAX_QUESTION_LENGTH} ký tự)` }, { status: 400 });
    }

    const context = body.context?.trim();
    if (context && context.length > MAX_CONTEXT_LENGTH) {
      return NextResponse.json({ error: "Context quá dài" }, { status: 400 });
    }

    const result = await runAdvisorPipeline(question, context);
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error(`[${errorLabel}]`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lỗi phân tích" },
      { status: 500 },
    );
  }
}
