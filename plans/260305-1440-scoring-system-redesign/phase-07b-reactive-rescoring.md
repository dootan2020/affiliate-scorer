# Phase 07b: Reactive Re-scoring Triggers

## Priority: HIGH
## Status: Pending
## Depends on: Phase 01, 05, 07
## Addresses: Case 1, 2, 3

## Problem

After scoring system is live, 6 events can make existing scores stale:
1. Learning cycle completes → category weights change → SP cũ vẫn score cũ
2. Personalization tier changes (0→5, 5→15, 15→30) → SP cũ không hưởng personalization mới
3. Large batch import → global stats shift → SP cũ drift nhẹ
4. Re-import cùng SP → data thay đổi (Case 4, handled in Phase 08)
5. SP cũ không re-import → staleness (Case 5, handled in Phase 06)
6. User đổi AI model (Case 6, handled in Phase 02)

## Architecture: Event-Driven Re-score Dispatcher

```
Event Source → Check Trigger → Determine Scope → Execute Re-score
```

### Trigger Matrix

| Event | Trigger Condition | Re-score Scope | Cost | Timing |
|-------|------------------|----------------|------|--------|
| Learning cycle cron (weekly) | Weight change > 20% for any category | Partial: SP in affected categories | $0 | Weekly (Sunday) |
| Personalization tier change | Feedback count crosses 5/15/30 | Full: all SP | $0 | On feedback insert |
| Large batch import | Global mean shift > 3pt | Re-normalize only: all SP | $0 | After import |
| Formula change (deploy) | Code change detected | Full: all SP | $0 | Manual via endpoint |
| AI prompt change (deploy) | Code change detected | Full: all SP (AI re-call) | $$$ | Manual, with warning |

### Re-score Types

```typescript
// lib/scoring/rescore-dispatcher.ts

type RescoreType = "normalize_only" | "formula_only" | "full_with_ai";

interface RescoreRequest {
  type: RescoreType;
  scope: "all" | "category" | "identityIds";
  categories?: string[];         // for scope="category"
  identityIds?: string[];        // for scope="identityIds"
  reason: string;                // logging
}

/**
 * Dispatch re-score based on event type.
 * NEVER triggers AI re-call automatically — only formula + normalize.
 * AI re-call is always manual via explicit endpoint.
 */
async function dispatchRescore(request: RescoreRequest): Promise<{ rescored: number }> {
  console.log(`[rescore] type=${request.type} scope=${request.scope} reason=${request.reason}`);

  switch (request.type) {
    case "normalize_only":
      return rescoreNormalizeOnly(request.scope, request.categories);

    case "formula_only":
      return rescoreFormulaOnly(request.scope, request.categories, request.identityIds);

    case "full_with_ai":
      // This should only be called from manual endpoint with user confirmation
      throw new Error("AI re-score must be triggered manually via /api/internal/rescore-ai");
  }
}
```

### Trigger 1: Learning Cycle Complete (Case 1)

```typescript
// Called after weekly learning cron completes
// File: lib/cron/weekly-learning.ts (existing) → add at end

async function onLearningCycleComplete(
  weightChanges: Array<{ scope: string; key: string; oldWeight: number; newWeight: number }>
): Promise<void> {
  // Find categories with >20% weight change
  const significantChanges = weightChanges.filter(w => {
    if (w.scope !== "category") return false;
    const pctChange = Math.abs(w.newWeight - w.oldWeight) / Math.max(w.oldWeight, 0.01);
    return pctChange > 0.20;
  });

  if (significantChanges.length === 0) {
    console.log("[rescore] Learning cycle: no significant weight changes, skip re-score");
    return;
  }

  const affectedCategories = significantChanges.map(w => w.key);
  console.log(`[rescore] Learning cycle: ${affectedCategories.length} categories changed >20%`);

  await dispatchRescore({
    type: "formula_only",
    scope: "category",
    categories: affectedCategories,
    reason: `learning-cycle: ${affectedCategories.join(", ")}`,
  });
}
```

### Trigger 2: Personalization Tier Change (Case 2)

```typescript
// Called after inserting feedback
// File: lib/feedback/implicit-feedback.ts → add after feedback insert

async function onFeedbackInserted(): Promise<void> {
  const count = await prisma.feedback.count();

  // Check if we just crossed a tier boundary
  const TIER_BOUNDARIES = [5, 15, 30];
  const justCrossed = TIER_BOUNDARIES.find(t => count === t);

  if (!justCrossed) return; // Not at a boundary

  console.log(`[rescore] Personalization tier crossed: ${justCrossed} feedback`);

  await dispatchRescore({
    type: "formula_only",
    scope: "all",
    reason: `personalization-tier-${justCrossed}`,
  });
}
```

### Trigger 3: Large Batch Import → Global Stats Drift (Case 3)

