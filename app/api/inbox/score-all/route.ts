// Phase 2: POST /api/inbox/score-all — tính Content Potential Score cho tất cả identities
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateContentPotentialScore } from "@/lib/scoring/content-potential";

export async function POST(): Promise<NextResponse> {
  try {
    const identities = await prisma.productIdentity.findMany({
      where: { inboxState: { not: "archived" } },
      include: {
        product: {
          select: {
            aiScore: true,
            totalKOL: true,
            totalVideos: true,
            commissionRate: true,
          },
        },
      },
    });

    let scored = 0;
    for (const identity of identities) {
      const contentScore = calculateContentPotentialScore({
        imageUrl: identity.imageUrl,
        price: identity.price,
        category: identity.category,
        title: identity.title,
        totalKOL: identity.product?.totalKOL ?? null,
        totalVideos: identity.product?.totalVideos ?? null,
        commissionRate: identity.commissionRate ? Number(identity.commissionRate) : (identity.product?.commissionRate ?? null),
        description: identity.description,
      });

      const marketScore = identity.product?.aiScore ?? (identity.marketScore ? Number(identity.marketScore) : null);

      let combinedScore: number | null = null;
      if (marketScore != null && contentScore != null) {
        combinedScore = Math.round(marketScore * 0.5 + contentScore * 0.5);
      } else if (contentScore != null) {
        combinedScore = contentScore;
      } else if (marketScore != null) {
        combinedScore = marketScore;
      }

      await prisma.productIdentity.update({
        where: { id: identity.id },
        data: {
          contentPotentialScore: contentScore,
          marketScore: marketScore,
          combinedScore: combinedScore,
          inboxState: identity.inboxState === "new" || identity.inboxState === "enriched" ? "scored" : identity.inboxState,
        },
      });
      scored++;
    }

    return NextResponse.json({
      message: `Đã chấm Content Potential Score cho ${scored} sản phẩm`,
      scored,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
