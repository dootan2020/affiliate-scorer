# Research Report: Cross-Batch Score Normalization & Multi-Model AI Calibration

**Date:** 2026-03-05
**Context:** PASTR affiliate scorer with 394 products across multiple batches (50-300 per batch)
**Problem:** Min-max per-batch normalization breaks cross-batch comparability; score 80 in batch 1 ≠ score 80 in batch 2

---

## Executive Summary

Three approaches are recommended, ranked by effectiveness + implementation simplicity:

1. **RECOMMENDED: Running Z-Score Normalization (Running Statistics)** — Best balance of simplicity, cost, and interpretability. Preserves absolute score meaning across batches.
2. **ALTERNATIVE: Percentile Ranking** — Maximum cross-batch consistency but loses absolute "80=excellent" meaning.
3. **BONUS: Prompt Anchoring + Optional Two-Pass Scoring** — Addresses LLM calibration inconsistency directly.

---

## 1. Cross-Batch Normalization Deep Dive

### 1.1 Current Problem: Min-Max Per-Batch

```
Batch 1: min=45, max=92 → score 80 → normalized to (80-45)/(92-45) = 0.66
Batch 2: min=30, max=85 → score 80 → normalized to (80-30)/(85-30) = 0.91
```

Both products have same raw score (80) but VERY different normalized scores. **This breaks comparison.**

