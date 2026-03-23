// GET /api/niche-finder/products?category=X&limit=N — product shortlist for a category
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const category = Number(url.searchParams.get("category") || "0");
  const limit = Math.min(Number(url.searchParams.get("limit") || "50"), 100);

  if (!category) {
    return NextResponse.json(
      { error: "category param required" },
      { status: 400 }
    );
  }

  const products = await prisma.productIdentity.findMany({
    where: {
      fastmossCategoryId: category,
      fastmossProductId: { not: null },
    },
    orderBy: { day28SoldCount: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      imageUrl: true,
      price: true,
      commissionRate: true,
      day28SoldCount: true,
      relateAuthorCount: true,
      relateVideoCount: true,
      soldCountIncRate: true,
      viralIndex: true,
      popularityIndex: true,
      countryRank: true,
      categoryRank: true,
      productRating: true,
      fastmossCategory: true,
      isPromoted: true,
      shopName: true,
      combinedScore: true,
    },
  });

  // Normalised multi-factor score: rev/order(30%) + sales(25%) + KOL(20%) + videos(15%) + commission(10%)
  const maxSales = Math.max(1, ...products.map((p) => p.day28SoldCount ?? 0));
  const maxKOL = Math.max(1, ...products.map((p) => p.relateAuthorCount ?? 0));
  const maxVideos = Math.max(1, ...products.map((p) => p.relateVideoCount ?? 0));
  const maxComm = Math.max(1, ...products.map((p) => Number(p.commissionRate ?? 0)));
  const maxRevOrder = Math.max(
    1,
    ...products.map((p) => (Number(p.price ?? 0) * Number(p.commissionRate ?? 0)) / 100)
  );

  const scored = products.map((p) => {
    const revPerOrder = (Number(p.price ?? 0) * Number(p.commissionRate ?? 0)) / 100;
    const nRevOrder = (revPerOrder / maxRevOrder) * 100;
    const nSales = ((p.day28SoldCount ?? 0) / maxSales) * 100;
    const nKOL = ((p.relateAuthorCount ?? 0) / maxKOL) * 100;
    const nVideos = ((p.relateVideoCount ?? 0) / maxVideos) * 100;
    const nComm = (Number(p.commissionRate ?? 0) / maxComm) * 100;
    const nicheScore = Math.round(
      nRevOrder * 0.3 + nSales * 0.25 + nKOL * 0.2 + nVideos * 0.15 + nComm * 0.1
    );
    return {
      ...p,
      price: Number(p.price ?? 0),
      commissionRate: Number(p.commissionRate ?? 0),
      combinedScore: Number(p.combinedScore ?? 0),
      revPerOrder: Math.round(revPerOrder),
      nicheScore,
    };
  });

  scored.sort((a, b) => b.nicheScore - a.nicheScore);

  return NextResponse.json({ products: scored, category });
}
