// Server-side smart content suggestions — no LLM, pure formula
import { prisma } from "@/lib/db";
import { buildSuggestionReason } from "./build-suggestion-reason";

export interface SuggestedProduct {
  id: string;
  title: string | null;
  category: string | null;
  imageUrl: string | null;
  combinedScore: number | null;
  contentPotentialScore: number | null;
  smartScore: number;
  reason: string;
  tag: "proven" | "explore";
  deltaType: string | null;
  commissionRate: number | null;
  lifecycleStage: string | null;
}

interface ChannelScoredProduct extends SuggestedProduct {
  contentMixMatch: boolean;
}

export interface ChannelSuggestions {
  channelId: string;
  channelName: string;
  products: SuggestedProduct[];
}

export interface SuggestionsResult {
  channels: ChannelSuggestions[];
  flatList: SuggestedProduct[];
  calendarEvents: Array<{ name: string; startDate: string; eventType: string }>;
}

const DELTA_SCORES: Record<string, number> = {
  REAPPEAR: 100,
  SURGE: 70,
  NEW: 40,
  STABLE: 0,
  COOL: -20,
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

export async function computeSmartSuggestions(
  channelIds?: string[],
): Promise<SuggestionsResult> {
  const [products, weights, calendarEvents, channels] = await Promise.all([
    prisma.productIdentity.findMany({
      where: {
        inboxState: { in: ["scored", "enriched"] },
        lifecycleStage: { not: "declining" },
      },
      orderBy: { combinedScore: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
        category: true,
        imageUrl: true,
        combinedScore: true,
        contentPotentialScore: true,
        deltaType: true,
        commissionRate: true,
        lifecycleStage: true,
        createdAt: true,
      },
    }),
    prisma.learningWeightP4.findMany({
      where: { scope: { in: ["category", "hook_type", "format"] } },
    }),
    prisma.calendarEvent.findMany({
      where: {
        startDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 86_400_000),
        },
      },
      orderBy: { startDate: "asc" },
      take: 5,
      select: { name: true, startDate: true, eventType: true },
    }),
    prisma.tikTokChannel.findMany({
      where: {
        isActive: true,
        ...(channelIds?.length ? { id: { in: channelIds } } : {}),
      },
      select: { id: true, personaName: true, niche: true, contentMix: true },
    }),
  ]);

  // Build weight maps
  const categoryWeights = new Map<string, number>();
  for (const w of weights) {
    if (w.scope === "category") {
      categoryWeights.set(w.key.toLowerCase(), Number(w.weight));
    }
  }

  // Calendar event keywords (min 4 chars to avoid false positives like "day")
  const calendarCategories = calendarEvents.map((e) => ({
    name: e.name,
    keywords: e.name.toLowerCase().split(/\s+/).filter((kw) => kw.length >= 4),
  }));

  // Pre-build product lookup map for O(1) access in channel loop
  const productMap = new Map(products.map((p) => [p.id, p]));
  const now = Date.now();

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

    const ageMs = now - new Date(p.createdAt).getTime();
    const ageDays = ageMs / 86_400_000;
    const recencyBonus = ageDays <= 3 ? 100 : ageDays <= 7 ? 50 : 0;

    const contentPotential = Number(p.contentPotentialScore ?? 0);

    // Coefficients sum to 1.0: 0.45 + 0.15 + 0.10 + 0.10 + 0.10 + 0.10
    const smartScore = Math.round(
      base * 0.45 +
      categoryBonus * 0.15 +
      deltaBonus * 0.10 +
      calendarBonus * 0.10 +
      contentPotential * 0.10 +
      recencyBonus * 0.10,
    );

    const tag: "proven" | "explore" = catWeight > 1.0 ? "proven" : "explore";

    const reason = buildSuggestionReason({
      combinedScore: base,
      categoryWeight: catWeight,
      category: p.category,
      deltaType: p.deltaType,
      calendarEvent: matchedEvent ? { name: matchedEvent.name } : null,
      tag,
      lifecycleStage: p.lifecycleStage,
      contentMixMatch: false,
    });

    return {
      id: p.id,
      title: p.title,
      category: p.category,
      imageUrl: p.imageUrl,
      combinedScore: base,
      contentPotentialScore: contentPotential,
      smartScore,
      reason,
      tag,
      deltaType: p.deltaType,
      commissionRate: p.commissionRate ? Number(p.commissionRate) : null,
      lifecycleStage: p.lifecycleStage,
    };
  });

  const flatList = [...scored].sort((a, b) => b.smartScore - a.smartScore).slice(0, 20);

  // Group by channel — track dedup counts with Map
  const usedCounts = new Map<string, number>();
  const channelResults: ChannelSuggestions[] = [];

  for (const ch of channels) {
    const contentMix = ch.contentMix as Record<string, number> | null;
    const niche = ch.niche?.toLowerCase();

    // Re-score with channel-specific contentMix bonus
    const channelScored: ChannelScoredProduct[] = scored.map((sp) => {
      const product = productMap.get(sp.id)!;
      const mixBonus = computeContentMixBonus(
        {
          category: product.category,
          contentPotentialScore: Number(product.contentPotentialScore ?? 0),
          commissionRate: product.commissionRate,
          deltaType: product.deltaType,
        },
        contentMix,
      );
      const adjustedScore = Math.round(sp.smartScore + mixBonus * 0.10);
      return { ...sp, smartScore: adjustedScore, contentMixMatch: mixBonus > 20 };
    });

    const filtered = niche
      ? channelScored.filter((sp) => {
          const cat = sp.category?.toLowerCase() ?? "";
          return cat.includes(niche) || niche.includes(cat) || !cat;
        })
      : channelScored;

    const sorted = filtered.sort((a, b) => b.smartScore - a.smartScore);
    const proven = sorted.filter((sp) => sp.tag === "proven" && (usedCounts.get(sp.id) ?? 0) < 2);
    const explore = sorted.filter((sp) => sp.tag === "explore" && (usedCounts.get(sp.id) ?? 0) < 2);

    const selected: ChannelScoredProduct[] = [];
    if (explore.length > 0) selected.push(explore[0]);
    for (const sp of proven) {
      if (selected.length >= 5) break;
      if (!selected.some((s) => s.id === sp.id)) selected.push(sp);
    }
    for (const sp of explore) {
      if (selected.length >= 5) break;
      if (!selected.some((s) => s.id === sp.id)) selected.push(sp);
    }

    selected.sort((a, b) => b.smartScore - a.smartScore);

    // Rebuild reason for products with contentMix match
    const finalProducts: SuggestedProduct[] = selected.map((sp) => {
      if (sp.contentMixMatch) {
        return {
          id: sp.id, title: sp.title, category: sp.category, imageUrl: sp.imageUrl,
          combinedScore: sp.combinedScore, contentPotentialScore: sp.contentPotentialScore,
          smartScore: sp.smartScore, tag: sp.tag, deltaType: sp.deltaType,
          commissionRate: sp.commissionRate, lifecycleStage: sp.lifecycleStage,
          reason: buildSuggestionReason({
            combinedScore: sp.combinedScore,
            categoryWeight: categoryWeights.get(sp.category?.toLowerCase() ?? "") ?? 0,
            category: sp.category,
            deltaType: sp.deltaType,
            calendarEvent: null,
            tag: sp.tag,
            lifecycleStage: sp.lifecycleStage,
            contentMixMatch: true,
          }),
        };
      }
      // Strip contentMixMatch from output
      const { contentMixMatch: _, ...rest } = sp;
      return rest;
    });

    for (const sp of finalProducts) {
      usedCounts.set(sp.id, (usedCounts.get(sp.id) ?? 0) + 1);
    }

    channelResults.push({
      channelId: ch.id,
      channelName: ch.personaName,
      products: finalProducts,
    });
  }

  return {
    channels: channelResults,
    flatList,
    calendarEvents: calendarEvents.map((e) => ({
      name: e.name,
      startDate: e.startDate.toISOString(),
      eventType: e.eventType,
    })),
  };
}
