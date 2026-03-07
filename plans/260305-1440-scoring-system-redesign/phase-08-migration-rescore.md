# Phase 08: Migration + Re-score + Verify

## Priority: CRITICAL — Must execute after all other phases
## Status: Pending
## Depends on: ALL previous phases

## Migration Steps

### Step 1: Schema Migration
```bash
# Add ScoringGlobalStats model
pnpm prisma migrate dev --name add-scoring-global-stats
```

### Step 2: Initialize Global Stats from Existing Data
```typescript
// Run once: compute global stats from all 394 products

async function initializeGlobalStats(): Promise<void> {
  // Get all raw scores (before normalization)
  const identities = await prisma.productIdentity.findMany({
    where: { marketScore: { not: null } },
    select: { marketScore: true },
  });

  const rawScores = identities.map(i => Number(i.marketScore));

  // Initialize singleton
  await prisma.scoringGlobalStats.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      count: rawScores.length,
      sumRaw: rawScores.reduce((s, v) => s + v, 0),
      sumSqRaw: rawScores.reduce((s, v) => s + v * v, 0),
      globalMin: Math.min(...rawScores),
      globalMax: Math.max(...rawScores),
    },
    update: {
      count: rawScores.length,
      sumRaw: rawScores.reduce((s, v) => s + v, 0),
      sumSqRaw: rawScores.reduce((s, v) => s + v * v, 0),
      globalMin: Math.min(...rawScores),
      globalMax: Math.max(...rawScores),
    },
  });
}
```

### Step 3: Re-score All Identities
```bash
curl -X POST https://affiliate-scorer.vercel.app/api/internal/rescore-identities
```
This uses the updated `syncAllIdentityScores()` with new formula + global normalization.

### Step 4: Verify Distribution

Target distribution after migration:
```
Score 0-29:  ~10-15% (bottom tier)
Score 30-49: ~20-25% (below average)
Score 50-69: ~35-40% (average)
Score 70-84: ~15-20% (good)
Score 85+:   ~5-10% (excellent)
```

Verification queries:
```sql
-- Distribution check
SELECT
  COUNT(CASE WHEN "combinedScore"::float < 30 THEN 1 END) as tier_low,
  COUNT(CASE WHEN "combinedScore"::float >= 30 AND "combinedScore"::float < 50 THEN 1 END) as tier_below_avg,
  COUNT(CASE WHEN "combinedScore"::float >= 50 AND "combinedScore"::float < 70 THEN 1 END) as tier_avg,
  COUNT(CASE WHEN "combinedScore"::float >= 70 AND "combinedScore"::float < 85 THEN 1 END) as tier_good,
  COUNT(CASE WHEN "combinedScore"::float >= 85 THEN 1 END) as tier_excellent,
  ROUND(AVG("combinedScore"::float)::numeric, 1) as mean,
  ROUND(STDDEV("combinedScore"::float)::numeric, 1) as stddev
FROM "ProductIdentity"
WHERE "combinedScore" IS NOT NULL;

-- Cross-check: Top 10 should be clearly differentiated
SELECT title, "combinedScore"::float, "marketScore"::float, category
FROM "ProductIdentity"
WHERE "combinedScore" IS NOT NULL
ORDER BY "combinedScore" DESC
LIMIT 10;

-- Cross-check: Bottom 10 should be clearly low
SELECT title, "combinedScore"::float, "marketScore"::float, category
FROM "ProductIdentity"
WHERE "combinedScore" IS NOT NULL
ORDER BY "combinedScore" ASC
LIMIT 10;
```

### Step 5: Log Before/After

```typescript
async function logRescoreResults(): Promise<void> {
  console.log("=== BEFORE RE-SCORE ===");
  // (capture current distribution before running rescore)

  console.log("=== AFTER RE-SCORE ===");
  const stats = await prisma.$queryRaw`
    SELECT
      COUNT(*)::int as total,
      MIN("combinedScore"::float)::int as min,
      MAX("combinedScore"::float)::int as max,
      ROUND(AVG("combinedScore"::float)::numeric, 1) as avg,
      ROUND(STDDEV("combinedScore"::float)::numeric, 1) as stddev,
      ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "combinedScore"::float)::numeric, 1) as median
    FROM "ProductIdentity"
    WHERE "combinedScore" IS NOT NULL
  `;
  console.log(stats);
}
```

## Rollback Plan
If new scores look wrong:
1. Raw marketScore is preserved in `ProductIdentity.marketScore` field
2. Can re-run old normalization by reverting `score-identity.ts`
3. Global stats can be reset by deleting singleton row

## NO AI re-scoring needed
- Formula changes (Phase 03) + normalization changes (Phase 01) only affect `combinedScore`
- `Product.aiScore` values remain untouched
- Only re-computation needed, not re-calling AI APIs
- Cost: $0 (no API calls)

---

