// Phase 06: SmartScore Suggestions — urgency-driven, staleness-aware
// smartScore = combinedScore*0.45 + urgency*0.25 + channelFit*0.20 + diversity*0.10

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
  calendarEvents: Array<{
    name: string;
    startDate: string;
    eventType: string;
  }>;
  morningBriefProducts: string[];
}

const DELTA_URGENCY: Record<string, number> = {
  REAPPEAR: 40,
  SURGE: 35,
  NEW: 20,
  STABLE: 5,
  COOL: 0,
};

/** Component 2: Urgency Bonus (25%) — "Why NOW?" with staleness decay */
function computeUrgencyBonus(
  deltaType: string | null,
  calendarMatch: boolean,
  ageDays: number,
  lifecycleStage: string | null,
  lastSeenAt: Date | null,
): number {
  let score = 0;

  // Delta momentum (0-40)
  score += DELTA_URGENCY[deltaType ?? "STABLE"] ?? 5;

  // Calendar relevance (0-30)
  if (calendarMatch) score += 30;

  // Recency — new products have urgency (0-20)
  if (ageDays <= 2) score += 20;
  else if (ageDays <= 5) score += 15;
  else if (ageDays <= 10) score += 10;
  else if (ageDays <= 21) score += 5;

  // Lifecycle peak = urgent (0-10)
  if (lifecycleStage === "peak") score += 10;
  else if (lifecycleStage === "hot") score += 5;

  // Case 5: Staleness decay — SP not re-imported >30 days loses urgency
  const daysSinceImport = lastSeenAt
    ? Math.floor((Date.now() - lastSeenAt.getTime()) / 86_400_000)
    : 90; // Unknown = assume stale
  if (daysSinceImport > 30) {
    const staleWeeks = Math.floor((daysSinceImport - 30) / 7);
    const decayPct = Math.min(0.2, staleWeeks * 0.02); // 2%/week, cap 20%
    score = Math.round(score * (1 - decayPct));
  }

  return Math.min(100, score);
}

/** Component 3: Channel Fit Bonus (20%) */
function computeChannelFitBonus(
  product: {
    category: string | null;
    contentPotentialScore: number | null;
    commissionRate: unknown;
    deltaType: string | null;
  },
  channelNiche: string | null,
  contentMix: Record<string, number> | null,
): number {
  let score = 0;

  // Niche match (0-50)
  if (channelNiche && product.category) {
    if (matchesNiche(channelNiche, product.category)) {
      score += 50;
    }
  }

  // ContentMix match (0-50)
  if (contentMix) {
    score += Math.min(50, computeContentMixBonus(product, contentMix));
  }

  return Math.min(100, score);
}

function computeContentMixBonus(
  product: {
    category: string | null;
    contentPotentialScore: number | null;
    commissionRate: unknown;
    deltaType: string | null;
  },
  contentMix: Record<string, number> | null,
): number {
  if (!contentMix) return 0;
  let bonus = 0;
  const total =
    Object.values(contentMix).reduce((s, v) => s + v, 0) || 100;
  if (contentMix.review && product.contentPotentialScore) {
    bonus +=
      (contentMix.review / total) *
      Math.min(100, Number(product.contentPotentialScore));
  }
  if (contentMix.selling && product.commissionRate) {
    bonus +=
      (contentMix.selling / total) *
      Math.min(100, Number(product.commissionRate) * 5);
  }
  if (contentMix.entertainment && product.deltaType) {
    const dScore = DELTA_URGENCY[product.deltaType] ?? 0;
    if (dScore > 0) bonus += (contentMix.entertainment / total) * dScore;
  }
  return Math.min(100, bonus);
}

/** Component 4: Diversity Bonus (10%) — explore mechanism */
function computeDiversityBonus(
  tag: "proven" | "explore",
  categoryUsedCount: number,
): number {
  let score = 0;
  if (tag === "explore") score += 40;

  if (categoryUsedCount === 0) score += 40;
  else if (categoryUsedCount === 1) score += 20;
  else if (categoryUsedCount >= 3) score -= 20;

  // Random jitter for serendipity
  score += Math.floor(Math.random() * 20);
  return Math.max(0, Math.min(100, score));
}

