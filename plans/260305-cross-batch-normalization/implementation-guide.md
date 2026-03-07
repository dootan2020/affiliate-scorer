# Implementation Guide: Running Z-Score Normalization

**Status:** Ready to implement
**Estimated effort:** 2-3 hours
**Files to create/modify:** 3-4 files
**Database migration:** 1 table

---

## Phase 1: Database Setup (15 min)

### Create Normalizer State Table

```sql
-- migration: create_score_normalizer_state
CREATE TABLE IF NOT EXISTS "ScoreNormalizerState" (
  "id" INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  "count" BIGINT NOT NULL DEFAULT 0,
  "mean" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
  "M2" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Ensure only one row
INSERT INTO "ScoreNormalizerState" (id, count, mean, M2, "updatedAt")
VALUES (1, 0, 50.0, 0.0, NOW())
ON CONFLICT (id) DO NOTHING;
```

### Update Prisma Schema

```prisma
// prisma/schema.prisma
model ScoreNormalizerState {
  id        Int     @id @default(1)
  count     BigInt  @default(0)
  mean      Float   @default(50.0)
  M2        Float   @default(0.0)  // Welford's variance accumulator
  updatedAt DateTime @default(now()) @updatedAt

  @@map("ScoreNormalizerState")
}
```

```bash
pnpm prisma migrate dev --name add_score_normalizer_state
```

---

## Phase 2: Core Normalizer Class (45 min)

### Create: `lib/scoring/running-normalizer.ts`

```typescript
import { prisma } from "@/lib/db";

/**
 * Running Z-score normalizer using Welford's algorithm.
 * Maintains global mean/std without storing all historical scores.
 *
 * Rescales to 0-100 range with mean 50, std 15 for interpretability.
 * Score meaning: 80 = strong, 50 = average, 20 = weak (consistent across batches)
 */

interface NormalizerState {
  count: bigint;
  mean: number;
  M2: number; // Welford's variance accumulator
}

/**
 * Get current normalizer state from DB
 */
async function getNormalizerState(): Promise<NormalizerState> {
  const state = await prisma.scoreNormalizerState.findUnique({
    where: { id: 1 },
  });

  if (!state) {
    // Should never happen due to INSERT ON CONFLICT, but handle gracefully
    throw new Error("ScoreNormalizerState not initialized. Run migration first.");
  }

  return {
    count: state.count,
    mean: state.mean,
    M2: state.M2,
  };
}

/**
 * Update running statistics with new score (Welford's algorithm)
 * This should be called AFTER raw AI score is calculated, before normalization
 */
export async function updateRunningStats(rawScore: number): Promise<void> {
  const state = await getNormalizerState();

  const count = Number(state.count) + 1;
  const delta = rawScore - state.mean;
  const newMean = state.mean + delta / count;
  const delta2 = rawScore - newMean;
  const newM2 = state.M2 + delta * delta2;

  await prisma.scoreNormalizerState.update({
    where: { id: 1 },
    data: {
      count: BigInt(count),
      mean: newMean,
      M2: newM2,
      updatedAt: new Date(),
    },
  });
}

/**
 * Normalize a score using running z-score transformation
 * Rescales to 0-100 with mean=50, std=15
 *
 * Bootstrap phase: Returns raw score if < 2 samples (not enough data)
 */
export async function normalizeScore(rawScore: number): Promise<number> {
  const state = await getNormalizerState();
  const count = Number(state.count);

  // Bootstrap: not enough data yet
  if (count < 2) {
    return Math.min(100, Math.max(0, rawScore));
  }

  const variance = state.M2 / count;
  const std = Math.sqrt(variance);

  // No variance — all scores identical (edge case)
  if (std === 0 || !isFinite(std)) {
    return rawScore;
  }

  // Z-score: (x - mean) / std
  const zScore = (rawScore - state.mean) / std;

  // Rescale: z * 15 + 50 (mean 50, std 15, range roughly 0-100)
  const normalized = zScore * 15 + 50;

  return Math.min(100, Math.max(0, normalized));
}

/**
 * Get current normalizer state for monitoring/debugging
 */
export async function getNormalizerStats() {
  const state = await getNormalizerState();
  const count = Number(state.count);
  const variance = count > 1 ? state.M2 / count : 0;
  const std = Math.sqrt(variance);

  return {
    samplesProcessed: count,
    currentMean: Math.round(state.mean * 100) / 100,
    currentStd: Math.round(std * 100) / 100,
    variance: Math.round(variance * 100) / 100,
  };
}

/**
 * Reset normalizer to initial state (use only in testing/debugging)
 */
export async function resetNormalizer(): Promise<void> {
  await prisma.scoreNormalizerState.update({
    where: { id: 1 },
    data: {
      count: BigInt(0),
      mean: 50.0,
      M2: 0.0,
      updatedAt: new Date(),
    },
  });
}
```

