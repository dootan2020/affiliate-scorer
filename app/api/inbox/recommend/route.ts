import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  computeNicheRecommend,
  diversifyTags,
  type NicheRecommendInput,
} from "@/lib/scoring/niche-recommend";
import type { UserProfile } from "@/lib/niche-scoring/types";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;
    const nicheCode = searchParams.get("nicheCode");
    if (!nicheCode) {
      return NextResponse.json({ error: "nicheCode is required" }, { status: 400 });
    }

    const code = parseInt(nicheCode, 10);
    if (isNaN(code)) {
      return NextResponse.json({ error: "Invalid nicheCode" }, { status: 400 });
    }

    // Parse optional user profile
    let profile: UserProfile | null = null;
    const profileParam = searchParams.get("profile");
    if (profileParam) {
      try {
        profile = JSON.parse(decodeURIComponent(profileParam)) as UserProfile;
      } catch {
        // ignore bad profile, use null
      }
    }

    const limit = Math.min(parseInt(searchParams.get("limit") ?? "5", 10) || 5, 20);
    const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10) || 0, 0);
    const minScore = parseInt(searchParams.get("minScore") ?? "30", 10);

    // Pre-filter top 200 by combinedScore for performance
    const products = await prisma.productIdentity.findMany({
      where: {
        fastmossCategoryId: code,
        inboxState: { not: "archived" },
      },
      orderBy: [{ combinedScore: { sort: "desc", nulls: "last" } }],
      take: 200,
      select: {
        id: true,
        title: true,
        shopName: true,
        imageUrl: true,
        price: true,
        commissionRate: true,
        day28SoldCount: true,
        relateAuthorCount: true,
        relateVideoCount: true,
        deltaType: true,
        lifecycleStage: true,
      },
    });

    // Score each product
    const scored = products.map((p) => {
      const input: NicheRecommendInput = {
        price: p.price,
        commissionRate: p.commissionRate ? Number(p.commissionRate) : null,
        day28SoldCount: p.day28SoldCount,
        relateAuthorCount: p.relateAuthorCount,
        relateVideoCount: p.relateVideoCount,
        deltaType: p.deltaType,
        lifecycleStage: p.lifecycleStage,
        imageUrl: p.imageUrl,
      };
      const result = computeNicheRecommend(input, profile);
      return { product: p, ...result };
    });

    // Sort by score desc, apply offset + limit
    scored.sort((a, b) => b.score - a.score);
    const eligible = scored.filter((s) => s.score >= minScore);
    const topN = eligible.slice(offset, offset + limit);
    const hasMore = offset + limit < eligible.length && (eligible[offset + limit]?.score ?? 0) >= minScore;

    // Apply tag diversity constraint
    diversifyTags(topN);

    // Shape response
    const recommendations = topN.map((s) => ({
      id: s.product.id,
      title: s.product.title,
      shopName: s.product.shopName,
      imageUrl: s.product.imageUrl,
      price: s.product.price,
      commissionRate: s.product.commissionRate ? Number(s.product.commissionRate) : null,
      day28SoldCount: s.product.day28SoldCount,
      relateVideoCount: s.product.relateVideoCount,
      deltaType: s.product.deltaType,
      nicheRecommendScore: s.score,
      pillarScores: s.pillarScores,
      primaryTag: s.primaryTag,
      secondaryTags: s.secondaryTags,
    }));

    return NextResponse.json({ recommendations, hasMore });
  } catch (err) {
    console.error("[inbox/recommend] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
