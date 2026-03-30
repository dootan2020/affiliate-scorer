import type { UserProfile } from "@/lib/niche-scoring/types";

// --- Types ---

export interface NicheRecommendInput {
  price: number | null;
  commissionRate: number | null;
  day28SoldCount: number | null;
  relateAuthorCount: number | null;
  relateVideoCount: number | null;
  deltaType: string | null;
  lifecycleStage: string | null;
  imageUrl: string | null;
}

export interface ReasonTag {
  emoji: string;
  label: string;
  pillar: "opportunity" | "revenue" | "momentum" | "accessibility" | "bonus";
}

export interface NicheRecommendResult {
  score: number;
  pillarScores: {
    opportunity: number;
    revenue: number;
    momentum: number;
    accessibility: number;
  };
  primaryTag: ReasonTag;
  secondaryTags: ReasonTag[];
}

// --- Pillar 1: Opportunity Ratio (0.35) ---

function scoreOpportunity(input: NicheRecommendInput): { score: number; tags: ReasonTag[] } {
  const sold = input.day28SoldCount ?? 0;
  const videos = input.relateVideoCount ?? 0;
  const kols = input.relateAuthorCount ?? 0;

  if (sold === 0) return { score: 0, tags: [] };

  const ratio = sold / (videos + 1);

  let score: number;
  if (ratio > 500) score = 100;
  else if (ratio > 200) score = 90;
  else if (ratio > 100) score = 80;
  else if (ratio > 50) score = 65;
  else if (ratio > 20) score = 50;
  else if (ratio > 10) score = 35;
  else if (ratio > 5) score = 20;
  else score = 10;

  const tags: ReasonTag[] = [];
  if (ratio > 100) {
    tags.push({ emoji: "🎯", label: `Ratio ${Math.round(ratio)}:1 — ít video, bán nhiều`, pillar: "opportunity" });
  }
  if (kols > 100 && videos < 10) {
    tags.push({ emoji: "🎤", label: "Livestream dominant, chưa ai làm video", pillar: "bonus" });
  }

  return { score, tags };
}

// --- Pillar 2: Revenue Signal (0.25) ---

function scoreRevenue(input: NicheRecommendInput): { score: number; tags: ReasonTag[] } {
  const price = input.price ?? 0;
  const rate = Number(input.commissionRate ?? 0);

  if (price === 0 || rate === 0) return { score: 30, tags: [] };

  const revPerOrder = price * (rate / 100);

  let score: number;
  if (revPerOrder > 30_000) score = 100;
  else if (revPerOrder > 20_000) score = 85;
  else if (revPerOrder > 10_000) score = 65;
  else if (revPerOrder > 5_000) score = 45;
  else score = 20;

  const tags: ReasonTag[] = [];
  if (revPerOrder > 20_000) {
    tags.push({ emoji: "💰", label: `${Math.round(revPerOrder / 1000)}K/đơn — hoa hồng cao`, pillar: "revenue" });
  }

  return { score, tags };
}

// --- Pillar 3: Momentum (0.20) ---

const DELTA_SCORES: Record<string, number> = {
  SURGE: 100, NEW: 80, REAPPEAR: 60, STABLE: 30, COOL: 10,
};
const LIFECYCLE_BONUS: Record<string, number> = {
  rising: 15, hot: 10, peak: 5,
};

function scoreMomentum(input: NicheRecommendInput): { score: number; tags: ReasonTag[] } {
  let score = DELTA_SCORES[input.deltaType ?? ""] ?? 20;
  score = Math.min(100, score + (LIFECYCLE_BONUS[input.lifecycleStage ?? ""] ?? 0));

  const tags: ReasonTag[] = [];
  if (input.deltaType === "SURGE") {
    tags.push({ emoji: "🚀", label: "Đang bùng nổ (SURGE)", pillar: "momentum" });
  } else if (input.deltaType === "NEW") {
    tags.push({ emoji: "✨", label: "Sản phẩm mới xuất hiện", pillar: "momentum" });
  } else if (input.deltaType === "REAPPEAR") {
    tags.push({ emoji: "🔄", label: "Quay lại thị trường", pillar: "momentum" });
  }

  return { score, tags };
}

