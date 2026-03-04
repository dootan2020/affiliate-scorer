// Server-side smart content suggestions — no LLM, pure formula
import { prisma } from "@/lib/db";
import { buildSuggestionReason } from "./build-suggestion-reason";
import { matchesNiche } from "./niche-category-map";

export interface SuggestedProduct {
  id: string;
  title: string | null;
  category: string | null;
  imageUrl: string | null;
  combinedScore: number | null;
  contentPotentialScore: number | null;
  marketScore: number | null;
  smartScore: number;
  reason: string;
  tag: "proven" | "explore";
  deltaType: string | null;
  commissionRate: number | null;
  lifecycleStage: string | null;
  sales7d: number | null;
  totalKOL: number | null;
  isMorningBriefPick: boolean;
}

interface ChannelScoredProduct extends SuggestedProduct {
  contentMixMatch: boolean;
}

export interface ChannelSuggestions {
  channelId: string;
  channelName: string;
  niche: string | null;
  hasContentMix: boolean;
  nicheMismatch: boolean;
  products: SuggestedProduct[];
}

export interface SuggestionsResult {
  channels: ChannelSuggestions[];
  flatList: SuggestedProduct[];
  calendarEvents: Array<{ name: string; startDate: string; eventType: string }>;
  morningBriefProducts: string[];
}

const DELTA_SCORES: Record<string, number> = {
  REAPPEAR: 100, SURGE: 70, NEW: 40, STABLE: 0, COOL: -20,
};

function computeContentMixBonus(
  product: { category: string | null; contentPotentialScore: number | null; commissionRate: unknown; deltaType: string | null },
  contentMix: Record<string, number> | null,
): number {
  if (!contentMix) return 0;
  let bonus = 0;
  const total = Object.values(contentMix).reduce((s, v) => s + v, 0) || 100;
  if (contentMix.review && product.contentPotentialScore) {
    bonus += (contentMix.review / total) * Math.min(100, Number(product.contentPotentialScore));
  }
  if (contentMix.selling && product.commissionRate) {
    bonus += (contentMix.selling / total) * Math.min(100, Number(product.commissionRate) * 5);
  }
  if (contentMix.entertainment && product.deltaType) {
    const dScore = DELTA_SCORES[product.deltaType] ?? 0;
    if (dScore > 0) bonus += (contentMix.entertainment / total) * dScore;
  }
  return Math.min(100, bonus);
}

/** Extract product IDs mentioned in today's morning brief */
async function getMorningBriefProductIds(): Promise<string[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const brief = await prisma.dailyBrief.findFirst({
    where: { briefDate: { gte: today } },
    orderBy: { briefDate: "desc" },
    select: { content: true },
  });
  if (!brief?.content) return [];
  // Content is JSON — look for productIdentityId references
  const text = JSON.stringify(brief.content);
  const ids = text.match(/cmm[a-z0-9]+/g) ?? [];
  return [...new Set(ids)];
}

