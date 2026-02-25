import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validations/validate-body";
import { createShopSchema } from "@/lib/validations/schemas-shops";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50", 10));
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

    const [shops, total] = await Promise.all([
      prisma.shop.findMany({
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.shop.count(),
    ]);

    return NextResponse.json({ data: shops, total, page, limit });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi lấy danh sách shop:", error);
    return NextResponse.json(
      { error: message, code: "FETCH_ERROR" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const validation = await validateBody(request, createShopSchema);
    if (validation.error) return validation.error;
    const body = validation.data;

    const shop = await prisma.shop.create({
      data: {
        name: body.name,
        platform: body.platform,
        commissionReliability: body.commissionReliability ?? null,
        supportQuality: body.supportQuality ?? null,
        samplePolicy: body.samplePolicy ?? null,
        notes: body.notes ?? null,
      },
    });

    return NextResponse.json(
      { message: "Đã tạo shop mới", data: shop },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi tạo shop:", error);
    return NextResponse.json(
      { error: message, code: "CREATE_ERROR" },
      { status: 500 }
    );
  }
}