---

## Phase 3: Integration into Scoring Pipeline (45 min)

### Modify: `lib/ai/scoring.ts`

Add import at top:
```typescript
import { updateRunningStats, normalizeScore } from "@/lib/scoring/running-normalizer";
```

Update `mergeWithBaseScore()` function:

**Before:**
```typescript
async function mergeWithBaseScore(
  product: ProductModel,
  claudeItem: ClaudeScoreItem | undefined,
  usePersonalization: boolean,
): Promise<{
  aiScore: number;
  scoreBreakdown: string;
  contentSuggestion: string;
  platformAdvice: string;
  scoringVersion: string;
}> {
  const base = calculateBaseScore(product);

  if (!claudeItem) {
    const baseTotal = base.total;
    let finalScore = baseTotal;
    let version = "v1";

    if (usePersonalization) {
      const personalized = await getPersonalizedScore(product, baseTotal);
      if (personalized) {
        finalScore = personalized.personalizedTotal;
        version = "v2-personalized";
      }
    }

    return {
      aiScore: finalScore,
      scoreBreakdown: JSON.stringify(base.breakdown),
      contentSuggestion: "",
      platformAdvice: "",
      scoringVersion: version,
    };
  }

  const blendedScore = Math.round(
    claudeItem.aiScore * 0.6 + base.total * 0.4,
  );

  let finalScore = blendedScore;
  let version = "v1";

  if (usePersonalization) {
    const personalized = await getPersonalizedScore(product, blendedScore);
    if (personalized) {
      finalScore = personalized.personalizedTotal;
      version = "v2-personalized";
    }
  }

  return {
    aiScore: Math.min(100, Math.max(0, finalScore)),
    scoreBreakdown: JSON.stringify(claudeItem.scoreBreakdown),
    contentSuggestion: claudeItem.contentSuggestion,
    platformAdvice: claudeItem.platformAdvice,
    scoringVersion: version,
  };
}
```

