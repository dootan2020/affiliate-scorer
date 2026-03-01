// Shared service: sync ProductIdentity scores (content potential + market + combined)
// Called from:
//   1. POST /api/upload/products — after scoreProducts() completes
//   2. POST /api/inbox/score-all — manual batch
//   3. POST /api/inbox/[id]/score — manual single

import { prisma } from "@/lib/db";
import { calculateContentPotentialScore } from "@/lib/scoring/content-potential";

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
  } | null;
}

const IDENTITY_INCLUDE = {
  product: {
    select: {
      aiScore: true,
      totalKOL: true,
      totalVideos: true,
      commissionRate: true,
    },
  },
} as const;

const UPDATE_CHUNK = 50;

function computeScores(identity: IdentityWithProduct): {
  contentPotentialScore: number;
  marketScore: number | null;
  combinedScore: number | null;
  inboxState: string;
} {
  const contentScore = calculateContentPotentialScore({
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

  const marketScore = identity.product?.aiScore
    ?? (identity.marketScore ? Number(identity.marketScore) : null);

  let combinedScore: number | null = null;
  if (marketScore != null && contentScore != null) {
    combinedScore = Math.round(marketScore * 0.5 + contentScore * 0.5);
  } else if (contentScore != null) {
    combinedScore = contentScore;
  } else if (marketScore != null) {
    combinedScore = marketScore;
  }

  const inboxState =
    identity.inboxState === "new" || identity.inboxState === "enriched"
      ? "scored"
      : identity.inboxState;

  return { contentPotentialScore: contentScore, marketScore, combinedScore, inboxState };
}

/** Score specific identities by ID using batch $transaction. Returns count scored. */
export async function syncIdentityScores(identityIds: string[]): Promise<number> {
  if (identityIds.length === 0) return 0;

  const identities = await prisma.productIdentity.findMany({
    where: { id: { in: identityIds } },
    include: IDENTITY_INCLUDE,
  });

  const updates = identities.map((identity) => ({
    id: identity.id,
    scores: computeScores(identity),
  }));

  // Batch update in $transaction chunks
  for (let i = 0; i < updates.length; i += UPDATE_CHUNK) {
    const chunk = updates.slice(i, i + UPDATE_CHUNK);
    await prisma.$transaction(
      chunk.map(({ id, scores }) =>
        prisma.productIdentity.update({
          where: { id },
          data: {
            contentPotentialScore: scores.contentPotentialScore,
            marketScore: scores.marketScore,
            combinedScore: scores.combinedScore,
            inboxState: scores.inboxState,
          },
        }),
      ),
    );
  }

  return updates.length;
}

/** Score ALL non-archived identities using batch $transaction. Returns count scored. */
export async function syncAllIdentityScores(): Promise<number> {
  const identities = await prisma.productIdentity.findMany({
    where: { inboxState: { not: "archived" } },
    include: IDENTITY_INCLUDE,
  });

  const updates = identities.map((identity) => ({
    id: identity.id,
    scores: computeScores(identity),
  }));

  for (let i = 0; i < updates.length; i += UPDATE_CHUNK) {
    const chunk = updates.slice(i, i + UPDATE_CHUNK);
    await prisma.$transaction(
      chunk.map(({ id, scores }) =>
        prisma.productIdentity.update({
          where: { id },
          data: {
            contentPotentialScore: scores.contentPotentialScore,
            marketScore: scores.marketScore,
            combinedScore: scores.combinedScore,
            inboxState: scores.inboxState,
          },
        }),
      ),
    );
  }

  return updates.length;
}

/** Score a single identity. Returns score data. */
export async function syncSingleIdentityScore(identityId: string): Promise<{
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

  const scores = computeScores(identity);
  await prisma.productIdentity.update({
    where: { id: identityId },
    data: {
      contentPotentialScore: scores.contentPotentialScore,
      marketScore: scores.marketScore,
      combinedScore: scores.combinedScore,
      inboxState: scores.inboxState,
    },
  });

  return scores;
}
