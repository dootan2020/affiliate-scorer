import { prisma } from "@/lib/db";

export interface AnalysisFactor {
  factor: string;
  value: string;
  impact: "positive" | "negative" | "neutral";
  detail: string;
}

export interface WinLossResult {
  assetId: string;
  verdict: string;
  rewardScore: number;
  factors: AnalysisFactor[];
  lessons: string[];
}

async function getAvgRewardByScope(
  scope: string,
  key: string,
  excludeId: string,
): Promise<number | null> {
  const weights = await prisma.learningWeightP4.findFirst({
    where: { scope, key },
    select: { weight: true },
  });
  return weights ? Number(weights.weight) : null;
}

async function wasNearSaleEvent(date: Date | null): Promise<string | null> {
  if (!date) return null;
  const window = 7 * 86_400_000;
  const nearby = await prisma.calendarEvent.findFirst({
    where: {
      startDate: { lte: new Date(date.getTime() + window) },
      endDate: { gte: new Date(date.getTime() - window) },
    },
    select: { name: true },
  });
  return nearby?.name ?? null;
}

function generateLessons(factors: AnalysisFactor[], verdict: string): string[] {
  const lessons: string[] = [];
  const positives = factors.filter((f) => f.impact === "positive");
  const negatives = factors.filter((f) => f.impact === "negative");

  if (verdict === "win" && positives.length > 0) {
    const combo = positives.map((f) => f.factor).join(" + ");
    lessons.push(`Combo chiến thắng: ${combo}`);
  }

  if (verdict === "loss" && negatives.length > 0) {
    for (const neg of negatives.slice(0, 2)) {
      lessons.push(`${neg.detail}`);
    }
  }

  if (verdict === "neutral") {
    lessons.push("Video trung bình — cần tối ưu thêm hook hoặc format");
  }

  if (factors.some((f) => f.factor === "Timing" && f.impact === "positive")) {
    lessons.push("Timing gần sự kiện sale giúp tăng hiệu quả");
  }

  return lessons.length > 0 ? lessons : ["Chưa đủ dữ liệu để rút ra bài học cụ thể"];
}

/**
 * Analyze win/loss factors for a ContentAsset based on its metrics and context.
 */
export async function analyzeWinLoss(assetId: string): Promise<WinLossResult | null> {
  const asset = await prisma.contentAsset.findUnique({
    where: { id: assetId },
    include: {
      productIdentity: { select: { title: true, product: { select: { category: true, price: true, totalKOL: true } } } },
      metrics: { orderBy: { capturedAt: "desc" }, take: 1 },
    },
  });

  if (!asset || asset.metrics.length === 0) return null;

  const metric = asset.metrics[0];
  const reward = Number(metric.rewardScore);
  const verdict = reward > 0.3 ? "win" : reward < -0.3 ? "loss" : "neutral";

  const factors: AnalysisFactor[] = [];
  const product = asset.productIdentity?.product;

  // 1. Hook type analysis
  if (asset.hookType) {
    const avgWeight = await getAvgRewardByScope("hook_type", asset.hookType, assetId);
    if (avgWeight !== null) {
      factors.push({
        factor: "Hook type",
        value: asset.hookType,
        impact: avgWeight > 1 ? "positive" : avgWeight < 0.5 ? "negative" : "neutral",
        detail: avgWeight > 1
          ? `Hook "${asset.hookType}" có weight cao (${avgWeight.toFixed(1)})`
          : `Hook "${asset.hookType}" có weight thấp (${avgWeight.toFixed(1)})`,
      });
    }
  }

  // 2. Format analysis
  if (asset.format) {
    const avgWeight = await getAvgRewardByScope("format", asset.format, assetId);
    if (avgWeight !== null) {
      factors.push({
        factor: "Format",
        value: asset.format,
        impact: avgWeight > 1 ? "positive" : avgWeight < 0.5 ? "negative" : "neutral",
        detail: `Format "${asset.format}" weight: ${avgWeight.toFixed(1)}`,
      });
    }
  }

  // 3. Product category
  if (product?.category) {
    const catWeight = await getAvgRewardByScope("category", product.category, assetId);
    if (catWeight !== null) {
      factors.push({
        factor: "Category",
        value: product.category,
        impact: catWeight > 1 ? "positive" : catWeight < 0.5 ? "negative" : "neutral",
        detail: `Category "${product.category}" weight: ${catWeight.toFixed(1)}`,
      });
    }
  }

  // 4. Competition
  if (product) {
    const kol = product.totalKOL ?? 0;
    factors.push({
      factor: "Cạnh tranh",
      value: `${kol} KOL`,
      impact: kol < 20 ? "positive" : kol > 60 ? "negative" : "neutral",
      detail: kol < 20
        ? "Ít cạnh tranh — cơ hội tốt"
        : kol > 60
          ? "Quá nhiều KOL — thị trường bão hòa"
          : "Mức cạnh tranh trung bình",
    });
  }

  // 5. Timing — was it near a sale event?
  const eventName = await wasNearSaleEvent(asset.publishedAt);
  if (eventName) {
    factors.push({
      factor: "Timing",
      value: eventName,
      impact: verdict === "win" ? "positive" : "neutral",
      detail: `Đăng gần sự kiện "${eventName}"`,
    });
  }

  // 6. Views performance
  const views = metric.views ?? 0;
  factors.push({
    factor: "Views",
    value: views.toLocaleString(),
    impact: views > 5000 ? "positive" : views < 500 ? "negative" : "neutral",
    detail: views > 5000
      ? "Views cao — content thu hút tốt"
      : views < 500
        ? "Views thấp — cần cải thiện hook/thumbnail"
        : "Views trung bình",
  });

  const lessons = generateLessons(factors, verdict);

  return {
    assetId: asset.id,
    verdict,
    rewardScore: reward,
    factors,
    lessons,
  };
}
