import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const format = searchParams.get("format") || undefined;
    const productSearch = searchParams.get("productSearch") || undefined;
    const sort = searchParams.get("sort") ?? "newest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "24", 10));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (format) where.format = format;
    if (productSearch) {
      where.productIdentity = {
        title: { contains: productSearch, mode: "insensitive" },
      };
    }

    let orderBy: Record<string, string>;
    switch (sort) {
      case "views":
        orderBy = { publishedAt: "desc" };
        break;
      case "reward":
        orderBy = { updatedAt: "desc" };
        break;
      case "newest":
      default:
        orderBy = { createdAt: "desc" };
        break;
    }

    const [assets, total] = await Promise.all([
      prisma.contentAsset.findMany({
        where,
        include: {
          productIdentity: {
            select: { id: true, title: true, imageUrl: true },
          },
          metrics: {
            orderBy: { capturedAt: "desc" },
            take: 1,
            select: { views: true, likes: true, shares: true, capturedAt: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.contentAsset.count({ where }),
    ]);

    return NextResponse.json({ data: assets, total, page, limit });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Lỗi khi lấy thư viện assets:", error);
    return NextResponse.json(
      { error: message, code: "FETCH_ERROR" },
      { status: 500 }
    );
  }
}
