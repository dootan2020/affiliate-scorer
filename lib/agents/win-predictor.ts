// Win Predictor Agent — formula-based win probability scoring
// $0 AI cost — pure DB computation from LearningWeightP4 + ChannelMemory
import { prisma } from "@/lib/db";

interface PredictionFeature {
  name: string;
  weight: number;
  score: number;
  contribution: number;
  reasoning: string;
}

export interface WinPrediction {
  probability: number;
  confidence: "low" | "medium" | "high";
  features: PredictionFeature[];
  totalVideosAnalyzed: number;
  message: string;
}

const MIN_VIDEOS = 10;

/**
 * Predict win probability for (productId, channelId) pair.
 * Returns 0-100% probability with feature breakdown.
 * Requires minimum 10 logged videos per channel.
 */
export async function predictWin(productId: string, channelId: string): Promise<WinPrediction> {
  // Get product info
  const product = await prisma.productIdentity.findUnique({
    where: { id: productId },
    select: { category: true, price: true, commissionRate: true, lifecycleStage: true },
  });

  if (!product) {
    return insufficientData("Không tìm thấy sản phẩm.");
  }

  // Get channel memory
  const memory = await prisma.channelMemory.findUnique({
    where: { channelId },
  });

  if (!memory || memory.totalVideos < MIN_VIDEOS) {
    return insufficientData(`Chưa đủ dữ liệu. Cần tối thiểu ${MIN_VIDEOS} video đã log.`);
  }

  // Get global average reward for normalization
  const globalAvg = await prisma.assetMetric.aggregate({
    _avg: { rewardScore: true },
  });
  const avgReward = Number(globalAvg._avg.rewardScore) || 1;

  const features: PredictionFeature[] = [];

  // Feature 1: Category Match (weight 3.0)
  const categoryWeight = await prisma.learningWeightP4.findFirst({
    where: { channelId, scope: "category", key: product.category || "" },
  });
  const categoryScore = categoryWeight
    ? Math.min(Number(categoryWeight.weight) / avgReward, 2.0)
    : 0.5;
  features.push({
    name: "Danh mục",
    weight: 3.0,
    score: Math.min(categoryScore, 1),
    contribution: 3.0 * Math.min(categoryScore, 1),
    reasoning: categoryWeight
      ? `Kênh có reward ${Number(categoryWeight.weight).toFixed(1)} cho "${product.category}"`
      : `Chưa có data cho "${product.category}"`,
  });

  // Feature 2: Price Range Match (weight 2.0)
  const priceRange = mapPriceToRange(Number(product.price) || 0);
  const priceWeight = await prisma.learningWeightP4.findFirst({
    where: { channelId, scope: "price_range", key: priceRange },
  });
  const priceScore = priceWeight
    ? Math.min(Number(priceWeight.weight) / avgReward, 2.0)
    : 0.5;
  features.push({
    name: "Phân khúc giá",
    weight: 2.0,
    score: Math.min(priceScore, 1),
    contribution: 2.0 * Math.min(priceScore, 1),
    reasoning: priceWeight
      ? `Phân khúc ${priceRange}: reward ${Number(priceWeight.weight).toFixed(1)}`
      : `Chưa có data cho phân khúc ${priceRange}`,
  });

  // Feature 3: Hook Availability (weight 2.0)
  const winCombos = memory.winningCombos as Array<{ winRate: number }>;
  const bestWinRate = winCombos.length > 0
    ? Math.max(...winCombos.map((c) => c.winRate))
    : 0;
  features.push({
    name: "Hook sẵn có",
    weight: 2.0,
    score: bestWinRate,
    contribution: 2.0 * bestWinRate,
    reasoning: winCombos.length > 0
      ? `Có ${winCombos.length} combo thắng, tốt nhất ${Math.round(bestWinRate * 100)}%`
      : "Chưa có combo thắng nào",
  });

  // Feature 4: Format Fit (weight 1.5)
  const topFormatWeight = await prisma.learningWeightP4.findFirst({
    where: { channelId, scope: "format" },
    orderBy: { weight: "desc" },
  });
  const formatScore = topFormatWeight
    ? Math.min(Number(topFormatWeight.weight) / avgReward, 1.0)
    : 0.5;
  features.push({
    name: "Format phù hợp",
    weight: 1.5,
    score: formatScore,
    contribution: 1.5 * formatScore,
    reasoning: topFormatWeight
      ? `Format "${topFormatWeight.key}" reward ${Number(topFormatWeight.weight).toFixed(1)}`
      : "Chưa có data format",
  });

  // Feature 5: Trending Bonus (weight 1.0)
  const lifecycleMap: Record<string, number> = {
    rising: 1.0, hot: 1.0, new: 0.7, peak: 0.6, stable: 0.5, declining: 0.2,
  };
  const trendScore = lifecycleMap[product.lifecycleStage || ""] || 0.5;
  features.push({
    name: "Xu hướng SP",
    weight: 1.0,
    score: trendScore,
    contribution: 1.0 * trendScore,
    reasoning: `SP đang ${product.lifecycleStage || "chưa rõ"} (${Math.round(trendScore * 100)}%)`,
  });

  // Feature 6: Commission Incentive (weight 0.5)
  const commRate = Number(product.commissionRate) || 0;
  const commScore = Math.min(commRate / 15, 1.0);
  features.push({
    name: "Hoa hồng",
    weight: 0.5,
    score: commScore,
    contribution: 0.5 * commScore,
    reasoning: `${commRate.toFixed(1)}% commission (${Math.round(commScore * 100)}% incentive)`,
  });

  // Calculate probability
  const totalContribution = features.reduce((s, f) => s + f.contribution, 0);
  const probability = Math.round(sigmoid(totalContribution - 5) * 100);

  // Confidence
  const totalVideos = memory.totalVideos;
  const confidence: "low" | "medium" | "high" =
    totalVideos < 15 ? "low" : totalVideos < 30 ? "medium" : "high";

  // Summary message
  const message = probability >= 70
    ? `Xác suất cao (${probability}%). Kênh có data tốt cho SP này.`
    : probability >= 40
      ? `Xác suất trung bình (${probability}%). Nên thử với hook đã chứng minh.`
      : `Xác suất thấp (${probability}%). SP có thể không phù hợp với kênh này.`;

  return { probability, confidence, features, totalVideosAnalyzed: totalVideos, message };
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function mapPriceToRange(price: number): string {
  if (price < 100000) return "under_100k";
  if (price < 300000) return "100k_300k";
  if (price < 1000000) return "300k_1m";
  return "over_1m";
}

function insufficientData(message: string): WinPrediction {
  return {
    probability: 50,
    confidence: "low",
    features: [],
    totalVideosAnalyzed: 0,
    message,
  };
}
