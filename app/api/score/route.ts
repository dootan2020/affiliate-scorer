import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { scoreProducts, scoreAllProducts } from "@/lib/ai/scoring";

const ScoreRequestSchema = z.object({
  batchId: z.string().optional(),
  productIds: z.array(z.string()).optional(),
  scoreAll: z.boolean().optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json().catch(() => ({}))) as unknown;
    const parsed = ScoreRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dữ liệu đầu vào không hợp lệ", code: "INVALID_INPUT" },
        { status: 400 },
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "sk-ant-...") {
      return NextResponse.json(
        { error: "Chưa cấu hình ANTHROPIC_API_KEY. Xem .env.example", code: "MISSING_API_KEY" },
        { status: 503 },
      );
    }

    const results = parsed.data.scoreAll
      ? await scoreAllProducts()
      : await scoreProducts(parsed.data);

    return NextResponse.json({
      data: results,
      message: `Đã chấm điểm ${results.length} sản phẩm thành công`,
    });
  } catch (error) {
    console.error("Lỗi khi chấm điểm sản phẩm:", error);
    const message = error instanceof Error ? error.message : "Lỗi khi chấm điểm sản phẩm. Vui lòng thử lại.";
    return NextResponse.json(
      { error: message, code: "SCORING_ERROR" },
      { status: 500 },
    );
  }
}
