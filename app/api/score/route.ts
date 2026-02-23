import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { scoreProducts } from "@/lib/ai/scoring";

const ScoreRequestSchema = z.object({
  batchId: z.string().optional(),
  productIds: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json().catch(() => ({}))) as unknown;
    const parsed = ScoreRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dữ liệu đầu vào không hợp lệ", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    const results = await scoreProducts(parsed.data);

    return NextResponse.json({
      data: results,
      message: `Đã chấm điểm ${results.length} sản phẩm thành công`,
    });
  } catch (error) {
    console.error("Lỗi khi chấm điểm sản phẩm:", error);
    return NextResponse.json(
      {
        error: "Lỗi khi chấm điểm sản phẩm. Vui lòng thử lại.",
        code: "SCORING_ERROR",
      },
      { status: 500 }
    );
  }
}
