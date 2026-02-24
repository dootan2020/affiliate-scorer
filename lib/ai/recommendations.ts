import { prisma } from "@/lib/db";

export interface ChannelRec {
  channel: string;
  reason: string;
  contentSuggestion: string;
  budgetSuggestion: number | null;
  confidence: "data" | "goi_y";
}

export interface BudgetAllocation {
  campaignId: string;
  campaignName: string;
  currentSpend: number;
  roas: number | null;
  suggestedSpend: number;
  reason: string;
}

interface DailyResult {
  date: string;
  spend: number;
  revenue: number;
  orders: number;
}

async function getUserPlatformRoas(platform: string): Promise<number | null> {
  const campaigns = await prisma.campaign.findMany({
    where: { status: "completed", platform, roas: { not: null } },
    select: { roas: true },
    take: 20,
  });

  if (campaigns.length === 0) return null;
  return campaigns.reduce((s, c) => s + (c.roas ?? 0), 0) / campaigns.length;
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
      reason: `Chi co ${totalVideos} video va ${totalKOL} KOL — thi truong con trong`,
      contentSuggestion: "Review ngan 30-60s, focus vao diem noi bat san pham",
      budgetSuggestion: null,
      confidence: "goi_y",
    });
  }

  // FB Ads
  if (product.price > 200_000) {
    let fbConf: "data" | "goi_y" = "goi_y";
    let extraReason = "";
    if (confidenceLevel >= 2) {
      const fbRoas = await getUserPlatformRoas("facebook");
      if (fbRoas !== null) {
        fbConf = "data";
        extraReason = ` (ROAS FB cua ban: ${fbRoas.toFixed(1)}x)`;
      }
    }
    recs.push({
      channel: "Facebook Ads",
      reason: `Gia ${Math.round(product.price / 1000)}K phu hop chay ads${extraReason}`,
      contentSuggestion: "Video review 1-3 phut hoac carousel anh truoc/sau",
      budgetSuggestion: Math.round(product.price * 0.5 / 1000) * 1000,
      confidence: fbConf,
    });
  }

  // Livestream
  if (totalLivestreams > 50) {
    recs.push({
      channel: "Livestream",
      reason: `${totalLivestreams} livestream truoc do — san pham phu hop livestream`,
      contentSuggestion: "Livestream demo truc tiep + khuyen mai doc quyen",
      budgetSuggestion: null,
      confidence: "goi_y",
    });
  }

  // Shopee Ads
  if (product.platform.toLowerCase().includes("shopee")) {
    let shopeeConf: "data" | "goi_y" = "goi_y";
    let extraReason = "";
    if (confidenceLevel >= 2) {
      const shopeeRoas = await getUserPlatformRoas("shopee");
      if (shopeeRoas !== null) {
        shopeeConf = "data";
        extraReason = ` (ROAS Shopee: ${shopeeRoas.toFixed(1)}x)`;
      }
    }
    recs.push({
      channel: "Shopee Ads",
      reason: `San pham tren Shopee — day ads de tang thu hang${extraReason}`,
      contentSuggestion: "Toi uu keyword + discovery ads voi anh dep",
      budgetSuggestion: 50_000,
      confidence: shopeeConf,
    });
  }

  // Fallback if no recommendations
  if (recs.length === 0) {
    recs.push({
      channel: "TikTok Organic",
      reason: "Kenh co ban phu hop moi san pham affiliate",
      contentSuggestion: "Thu video review ngan 30-60s de test phan hoi",
      budgetSuggestion: null,
      confidence: "goi_y",
    });
  }

  return recs;
}

export async function getBudgetPortfolio(): Promise<BudgetAllocation[]> {
  const activeCampaigns = await prisma.campaign.findMany({
    where: { status: "running" },
    select: {
      id: true,
      name: true,
      totalSpend: true,
      totalRevenue: true,
      roas: true,
      dailyResults: true,
      plannedBudgetDaily: true,
    },
  });

  if (activeCampaigns.length === 0) return [];

  const totalBudget = activeCampaigns.reduce((s, c) => s + (c.plannedBudgetDaily ?? 0), 0);
  const maxPerCampaign = totalBudget > 0 ? totalBudget * 0.5 : Infinity;
  const allocations: BudgetAllocation[] = [];

  for (const campaign of activeCampaigns) {
    const dailyResults = (campaign.dailyResults as unknown as DailyResult[]) ?? [];
    const recent = dailyResults.slice(-3);
    const currentSpend = campaign.plannedBudgetDaily ?? 0;

    // Calculate recent ROAS (last 3 days)
    let recentRoas = campaign.roas;
    if (recent.length > 0) {
      const totalSpend = recent.reduce((s, d) => s + (d.spend ?? 0), 0);
      const totalRev = recent.reduce((s, d) => s + (d.revenue ?? 0), 0);
      recentRoas = totalSpend > 0 ? totalRev / totalSpend : 0;
    }

    let suggestedSpend = currentSpend;
    let reason = "Giu nguyen budget hien tai";

    if (recentRoas !== null && recentRoas > 2) {
      suggestedSpend = Math.round(currentSpend * 1.5);
      reason = `ROAS ${recentRoas.toFixed(1)}x tot — tang budget 50%`;
    } else if (recentRoas !== null && recentRoas >= 1) {
      reason = `ROAS ${recentRoas.toFixed(1)}x on dinh — giu nguyen`;
    } else if (recentRoas !== null && recentRoas < 1) {
      suggestedSpend = Math.round(currentSpend * 0.5);
      reason = `ROAS ${recentRoas.toFixed(1)}x lo — giam budget 50%`;
    }

    // Cap at 50% of total budget
    if (suggestedSpend > maxPerCampaign) {
      suggestedSpend = Math.round(maxPerCampaign);
      reason += " (gioi han 50% tong budget)";
    }

    allocations.push({
      campaignId: campaign.id,
      campaignName: campaign.name,
      currentSpend,
      roas: recentRoas,
      suggestedSpend,
      reason,
    });
  }

  return allocations.sort((a, b) => (b.roas ?? 0) - (a.roas ?? 0));
}
