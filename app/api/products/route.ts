import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/db";

const ALLOWED_FIELDS = ["id", "name", "price", "commissionRate", "aiScore", "platform", "category", "imageUrl"] as const;

const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(500).default(20),
  category: z.string().optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  fields: z.string().optional(),
  sortBy: z
    .enum(["aiScore", "commissionRate", "price", "sales7d", "createdAt"])
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

    const { page, limit, category, minScore, fields, sortBy, sortOrder } = parsed.data;
    const skip = (page - 1) * limit;

    // Build where clause dynamically
    const whereClause: Record<string, unknown> = {};
    if (category) {
      whereClause.category = { contains: category, mode: "insensitive" };
    }
    if (minScore !== undefined) {
      whereClause.aiScore = { gte: minScore };
    }

    // Build select clause if fields specified
    let selectClause: Record<string, boolean> | undefined;
    if (fields) {
      selectClause = { id: true };
      for (const f of fields.split(",")) {
        const trimmed = f.trim();
        if ((ALLOWED_FIELDS as readonly string[]).includes(trimmed)) {
          selectClause[trimmed] = true;
        }
      }
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
        ...(selectClause ? { select: selectClause } : {}),
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
