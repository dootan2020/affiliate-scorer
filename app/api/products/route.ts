import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/db";

const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  sortBy: z
    .enum(["aiScore", "commissionRate", "price", "createdAt"])
    .default("aiScore"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const parsed = QuerySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Tham số truy vấn không hợp lệ", code: "INVALID_PARAMS" },
        { status: 400 }
      );
    }

    const { page, limit, category, minScore, sortBy, sortOrder } = parsed.data;
    const skip = (page - 1) * limit;

    // Build where clause dynamically
    const whereClause: Record<string, unknown> = {};
    if (category) {
      whereClause.category = { contains: category };
    }
    if (minScore !== undefined) {
      whereClause.aiScore = { gte: minScore };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      data: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sản phẩm:", error);
    return NextResponse.json(
      {
        error: "Lỗi khi tải danh sách sản phẩm. Vui lòng thử lại.",
        code: "FETCH_ERROR",
      },
      { status: 500 }
    );
  }
}
