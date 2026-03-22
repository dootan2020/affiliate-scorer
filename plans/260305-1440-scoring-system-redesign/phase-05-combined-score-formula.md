# Phase 05: Combined Score Final Formula

## Priority: CRITICAL — The final scoring equation
## Status: Pending
## Depends on: Phase 01, 02, 03, 04

## Context
- Current: `combinedScore = marketScore * 0.70 + contentPotential * 0.30` (post-R1)
- Data: market↔combined = 0.901 (combined is basically just market)
- Goal: combinedScore has absolute meaning, discriminates well, cross-batch consistent

## New Architecture: 3-Layer Scoring

```
Layer 1: BASE FORMULA SCORE (no AI, pure data)
  → commission × 0.25 + trending × 0.25 + competition × 0.20
    + priceAppeal × 0.15 + salesVelocity × 0.15
  → Range: 0-100 raw

Layer 2: AI EXPERT SCORE (rubric-anchored)
  → market_demand × 0.35 + quality_trust × 0.25
    + viral_potential × 0.25 + risk × 0.15
  → Range: 0-100 raw

Layer 3: COMBINED SCORE (blended + normalized)
  → If AI available: aiScore × 0.55 + baseFormula × 0.45
  → If no AI:        baseFormula only
  → Then: normalizeWithGlobalStats(raw) → 0-100 absolute
```

### Why 55/45 blend (not 60/40 or 70/30)

From real data analysis:
- marketScore (≈ aiScore) has highest discrimination: TOP 20 avg=84.6 vs BOT 20 avg=42.0 (diff=42.6)
- Base formula also discriminates (via commission/trending)
- But AI captures qualitative signals base formula misses
- 55/45 gives AI slight edge while keeping formula grounded

### Combined Score Function

```typescript
// lib/services/score-identity.ts

import { getGlobalStats, updateGlobalStats, normalizeWithGlobalStats } from "@/lib/scoring/global-stats";
import { calculateBaseScore } from "@/lib/scoring/formula";  // Phase 03
// [UPDATED from review — Fix 7] calculateContentPotentialScore import removed — no longer used as fallback

function computeRawCombinedScore(identity: IdentityWithProduct): number | null {
  // Layer 1: BASE FORMULA SCORE (no AI, pure data — from Phase 03)
  const baseFormulaScore = identity.product
    ? calculateBaseScore({
        commissionRate: identity.product.commissionRate,
        sales7d: identity.product.sales7d,
        salesGrowth7d: identity.product.salesGrowth7d,
        totalKOL: identity.product.totalKOL,
        price: Number(identity.price),
        category: identity.category,
      }).total
    : null;

  // Layer 2: AI EXPERT SCORE (rubric-anchored — from Phase 02)
  const aiScore = identity.product?.aiScore
    ?? (identity.marketScore ? Number(identity.marketScore) : null);

  // Layer 3: COMBINED SCORE (blended)
  const hasAI = aiScore != null;
  const hasFormula = baseFormulaScore != null;

  if (hasAI && hasFormula) {
    // Normal case: blend AI + formula
    return aiScore * 0.55 + baseFormulaScore * 0.45;
  }

  if (hasAI && !hasFormula) {
    // No product data for formula — AI only
    return aiScore;
  }

  if (!hasAI && hasFormula) {
    // AI unavailable — formula only (quick paste, API down)
    return baseFormulaScore;
  }

  // [UPDATED from review — Fix 7: contentPotentialScore fallback is meaningless]
  // Phase 04 confirmed contentPotentialScore has ZERO discrimination (avg 71, TOP=66, BOT=68).
  // Using it as fallback would assign a misleadingly "decent" score to products with no real data.
  // Instead, return a fixed low value indicating "insufficient data to score".
  return 30; // Fixed value = "insufficient data", NOT contentPotentialScore
}

/** Score specific identities — with global normalization */
export async function syncIdentityScores(identityIds: string[]): Promise<number> {
  if (identityIds.length === 0) return 0;

  const identities = await prisma.productIdentity.findMany({
    where: { id: { in: identityIds } },
    include: IDENTITY_INCLUDE,
  });

  const updates = identities.map((identity) => {
    const contentScore = calculateContentPotentialScore({...});
    const rawCombined = computeRawCombinedScore(identity);
    return {
      id: identity.id,
      contentPotentialScore: contentScore,
      rawCombined,
      inboxState: identity.inboxState === "new" || identity.inboxState === "enriched"
        ? "scored" : identity.inboxState,
    };
  });

  // [UPDATED from review — Fix 1: Global stats pollution]
  // CRITICAL: Get global stats BEFORE updating with new batch.
  // If we updateGlobalStats() first, the new batch affects its own normalization.
  // Correct order: read OLD stats → normalize with OLD stats → THEN update stats.
  const rawScores = updates
    .map(u => u.rawCombined)
    .filter((s): s is number => s != null);
  const stats = await getGlobalStats(); // OLD stats for normalization

  // Use OLD stats for normalization (not updatedStats)
  const updatedStats = stats; // normalize against pre-batch baseline

  // Update global stats AFTER normalization with new batch data
  // (moved to after the normalize+write loop below)

  // Normalize and write
  for (let i = 0; i < updates.length; i += PARALLEL_WRITES) {
    const chunk = updates.slice(i, i + PARALLEL_WRITES);
    await Promise.allSettled(
      chunk.map(({ id, contentPotentialScore, rawCombined, inboxState }) => {
        const combinedScore = rawCombined != null
          ? normalizeWithGlobalStats(rawCombined, updatedStats)
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

  // [UPDATED from review — Fix 1 continued]
  // NOW update global stats after normalization is done with old stats
  await updateGlobalStats(rawScores);

  return updates.length;
}
```

### Score Meaning Table (POST-NORMALIZATION)

| Score | Meaning | Percentile | Action |
|-------|---------|-----------|--------|
| 90-100 | Xuất sắc — chắc chắn nên làm | Top 5% | Priority 1, làm ngay |
| 75-89 | Rất tốt — nên làm | Top 15% | Priority 2 |
| 60-74 | Tốt — đáng xem xét | Top 35% | Xem xét, phù hợp niche thì làm |
| 45-59 | Trung bình — chấp nhận được | Average | Chỉ làm nếu thiếu SP |
| 30-44 | Dưới trung bình | Bottom 35% | Không nên, trừ khi lý do đặc biệt |
| 0-29 | Kém — nên bỏ qua | Bottom 15% | Bỏ qua |

### contentPotentialScore Role

- Still computed and stored in DB
- NOT blended into combinedScore
- Displayed on UI as separate "Content Ease" badge
- Used by suggestions for contentMix channel matching

## Migration Path (394 existing products)

1. Compute raw combined scores for all 394 products
2. Initialize global stats from these raw scores
3. Normalize all with sigmoid
4. Verify distribution: should see P25≈35, P50≈50, P75≈65, P90≈80

## Files to modify
- MODIFY: `lib/services/score-identity.ts` — new `computeRawCombinedScore()`, remove `normalizeScores()`
- IMPORT: `lib/scoring/global-stats.ts` from Phase 01

## Success Criteria
- Score 50 = global average product
- Score 80+ = top ~10% (verifiable)
- Score 30- = bottom ~10% (verifiable)
- Cross-batch: import new batch → old product rankings unchanged
- User understands: "85 = excellent, 50 = average, 25 = skip"
