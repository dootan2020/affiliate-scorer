// Phase 4: POST /api/log/batch — Log metrics cho nhiều videos
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateReward } from "@/lib/learning/reward-score";
import { updateLearningWeights } from "@/lib/learning/update-weights";
import { extractPostId } from "@/lib/learning/match-tiktok-link";

interface BatchItem {
  assetId: string;
  tiktokUrl?: string;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  orders?: number;
}

interface BatchResult {
  assetId: string;
  assetCode: string | null;
  rewardScore: number;
  status: "success" | "error";
  error?: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { items?: BatchItem[] };

    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: "Thiếu danh sách items" }, { status: 400 });
    }

    const results: BatchResult[] = [];

    for (const item of body.items) {
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

        // Update asset
        const updateData: Record<string, unknown> = { status: "logged" };
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
      message: `${success}/${body.items.length} đã log thành công`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
