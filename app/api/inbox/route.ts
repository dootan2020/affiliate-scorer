// Phase 2: GET /api/inbox — lấy danh sách product identities (inbox)
// Query params: state, page, limit, sort
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;
    const state = searchParams.get("state"); // "new" | "enriched" | "scored" | "briefed" | "published" | "archived" | null (tất cả)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const sort = searchParams.get("sort") || "newest"; // "newest" | "score" | "delta"

    const where = state ? { inboxState: state } : { inboxState: { not: "archived" } };

    const orderBy = sort === "score"
      ? { combinedScore: "desc" as const }
      : sort === "delta"
        ? { updatedAt: "desc" as const }
        : { createdAt: "desc" as const };

    const [items, total] = await Promise.all([
      prisma.productIdentity.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          product: {
            select: {
              id: true,
              aiScore: true,
              aiRank: true,
              sales7d: true,
              totalKOL: true,
              imageUrl: true,
            },
          },
          urls: { select: { url: true, urlType: true } },
          _count: { select: { inboxItems: true } },
        },
      }),
      prisma.productIdentity.count({ where }),
    ]);

    // Thống kê theo state
    const stats = await prisma.productIdentity.groupBy({
      by: ["inboxState"],
      _count: { id: true },
    });

    const statMap: Record<string, number> = {};
    for (const s of stats) {
      statMap[s.inboxState] = s._count.id;
    }

    return NextResponse.json({
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: statMap,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
