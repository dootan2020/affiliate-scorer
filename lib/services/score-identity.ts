// Phase 05: 3-Layer Combined Score with Global Normalization
// Layer 1: Base Formula (5 components, no AI) -> raw 0-100
// Layer 2: AI Expert (4 rubric criteria) -> raw 0-100
// Layer 3: Combined = aiScore * 0.55 + baseFormula * 0.45 -> sigmoid normalize
//
// Called from:
//   1. POST /api/upload/products — after scoreProducts() completes
//   2. POST /api/inbox/score-all — manual batch
//   3. POST /api/inbox/[id]/score — manual single
//   4. POST /api/internal/rescore-identities — full re-score

import { prisma } from "@/lib/db";
import { calculateContentPotentialScore } from "@/lib/scoring/content-potential";
import { calculateBaseScore, type BaseScoreInput } from "@/lib/scoring/formula";
import {
  getGlobalStats,
  updateGlobalStats,
  normalizeWithGlobalStats,
} from "@/lib/scoring/global-stats";

interface IdentityWithProduct {
  id: string;
  imageUrl: string | null;
  price: number | null;
  category: string | null;
  title: string | null;
  commissionRate: unknown; // Decimal from Prisma
  description: string | null;
  inboxState: string;
  marketScore: unknown; // Decimal from Prisma
  product: {
    aiScore: number | null;
    totalKOL: number | null;
    totalVideos: number | null;
    commissionRate: number | null;
    sales7d: number | null;
    salesTotal: number | null;
    salesGrowth7d: number | null;
    kolOrderRate: number | null;
    affiliateCount: number | null;
    price: number;
    commissionVND: number;
  } | null;
}

const IDENTITY_INCLUDE = {
  product: {
    select: {
      aiScore: true,
      totalKOL: true,
      totalVideos: true,
      commissionRate: true,
      sales7d: true,
      salesTotal: true,
      salesGrowth7d: true,
      kolOrderRate: true,
      affiliateCount: true,
      price: true,
      commissionVND: true,
    },
  },
} as const;

const PARALLEL_WRITES = 20;

/** Compute raw combined score using 3-layer architecture */
function computeRawCombinedScore(identity: IdentityWithProduct): number | null {
  // Layer 1: BASE FORMULA SCORE (no AI, pure data — Phase 03)
  let baseFormulaScore: number | null = null;
  if (identity.product) {
    const input: BaseScoreInput = {
      commissionRate: identity.product.commissionRate ?? 0,
      commissionVND: identity.product.commissionVND,
      sales7d: identity.product.sales7d,
      salesTotal: identity.product.salesTotal,
      salesGrowth7d: identity.product.salesGrowth7d,
      totalKOL: identity.product.totalKOL,
      totalVideos: identity.product.totalVideos,
      kolOrderRate: identity.product.kolOrderRate,
      affiliateCount: identity.product.affiliateCount,
      price: identity.product.price ?? Number(identity.price) ?? 0,
      name: identity.title,
    };
    baseFormulaScore = calculateBaseScore(input).total;
  }

  // Layer 2: AI EXPERT SCORE (rubric-anchored — Phase 02)
  const aiScore =
    identity.product?.aiScore ??
    (identity.marketScore ? Number(identity.marketScore) : null);

  // Layer 3: COMBINED SCORE (blended)
  const hasAI = aiScore != null && aiScore > 0;
  const hasFormula = baseFormulaScore != null;

  if (hasAI && hasFormula) {
    return aiScore * 0.55 + baseFormulaScore! * 0.45;
  }
  if (hasAI) return aiScore;
  if (hasFormula) return baseFormulaScore;

  // Fix #7: contentPotentialScore has ZERO discrimination (avg 71, TOP=66, BOT=68).
  // Return fixed low value = "insufficient data to score", NOT contentPotentialScore.
  return 30;
}

function computeContentScore(identity: IdentityWithProduct): number {
  return calculateContentPotentialScore({
    imageUrl: identity.imageUrl,
    price: identity.price,
    category: identity.category,
    title: identity.title,
    totalKOL: identity.product?.totalKOL ?? null,
    totalVideos: identity.product?.totalVideos ?? null,
    commissionRate: identity.commissionRate
      ? Number(identity.commissionRate)
      : (identity.product?.commissionRate ?? null),
    description: identity.description,
  });
}

function computeInboxState(current: string): string {
  return current === "new" || current === "enriched" ? "scored" : current;
}

