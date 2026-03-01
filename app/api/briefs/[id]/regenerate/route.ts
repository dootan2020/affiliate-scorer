// POST /api/briefs/{id}/regenerate — Tạo lại brief cho cùng SP
// Sets old brief status = "replaced", generates new brief, limits 3/SP/day
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateBrief } from "@/lib/content/generate-brief";
import type { BriefOptions, ChannelContext } from "@/lib/content/generate-brief";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // 1. Fetch existing brief (include channelId for inheritance)
    const oldBrief = await prisma.contentBrief.findUnique({
      where: { id },
      select: { id: true, productIdentityId: true, status: true, channelId: true },
    });

    if (!oldBrief) {
      return NextResponse.json({ error: "Không tìm thấy brief" }, { status: 404 });
    }

    // 2. Rate limit: max 3 briefs/SP/day (exclude replaced)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayCount = await prisma.contentBrief.count({
      where: {
        productIdentityId: oldBrief.productIdentityId,
        status: { not: "replaced" },
        createdAt: { gte: todayStart },
      },
    });

    if (todayCount >= 3) {
      return NextResponse.json(
        { error: "Đã đạt giới hạn 3 briefs/SP/ngày", todayCount },
        { status: 429 },
      );
    }

    // 3. Mark old brief as replaced + archive orphan draft assets (atomic)
    await prisma.$transaction([
      prisma.contentBrief.update({
        where: { id },
        data: { status: "replaced" },
      }),
      // Archive draft assets from replaced brief (produced/published assets stay)
      prisma.contentAsset.updateMany({
        where: { briefId: id, status: "draft" },
        data: { status: "archived" },
      }),
    ]);

    // 4. Fetch product data for brief generation
    const identity = await prisma.productIdentity.findUnique({
      where: { id: oldBrief.productIdentityId },
      include: {
        product: { select: { shopRating: true, salesTotal: true, sales7d: true } },
      },
    });

    if (!identity) {
      return NextResponse.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 });
    }

    // 5. Resolve channel context from old brief (backwards compatible for legacy null channelId)
    let briefOptions: BriefOptions | undefined;
    if (oldBrief.channelId) {
      const channel = await prisma.tikTokChannel.findUnique({
        where: { id: oldBrief.channelId },
      });
      if (channel?.isActive) {
        const channelCtx: ChannelContext = {
          channelId: channel.id,
          personaName: channel.personaName,
          personaDesc: channel.personaDesc,
          voiceStyle: channel.voiceStyle,
          targetAudience: channel.targetAudience,
          editingStyle: channel.editingStyle,
          niche: channel.niche,
        };
        briefOptions = { channel: channelCtx };
      }
    }

    // 6. Generate new brief with inherited channel context
    const newBriefId = await generateBrief({
      id: identity.id,
      title: identity.title,
      category: identity.category,
      price: identity.price ? Number(identity.price) : null,
      commissionRate: identity.commissionRate ? String(identity.commissionRate) : null,
      description: identity.description,
      imageUrl: identity.imageUrl,
      shopName: identity.shopName,
      shopRating: identity.product?.shopRating ? Number(identity.product.shopRating) : null,
      salesTotal: identity.product?.salesTotal ?? null,
      combinedScore: identity.combinedScore ? Number(identity.combinedScore) : null,
      lifecycleStage: identity.lifecycleStage,
      deltaType: identity.deltaType,
    }, briefOptions);

    // 7. Return new brief with full data
    const newBrief = await prisma.contentBrief.findUnique({
      where: { id: newBriefId },
      include: {
        productIdentity: {
          select: {
            id: true, title: true, shopName: true, imageUrl: true,
            price: true, productIdExternal: true, combinedScore: true,
            product: { select: { shopRating: true, salesTotal: true } },
            urls: { select: { url: true, urlType: true } },
          },
        },
        assets: { orderBy: { createdAt: "asc" } },
      },
    });

    return NextResponse.json({
      data: newBrief,
      replacedBriefId: id,
      message: "Brief mới đã được tạo",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("[briefs/regenerate]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