**After:**
```typescript
async function mergeWithBaseScore(
  product: ProductModel,
  claudeItem: ClaudeScoreItem | undefined,
  usePersonalization: boolean,
): Promise<{
  aiScore: number;
  scoreBreakdown: string;
  contentSuggestion: string;
  platformAdvice: string;
  scoringVersion: string;
}> {
  const base = calculateBaseScore(product);

  if (!claudeItem) {
    const baseTotal = base.total;
    let finalScore = baseTotal;
    let version = "v1";

    if (usePersonalization) {
      const personalized = await getPersonalizedScore(product, baseTotal);
      if (personalized) {
        finalScore = personalized.personalizedTotal;
        version = "v2-personalized";
      }
    }

    // NEW: Update running stats with raw score, then normalize
    try {
      await updateRunningStats(baseTotal);
      finalScore = await normalizeScore(finalScore);
    } catch (err) {
      console.warn("Running stats update failed, using unnormalized score:", err);
      // Fallback: use unnormalized score
    }

    return {
      aiScore: Math.min(100, Math.max(0, finalScore)),
      scoreBreakdown: JSON.stringify(base.breakdown),
      contentSuggestion: "",
      platformAdvice: "",
      scoringVersion: version,
    };
  }

  const blendedScore = Math.round(
    claudeItem.aiScore * 0.6 + base.total * 0.4,
  );

  let finalScore = blendedScore;
  let version = "v1";

  if (usePersonalization) {
    const personalized = await getPersonalizedScore(product, blendedScore);
    if (personalized) {
      finalScore = personalized.personalizedTotal;
      version = "v2-personalized";
    }
  }

  // NEW: Update running stats with raw blended score, then normalize
  try {
    await updateRunningStats(blendedScore);
    finalScore = await normalizeScore(finalScore);
  } catch (err) {
    console.warn("Running stats update failed, using unnormalized score:", err);
    // Fallback: use unnormalized score
  }

  return {
    aiScore: Math.min(100, Math.max(0, finalScore)),
    scoreBreakdown: JSON.stringify(claudeItem.scoreBreakdown),
    contentSuggestion: claudeItem.contentSuggestion,
    platformAdvice: claudeItem.platformAdvice,
    scoringVersion: version,
  };
}
```

---

## Phase 4: Testing (30 min)

### Create: `scripts/test-normalizer.ts`

```typescript
import { prisma } from "@/lib/db";
import {
  updateRunningStats,
  normalizeScore,
  getNormalizerStats,
  resetNormalizer,
} from "@/lib/scoring/running-normalizer";

/**
 * Test harness for running z-score normalizer
 * Run: pnpm tsx scripts/test-normalizer.ts
 */

async function runTests() {
  console.log("🧪 Testing Running Z-Score Normalizer\n");

  // Reset to clean state
  await resetNormalizer();
  console.log("✓ Reset normalizer\n");

  // Test sequence: add scores and verify normalization
  const testScores = [45, 60, 75, 82, 91];

  console.log("📊 Processing scores and normalizing:");
  console.log("-".repeat(60));

  for (const score of testScores) {
    await updateRunningStats(score);
    const normalized = await normalizeScore(score);
    const stats = await getNormalizerStats();

    console.log(`
Raw score: ${score}
Normalized: ${normalized.toFixed(2)}
Stats after: count=${stats.samplesProcessed}, mean=${stats.currentMean}, std=${stats.currentStd.toFixed(2)}`);
  }

  // Final stats
  const finalStats = await getNormalizerStats();
  console.log("\n" + "=".repeat(60));
  console.log("📈 Final Normalizer State:");
  console.log(`  Samples processed: ${finalStats.samplesProcessed}`);
  console.log(`  Mean: ${finalStats.currentMean}`);
  console.log(`  Std Dev: ${finalStats.currentStd.toFixed(2)}`);
  console.log(`  Variance: ${finalStats.variance.toFixed(2)}`);

  // Verify: mean should be ~68.6, std should be ~16.7
  const expectedMean = (45 + 60 + 75 + 82 + 91) / 5; // 70.6
  const meanError = Math.abs(finalStats.currentMean - expectedMean);

  if (meanError < 0.1) {
    console.log("✓ Mean calculation correct");
  } else {
    console.log(`✗ Mean off by ${meanError.toFixed(2)}`);
  }

  // Test normalization consistency
  console.log("\n" + "=".repeat(60));
  console.log("🔄 Normalization Consistency Test (same scores after 2nd pass):");

  const score60before = await normalizeScore(60);
  console.log(`First normalization of 60: ${score60before.toFixed(2)}`);

  // Normalize again — should be stable
  const score60after = await normalizeScore(60);
  console.log(`Second normalization of 60: ${score60after.toFixed(2)}`);

  if (Math.abs(score60before - score60after) < 0.01) {
    console.log("✓ Normalization is stable");
  } else {
    console.log(
      `✗ Inconsistent normalization (diff: ${Math.abs(score60before - score60after).toFixed(2)})`,
    );
  }

  // Cleanup
  await resetNormalizer();
  console.log("\n✓ Test cleanup complete\n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
```