## Case 4: Re-import Same Product — Data Changed → Score Must Update

### Problem
Import FastMoss week 1: SP "Nồi chiên" sales7d=100, KOL=5.
Import FastMoss week 2: Same SP, sales7d=5000, KOL=200.
Canonical dedup matches → Product fields update → delta classification runs.
But does combinedScore re-calculate? Base formula depends on sales7d, KOL, commission — data changed → score MUST change.

### Solution: Re-score Trigger in Import Pipeline

After Product fields update from re-import, trigger re-score for that specific product.

```typescript
// Integration point: lib/inbox/sync-identity.ts — after product fields update

async function onProductFieldsUpdated(
  identityId: string,
  deltaType: string,
  oldScores: { combinedScore: number | null; marketScore: number | null },
  newProduct: { sales7d: number; totalKOL: number; commissionRate: number },
): Promise<void> {
  // ALWAYS re-calculate formula score when product data changes
  const newScores = computeScores(/* identity with updated product */);

  const scoreChange = oldScores.combinedScore != null && newScores.combinedScore != null
    ? Math.abs(newScores.combinedScore - Number(oldScores.combinedScore))
    : 999; // Unknown old score → treat as significant

  // Decision: AI re-score or formula-only?
  if (deltaType === "SURGE" || scoreChange > 10) {
    // Significant change → AI should re-evaluate quality/risk/viral
    console.log(`[re-import] ${identityId}: delta=${deltaType}, scoreChange=${scoreChange.toFixed(1)} → AI re-score`);
    await triggerAIRescore([identityId]);
  } else {
    // Minor change → formula-only re-score (no token cost)
    console.log(`[re-import] ${identityId}: delta=${deltaType}, scoreChange=${scoreChange.toFixed(1)} → formula-only`);
    await rescoreFormulaOnly("identityIds", undefined, [identityId]);
  }
}

async function triggerAIRescore(identityIds: string[]): Promise<void> {
  // IMPORTANT: Direct function call, NOT HTTP self-fetch
  // On Vercel, serverless functions calling themselves via HTTP can:
  //   - Timeout (function A waits for function B, both have 60s limit)
  //   - Hit cold start delays
  //   - Get rate-limited
  //
  // Instead, import and call the scoring function directly:
  const { scoreProducts } = await import("@/lib/ai/scoring");
  await scoreProducts({
    identityIds,
    includeAlreadyScored: true,
  });
  // If this needs to be non-blocking (don't hold up import pipeline),
  // use Vercel after() callback:
  //   import { after } from "next/server";
  //   after(() => scoreProducts({ identityIds, includeAlreadyScored: true }));
}
```

### Decision Matrix

| Delta Type | Score Change | Action | Token Cost |
|-----------|-------------|--------|-----------|
| SURGE | Any | AI re-score | ~150 tokens/SP |
| REAPPEAR | > 10 points | AI re-score | ~150 tokens/SP |
| REAPPEAR | ≤ 10 points | Formula only | $0 |
| STABLE | > 10 points | AI re-score | ~150 tokens/SP |
| STABLE | ≤ 10 points | Formula only | $0 |
| NEW | N/A | Normal scoring pipeline | ~150 tokens/SP |

### Integration in Import Pipeline

```
Import Excel → Parse → Dedup match → Product.update()
  → sync-identity.ts: syncIdentity()
    → detect deltaType (NEW / REAPPEAR / SURGE / STABLE / COOL)
    → IF existing identity with scores:
        → computeScores() with NEW product data
        → compare with OLD combinedScore
        → IF delta=SURGE OR scoreChange>10 → queue AI re-score
        → ELSE → formula-only re-score
    → ELSE (new identity):
        → normal scoring pipeline
```

### Cost Estimate
- Typical weekly re-import: ~50-100 SP overlap
- SURGE products per import: ~5-10
- Score change >10pt: ~10-20 products
- AI re-score needed: ~15-25 products/import
- Token cost: ~25 × 150 = 3,750 tokens ≈ $0.01/import

---

## Files to modify
- CREATE: `scripts/init-global-stats.ts` — one-time initialization
- MODIFY: `app/api/internal/rescore-identities/route.ts` — add logging
- MODIFY: `lib/inbox/sync-identity.ts` — add re-import re-score trigger (Case 4)
- MODIFY: `lib/scoring/rescore-dispatcher.ts` — add `triggerAIRescore()` (Case 4)

## Success Criteria
- All 394 products re-scored without errors
- Distribution matches target bell curve
- Mean ≈ 50 (sigmoid property)
- StdDev ≈ 15-20 (good spread)
- Top product score ≥ 85
- Bottom product score ≤ 25
- No products stuck at 20 or 100 (sigmoid prevents edge clustering)
- Re-imported products with SURGE delta get AI re-score automatically
- Re-imported products with minor changes get formula-only re-score ($0)
- Score changes logged for audit trail
