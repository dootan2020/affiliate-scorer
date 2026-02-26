// Phase 2: POST /api/inbox/score-all — tính Content Potential Score cho tất cả identities
import { NextResponse } from "next/server";
import { syncAllIdentityScores } from "@/lib/services/score-identity";

export async function POST(): Promise<NextResponse> {
  try {
    const scored = await syncAllIdentityScores();

    return NextResponse.json({
      message: `Đã chấm Content Potential Score cho ${scored} sản phẩm`,
      scored,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