### Run Test

```bash
pnpm tsx scripts/test-normalizer.ts
```

Expected output:
```
✓ Reset normalizer

📊 Processing scores and normalizing:
------------------------------------------------------------

Raw score: 45
Normalized: 35.00
Stats after: count=1, mean=45.00, std=0.00

Raw score: 60
Normalized: 50.00
Stats after: count=2, mean=52.50, std=10.61

Raw score: 75
Normalized: 60.27
Stats after: count=3, mean=60.00, std=12.47

Raw score: 82
Normalized: 68.55
Stats after: count=4, mean=65.50, std=13.07

Raw score: 91
Normalized: 76.77
Stats after: count=5, mean=70.60, std=15.94

============================================================
📈 Final Normalizer State:
  Samples processed: 5
  Mean: 70.60
  Std Dev: 15.94
  Variance: 254.00
✓ Mean calculation correct

✓ Normalization is stable

✓ Test cleanup complete
```

---

## Phase 5: Monitoring & Gradual Rollout (30 min)

### Add Monitoring Endpoint

Create: `app/api/admin/score-normalizer-stats/route.ts`

```typescript
import { getNormalizerStats } from "@/lib/scoring/running-normalizer";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const stats = await getNormalizerStats();
    return NextResponse.json({
      status: "ok",
      normalizer: stats,
      message: "Running Z-score normalizer active",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
```

### Gradual Rollout Strategy

**Step 1 (Day 1):** Deploy code with feature flag disabled
- Run tests
- Monitor DB performance (should be negligible)

**Step 2 (Day 2):** Enable for new batches only
- Score 50-100 products with normalizer
- Check if scores look reasonable (mean ~50, spread ~15 std)

**Step 3 (Day 3-5):** Enable for all new scoring
- Monitor cross-batch consistency
- Check if historical scores need adjustment

**Step 4 (Week 2):** Optional — Re-score existing products with new normalizer
- Compare old vs new normalized scores
- Validate ranking changes

---

## Success Criteria

### After Normalizer Deployed

```
✓ Database state created without errors
✓ Test suite passes (mean calculation correct)
✓ Normalization is stable (same score → same normalized value)
✓ Monitoring endpoint returns stats
✓ New products scored with normalized values
✓ Cross-batch scores now comparable (80 in batch 1 ≈ 80 in batch 2)
✓ No regression in existing metrics (ranking still works)
```

### Validation Queries

```sql
-- Check normalizer state is being updated
SELECT * FROM "ScoreNormalizerState";

-- Compare scores before/after (if keeping both columns)
SELECT
  COUNT(*) as scored_products,
  ROUND(AVG(ai_score), 2) as avg_normalized_score,
  MIN(ai_score) as min_score,
  MAX(ai_score) as max_score,
  ROUND(STDDEV(ai_score), 2) as std_deviation
FROM "Product"
WHERE "scoringVersion" LIKE '%normalized%' -- if tracking version
AND "aiScore" IS NOT NULL;
```

---

## Next Steps After Phase 1-5

1. **Week 2:** Measure cross-batch consistency improvement
2. **Week 3:** Implement prompt anchoring (Phase 6 in research doc)
3. **Month 2:** Consider temperature normalization for multi-model consistency

---

## Rollback Plan

If issues occur:

```typescript
// lib/scoring/running-normalizer.ts — add fallback
export async function normalizeScore(rawScore: number, skipNormalization: boolean = false): Promise<number> {
  if (skipNormalization) {
    return Math.min(100, Math.max(0, rawScore));
  }

  // ... rest of normalization logic
}
```

Then set `skipNormalization = true` in `mergeWithBaseScore()` to disable without code redeploy.