```typescript
// Called after import batch scoring completes
// File: lib/scoring/global-stats.ts → add

interface DriftCheck {
  drifted: boolean;
  oldMean: number;
  newMean: number;
  shift: number;
}

async function checkGlobalStatsDrift(
  preImportStats: GlobalStats,
  postImportStats: GlobalStats,
): Promise<DriftCheck> {
  const shift = Math.abs(postImportStats.mean - preImportStats.mean);
  return {
    drifted: shift > 3, // 3-point threshold
    oldMean: preImportStats.mean,
    newMean: postImportStats.mean,
    shift,
  };
}

// [UPDATED from review — Fix 9: preImportStats can't persist between serverless invocations]
// import-chunk and score-batch are separate Vercel serverless invocations with no shared memory.
// Solution: Store preImportStats in ImportBatch record (JSON field) at scoring start,
// read back for drift check after scoring completes.
//
// Schema change needed: add `preImportStats Json?` field to ImportBatch model
// OR store in existing `metadata Json?` field on ImportBatch as metadata.preImportStats
//
// Integration in score-batch relay
// File: app/api/internal/score-batch/route.ts

// At SCORING START (before any products scored):
async function savePreImportStats(batchId: string): Promise<void> {
  const stats = await getGlobalStats();
  await prisma.importBatch.update({
    where: { id: batchId },
    data: { metadata: { preImportStats: stats } },
  });
}

// At SCORING END:
async function onBatchScoringComplete(batchId: string): Promise<void> {
  // Check if this was a large batch
  const batch = await prisma.importBatch.findUnique({
    where: { id: batchId },
    select: { recordCount: true, metadata: true },
  });

  if (!batch || batch.recordCount < 50) return; // Skip small batches

  // Read preImportStats from ImportBatch metadata (persisted across invocations)
  const preImportStats = (batch.metadata as Record<string, unknown>)?.preImportStats as GlobalStats | undefined;
  if (!preImportStats) {
    console.warn(`[rescore] No preImportStats found for batch ${batchId}, skip drift check`);
    return;
  }

  // Compare pre/post global stats
  const stats = await getGlobalStats();
  const drift = await checkGlobalStatsDrift(preImportStats, stats);

  if (drift.drifted) {
    console.log(`[rescore] Global mean shifted ${drift.shift.toFixed(1)}pt after batch ${batchId}`);

    await dispatchRescore({
      type: "normalize_only",
      scope: "all",
      reason: `batch-drift: mean ${drift.oldMean.toFixed(1)} → ${drift.newMean.toFixed(1)}`,
    });
  }
}
```

### Re-score Implementation Functions

```typescript
// lib/scoring/rescore-dispatcher.ts

/** Re-normalize only — no formula recompute, just apply updated global stats */
async function rescoreNormalizeOnly(
  scope: "all" | "category",
  categories?: string[],
): Promise<{ rescored: number }> {
  const where: Prisma.ProductIdentityWhereInput = {
    marketScore: { not: null },
    ...(scope === "category" && categories?.length
      ? { category: { in: categories } }
      : {}),
  };

  const identities = await prisma.productIdentity.findMany({
    where,
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

/** Formula re-score — recompute contentPotential + combinedScore, no AI call */
async function rescoreFormulaOnly(
  scope: "all" | "category" | "identityIds",
  categories?: string[],
  identityIds?: string[],
): Promise<{ rescored: number }> {
  const where: Prisma.ProductIdentityWhereInput =
    scope === "identityIds" && identityIds?.length
      ? { id: { in: identityIds } }
      : scope === "category" && categories?.length
        ? { category: { in: categories }, inboxState: { not: "archived" } }
        : { inboxState: { not: "archived" } };

  const identities = await prisma.productIdentity.findMany({
    where,
    include: { product: { select: { aiScore: true, totalKOL: true, totalVideos: true, commissionRate: true } } },
  });

  // Same logic as syncAllIdentityScores but without AI
  const updates = identities.map(identity => ({
    id: identity.id,
    scores: computeScores(identity), // existing function from score-identity.ts
  }));

  const stats = await getGlobalStats();
  const rawScores = updates
    .map(u => u.scores.combinedScore)
    .filter((s): s is number => s != null);

  // Update global stats
  await updateGlobalStats(rawScores);
  const updatedStats = await getGlobalStats();

  // Write normalized scores
  const PARALLEL = 20;
  for (let i = 0; i < updates.length; i += PARALLEL) {
    const chunk = updates.slice(i, i + PARALLEL);
    await Promise.allSettled(
      chunk.map(({ id, scores }) => {
        const normalized = scores.combinedScore != null
          ? normalizeWithGlobalStats(scores.combinedScore, updatedStats)
          : null;
        return prisma.productIdentity.update({
          where: { id },
          data: {
            contentPotentialScore: scores.contentPotentialScore,
            combinedScore: normalized,
            inboxState: scores.inboxState,
          },
        });
      }),
    );
  }

  console.log(`[rescore] formula-only: ${updates.length} products`);
  return { rescored: updates.length };
}
```

### API Endpoint

```typescript
// app/api/internal/rescore-reactive/route.ts

export const maxDuration = 60;

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const { type, scope, categories, identityIds, reason } = body;

  const result = await dispatchRescore({
    type: type || "formula_only",
    scope: scope || "all",
    categories,
    identityIds,
    reason: reason || "manual",
  });

  return NextResponse.json({ success: true, ...result });
}
```

### Cost Analysis

| Trigger | Frequency | SP count | Time | Token cost |
|---------|-----------|----------|------|-----------|
| Learning cycle (weekly) | 1x/week | ~50-200 (category subset) | ~1s | $0 |
| Personalization tier | 3x total (at 5, 15, 30) | ~400 (all) | ~2s | $0 |
| Large batch drift | ~1x/month | ~400 (all) | ~1s | $0 |
| Formula deploy | ~1x/quarter | ~400 (all) | ~2s | $0 |

**Total annual cost: $0.** All reactive re-scores are formula-only or normalize-only.

## Files to create/modify
- CREATE: `lib/scoring/rescore-dispatcher.ts`
- CREATE: `app/api/internal/rescore-reactive/route.ts`
- MODIFY: `app/api/internal/score-batch/route.ts` — add drift check after batch complete
- MODIFY: `lib/scoring/global-stats.ts` — add `checkGlobalStatsDrift()`

## Success Criteria
- Learning cycle triggers partial re-score for affected categories
- Personalization tier change triggers full re-score within 5s
- Large batch import (>50 SP) triggers re-normalize if mean shifts >3pt
- All reactive re-scores complete within Vercel 60s timeout
- No AI tokens spent on reactive re-scoring
