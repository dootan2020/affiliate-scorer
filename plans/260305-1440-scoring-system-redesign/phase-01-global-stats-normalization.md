# Phase 01: Global Running Stats + Cross-batch Normalization

## Priority: CRITICAL — Foundation for all other phases
## Status: Pending

## Context
- [Audit Report](../../docs/scoring-suggestions-logic-report.md)
- Current: per-batch min-max normalization → cross-batch ranking meaningless
- After R2: range 20-100 but batch 1's "80" may not equal batch 2's "80"

## Problem
Current `normalizeScores()` in `score-identity.ts` uses batch-local min/max:
```
normalized = ((raw - batchMin) / (batchMax - batchMin)) * 80 + 20
```
- Batch of 3 products: min=50, max=55 → normalized to 20, 60, 100 (absurd spread)
- Batch of 300 products: scores compress differently
- Cross-batch ranking is meaningless

## Solution: Global Running Statistics

### Architecture
Create `ScoringGlobalStats` — a single-row table tracking cumulative statistics across ALL batches.

```sql
-- Add to Prisma schema
model ScoringGlobalStats {
  id        String @id @default("singleton")
  count     Int    @default(0)          // total products scored
  sumRaw    Float  @default(0)          // sum of raw scores
  sumSqRaw  Float  @default(0)          // sum of squared raw scores
  globalMin Float  @default(100)        // observed minimum raw score
  globalMax Float  @default(0)          // observed maximum raw score
  updatedAt DateTime @updatedAt
}
```

### Normalization Function

```typescript
// lib/scoring/global-stats.ts

interface GlobalStats {
  count: number;
  mean: number;
  stddev: number;
  globalMin: number;
  globalMax: number;
}

/** Get or initialize global stats */
async function getGlobalStats(): Promise<GlobalStats> {
  const row = await prisma.scoringGlobalStats.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });

  const mean = row.count > 0 ? row.sumRaw / row.count : 50;
  const variance = row.count > 1
    ? (row.sumSqRaw - row.sumRaw * row.sumRaw / row.count) / (row.count - 1)
    : 100;
  const stddev = Math.sqrt(Math.max(0, variance));

  return { count: row.count, mean, stddev, globalMin: row.globalMin, globalMax: row.globalMax };
}

/** Update global stats with new batch of raw scores */
async function updateGlobalStats(rawScores: number[]): Promise<void> {
  if (rawScores.length === 0) return;

  const batchSum = rawScores.reduce((s, v) => s + v, 0);
  const batchSumSq = rawScores.reduce((s, v) => s + v * v, 0);
  const batchMin = Math.min(...rawScores);
  const batchMax = Math.max(...rawScores);

  await prisma.$executeRaw`
    UPDATE "ScoringGlobalStats"
    SET
      count = count + ${rawScores.length},
      "sumRaw" = "sumRaw" + ${batchSum},
      "sumSqRaw" = "sumSqRaw" + ${batchSumSq},
      "globalMin" = LEAST("globalMin", ${batchMin}),
      "globalMax" = GREATEST("globalMax", ${batchMax})
    WHERE id = 'singleton'
  `;
}

/**
 * Normalize a raw score to 0-100 using global z-score + sigmoid mapping.
 *
 * Strategy: Modified z-score → sigmoid → 0-100
 * - z = (raw - globalMean) / globalStdDev
 * - Use sigmoid to map z to [0, 1]: sig = 1 / (1 + exp(-k * z))
 * - Scale to 0-100: score = round(sig * 100)
 *
 * k=1.5 gives nice spread: z=-2 → ~5, z=-1 → ~18, z=0 → 50, z=1 → 82, z=2 → 95
 *
 * Properties:
 * - Score 50 ALWAYS means "average product" (at global mean)
 * - Score 80+ ALWAYS means "top ~10%" (>1 stddev above mean)
 * - Score 30- ALWAYS means "bottom ~10%" (<1 stddev below mean)
 * - Adding new batch doesn't change meaning of scores
 * - Absolute meaning preserved across batches
 */
function normalizeWithGlobalStats(rawScore: number, stats: GlobalStats): number {
  if (stats.count < 10 || stats.stddev < 1) {
    // Cold start: not enough data, use raw score clamped
    return Math.max(0, Math.min(100, Math.round(rawScore)));
  }

  const z = (rawScore - stats.mean) / stats.stddev;
  const K = 1.5; // Controls spread — 1.5 gives ~18-82 for ±1 stddev
  const sigmoid = 1 / (1 + Math.exp(-K * z));
  return Math.max(0, Math.min(100, Math.round(sigmoid * 100)));
}
```

### Why z-score + sigmoid over other approaches

| Method | Cross-batch | Absolute meaning | Cold-start | Compute cost |
|--------|------------|-----------------|------------|-------------|
| Per-batch min-max (current) | BAD | NO | OK | O(n) |
| Global min-max | OK | PARTIAL | BAD | O(1) |
| Global percentile | GOOD | YES | BAD (needs all data) | O(n log n) |
| **z-score + sigmoid** | **GOOD** | **YES** | **OK (>10 products)** | **O(1)** |
| ELO | BEST | YES | OK | O(n²) comparisons |

z-score + sigmoid wins because:
1. O(1) normalize — only needs mean + stddev (stored in singleton)
2. Absolute meaning — 50 = average, 80 = excellent, always
3. Cross-batch stable — new batch updates stats incrementally
4. No need to re-score old products — old normalized scores remain valid
5. Sigmoid prevents extreme outliers from breaking the scale

### When old scores need updating
- **NEVER** for normal batch imports — this is the key advantage
- Only when formula itself changes (like R1 weight change) → manual rescore via `/api/internal/rescore-identities`

## Files to modify
- CREATE: `lib/scoring/global-stats.ts`
- CREATE: `prisma/migrations/xxx_add_scoring_global_stats/migration.sql`
- MODIFY: `lib/services/score-identity.ts` — replace `normalizeScores()` with `normalizeWithGlobalStats()`
- MODIFY: `prisma/schema.prisma` — add `ScoringGlobalStats` model

## Implementation Steps
1. Add `ScoringGlobalStats` model to Prisma schema
2. Run `prisma migrate dev`
3. Create `lib/scoring/global-stats.ts` with functions above
4. Modify `score-identity.ts`:
   - In `computeScores()`: return raw combinedScore (no normalization)
   - In `syncIdentityScores()`: after computing raw scores, call `updateGlobalStats(rawScores)` then normalize each with `normalizeWithGlobalStats()`
   - In `syncAllIdentityScores()`: same pattern
5. Initialize global stats from existing 394 products' raw scores
6. Test: score a small batch, verify cross-batch consistency

## Success Criteria
- Score 50 ≈ average product (at global mean)
- Score 80+ ≈ top 10% products
- Import batch 2 after batch 1: rankings across batches are consistent
- Small batch (3 products) doesn't get absurd 20/60/100 spread

## Risk
- Cold start (first 10 products): sigmoid may not be well-calibrated → fallback to raw score
- If raw score distribution shifts dramatically (new data source): mean/stddev drift → acceptable, self-corrects over time
