// Phase 4: POST /api/log/quick — Log metrics cho 1 video
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateReward } from "@/lib/learning/reward-score";
import { updateLearningWeights } from "@/lib/learning/update-weights";
import { analyzeAsset } from "@/lib/learning/win-loss-analysis";
import { matchTikTokLink, extractPostId } from "@/lib/learning/match-tiktok-link";
import { validateBody } from "@/lib/validations/validate-body";
import { quickLogSchema } from "@/lib/validations/schemas-content";
import { validateTransition } from "@/lib/state-machines/transitions";
import { analyzeContent } from "@/lib/agents/content-analyzer";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const validation = await validateBody(request, quickLogSchema);
    if (validation.error) return validation.error;
    const body = validation.data;

    // Resolve assetId
    let assetId = body.assetId;
    if (!assetId && body.tiktokUrl) {
      const match = await matchTikTokLink(body.tiktokUrl);
      assetId = match.assetId || undefined;
    }

    if (!assetId) {
      return NextResponse.json(
        { error: "Không match được video. Chọn asset thủ công." },
        { status: 400 },
      );
    }

    // Verify asset exists
    const asset = await prisma.contentAsset.findUnique({
      where: { id: assetId },
      include: { productIdentity: { select: { category: true } } },
    });

    if (!asset) {
      return NextResponse.json({ error: "Không tìm thấy asset" }, { status: 404 });
    }

    // Calculate reward
    const reward = calculateReward({
      views: body.views,
      likes: body.likes,
      comments: body.comments,
      shares: body.shares,
      saves: body.saves,
      orders: body.orders,
      commissionAmount: body.commissionAmount,
    });

    // Save metrics
    const metric = await prisma.assetMetric.create({
      data: {
        contentAssetId: assetId,
        source: "manual",
        views: body.views,
        likes: body.likes,
        comments: body.comments,
        shares: body.shares,
        saves: body.saves,
        orders: body.orders,
        commissionAmount: body.commissionAmount,
        rewardScore: reward,
      },
    });

    // Validate transition → logged (skip if already logged — allow re-capture)
    if (asset.status !== "logged") {
      const check = validateTransition("assetStatus", asset.status, "logged");
      if (!check.valid) {
        return NextResponse.json({ error: check.error }, { status: 400 });
      }
    }

    // Update asset status → logged + publishedUrl
    const updateData: Record<string, unknown> = {};
    if (asset.status !== "logged") updateData.status = "logged";
    if (body.tiktokUrl) {
      updateData.publishedUrl = body.tiktokUrl;
      const postId = extractPostId(body.tiktokUrl);
      if (postId) updateData.postId = postId;
      if (!asset.publishedAt) updateData.publishedAt = new Date();
    }
    await prisma.contentAsset.update({ where: { id: assetId }, data: updateData });

    // Content Analyzer: fire-and-forget (runs async, doesn't block response)
    // Nightly learning will pick up actual* fields for weight updates
    if (body.tiktokUrl) {
      analyzeContent(assetId, body.tiktokUrl).catch((err) => {
        console.warn("[log/quick] Background content analysis failed:", err);
      });
    }

    // Update learning weights (using planned metadata — actual* updated async by analyzer)
    await updateLearningWeights(
      {
        hookType: asset.hookType,
        format: asset.format,
        angle: asset.angle,
        category: asset.productIdentity?.category || null,
        channelId: asset.channelId || null,
      },
      reward,
    );

    // Win/Loss analysis
    const analysis = await analyzeAsset(assetId, reward);

    return NextResponse.json({
      data: {
        metricId: metric.id,
        rewardScore: reward,
        analysis,
      },
      message: `Đã log. Reward: ${reward} — ${analysis.verdict === "win" ? "WIN" : analysis.verdict === "loss" ? "LOSS" : "Trung bình"}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("[log/quick]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
