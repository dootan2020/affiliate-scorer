import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/db";

const ManualFeedbackSchema = z.object({
  productId: z.string(),
  overallSuccess: z.enum(["success", "moderate", "poor"]),
  adPlatform: z.string().nullable().optional(),
  adSpend: z.number().nullable().optional(),
  adROAS: z.number().nullable().optional(),
  adConversions: z.number().nullable().optional(),
  revenue: z.number().nullable().optional(),
  orders: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsed = ManualFeedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ" },
        { status: 400 }
      );
    }

    const { productId, overallSuccess, ...rest } = parsed.data;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { aiScore: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Không tìm thấy sản phẩm" },
        { status: 404 }
      );
    }

    const feedback = await prisma.feedback.create({
      data: {
        productId,
        aiScoreAtSelection: product.aiScore ?? 0,
        overallSuccess,
        adPlatform: rest.adPlatform ?? null,
        adSpend: rest.adSpend ?? null,
        adROAS: rest.adROAS ?? null,
        adConversions: rest.adConversions ?? null,
        revenue: rest.revenue ?? null,
        orders: rest.orders ?? null,
        notes: rest.notes ?? null,
      },
    });

    return NextResponse.json({
      data: { id: feedback.id },
      message: "Đã lưu feedback thành công",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
