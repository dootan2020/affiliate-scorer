import { prisma } from "@/lib/db";
import { callClaude, MAX_TOKENS_LEARNING } from "@/lib/ai/claude";
import { buildLearningPrompt } from "@/lib/ai/prompts";
import { getWeights, saveWeights } from "@/lib/scoring/weights";
import { getTimeDecayWeight } from "@/lib/utils/product-badges";
import type { WeightMap } from "@/lib/ai/prompts";

export interface LearningResult {
  accuracy: number;
  previousAccuracy: number;
  patterns: string[];
  insights: string;
  weightsAdjusted: boolean;
  weekNumber: number;
}

interface ClaudeResponse {
  accuracy: number;
  patterns: string[];
  weightAdjustments: WeightMap;
  insights: string;
}

function buildFeedbackSummary(
  feedbacks: Array<{
    overallSuccess: string;
    aiScoreAtSelection: number;
    product: { category: string; name: string };
    adROAS: number | null;
    feedbackDate: Date;
  }>
): string {
  if (feedbacks.length === 0) return "Chưa có dữ liệu feedback.";

  const total = feedbacks.length;

  // B8: Apply time decay — count weighted successes
  let weightedSuccesses = 0;
  let totalWeight = 0;
  for (const f of feedbacks) {
    const w = getTimeDecayWeight(f.feedbackDate);
    totalWeight += w;
    if (f.overallSuccess === "success") weightedSuccesses += w;
  }
  const successful = feedbacks.filter((f) => f.overallSuccess === "success").length;
  const successRate = totalWeight > 0
    ? ((weightedSuccesses / totalWeight) * 100).toFixed(1)
    : ((successful / total) * 100).toFixed(1);

  // Avg ROAS by category
  const categoryMap: Record<string, { roas: number[]; count: number }> = {};
  for (const f of feedbacks) {
    const cat = f.product.category;
    if (!categoryMap[cat]) categoryMap[cat] = { roas: [], count: 0 };
    categoryMap[cat].count++;
    if (f.adROAS != null) categoryMap[cat].roas.push(f.adROAS);
  }

  const categoryStats = Object.entries(categoryMap)
    .map(([cat, stats]) => {
      const avgRoas =
        stats.roas.length > 0
          ? (stats.roas.reduce((a, b) => a + b, 0) / stats.roas.length).toFixed(2)
          : "N/A";
      return `  - ${cat}: ${stats.count} feedbacks, avg ROAS ${avgRoas}x`;
    })
    .join("\n");

  // Top vs low performers
  const sorted = [...feedbacks].sort((a, b) => b.aiScoreAtSelection - a.aiScoreAtSelection);
  const topPerformers = sorted
    .slice(0, 3)
    .map((f) => `  - ${f.product.name} (AI score: ${f.aiScoreAtSelection}, kết quả: ${f.overallSuccess})`)
    .join("\n");
  const lowPerformers = sorted
    .slice(-3)
    .map((f) => `  - ${f.product.name} (AI score: ${f.aiScoreAtSelection}, kết quả: ${f.overallSuccess})`)
    .join("\n");

  return `Tổng feedback: ${total}
Tỷ lệ thành công: ${successRate}%

Hiệu suất theo danh mục:
${categoryStats}

Sản phẩm điểm cao nhất:
${topPerformers}

Sản phẩm điểm thấp nhất:
${lowPerformers}`;
}

export async function runLearningCycle(): Promise<LearningResult> {
  const now = new Date();
  const weekNumber = Math.ceil(
    ((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7
  );

  try {
    const feedbacks = await prisma.feedback.findMany({
      include: {
        product: {
          select: { name: true, category: true },
        },
      },
    });

    const currentWeights = await getWeights();

    const previousLog = await prisma.learningLog.findFirst({
      orderBy: { runDate: "desc" },
      select: { patternsFound: true, currentAccuracy: true, runDate: true },
    });

    const previousAccuracy = previousLog?.currentAccuracy ?? 0;
    const previousPatterns: string[] = previousLog
      ? (JSON.parse(previousLog.patternsFound) as string[])
      : [];

    const newDataPoints = previousLog?.runDate
      ? await prisma.feedback.count({
          where: { feedbackDate: { gt: previousLog.runDate } },
        })
      : feedbacks.length;

    const feedbackSummary = buildFeedbackSummary(feedbacks);

    const { system, user } = buildLearningPrompt({
      feedbackSummary,
      currentWeights,
      previousPatterns,
    });

    const raw = await callClaude(system, user, MAX_TOKENS_LEARNING);

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Không tìm thấy JSON trong phản hồi Claude");

    const parsed = JSON.parse(jsonMatch[0]) as ClaudeResponse;

    const newWeights: WeightMap = {
      commission: parsed.weightAdjustments.commission ?? currentWeights.commission,
      trending: parsed.weightAdjustments.trending ?? currentWeights.trending,
      competition: parsed.weightAdjustments.competition ?? currentWeights.competition,
      contentFit: parsed.weightAdjustments.contentFit ?? currentWeights.contentFit,
      price: parsed.weightAdjustments.price ?? currentWeights.price,
      platform: parsed.weightAdjustments.platform ?? currentWeights.platform,
    };

    await saveWeights(newWeights, {
      weekNumber,
      totalDataPoints: feedbacks.length,
      newDataPoints,
      accuracy: parsed.accuracy,
      previousAccuracy,
      patterns: parsed.patterns,
      insights: parsed.insights,
      weightsBefore: currentWeights,
    });

    return {
      accuracy: parsed.accuracy,
      previousAccuracy,
      patterns: parsed.patterns,
      insights: parsed.insights,
      weightsAdjusted: true,
      weekNumber,
    };
  } catch (error) {
    console.error("Lỗi trong learning cycle:", error);

    return {
      accuracy: 0,
      previousAccuracy: 0,
      patterns: [],
      insights: "Lỗi khi phân tích dữ liệu. Vui lòng thử lại sau.",
      weightsAdjusted: false,
      weekNumber,
    };
  }
}
