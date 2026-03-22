// Phase 07b: Reactive Re-scoring Dispatcher
// Event-driven triggers: learning cycle, personalization tier, batch drift
// NEVER triggers AI re-call automatically — only formula + normalize

import { prisma } from "@/lib/db";
import {
  getGlobalStats,
  updateGlobalStats,
  normalizeWithGlobalStats,
  type GlobalStats,
} from "@/lib/scoring/global-stats";
import { calculateBaseScore, type BaseScoreInput } from "@/lib/scoring/formula";

type RescoreType = "normalize_only" | "formula_only" | "full_with_ai";

interface RescoreRequest {
  type: RescoreType;
  scope: "all" | "category" | "identityIds";
  categories?: string[];
  identityIds?: string[];
  reason: string;
}

export async function dispatchRescore(
  request: RescoreRequest,
): Promise<{ rescored: number }> {
  console.log(
    `[rescore] type=${request.type} scope=${request.scope} reason=${request.reason}`,
  );

  switch (request.type) {
    case "normalize_only":
      return rescoreNormalizeOnly(request.scope, request.categories);

    case "formula_only":
      return rescoreFormulaOnly(
        request.scope,
        request.categories,
        request.identityIds,
      );

    case "full_with_ai":
      throw new Error(
        "AI re-score must be triggered manually via /api/internal/rescore-ai",
      );
  }
}

/** Re-normalize only — no formula recompute, just apply updated global stats */
async function rescoreNormalizeOnly(
  scope: "all" | "category" | "identityIds",
  categories?: string[],
): Promise<{ rescored: number }> {
  const where =
    scope === "category" && categories?.length
      ? { category: { in: categories }, marketScore: { not: null } }
      : { marketScore: { not: null } };

  const identities = await prisma.productIdentity.findMany({
    where: where,
    select: { id: true, marketScore: true },
  });

  const stats = await getGlobalStats();
  const PARALLEL = 20;

  for (let i = 0; i < identities.length; i += PARALLEL) {
    const chunk = identities.slice(i, i + PARALLEL);
    await Promise.allSettled(
      chunk.map(({ id, marketScore }) => {
        const raw = Number(marketScore);
        const normalized = normalizeWithGlobalStats(raw, stats);
        return prisma.productIdentity.update({
          where: { id },
          data: { combinedScore: normalized },
        });
      }),
    );
  }

  console.log(`[rescore] normalize-only: ${identities.length} products`);
  return { rescored: identities.length };
}

/** Formula re-score — recompute base formula + blend, no AI call */
async function rescoreFormulaOnly(
  scope: "all" | "category" | "identityIds",
  categories?: string[],
  identityIds?: string[],
): Promise<{ rescored: number }> {
  const where =
    scope === "identityIds" && identityIds?.length
      ? { id: { in: identityIds } }
      : scope === "category" && categories?.length
        ? { category: { in: categories }, inboxState: { not: "archived" } }
        : { inboxState: { not: "archived" } };

  const identities = await prisma.productIdentity.findMany({
    where: where,
    include: {
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
          name: true,
        },
      },
    },
  });

  // Compute raw scores
  const updates = identities.map((identity) => {
    let rawCombined: number | null = null;

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
        price: identity.product.price ?? (identity.price != null ? Number(identity.price) : 0),
        name: identity.product.name ?? identity.title,
      };
      const baseScore = calculateBaseScore(input).total;
      const aiScore = identity.product.aiScore;

      if (aiScore != null && aiScore > 0) {
        rawCombined = aiScore * 0.55 + baseScore * 0.45;
      } else {
        rawCombined = baseScore;
      }
    } else if (identity.marketScore) {
      rawCombined = Number(identity.marketScore);
    }

    return { id: identity.id, rawCombined };
  });

  // CRITICAL: Get stats BEFORE updating with new batch (Fix C1)
  const stats = await getGlobalStats();

  const rawScores = updates
    .map((u) => u.rawCombined)
    .filter((s): s is number => s != null);
  if (rawScores.length > 0) {
    await updateGlobalStats(rawScores);
  }
  const PARALLEL = 20;

  for (let i = 0; i < updates.length; i += PARALLEL) {
    const chunk = updates.slice(i, i + PARALLEL);
    await Promise.allSettled(
      chunk.map(({ id, rawCombined }) => {
        const normalized =
          rawCombined != null
            ? normalizeWithGlobalStats(rawCombined, stats)
            : null;
        return prisma.productIdentity.update({
          where: { id },
          data: {
            marketScore: rawCombined,
            combinedScore: normalized,
          },
        });
      }),
    );
  }

  console.log(`[rescore] formula-only: ${updates.length} products`);
  return { rescored: updates.length };
}

/** Check global stats drift after large batch import */
export async function checkGlobalStatsDrift(
  preStats: GlobalStats,
  postStats: GlobalStats,
): Promise<{ drifted: boolean; shift: number }> {
  const shift = Math.abs(postStats.mean - preStats.mean);
  return { drifted: shift > 3, shift };
}
