// Phase 3: POST /api/briefs/batch — Generate briefs cho nhiều SP cùng lúc
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateBrief } from "@/lib/content/generate-brief";
import type { BriefOptions, ChannelContext } from "@/lib/content/generate-brief";
import { validateBody } from "@/lib/validations/validate-body";
import { batchBriefSchema } from "@/lib/validations/schemas-content";

interface BatchResult {
  productIdentityId: string;
  title: string | null;
  briefId: string | null;
  assetsCreated: number;
  status: "success" | "error";
  error?: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const validation = await validateBody(request, batchBriefSchema);
    if (validation.error) return validation.error;
    const { productIdentityIds, channelId, contentType, videoFormat, targetDuration } = validation.data;

    // Build channel context (channelId is required)
    const channel = await prisma.tikTokChannel.findUnique({ where: { id: channelId } });
    if (!channel) {
      return NextResponse.json(
        { error: "Không tìm thấy kênh. Vui lòng chọn kênh hợp lệ." },
        { status: 404 },
      );
    }
    if (!channel.isActive) {
      return NextResponse.json(
        { error: "Kênh đã tạm dừng. Chọn kênh khác hoặc kích hoạt lại kênh." },
        { status: 400 },
      );
    }
    const channelCtx: ChannelContext = {
      channelId: channel.id,
      personaName: channel.personaName,
      personaDesc: channel.personaDesc,
      voiceStyle: channel.voiceStyle,
      targetAudience: channel.targetAudience,
      editingStyle: channel.editingStyle,
      niche: channel.niche,
    };
    const briefOptions: BriefOptions = { channel: channelCtx, contentType, videoFormat, targetDuration };

    // Lấy tất cả identities + product data cho enriched prompt
    const identities = await prisma.productIdentity.findMany({
      where: { id: { in: productIdentityIds } },
      include: {
        product: {
          select: { shopRating: true, salesTotal: true, sales7d: true },
        },
      },
    });

    if (identities.length === 0) {
      return NextResponse.json(
        { error: "Không tìm thấy sản phẩm nào" },
        { status: 404 },
      );
    }

    // Generate briefs tuần tự (tránh rate limit Claude API)
    const results: BatchResult[] = [];

    for (const identity of identities) {
      try {
        const briefId = await generateBrief({
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

        const assetCount = await prisma.contentAsset.count({
          where: { briefId },
        });

        results.push({
          productIdentityId: identity.id,
          title: identity.title,
          briefId,
          assetsCreated: assetCount,
          status: "success",
        });
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Lỗi không xác định";
        results.push({
          productIdentityId: identity.id,
          title: identity.title,
          briefId: null,
          assetsCreated: 0,
          status: "error",
          error: errMsg,
        });
      }
    }

    const success = results.filter((r) => r.status === "success").length;
    const totalAssets = results.reduce((sum, r) => sum + r.assetsCreated, 0);

    return NextResponse.json({
      data: results,
      message: `${success}/${identities.length} briefs tạo thành công, ${totalAssets} assets`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("[briefs/batch]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
