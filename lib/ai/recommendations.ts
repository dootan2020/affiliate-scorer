import { prisma } from "@/lib/db";

export interface ChannelRec {
  channel: string;
  reason: string;
  contentSuggestion: string;
  budgetSuggestion: number | null;
  confidence: "data" | "goi_y";
}

/**
 * Get avg rewardScore for assets by format type, as proxy for channel performance.
 */
async function getAvgRewardByFormat(format: string): Promise<number | null> {
  const metrics = await prisma.assetMetric.findMany({
    where: {
      contentAsset: { format },
    },
    select: { rewardScore: true },
    take: 50,
    orderBy: { capturedAt: "desc" },
  });

  if (metrics.length === 0) return null;
  return metrics.reduce((s, m) => s + Number(m.rewardScore), 0) / metrics.length;
}

export async function getChannelRecommendations(
  productId: string,
  confidenceLevel: number,
): Promise<ChannelRec[]> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      price: true,
      platform: true,
      totalVideos: true,
      totalKOL: true,
      totalLivestreams: true,
      category: true,
    },
  });

  if (!product) return [];

  const recs: ChannelRec[] = [];
  const totalVideos = product.totalVideos ?? 0;
  const totalKOL = product.totalKOL ?? 0;
  const totalLivestreams = product.totalLivestreams ?? 0;

  // TikTok Organic
  if (totalVideos < 10 && totalKOL < 20) {
    recs.push({
      channel: "TikTok Organic",
      reason: `Chỉ có ${totalVideos} video và ${totalKOL} KOL — thị trường còn trống`,
      contentSuggestion: "Review ngắn 30-60s, focus vào điểm nổi bật sản phẩm",
      budgetSuggestion: null,
      confidence: "goi_y",
    });
  }

  // FB Ads
  if (product.price > 200_000) {
    let fbConf: "data" | "goi_y" = "goi_y";
    let extraReason = "";
    if (confidenceLevel >= 2) {
      const avgReward = await getAvgRewardByFormat("review_short");
      if (avgReward !== null) {
        fbConf = "data";
        extraReason = ` (Avg reward review ngắn: ${avgReward.toFixed(1)})`;
      }
    }
    recs.push({
      channel: "Facebook Ads",
      reason: `Giá ${Math.round(product.price / 1000)}K phù hợp chạy ads${extraReason}`,
      contentSuggestion: "Video review 1-3 phút hoặc carousel ảnh trước/sau",
      budgetSuggestion: Math.round(product.price * 0.5 / 1000) * 1000,
      confidence: fbConf,
    });
  }

  // Livestream
  if (totalLivestreams > 50) {
    recs.push({
      channel: "Livestream",
      reason: `${totalLivestreams} livestream trước đó — sản phẩm phù hợp livestream`,
      contentSuggestion: "Livestream demo trực tiếp + khuyến mãi độc quyền",
      budgetSuggestion: null,
      confidence: "goi_y",
    });
  }

  // Shopee Ads
  if (product.platform.toLowerCase().includes("shopee")) {
    let shopeeConf: "data" | "goi_y" = "goi_y";
    let extraReason = "";
    if (confidenceLevel >= 2) {
      const avgReward = await getAvgRewardByFormat("demo");
      if (avgReward !== null) {
        shopeeConf = "data";
        extraReason = ` (Avg reward demo: ${avgReward.toFixed(1)})`;
      }
    }
    recs.push({
      channel: "Shopee Ads",
      reason: `Sản phẩm trên Shopee — đẩy ads để tăng thứ hạng${extraReason}`,
      contentSuggestion: "Tối ưu keyword + discovery ads với ảnh đẹp",
      budgetSuggestion: 50_000,
      confidence: shopeeConf,
    });
  }

  // Fallback if no recommendations
  if (recs.length === 0) {
    recs.push({
      channel: "TikTok Organic",
      reason: "Kênh cơ bản phù hợp mọi sản phẩm affiliate",
      contentSuggestion: "Thử video review ngắn 30-60s để test phản hồi",
      budgetSuggestion: null,
      confidence: "goi_y",
    });
  }

  return recs;
}

/**
 * Budget portfolio — no longer applicable without Campaign model.
 * Content Factory workflow uses ContentAsset without ad budgets.
 */
export async function getBudgetPortfolio(): Promise<[]> {
  return [];
}
