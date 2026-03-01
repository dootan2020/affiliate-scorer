// Phase 4: POST /api/metrics/capture — Chrome extension endpoint (sẵn sàng)
import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/db";
import { calculateReward } from "@/lib/learning/reward-score";
import { updateLearningWeights } from "@/lib/learning/update-weights";
import { validateBody } from "@/lib/validations/validate-body";

const extensionPayloadSchema = z.object({
  platform: z.string().min(1),
  post_id: z.string().min(1),
  post_url: z.string().min(1),
  captured_at: z.string().optional(),
  metrics: z.object({
    views: z.number(),
    likes: z.number(),
    comments: z.number(),
    shares: z.number(),
    saves: z.number(),
    avg_watch_time_s: z.number().optional(),
    completion_rate: z.number().optional(),
    followers_gained: z.number().optional(),
  }),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const validation = await validateBody(request, extensionPayloadSchema);
    if (validation.error) return validation.error;
    const body = validation.data;

    // Match asset by post_id
    const asset = await prisma.contentAsset.findFirst({
      where: { postId: body.post_id },
      include: { productIdentity: { select: { category: true } } },
    });

    if (!asset) {
      return NextResponse.json(
        { error: `No asset found for post_id: ${body.post_id}` },
        { status: 404 },
      );
    }

    // Calculate reward
    const reward = calculateReward({
      views: body.metrics.views,
      likes: body.metrics.likes,
      comments: body.metrics.comments,
      shares: body.metrics.shares,
      saves: body.metrics.saves,
      completionRate: body.metrics.completion_rate,
    });

    // Get previous latest metric for delta calculation (re-capture for logged assets)
    const previousMetric = await prisma.assetMetric.findFirst({
      where: { contentAssetId: asset.id },
      orderBy: { capturedAt: "desc" },
      select: { rewardScore: true },
    });

    // Save metrics (allows multiple records per asset for re-capture)
    const metric = await prisma.assetMetric.create({
      data: {
        contentAssetId: asset.id,
        source: "extension",
        capturedAt: body.captured_at ? new Date(body.captured_at) : new Date(),
        views: body.metrics.views,
        likes: body.metrics.likes,
        comments: body.metrics.comments,
        shares: body.metrics.shares,
        saves: body.metrics.saves,
        avgWatchTimeS: body.metrics.avg_watch_time_s,
        completionRate: body.metrics.completion_rate,
        followersGained: body.metrics.followers_gained,
        rewardScore: reward,
        rawData: JSON.parse(JSON.stringify(body)),
      },
    });

    // Update weights: use delta reward if re-capturing logged asset (#5)
    const previousReward = previousMetric ? Number(previousMetric.rewardScore) : 0;
    const deltaReward = previousMetric ? reward - previousReward : reward;

    if (Math.abs(deltaReward) > 0.01) {
      await updateLearningWeights(
        {
          hookType: asset.hookType,
          format: asset.format,
          angle: asset.angle,
          category: asset.productIdentity?.category || null,
          channelId: asset.channelId || null,
        },
        deltaReward,
      );
    }

    return NextResponse.json({
      data: {
        metricId: metric.id,
        assetCode: asset.assetCode,
        rewardScore: reward,
      },
      message: "Captured successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