export async function computeSmartSuggestions(
  channelIds?: string[],
): Promise<SuggestionsResult> {
  const [products, weights, calendarEvents, channels, morningBriefIds] = await Promise.all([
    prisma.productIdentity.findMany({
      where: {
        inboxState: { in: ["scored", "enriched"] },
        lifecycleStage: { notIn: ["declining", "dead"] },
      },
      orderBy: { combinedScore: "desc" },
      take: 100,
      select: {
        id: true, title: true, category: true, imageUrl: true,
        combinedScore: true, contentPotentialScore: true, marketScore: true,
        deltaType: true, commissionRate: true, lifecycleStage: true, createdAt: true,
        product: { select: { sales7d: true, totalKOL: true } },
      },
    }),
    prisma.learningWeightP4.findMany({
      where: { scope: { in: ["category", "hook_type", "format"] } },
    }),
    prisma.calendarEvent.findMany({
      where: { startDate: { gte: new Date(), lte: new Date(Date.now() + 7 * 86_400_000) } },
      orderBy: { startDate: "asc" },
      take: 5,
      select: { name: true, startDate: true, eventType: true },
    }),
    prisma.tikTokChannel.findMany({
      where: { isActive: true, ...(channelIds?.length ? { id: { in: channelIds } } : {}) },
      select: { id: true, personaName: true, niche: true, contentMix: true },
    }),
    getMorningBriefProductIds(),
  ]);

  const morningBriefSet = new Set(morningBriefIds);

  // Build weight maps
  const categoryWeights = new Map<string, number>();
  for (const w of weights) {
    if (w.scope === "category") categoryWeights.set(w.key.toLowerCase(), Number(w.weight));
  }

  const calendarCategories = calendarEvents.map((e) => ({
    name: e.name,
    keywords: e.name.toLowerCase().split(/\s+/).filter((kw) => kw.length >= 4),
  }));

  const productMap = new Map(products.map((p) => [p.id, p]));
  const now = Date.now();
  const hasWeights = categoryWeights.size > 0;

  // Score all products (flat — no contentMix bonus yet)
  const scored: SuggestedProduct[] = products.map((p) => {
    const base = Number(p.combinedScore ?? 0);
    const catKey = p.category?.toLowerCase() ?? "";
    const catWeight = categoryWeights.get(catKey) ?? 0;
    const categoryBonus = catWeight > 0 ? Math.min(100, catWeight * 50) : 0;
    const deltaBonus = DELTA_SCORES[p.deltaType ?? ""] ?? 0;
    const matchedEvent = calendarCategories.find((ce) =>
      catKey && ce.keywords.some((kw) => catKey.includes(kw) || kw.includes(catKey)),
    );
    const calendarBonus = matchedEvent ? 100 : 0;
    const ageDays = (now - new Date(p.createdAt).getTime()) / 86_400_000;
    const recencyBonus = ageDays <= 3 ? 100 : ageDays <= 7 ? 50 : 0;
    const contentPotential = Number(p.contentPotentialScore ?? 0);

    const smartScore = Math.round(
      base * 0.55 + categoryBonus * 0.15 + deltaBonus * 0.05 +
      calendarBonus * 0.10 + contentPotential * 0.10 + recencyBonus * 0.05,
    );

    const tag: "proven" | "explore" = hasWeights
      ? (catWeight > 1.0 ? "proven" : "explore")
      : (base >= 75 ? "proven" : "explore");

    const reason = buildSuggestionReason({
      combinedScore: base, categoryWeight: catWeight, category: p.category,
      deltaType: p.deltaType, calendarEvent: matchedEvent ? { name: matchedEvent.name } : null,
      tag, lifecycleStage: p.lifecycleStage, contentMixMatch: false,
    });

    return {
      id: p.id, title: p.title, category: p.category, imageUrl: p.imageUrl,
      combinedScore: base, contentPotentialScore: contentPotential,
      marketScore: p.marketScore ? Number(p.marketScore) : null,
      smartScore, reason, tag, deltaType: p.deltaType,
      commissionRate: p.commissionRate ? Number(p.commissionRate) : null,
      lifecycleStage: p.lifecycleStage,
      sales7d: p.product?.sales7d ?? null,
      totalKOL: p.product?.totalKOL ?? null,
      isMorningBriefPick: morningBriefSet.has(p.id),
    };
  });

  const flatList = [...scored].sort((a, b) => b.smartScore - a.smartScore).slice(0, 20);

  // Group by channel
  const usedCounts = new Map<string, number>();
  const channelResults: ChannelSuggestions[] = [];

  for (const ch of channels) {
    const contentMix = ch.contentMix as Record<string, number> | null;
    const niche = ch.niche?.toLowerCase();

    const channelScored: ChannelScoredProduct[] = scored.map((sp) => {
      const product = productMap.get(sp.id)!;
      const mixBonus = computeContentMixBonus(
        { category: product.category, contentPotentialScore: Number(product.contentPotentialScore ?? 0),
          commissionRate: product.commissionRate, deltaType: product.deltaType },
        contentMix,
      );
      return { ...sp, smartScore: Math.round(sp.smartScore + mixBonus * 0.10), contentMixMatch: mixBonus > 20 };
    });

    const nicheFiltered = niche
      ? channelScored.filter((sp) => { const cat = sp.category ?? ""; return !cat || matchesNiche(niche, cat); })
      : channelScored;
    const nicheMismatch = niche ? nicheFiltered.length === 0 : false;
    const filtered = nicheFiltered.length > 0 ? nicheFiltered : channelScored;

    const sorted = filtered.sort((a, b) => b.smartScore - a.smartScore);
    const proven = sorted.filter((sp) => sp.tag === "proven" && (usedCounts.get(sp.id) ?? 0) < 2);
    const explore = sorted.filter((sp) => sp.tag === "explore" && (usedCounts.get(sp.id) ?? 0) < 2);

    const selected: ChannelScoredProduct[] = [];
    if (explore.length > 0) selected.push(explore[0]);
    for (const sp of proven) { if (selected.length >= 10) break; if (!selected.some((s) => s.id === sp.id)) selected.push(sp); }
    for (const sp of explore) { if (selected.length >= 10) break; if (!selected.some((s) => s.id === sp.id)) selected.push(sp); }
    selected.sort((a, b) => b.smartScore - a.smartScore);

    const finalProducts: SuggestedProduct[] = selected.map((sp) => {
      const { contentMixMatch, ...rest } = sp;
      if (!contentMixMatch) return rest;
      return { ...rest, reason: buildSuggestionReason({
        combinedScore: sp.combinedScore, categoryWeight: categoryWeights.get(sp.category?.toLowerCase() ?? "") ?? 0,
        category: sp.category, deltaType: sp.deltaType, calendarEvent: null,
        tag: sp.tag, lifecycleStage: sp.lifecycleStage, contentMixMatch: true,
      })};
    });

    for (const sp of finalProducts) usedCounts.set(sp.id, (usedCounts.get(sp.id) ?? 0) + 1);

    channelResults.push({
      channelId: ch.id, channelName: ch.personaName,
      niche: ch.niche, hasContentMix: contentMix !== null,
      nicheMismatch, products: finalProducts,
    });
  }

  return {
    channels: channelResults, flatList,
    calendarEvents: calendarEvents.map((e) => ({ name: e.name, startDate: e.startDate.toISOString(), eventType: e.eventType })),
    morningBriefProducts: morningBriefIds,
  };
}
