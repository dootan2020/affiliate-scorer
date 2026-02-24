import { prisma } from "@/lib/db";

export interface WinPatternData {
  id: string;
  label: string;
  patternType: "winning" | "losing";
  conditions: {
    category?: string;
    priceRange?: string;
    platform?: string;
    contentType?: string;
  };
  winRate: number;
  avgROAS: number;
  totalProfit: number;
  sampleSize: number;
  campaignIds: string[];
}

interface CampaignWithProduct {
  id: string;
  platform: string;
  verdict: string | null;
  roas: number | null;
  profitLoss: number;
  contentType: string | null;
  product: { category: string; price: number } | null;
}

function getPriceRange(price: number): string {
  if (price < 100_000) return "<100K";
  if (price < 300_000) return "100-300K";
  if (price < 500_000) return "300-500K";
  return ">500K";
}

function buildGroupKey(campaign: CampaignWithProduct): string | null {
  if (!campaign.product) return null;
  const category = campaign.product.category;
  const priceRange = getPriceRange(campaign.product.price);
  return `${category}|${priceRange}|${campaign.platform}`;
}

function buildLabel(conditions: WinPatternData["conditions"], patternType: string): string {
  const parts: string[] = [];
  if (conditions.category) parts.push(conditions.category);
  if (conditions.priceRange) parts.push(conditions.priceRange);
  if (conditions.platform) parts.push(conditions.platform);
  const prefix = patternType === "winning" ? "Chien thang" : "That bai";
  return `${prefix}: ${parts.join(" + ")}`;
}

export async function generatePatterns(): Promise<WinPatternData[]> {
  const campaigns = await prisma.campaign.findMany({
    where: { status: "completed", verdict: { not: null } },
    select: {
      id: true,
      platform: true,
      verdict: true,
      roas: true,
      profitLoss: true,
      contentType: true,
      product: { select: { category: true, price: true } },
    },
  });

  if (campaigns.length < 3) return [];

  // Group by category + priceRange + platform
  const groups = new Map<string, CampaignWithProduct[]>();
  for (const c of campaigns) {
    const key = buildGroupKey(c);
    if (!key) continue;
    const list = groups.get(key) ?? [];
    list.push(c);
    groups.set(key, list);
  }

  const patterns: WinPatternData[] = [];

  groups.forEach((group, key) => {
    if (group.length < 2) return;

    const [category, priceRange, platform] = key.split("|");
    const wins = group.filter((c) => c.verdict === "profitable").length;
    const winRate = wins / group.length;
    const avgROAS = group.reduce((s, c) => s + (c.roas ?? 0), 0) / group.length;
    const totalProfit = group.reduce((s, c) => s + c.profitLoss, 0);
    const campaignIds = group.map((c) => c.id);
    const patternType: "winning" | "losing" = winRate >= 0.6 ? "winning" : "losing";

    // Detect dominant content type
    const contentTypes = group.map((c) => c.contentType).filter(Boolean) as string[];
    const contentCount = new Map<string, number>();
    for (const ct of contentTypes) {
      contentCount.set(ct, (contentCount.get(ct) ?? 0) + 1);
    }
    let dominantContent: string | undefined;
    if (contentCount.size > 0) {
      dominantContent = Array.from(contentCount.entries()).sort((a, b) => b[1] - a[1])[0][0];
    }

    const conditions: WinPatternData["conditions"] = {
      category,
      priceRange,
      platform,
      contentType: dominantContent,
    };

    patterns.push({
      id: `pat_${category}_${priceRange}_${platform}`.replace(/\s+/g, "_").toLowerCase(),
      label: buildLabel(conditions, patternType),
      patternType,
      conditions,
      winRate: Math.round(winRate * 100) / 100,
      avgROAS: Math.round(avgROAS * 100) / 100,
      totalProfit,
      sampleSize: group.length,
      campaignIds,
    });
  });

  return patterns.sort((a, b) => b.winRate - a.winRate);
}

export async function refreshPatterns(): Promise<void> {
  const patterns = await generatePatterns();

  await prisma.winPattern.deleteMany();

  if (patterns.length === 0) return;

  await prisma.winPattern.createMany({
    data: patterns.map((p) => ({
      label: p.label,
      patternType: p.patternType,
      conditions: p.conditions,
      campaignIds: p.campaignIds,
      winRate: p.winRate,
      avgROAS: p.avgROAS,
      totalProfit: p.totalProfit,
      sampleSize: p.sampleSize,
    })),
  });
}
