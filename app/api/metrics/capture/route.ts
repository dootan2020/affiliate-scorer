// Phase 4: POST /api/metrics/capture — Chrome extension endpoint (sẵn sàng)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateReward } from "@/lib/learning/reward-score";
import { updateLearningWeights } from "@/lib/learning/update-weights";

interface ExtensionPayload {
  platform: string;
  post_id: string;
  post_url: string;
  captured_at: string;
  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    avg_watch_time_s?: number;
    completion_rate?: number;
    followers_gained?: number;
  };
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as ExtensionPayload;

    if (!body.post_id || !body.metrics) {
      return NextResponse.json({ error: "Missing post_id or metrics" }, { status: 400 });
    }

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

    // Save metrics
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
