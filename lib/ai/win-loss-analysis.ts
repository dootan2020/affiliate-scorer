import { prisma } from "@/lib/db";

export interface AnalysisFactor {
  factor: string;
  value: string;
  impact: "positive" | "negative" | "neutral";
  detail: string;
}

export interface WinLossResult {
  campaignId: string;
  verdict: string;
  roas: number | null;
  profitLoss: number;
  factors: AnalysisFactor[];
  lessons: string[];
}

async function getAvgRoas(
  where: Record<string, unknown>, excludeId: string,
): Promise<number | null> {
  const camps = await prisma.campaign.findMany({
    where: { status: "completed", verdict: { not: null }, id: { not: excludeId }, ...where },
    select: { roas: true },
  });
  if (camps.length === 0) return null;
  return camps.reduce((s, c) => s + (c.roas ?? 0), 0) / camps.length;
}

async function getProfitablePriceRange(): Promise<{ min: number; max: number } | null> {
  const campaigns = await prisma.campaign.findMany({
    where: { status: "completed", verdict: "profitable" },
    select: { product: { select: { price: true } } },
  });

  const prices = campaigns.filter((c) => c.product).map((c) => c.product!.price);
  if (prices.length < 2) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
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

  if (verdict === "profitable" && positives.length > 0) {
    const combo = positives.map((f) => f.factor).join(" + ");
    lessons.push(`Combo chiến thắng: ${combo}`);
  }

  if (verdict === "loss" && negatives.length > 0) {
    for (const neg of negatives.slice(0, 2)) {
      lessons.push(`${neg.detail}`);
    }
  }

  if (verdict === "break_even") {
    lessons.push("Chiến dịch hòa vốn — cần tối ưu thêm content hoặc budget");
  }

  if (factors.some((f) => f.factor === "Timing" && f.impact === "positive")) {
    lessons.push("Timing gần sự kiện sale giúp tăng hiệu quả");
  }

  if (factors.some((f) => f.factor === "Cạnh tranh" && f.impact === "negative")) {
    lessons.push("Quá nhiều KOL cạnh tranh — chọn sản phẩm ít đối thủ hơn");
  }

  return lessons.length > 0 ? lessons : ["Chưa đủ dữ liệu để rút ra bài học cụ thể"];
}

export async function analyzeWinLoss(campaignId: string): Promise<WinLossResult | null> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      product: true,
      contentPosts: { select: { contentType: true, views: true, likes: true } },
    },
  });

  if (!campaign || !campaign.verdict) return null;

  const factors: AnalysisFactor[] = [];
  const product = campaign.product;

  // 1. Category analysis
  if (product) {
    const catRoas = await getAvgRoas({ product: { category: product.category } }, campaign.id);
    if (catRoas !== null) {
      const campaignRoas = campaign.roas ?? 0;
      const diff = campaignRoas - catRoas;
      factors.push({
        factor: "Category",
        value: product.category,
        impact: diff > 0.5 ? "positive" : diff < -0.5 ? "negative" : "neutral",
        detail: diff > 0.5
          ? `ROAS cao hơn trung bình category (${catRoas.toFixed(1)}x)`
          : diff < -0.5
            ? `ROAS thấp hơn trung bình category (${catRoas.toFixed(1)}x)`
            : `ROAS gần trung bình category (${catRoas.toFixed(1)}x)`,
      });
    }

    // 2. Price analysis
    const priceRange = await getProfitablePriceRange();
    if (priceRange) {
      const inRange = product.price >= priceRange.min && product.price <= priceRange.max;
      factors.push({
        factor: "Giá sản phẩm",
        value: `${Math.round(product.price / 1000)}K VND`,
        impact: inRange ? "positive" : "negative",
        detail: inRange
          ? `Giá nằm trong khoảng thành công (${Math.round(priceRange.min / 1000)}K-${Math.round(priceRange.max / 1000)}K)`
          : `Giá ngoài khoảng thành công (${Math.round(priceRange.min / 1000)}K-${Math.round(priceRange.max / 1000)}K)`,
      });
    }

    // 4. Competition
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

  // 3. Platform analysis
  const platRoas = await getAvgRoas({ platform: campaign.platform }, campaign.id);
  if (platRoas !== null) {
    const diff = (campaign.roas ?? 0) - platRoas;
    factors.push({
      factor: "Platform",
      value: campaign.platform,
      impact: diff > 0.3 ? "positive" : diff < -0.3 ? "negative" : "neutral",
      detail: `ROAS ${campaign.platform}: ${(campaign.roas ?? 0).toFixed(1)}x vs trung bình ${platRoas.toFixed(1)}x`,
    });
  }

  // 5. Timing
  const eventName = await wasNearSaleEvent(campaign.startedAt);
  if (eventName) {
    factors.push({
      factor: "Timing",
      value: eventName,
      impact: campaign.verdict === "profitable" ? "positive" : "neutral",
      detail: `Chạy gần sự kiện "${eventName}"`,
    });
  }

  // 6. Content type
  if (campaign.contentPosts.length > 0) {
    const types = campaign.contentPosts.map((p) => p.contentType).filter(Boolean);
    const topType = types[0] ?? "unknown";
    const totalViews = campaign.contentPosts.reduce((s, p) => s + (p.views ?? 0), 0);
    factors.push({
      factor: "Content",
      value: topType,
      impact: totalViews > 1000 ? "positive" : totalViews > 0 ? "neutral" : "negative",
      detail: `${types.length} bài đăng, ${totalViews.toLocaleString()} lượt xem`,
    });
  }

  const lessons = generateLessons(factors, campaign.verdict);

  return {
    campaignId: campaign.id,
    verdict: campaign.verdict,
    roas: campaign.roas,
    profitLoss: campaign.profitLoss,
    factors,
    lessons,
  };
}