async function getMorningBriefProductIds(): Promise<string[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const brief = await prisma.dailyBrief.findFirst({
    where: { briefDate: { gte: today } },
    orderBy: { briefDate: "desc" },
    select: { content: true },
  });
  if (!brief?.content) return [];
  const text = JSON.stringify(brief.content);
  const ids = text.match(/cmm[a-z0-9]+/g) ?? [];
  return [...new Set(ids)];
}

export async function computeSmartSuggestions(
  channelIds?: string[],
): Promise<SuggestionsResult> {
  const [products, weights, calendarEvents, channels, morningBriefIds] =
    await Promise.all([
      prisma.productIdentity.findMany({
        where: {
          inboxState: { in: ["scored", "enriched"] },
          lifecycleStage: { notIn: ["declining", "dead"] },
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
          marketScore: true,
          deltaType: true,
          commissionRate: true,
          lifecycleStage: true,
          createdAt: true,
          lastSeenAt: true,
          product: { select: { sales7d: true, totalKOL: true } },
        },
      }),
      prisma.learningWeightP4.findMany({
        where: { scope: { in: ["category", "hook_type", "format"] } },
      }),
      prisma.calendarEvent.findMany({
        where: {
          OR: [
            {
              startDate: {
                gte: new Date(),
                lte: new Date(Date.now() + 7 * 86_400_000),
              },
            },
            {
              prepStartDate: { lte: new Date() },
              startDate: { gte: new Date() },
            },
          ],
        },
        orderBy: { startDate: "asc" },
        take: 5,
        select: {
          name: true,
          startDate: true,
          eventType: true,
          notes: true,
        },
      }),
      prisma.tikTokChannel.findMany({
        where: {
          isActive: true,
          ...(channelIds?.length ? { id: { in: channelIds } } : {}),
        },
        select: {
          id: true,
          personaName: true,
          niche: true,
          contentMix: true,
        },
      }),
      getMorningBriefProductIds(),
    ]);

  const morningBriefSet = new Set(morningBriefIds);
  const categoryWeights = new Map<string, number>();
  for (const w of weights) {
    if (w.scope === "category")
      categoryWeights.set(w.key.toLowerCase(), Number(w.weight));
  }

  const calendarCategories = calendarEvents.map((e) => {
    const source = (e.notes ?? e.name).toLowerCase();
    const keywords = source
      .split(/[\s,]+/)
      .filter((kw) => kw.length >= 2);
    return { name: e.name, keywords };
  });

  const now = Date.now();
  const hasWeights = categoryWeights.size > 0;

  // Score all products with new 4-component formula
  const scored: SuggestedProduct[] = products.map((p) => {
    const base = Number(p.combinedScore ?? 0);
    const catKey = p.category?.toLowerCase() ?? "";
    const catWeight = categoryWeights.get(catKey) ?? 0;
    const ageDays = (now - new Date(p.createdAt).getTime()) / 86_400_000;

    const matchedEvent = calendarCategories.find((ce) =>
      catKey &&
      ce.keywords.some(
        (kw) => catKey.includes(kw) || kw.includes(catKey),
      ),
    );

    const urgency = computeUrgencyBonus(
      p.deltaType,
      !!matchedEvent,
      ageDays,
      p.lifecycleStage,
      p.lastSeenAt,
    );

    // Tag: score >= 60 = proven, < 60 = explore
    const tag: "proven" | "explore" = hasWeights
      ? catWeight > 1.0
        ? "proven"
        : "explore"
      : base >= 60
        ? "proven"
        : "explore";

    // Category bonus from learning weights
    const categoryBonus =
      catWeight > 0 ? Math.min(100, catWeight * 50) : 0;

    const smartScore = Math.round(
      base * 0.45 +
        urgency * 0.25 +
        categoryBonus * 0.20 +
        computeDiversityBonus(tag, 0) * 0.10,
    );

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
      contentPotentialScore: Number(p.contentPotentialScore ?? 0),
      marketScore: p.marketScore ? Number(p.marketScore) : null,
      smartScore,
      reason,
      tag,
      deltaType: p.deltaType,
      commissionRate: p.commissionRate ? Number(p.commissionRate) : null,
      lifecycleStage: p.lifecycleStage,
      sales7d: p.product?.sales7d ?? null,
      totalKOL: p.product?.totalKOL ?? null,
      isMorningBriefPick: morningBriefSet.has(p.id),
    };
  });

  const flatList = [...scored]
    .sort((a, b) => b.smartScore - a.smartScore)
    .slice(0, 20);

  // Group by channel with channelFit
  const usedCounts = new Map<string, number>();
  const channelResults: ChannelSuggestions[] = [];

  for (const ch of channels) {
    const contentMix = ch.contentMix as Record<string, number> | null;
    const niche = ch.niche?.toLowerCase() ?? null;

    const channelScored: ChannelScoredProduct[] = scored.map((sp) => {
      const product = products.find((p) => p.id === sp.id)!;
      const fitBonus = computeChannelFitBonus(
        {
          category: product.category,
          contentPotentialScore: Number(
            product.contentPotentialScore ?? 0,
          ),
          commissionRate: product.commissionRate,
          deltaType: product.deltaType,
        },
        niche,
        contentMix,
      );
      return {
        ...sp,
        smartScore: Math.round(sp.smartScore * 0.8 + fitBonus * 0.2),
        contentMixMatch: fitBonus > 20,
      };
    });

    const nicheFiltered = niche
      ? channelScored.filter((sp) => {
          const cat = sp.category ?? "";
          return !cat || matchesNiche(niche, cat);
        })
      : channelScored;
    const nicheMismatch = niche ? nicheFiltered.length === 0 : false;
    const filtered =
      nicheFiltered.length > 0 ? nicheFiltered : channelScored;

    const sorted = filtered.sort((a, b) => b.smartScore - a.smartScore);
    const explore = sorted.filter(
      (sp) => sp.tag === "explore" && (usedCounts.get(sp.id) ?? 0) < 2,
    );
    const proven = sorted.filter(
      (sp) => sp.tag === "proven" && (usedCounts.get(sp.id) ?? 0) < 2,
    );

    // Select: min 2 explore, max 3 per category, max 10 total
    const selected: ChannelScoredProduct[] = [];
    const categoryCounts = new Map<string, number>();

    // Add explore picks first
    for (const sp of explore) {
      if (selected.length >= 2) break;
      selected.push(sp);
      const cat = sp.category ?? "";
      categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
    }

    // Fill with proven (max 3 per category)
    for (const sp of proven) {
      if (selected.length >= 10) break;
      if (selected.some((s) => s.id === sp.id)) continue;
      const cat = sp.category ?? "";
      if ((categoryCounts.get(cat) ?? 0) >= 3) continue;
      if ((usedCounts.get(sp.id) ?? 0) >= 2) continue;
      selected.push(sp);
      categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
    }

    // Fill remaining
    for (const sp of sorted) {
      if (selected.length >= 10) break;
      if (selected.some((s) => s.id === sp.id)) continue;
      if ((usedCounts.get(sp.id) ?? 0) >= 2) continue;
      selected.push(sp);
    }

    selected.sort((a, b) => b.smartScore - a.smartScore);

    const finalProducts: SuggestedProduct[] = selected.map((sp) => {
      const { contentMixMatch, ...rest } = sp;
      if (!contentMixMatch) return rest;
      return {
        ...rest,
        reason: buildSuggestionReason({
          combinedScore: sp.combinedScore,
          categoryWeight:
            categoryWeights.get(sp.category?.toLowerCase() ?? "") ?? 0,
          category: sp.category,
          deltaType: sp.deltaType,
          calendarEvent: null,
          tag: sp.tag,
          lifecycleStage: sp.lifecycleStage,
          contentMixMatch: true,
        }),
      };
    });

    for (const sp of finalProducts)
      usedCounts.set(sp.id, (usedCounts.get(sp.id) ?? 0) + 1);

    channelResults.push({
      channelId: ch.id,
      channelName: ch.personaName,
      niche: ch.niche,
      hasContentMix: contentMix !== null,
      nicheMismatch,
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
    morningBriefProducts: morningBriefIds,
  };
}
