// Phase 4: Win/Loss analysis per asset
import { prisma } from "@/lib/db";

interface Factor {
  factor: string;
  value: string | null;
  impact: "positive" | "negative" | "neutral";
  detail?: string;
}

export interface AssetAnalysis {
  assetId: string;
  verdict: "win" | "loss" | "neutral";
  reward: number;
  avgReward: number;
  factors: Factor[];
}

/** Phân tích win/loss cho 1 asset dựa trên reward vs average */
export async function analyzeAsset(
  assetId: string,
  rewardScore: number,
): Promise<AssetAnalysis> {
  // Lấy asset info
  const asset = await prisma.contentAsset.findUnique({
    where: { id: assetId },
    include: { productIdentity: { select: { category: true } } },
  });

  // Lấy avg reward toàn hệ thống
  const allMetrics = await prisma.assetMetric.aggregate({
    _avg: { rewardScore: true },
  });
  const avgReward = Number(allMetrics._avg.rewardScore) || 0;

  const isWin = rewardScore > avgReward * 1.5;
  const isLoss = rewardScore < avgReward * 0.5;

  const factors: Factor[] = [];

  if (asset) {
    // Hook analysis
    if (asset.hookType) {
      const hookAvg = await getAvgByScope("hook_type", asset.hookType);
      factors.push({
        factor: "Hook",
        value: asset.hookType,
        impact: rewardScore > hookAvg ? "positive" : hookAvg > 0 ? "negative" : "neutral",
        detail: `Avg reward cho hook "${asset.hookType}": ${hookAvg.toFixed(1)}`,
      });
    }

    // Format analysis
    if (asset.format) {
      const formatAvg = await getAvgByScope("format", asset.format);
      factors.push({
        factor: "Format",
        value: asset.format,
        impact: rewardScore > formatAvg ? "positive" : formatAvg > 0 ? "negative" : "neutral",
        detail: `Avg reward cho format "${asset.format}": ${formatAvg.toFixed(1)}`,
      });
    }

    // Category analysis
    const category = asset.productIdentity?.category;
    if (category) {
      const catAvg = await getAvgByScope("category", category);
      factors.push({
        factor: "Category",
        value: category,
        impact: rewardScore > catAvg ? "positive" : catAvg > 0 ? "negative" : "neutral",
        detail: `Avg reward cho "${category}": ${catAvg.toFixed(1)}`,
      });
    }

    // Timing
    const hourPosted = asset.publishedAt?.getHours();
    if (hourPosted !== undefined) {
      const isPrimeTime = hourPosted >= 19 && hourPosted <= 21;
      factors.push({
        factor: "Thời gian đăng",
        value: `${hourPosted}:00`,
        impact: isPrimeTime ? "positive" : "neutral",
        detail: isPrimeTime ? "Prime time (19-21h)" : "Ngoài prime time",
      });
    }
  }

  return {
    assetId,
    verdict: isWin ? "win" : isLoss ? "loss" : "neutral",
    reward: rewardScore,
    avgReward,
    factors,
  };
}

async function getAvgByScope(scope: string, key: string): Promise<number> {
  const w = await prisma.learningWeightP4.findUnique({
    where: { scope_key: { scope, key } },
  });
  return w ? Number(w.avgReward) : 0;
}
