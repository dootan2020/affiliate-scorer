// Phase 4: POST /api/log/batch — Log metrics cho nhiều videos
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateReward } from "@/lib/learning/reward-score";
import { updateLearningWeights } from "@/lib/learning/update-weights";
import { extractPostId } from "@/lib/learning/match-tiktok-link";
import { validateBody } from "@/lib/validations/validate-body";
import { batchLogSchema } from "@/lib/validations/schemas-content";
import { validateTransition } from "@/lib/state-machines/transitions";

interface BatchResult {
  assetId: string;
  assetCode: string | null;
  rewardScore: number;
  status: "success" | "error";
  error?: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const validation = await validateBody(request, batchLogSchema);
    if (validation.error) return validation.error;
    const { items } = validation.data;

    const results: BatchResult[] = [];

    for (const item of items) {
      try {
        const asset = await prisma.contentAsset.findUnique({
          where: { id: item.assetId },
          include: { productIdentity: { select: { category: true } } },
        });

        if (!asset) {
          results.push({ assetId: item.assetId, assetCode: null, rewardScore: 0, status: "error", error: "Không tìm thấy" });
          continue;
        }

        const reward = calculateReward({
          views: item.views,
          likes: item.likes,
          comments: item.comments,
          shares: item.shares,
          saves: item.saves,
          orders: item.orders,
        });

        await prisma.assetMetric.create({
          data: {
            contentAssetId: item.assetId,
            source: "manual",
            views: item.views,
            likes: item.likes,
            comments: item.comments,
            shares: item.shares,
            saves: item.saves,
            orders: item.orders,
            rewardScore: reward,
          },
        });

        // Validate transition → logged (skip if already logged — allow re-capture)
        if (asset.status !== "logged") {
          const check = validateTransition("assetStatus", asset.status, "logged");
          if (!check.valid) {
            results.push({ assetId: item.assetId, assetCode: asset.assetCode, rewardScore: 0, status: "error", error: check.error });
            continue;
          }
        }

        // Update asset
        const updateData: Record<string, unknown> = {};
        if (asset.status !== "logged") updateData.status = "logged";
        if (item.tiktokUrl) {
          updateData.publishedUrl = item.tiktokUrl;
          const postId = extractPostId(item.tiktokUrl);
          if (postId) updateData.postId = postId;
          if (!asset.publishedAt) updateData.publishedAt = new Date();
        }
        await prisma.contentAsset.update({ where: { id: item.assetId }, data: updateData });

        // Update weights
        await updateLearningWeights(
          {
            hookType: asset.hookType,
            format: asset.format,
            angle: asset.angle,
            category: asset.productIdentity?.category || null,
          },
          reward,
        );

        results.push({ assetId: item.assetId, assetCode: asset.assetCode, rewardScore: reward, status: "success" });
      } catch (err) {
        results.push({
          assetId: item.assetId,
          assetCode: null,
          rewardScore: 0,
          status: "error",
          error: err instanceof Error ? err.message : "Lỗi",
        });
      }
    }

    const success = results.filter((r) => r.status === "success").length;

    return NextResponse.json({
      data: results,
      message: `${success}/${items.length} đã log thành công`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
