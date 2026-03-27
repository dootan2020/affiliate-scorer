// Phase 2: GET /api/inbox — lấy danh sách product identities (inbox)
// Query params: state, page, limit/pageSize, sort, order, search, category, delta, priceMin, priceMax, scoreMin, scoreMax
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/app/generated/prisma/client";

type PIWhere = Prisma.ProductIdentityWhereInput;

/** Build Prisma where clause from query params (excluding state filter) */
function buildFilters(params: URLSearchParams): PIWhere {
  const conditions: PIWhere[] = [];

  // Search — title or shopName
  const search = params.get("search")?.trim();
  if (search) {
    conditions.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { shopName: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  // Category — comma-separated multi-select (text names)
  const category = params.get("category");
  if (category) {
    const cats = category.split(",").map((c) => c.trim()).filter(Boolean);
    if (cats.length > 0) conditions.push({ category: { in: cats } });
  }

  // Niche code — fastmossCategoryId (numeric, from niche-finder)
  const nicheCode = params.get("nicheCode");
  if (nicheCode) {
    const code = parseInt(nicheCode, 10);
    if (!isNaN(code)) conditions.push({ fastmossCategoryId: code });
  }

  // Delta type — comma-separated multi-select
  const delta = params.get("delta");
  if (delta) {
    const deltas = delta.split(",").map((d) => d.trim()).filter(Boolean);
    if (deltas.length > 0) conditions.push({ deltaType: { in: deltas } });
  }

  // Price range
  const priceMin = params.get("priceMin");
  const priceMax = params.get("priceMax");
  if (priceMin) conditions.push({ price: { gte: parseInt(priceMin, 10) } });
  if (priceMax) conditions.push({ price: { lte: parseInt(priceMax, 10) } });

  // Score range
  const scoreMin = params.get("scoreMin");
  const scoreMax = params.get("scoreMax");
  if (scoreMin) conditions.push({ combinedScore: { gte: parseInt(scoreMin, 10) } });
  if (scoreMax) conditions.push({ combinedScore: { lte: parseInt(scoreMax, 10) } });

  return conditions.length > 0 ? { AND: conditions } : {};
}

/** Build orderBy from sort + order params */
function buildOrderBy(params: URLSearchParams): Prisma.ProductIdentityOrderByWithRelationInput[] {
  const sort = params.get("sort") || "score";
  const order = params.get("order") === "asc" ? "asc" : "desc";

  // Use { sort, nulls } to push NULL scores to the bottom
  const nulls = order === "desc" ? "last" as const : "first" as const;

  const sortMap: Record<string, Prisma.ProductIdentityOrderByWithRelationInput[]> = {
    newest: [{ createdAt: "desc" }],
    score: [{ combinedScore: { sort: order, nulls } }, { createdAt: "desc" }],
    price: [{ price: { sort: order, nulls } }, { createdAt: "desc" }],
    delta: [{ updatedAt: "desc" }],
    content: [{ contentPotentialScore: { sort: order, nulls } }, { createdAt: "desc" }],
    sales7d: [{ product: { sales7d: order } }, { createdAt: "desc" }],
    kol: [{ product: { totalKOL: order } }, { createdAt: "desc" }],
  };

  return sortMap[sort] ?? [{ combinedScore: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }];
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;
    const state = searchParams.get("state");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(500, Math.max(1, parseInt(
      searchParams.get("pageSize") || searchParams.get("limit") || "20", 10
    )));

    // Build where: state filter + search/filter conditions
    const filters = buildFilters(searchParams);
    const stateFilter: PIWhere = state
      ? { inboxState: state }
      : { inboxState: { not: "archived" } };
    const where: PIWhere = { AND: [stateFilter, filters] };

    const orderBy = buildOrderBy(searchParams);

    const [items, total] = await Promise.all([
      prisma.productIdentity.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          product: {
            select: {
              id: true,
              aiScore: true,
              aiRank: true,
              sales7d: true,
              totalKOL: true,
              imageUrl: true,
              shopRating: true,
              salesTotal: true,
            },
          },
          urls: { select: { url: true, urlType: true } },
          _count: { select: { inboxItems: true } },
        },
      }),
      prisma.productIdentity.count({ where }),
    ]);

    // Stats: count per state WITH filters applied (includes archived for tab count)
    const hasFilters = Object.keys(filters).length > 0;
    const [activeStats, archivedCount] = await Promise.all([
      prisma.productIdentity.groupBy({
        by: ["inboxState"],
        where: hasFilters
          ? { AND: [{ inboxState: { not: "archived" } }, filters] }
          : { inboxState: { not: "archived" } },
        _count: { id: true },
      }),
      prisma.productIdentity.count({
        where: { inboxState: "archived" },
      }),
    ]);

    const statMap: Record<string, number> = {};
    for (const s of activeStats) {
      statMap[s.inboxState] = s._count.id;
    }
    statMap["archived"] = archivedCount;

    return NextResponse.json({
      data: items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      stats: statMap,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
