// Phase 2: POST /api/inbox/[id]/score — tính Content Potential Score cho 1 identity
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateContentPotentialScore } from "@/lib/scoring/content-potential";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const identity = await prisma.productIdentity.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            aiScore: true,
            totalKOL: true,
            totalVideos: true,
            commissionRate: true,
            sales7d: true,
          },
        },
      },
    });

    if (!identity) {
      return NextResponse.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 });
    }

    // Tính Content Potential Score
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

    // Market score từ product nếu có
    const marketScore = identity.product?.aiScore ?? (identity.marketScore ? Number(identity.marketScore) : null);

    // Combined score = (market * 0.5 + content * 0.5) hoặc chỉ 1 nếu thiếu
    let combinedScore: number | null = null;
    if (marketScore != null && contentScore != null) {
      combinedScore = Math.round(marketScore * 0.5 + contentScore * 0.5);
    } else if (contentScore != null) {
      combinedScore = contentScore;
    } else if (marketScore != null) {
      combinedScore = marketScore;
    }

    // Update identity
    const updated = await prisma.productIdentity.update({
      where: { id },
      data: {
        contentPotentialScore: contentScore,
        marketScore: marketScore,
        combinedScore: combinedScore,
        inboxState: identity.inboxState === "new" || identity.inboxState === "enriched" ? "scored" : identity.inboxState,
      },
    });

    return NextResponse.json({
      data: {
        contentPotentialScore: contentScore,
        marketScore,
        combinedScore,
        inboxState: updated.inboxState,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