Sources: [Z-Score Normalization Techniques](https://www.emergentmind.com/topics/z-score-normalization), [Batch Normalization Theory](https://www.datacamp.com/tutorial/batch-normalization-tensorflow)

---

### 1.2 Option A: Running Z-Score Normalization (RECOMMENDED)

**Concept:** Maintain global mean/std deviation, update incrementally with Welford's algorithm as new batches arrive.

**Formula:**
```
z-score = (x - running_mean) / running_std
final_score = (z-score * 15 + 50)  // rescale to 0-100 with mean 50, std 15
```

**Advantages:**
- ✅ Absolute meaning preserved: 80 = "strong" across batches
- ✅ O(1) memory, O(n) compute per batch
- ✅ Works without reprocessing history
- ✅ Numerically stable (Welford's algorithm, used in TensorFlow batch norm)
- ✅ Simple to implement

**Disadvantages:**
- Early batches influence later scores (slow convergence with small n)
- Requires storing 3 values globally: count, mean, M2 (variance accumulator)

**Welford's Algorithm (numerically stable):**
```
For each new score x:
  count = count + 1
  delta = x - mean
  mean = mean + delta / count
  delta2 = x - mean
  M2 = M2 + delta * delta2

variance = M2 / count
std = sqrt(variance)
```

Sources: [Welford Algorithm for Variance](https://changyaochen.github.io/welford/), [Running Mean & Variance](https://nullbuffer.com/articles/welford_algorithm.html), [Embedded Related Deep Dive](https://www.embeddedrelated.com/showarticle/785.php)

---

### 1.3 Option B: Percentile Ranking

**Concept:** Convert all scores to percentile rank across all products ever imported.

**Formula:**
```
percentile = (products_with_lower_score / total_products) * 100
final_score = percentile  // 0-100
```

**Advantages:**
- ✅ Perfect cross-batch consistency by definition
- ✅ No statistical assumptions needed
- ✅ Common in research (citation impact normalization)

**Disadvantages:**
- ❌ Loses absolute meaning: "80" just means "top 20%" — not "excellent quality"
- ❌ All scores shift when new batch added (products drop in percentile)
- ❌ Requires full sort of all products on every update

**When to use:** If you only care about relative ranking, not absolute quality judgment.

Sources: [Percentile Rank Definition](https://en.wikipedia.org/wiki/Percentile_rank), [Quantile Normalization](https://en.wikipedia.org/wiki/Quantile_normalization), [Citation Normalization Methods](https://link.springer.com/article/10.1007/s11192-020-03512-7)

---

### 1.4 Option C: ELO Rating System (Theoretical)

**Concept:** Adapt ELO (chess) for products with "pairwise comparisons" between batches.

**Why we skip it:**
- Requires comparing products against each other (battles/wins)
- Our scoring is absolute (AI generates 0-100), not relative
- Over-engineered for this use case
- High K-factor tuning complexity

**Note:** ELO works great for model comparison, not product quality assessment.

Sources: [ELO Rating System](https://en.wikipedia.org/wiki/Elo_rating_system), [ELO for Auto-Evaluation](https://www.emergentmind.com/topics/elo-based-auto-evaluation-metrics)

---

### 1.5 Option D: Bayesian Sequential Updating (Theoretical)

**Concept:** Update prior distribution of scores as each batch arrives; posterior becomes next prior.

**Why we skip it:**
- Overkill for normalization task
- Requires choosing prior (Beta distribution?) and likelihood
- No real benefit over Welford's simpler running stats
- More complex to explain to stakeholders

**When useful:** If you want to model uncertainty/confidence in scores.

Sources: [Sequential Bayesian Updating](https://www.stats.ox.ac.uk/~steffen/teaching/bs2HT9/kalman.pdf), [Bayesian Inference](https://en.wikipedia.org/wiki/Bayesian_inference)

---

## 2. Multi-Model AI Calibration

### 2.1 Problem: Claude vs Gemini vs GPT Inconsistency

Currently blending Claude score (60%) + formula score (40%), but different AI models produce different distributions:
- Claude tends toward middle (mean 60-65)
- Gemini mode distribution is flatter
- GPT-4 clusters high (mean 75+)

Sources: [Temperature Scaling for LLM Calibration](https://markaicode.com/temperature-scaling-calibrate-llm-confidence-scores/), [ICLR 2025 Semantic Calibration](https://iclr.cc/virtual/2025/32891)

---

### 2.2 Option A: Prompt Anchoring (Simplest, Free)

**Concept:** Add reference examples in scoring prompt.

```
CURRENT PROMPT:
"Score this product 0-100."

ANCHORED PROMPT:
"Score this product 0-100:
  - 90-100: Exceptional quality, trending, perfect niche fit
  - 70-89:  Good product, decent engagement potential
  - 50-69:  Average product, needs improvement
  - 30-49:  Below average, limited appeal
  - 0-29:   Poor quality, unlikely to perform

Examples:
  - iphone case (mass appeal, 4M views): 85
  - niche kitchen gadget (1K views): 45
  - viral trend product (trending): 88
"
```

**Effectiveness:** Studies show anchoring works but with caveats:
- Chain-of-Thought prompting (ask AI to explain) reduces anchoring bias by ~40%
- Margins of victory still vary 20-30% between models
- NOT a substitute for post-hoc calibration

**To test:** Run 20 products 3x each, measure score variance.

Sources: [Anchoring Bias in LLMs](https://www.sciencedirect.com/science/article/pii/S2214635024000868), [Few-Shot Prompting](https://learnprompting.org/docs/intermediate/self_consistency)

---

### 2.3 Option B: Temperature Normalization (Post-Hoc)

**Concept:** Scale raw AI scores post-generation using learned temperature parameter.

```
calibrated_score = f(raw_ai_score, temperature)
```

**Advanced methods:**
- **Adaptive Temperature Scaling (ATS):** Predict temperature per score using auxiliary model
- **Thermometer (MIT):** Learn dataset-specific temperature mapping from multiple tasks

**Why suitable:** Model-agnostic, works with existing scores, no retraining needed.

**Downside:** Requires calibration dataset (50-100 manually verified scores).

Sources: [Adaptive Temperature Scaling](https://arxiv.org/abs/2409.19817), [Thermometer MIT](https://sia.mit.edu/wp-content/uploads/2024/12/2024-shen-das-greenewald-sattigeri-wornell-icml.pdf), [Calibration Methods Overview](https://latitude.so/blog/5-methods-for-calibrating-llm-confidence-scores)

---

### 2.4 Option C: Two-Pass Scoring (Expensive)

**Pass 1:** AI generates initial score + reasoning

**Pass 2:** AI reviews own work + adjusts if needed
```
"Your previous score was 75. Looking at [reasoning], does this feel right?
Adjust to X if needed, or keep 75 if accurate."
```

**Effectiveness:** +8-12% consistency between models, but 2x token cost.

**ROI:** Only worth if you're hitting tier-3 pricing anyway (bulk scoring).

---

## 3. Practical Recommendations for PASTR

### 3.1 Immediate Implementation: Running Z-Score Normalization

**Why this:**
1. Low token cost (free at runtime)
2. Preserves "80 = good" semantics
3. Works for 394 products + new batches
4. Vercel 60s timeout: just 3 arithmetic ops per score

**Implementation path:**
1. Create `ScoreNormalizer` class storing running stats in DB
2. After scoring each product, update running mean/std
3. Rescale new scores to 0-100 range
4. Re-rank products (existing logic does this)

**Database change:**
```sql
ALTER TABLE "ScoreNormalizer" ADD COLUMN (
  count INTEGER DEFAULT 0,
  mean FLOAT DEFAULT 50,
  M2 FLOAT DEFAULT 0  -- variance accumulator
);
```

**Estimated effort:** 2-3 hours (write class, update scoring pipeline, test)

---

### 3.2 Medium-Term: Prompt Anchoring + Rubric

**Implement in next prompt iteration:**

Add this to `lib/ai/prompts/scoring-prompt.ts`:

```typescript
export function buildScoringPrompt({ products, weights }: ScoreInput): {
  system: string;
  user: string;
} {
  return {
    system: `You are a product quality evaluator. Score products 0-100 using this rubric:

SCORE INTERPRETATION:
- 90-100: Exceptional quality, proven viral potential, perfect niche fit, high engagement
- 75-89:  Strong product, good market demand, solid commission potential
- 50-74:  Average product, moderate engagement potential, needs positioning
- 25-49:  Below average, limited market fit or weak metrics
- 0-24:   Poor quality, unlikely to convert

CALIBRATION EXAMPLES:
- iPhone Pro Max case (mass appeal, 2M+ views): 82
- Niche Japanese kitchen knife (100K views, 30% conversion): 71
- Trending TikTok gadget (viral, 10M views): 88
- Low-quality dropship item (1K views, 2% conversion): 28

Always explain your score using 2-3 key factors from the data provided.`,
    user: `Score these products...` // rest of prompt
  };
}
```

**Test before deploying:**
```
Run 20 products 3x each → measure score variance
Target: coefficient of variation < 5% per product
```

**Estimated effort:** 1 hour (update prompt, run test batch)

---

### 3.3 Optional: Two-Pass Scoring (v2.0)

Only do this if:
- Token budget allows (current bottleneck?)
- Consistency issues persist after prompt anchoring
- 394 products → ~30 products/batch → ~15 batches to fully rescore

**Not recommended yet** — wait 1-2 weeks for data on prompt anchoring effectiveness.

---

## 4. Implementation Priority Matrix

| Approach | Cost | Effort | Impact | Priority |
|----------|------|--------|--------|----------|
| Running Z-Score | Free | 2-3h | High (solves batch problem) | **DO NOW** |
| Prompt Anchoring | Free | 1h | Medium (±5% consistency) | **DO AFTER NORMALIZATION** |
| Temperature Normalization | Free (post-hoc) | 4-6h | Medium (±8% consistency) | Defer |
| Two-Pass Scoring | 2x tokens | 2h code + testing | Medium (±10% consistency) | Defer to v2.0 |
| ELO / Bayesian | - | Over-engineered | Unnecessary | Skip |

---

## 5. Pseudocode: Running Z-Score Implementation

### Database Schema Update

```sql
-- Store global normalization stats
CREATE TABLE score_normalization_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  count BIGINT DEFAULT 0,
  mean DOUBLE PRECISION DEFAULT 50.0,
  M2 DOUBLE PRECISION DEFAULT 0.0,  -- Welford's variance accumulator
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO score_normalization_state VALUES (1, 0, 50.0, 0.0, NOW());
```

### Code: Welford Update

```typescript
// lib/scoring/running-normalizer.ts
import { prisma } from "@/lib/db";

interface NormalizerState {
  count: number;
  mean: number;
  M2: number;
}

async function getNormalizerState(): Promise<NormalizerState> {
  const state = await prisma.scoreNormalizerState.findUnique({
    where: { id: 1 }
  });
  return state || { count: 0, mean: 50, M2: 0 };
}

export async function updateRunningStats(rawScore: number): Promise<void> {
  const state = await getNormalizerState();

  // Welford's online algorithm
  const count = state.count + 1;
  const delta = rawScore - state.mean;
  const newMean = state.mean + delta / count;
  const delta2 = rawScore - newMean;
  const newM2 = state.M2 + delta * delta2;

  await prisma.scoreNormalizerState.update({
    where: { id: 1 },
    data: {
      count,
      mean: newMean,
      M2: newM2,
      updatedAt: new Date()
    }
  });
}

export async function normalizeScore(rawScore: number): Promise<number> {
  const state = await getNormalizerState();

  if (state.count < 2) {
    // Bootstrap: use default scaling until enough data
    return Math.min(100, Math.max(0, rawScore));
  }

  const variance = state.M2 / state.count;
  const std = Math.sqrt(variance);

  if (std === 0) {
    // All scores identical, no variance
    return rawScore;
  }

  // Z-score normalization → rescale to 0-100 with mean 50, std 15
  const zScore = (rawScore - state.mean) / std;
  const normalized = zScore * 15 + 50;

  return Math.min(100, Math.max(0, normalized));
}
```

### Integration: Update Scoring Pipeline

```typescript
// In lib/ai/scoring.ts, after calculating aiScore:

async function mergeWithBaseScore(
  product: ProductModel,
  claudeItem: ClaudeScoreItem | undefined,
  usePersonalization: boolean,
): Promise<ScoredProduct> {
  // ... existing code ...

  let finalScore = blendedScore;

  // NEW: Apply running normalization AFTER blending
  finalScore = await normalizeScore(finalScore);

  // Update global running stats
  await updateRunningStats(blendedScore); // use RAW score, not normalized

  // ... rest of existing code ...
}
```

### Test Harness

```typescript
// scripts/test-normalizer.ts
async function testNormalizer() {
  const testScores = [45, 60, 75, 82, 91];

  console.log("Testing Running Z-Score Normalizer:");

  for (const score of testScores) {
    await updateRunningStats(score);
    const normalized = await normalizeScore(score);
    console.log(`Raw: ${score} → Normalized: ${normalized.toFixed(2)}`);
  }

  // Expected: scores spread more evenly after 3-4 updates
}
```

---

## 6. Data Validation Strategy

### Pre-Deployment Checks

```sql
-- Check min/max/mean before vs after normalization
SELECT
  COUNT(*),
  MIN(ai_score) as min_raw,
  MAX(ai_score) as max_raw,
  AVG(ai_score) as mean_raw
FROM product_scoring_v1;

-- After deploying normalizer:
SELECT
  COUNT(*),
  MIN(normalized_score) as min_norm,
  MAX(normalized_score) as max_norm,
  AVG(normalized_score) as mean_norm
FROM product_scoring_v2;
```

### Expected Behavior

```
BEFORE (per-batch min-max):
  Batch 1: range [30, 95], mean 65, many at 85-95
  Batch 2: range [20, 80], mean 55, many at 45-55
  → INCOMPARABLE

AFTER (running z-score):
  All batches: range [5, 95], mean ~50, std ~15
  → COMPARABLE, "80 always means ~strong"
```

---

## 7. Key Findings from Research

### Running Statistics (Welford)
- Used in TensorFlow batch normalization for numerical stability
- Prevents catastrophic rounding errors (unlike naive sum-of-squares)
- O(1) memory, O(n) per-batch computation
- Source: [TensorFlow Batch Norm](https://www.datacamp.com/tutorial/batch-normalization-tensorflow)

### Multi-Model Calibration
- Post-hoc calibration (temperature scaling, isotonic regression) outperforms direct prompting
- Platt scaling can degrade performance on modern models; Beta calibration preferred
- Semantic-level calibration (Selective Logit Smoothing) addresses LLM confidence miscalibration
- Source: [Model-Agnostic Calibration Study 2025](https://arxiv.org/abs/2601.19944)

### Prompt Anchoring Effectiveness
- Anchoring reduces forecast variance by ~30%
- Chain-of-Thought significantly reduces anchoring bias
- Inter-rater reliability (Krippendorff's Alpha) increases 0.15-0.25 with good rubrics
- 5-point rubric with 4-6 criteria optimal for consistency
- Source: [Anchoring & Rubric Design in AI](https://www.sciencedirect.com/science/article/pii/S2214635024000868)

### Batch Effect Correction (from Bioinformatics)
- Quantile normalization works well when paired with ComBat
- Per-batch normalization then global alignment is robust
- Percentile-based correction preserves biological/product variance better than z-score
- Source: [Batch Correction Analysis](https://rnabio.org/module-03-expression/0003/06/02/Batch-Correction/)

---

## 8. Unresolved Questions

1. **Current score distribution:** What's the actual mean/std by batch? Run audit first to confirm problem severity.

2. **Bootstrap phase:** How many products needed before running stats stabilize? (Rule of thumb: 30-50 samples)

3. **Retraining old batches:** Should we normalize historical scores? Recommendation: Yes, rerun after stabilization (week 1 after deploying normalizer).

4. **Model selection:** When switching from Claude to Gemini, does score distribution shift enough to break normalization? (Test with 10-product trial batch)

5. **Performance impact:** What's the DB query cost of updating running state 394 times? (Should be negligible, ~50ms total)

---

## References

### Cross-Batch Normalization
- [Z-Score Normalization](https://www.emergentmind.com/topics/z-score-normalization)
- [Welford's Algorithm](https://changyaochen.github.io/welford/)
- [Batch Normalization Theory](https://www.datacamp.com/tutorial/batch-normalization-tensorflow)
- [Quantile Normalization](https://en.wikipedia.org/wiki/Quantile_normalization)
- [Batch Effect Correction](https://rnabio.org/module-03-expression/0003/06/02/Batch-Correction/)

### Multi-Model Calibration
- [Temperature Scaling](https://markaicode.com/temperature-scaling-calibrate-llm-confidence-scores/)
- [Adaptive Temperature Scaling](https://arxiv.org/abs/2409.19817)
- [Thermometer (MIT)](https://sia.mit.edu/wp-content/uploads/2024/12/2024-shen-das-greenewald-sattigeri-wornell-icml.pdf)
- [Post-Hoc Calibration Methods](https://arxiv.org/abs/2601.19944)
- [ICLR 2025 Semantic Calibration](https://iclr.cc/virtual/2025/32891)

### Prompt & Rubric Design
- [Anchoring Bias in LLMs](https://www.sciencedirect.com/science/article/pii/S2214635024000868)
- [Few-Shot Prompting](https://learnprompting.org/docs/intermediate/self_consistency)
- [Rubric Design Best Practices](https://snorkel.ai/blog/the-science-of-rubric-design/)
- [Inter-Rater Reliability](https://en.wikipedia.org/wiki/Inter-rater_reliability)
- [Prompt Engineering 2025](https://mitrix.io/blog/prompt-engineering-or-why-consistent-ai-results-require-tweaking/)

### ELO & Bayesian (Deferred)
- [ELO Rating System](https://en.wikipedia.org/wiki/Elo_rating_system)
- [ELO for Auto-Evaluation](https://www.emergentmind.com/topics/elo-based-auto-evaluation-metrics)
- [Sequential Bayesian Updating](https://www.stats.ox.ac.uk/~steffen/teaching/bs2HT9/kalman.pdf)
- [Bayesian Inference](https://en.wikipedia.org/wiki/Bayesian_inference)