/** Score specific identities by ID with global normalization. Returns count scored. */
export async function syncIdentityScores(
  identityIds: string[],
): Promise<number> {
  if (identityIds.length === 0) return 0;

  const identities = await prisma.productIdentity.findMany({
    where: { id: { in: identityIds } },
    include: IDENTITY_INCLUDE,
  });

  const updates = identities.map((identity) => ({
    id: identity.id,
    contentPotentialScore: computeContentScore(identity),
    rawCombined: computeRawCombinedScore(identity),
    inboxState: computeInboxState(identity.inboxState),
  }));

  // CRITICAL: Get OLD stats FIRST for normalization, THEN update with new batch.
  // New batch must NOT affect its own normalization (Fix #1).
  const stats = await getGlobalStats();

  const rawScores = updates
    .map((u) => u.rawCombined)
    .filter((s): s is number => s != null);
  if (rawScores.length > 0) {
    await updateGlobalStats(rawScores);
  }

  // Normalize and write
  for (let i = 0; i < updates.length; i += PARALLEL_WRITES) {
    const chunk = updates.slice(i, i + PARALLEL_WRITES);
    await Promise.allSettled(
      chunk.map(({ id, contentPotentialScore, rawCombined, inboxState }) => {
        const combinedScore =
          rawCombined != null
            ? normalizeWithGlobalStats(rawCombined, stats)
            : null;
        return prisma.productIdentity.update({
          where: { id },
          data: {
            contentPotentialScore,
            marketScore: rawCombined, // Store raw for reference
            combinedScore,
            inboxState,
          },
        });
      }),
    );
  }

  return updates.length;
}

/** Score ALL non-archived identities with global normalization. */
export async function syncAllIdentityScores(
  onProgress?: (done: number, total: number) => void,
): Promise<number> {
  const identities = await prisma.productIdentity.findMany({
    where: { inboxState: { not: "archived" } },
    include: IDENTITY_INCLUDE,
  });

  const updates = identities.map((identity) => ({
    id: identity.id,
    contentPotentialScore: computeContentScore(identity),
    rawCombined: computeRawCombinedScore(identity),
    inboxState: computeInboxState(identity.inboxState),
  }));

  // CRITICAL: Get OLD stats FIRST, normalize, THEN update (Fix #1)
  const stats = await getGlobalStats();

  const rawScores = updates
    .map((u) => u.rawCombined)
    .filter((s): s is number => s != null);
  if (rawScores.length > 0) {
    await updateGlobalStats(rawScores);
  }
  const total = updates.length;
  let done = 0;

  for (let i = 0; i < updates.length; i += PARALLEL_WRITES) {
    const chunk = updates.slice(i, i + PARALLEL_WRITES);
    await Promise.allSettled(
      chunk.map(({ id, contentPotentialScore, rawCombined, inboxState }) => {
        const combinedScore =
          rawCombined != null
            ? normalizeWithGlobalStats(rawCombined, stats)
            : null;
        return prisma.productIdentity.update({
          where: { id },
          data: {
            contentPotentialScore,
            marketScore: rawCombined,
            combinedScore,
            inboxState,
          },
        });
      }),
    );
    done = Math.min(i + PARALLEL_WRITES, total);
    if (onProgress) onProgress(done, total);
  }

  return updates.length;
}

/** Score a single identity with global normalization. */
export async function syncSingleIdentityScore(
  identityId: string,
): Promise<{
  contentPotentialScore: number;
  marketScore: number | null;
  combinedScore: number | null;
  inboxState: string;
} | null> {
  const identity = await prisma.productIdentity.findUnique({
    where: { id: identityId },
    include: IDENTITY_INCLUDE,
  });

  if (!identity) return null;

  const contentPotentialScore = computeContentScore(identity);
  const rawCombined = computeRawCombinedScore(identity);
  const inboxState = computeInboxState(identity.inboxState);

  // CRITICAL: Get OLD stats FIRST, normalize, THEN update (Fix #1)
  const stats = await getGlobalStats();

  if (rawCombined != null) {
    await updateGlobalStats([rawCombined]);
  }
  const combinedScore =
    rawCombined != null
      ? normalizeWithGlobalStats(rawCombined, stats)
      : null;

  await prisma.productIdentity.update({
    where: { id: identityId },
    data: {
      contentPotentialScore,
      marketScore: rawCombined,
      combinedScore,
      inboxState,
    },
  });

  return { contentPotentialScore, marketScore: rawCombined, combinedScore, inboxState };
}