// --- Pillar 4: Accessibility (0.20) ---

function scoreAccessibility(
  input: NicheRecommendInput,
  profile: UserProfile | null,
): { score: number; tags: ReasonTag[] } {
  const price = input.price ?? 0;

  let score: number;
  if (price >= 50_000 && price <= 200_000) score = 100;
  else if (price > 200_000 && price <= 400_000) score = 70;
  else if (price > 0 && price < 50_000) score = 50;
  else if (price > 400_000) score = 30;
  else score = 50;

  const tags: ReasonTag[] = [];

  if (profile) {
    if (profile.contentType === "ai_video") {
      if (input.imageUrl) score = Math.min(100, score + 15);
      if (price > 500_000) score = Math.max(0, score - 10);
    }
    if (!profile.buyProduct && price > 500_000) {
      score = Math.max(0, score - 15);
      tags.push({ emoji: "⚠️", label: "Giá cao — cần mua hàng review", pillar: "accessibility" });
    }
    if (profile.experience === "new" && price >= 50_000 && price <= 200_000) {
      score = Math.min(100, score + 20);
      tags.push({ emoji: "🎓", label: "Giá vừa tầm cho người mới", pillar: "accessibility" });
    }
  }

  if (price >= 50_000 && price <= 200_000 && tags.length === 0) {
    tags.push({ emoji: "✅", label: "Giá sweet spot 50-200K", pillar: "accessibility" });
  }

  return { score, tags };
}

// --- Main ---

export function computeNicheRecommend(
  input: NicheRecommendInput,
  profile: UserProfile | null,
): NicheRecommendResult {
  const opp = scoreOpportunity(input);
  const rev = scoreRevenue(input);
  const mom = scoreMomentum(input);
  const acc = scoreAccessibility(input, profile);

  const score = Math.round(
    opp.score * 0.35 + rev.score * 0.25 + mom.score * 0.20 + acc.score * 0.20,
  );

  const allTags = [...opp.tags, ...rev.tags, ...mom.tags, ...acc.tags];

  const pillarRank = [
    { score: opp.score, tags: opp.tags },
    { score: rev.score, tags: rev.tags },
    { score: mom.score, tags: mom.tags },
    { score: acc.score, tags: acc.tags },
  ].sort((a, b) => b.score - a.score);

  const topTags = pillarRank[0].tags;
  const primaryTag: ReasonTag = topTags[0] ?? allTags[0] ?? { emoji: "📦", label: "Sản phẩm tiềm năng", pillar: "opportunity" };
  const secondaryTags = allTags.filter((t) => t !== primaryTag).slice(0, 2);

  return {
    score,
    pillarScores: {
      opportunity: opp.score,
      revenue: rev.score,
      momentum: mom.score,
      accessibility: acc.score,
    },
    primaryTag,
    secondaryTags,
  };
}

// --- Tag Diversity Post-Processing ---

export function diversifyTags(
  results: Array<{ primaryTag: ReasonTag; secondaryTags: ReasonTag[] }>,
): void {
  const freq = new Map<string, number>();
  for (const r of results) {
    freq.set(r.primaryTag.pillar, (freq.get(r.primaryTag.pillar) ?? 0) + 1);
  }

  for (const [pillar, count] of freq) {
    if (count < 3) continue;
    let swapped = 0;
    for (const r of results) {
      if (swapped >= count - 2) break;
      if (r.primaryTag.pillar !== pillar) continue;
      if (r.secondaryTags.length === 0) continue;
      const oldPrimary = r.primaryTag;
      r.primaryTag = r.secondaryTags[0];
      r.secondaryTags[0] = oldPrimary;
      swapped++;
    }
  }
}
