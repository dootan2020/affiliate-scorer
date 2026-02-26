// Phase 2: POST /api/inbox/[id]/score — tính Content Potential Score cho 1 identity
import { NextRequest, NextResponse } from "next/server";
import { syncSingleIdentityScore } from "@/lib/services/score-identity";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const result = await syncSingleIdentityScore(id);

    if (!result) {
      return NextResponse.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 });
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
