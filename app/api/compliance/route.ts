// Phase 3: POST /api/compliance/check — Check text cho TikTok VN rules
import { NextResponse } from "next/server";
import { checkCompliance } from "@/lib/content/compliance";
import { validateBody } from "@/lib/validations/validate-body";
import { complianceCheckSchema } from "@/lib/validations/schemas-content";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const validation = await validateBody(request, complianceCheckSchema);
    if (validation.error) return validation.error;
    const { text } = validation.data;

    const result = checkCompliance(text);

    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
