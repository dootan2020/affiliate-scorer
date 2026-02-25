// Phase 3: POST /api/compliance/check — Check text cho TikTok VN rules
import { NextResponse } from "next/server";
import { checkCompliance } from "@/lib/content/compliance";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { text?: string };

    if (!body.text?.trim()) {
      return NextResponse.json(
        { error: "Thiếu text cần kiểm tra" },
        { status: 400 },
      );
    }

    const result = checkCompliance(body.text);

    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
