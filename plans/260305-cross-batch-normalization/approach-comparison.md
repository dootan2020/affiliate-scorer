# Approach Comparison: Cross-Batch Normalization Methods

Visual summary of all evaluated approaches and why z-score normalization wins.

---

## Problem Visualization

```
CURRENT STATE (Per-Batch Min-Max Normalization):

Batch 1 (3 products):          Batch 2 (4 products):
Score 45 → normalized to 0     Score 30 → normalized to 0
Score 65 → normalized to 0.5   Score 50 → normalized to 0.4
Score 92 → normalized to 1     Score 85 → normalized to 1

CROSS-BATCH COMPARISON BREAKS ❌
- A product with 0.5 in batch 1 looks bad
- A product with 0.5 in batch 2 looks worse
- But both could be the same quality!
```

---

## Solution 1: Running Z-Score Normalization ⭐ RECOMMENDED

```
MECHANISM:
  Global statistics maintained across ALL products:
  - Mean: 65.2
  - Std Dev: 13.4

  New score arrives: 80
  Z-score = (80 - 65.2) / 13.4 = 1.10
  Final = 1.10 * 15 + 50 = 66.5 (on 0-100 scale)

Batch 1 (Product A): raw=80 → z-score=1.10 → normalized=66.5
Batch 2 (Product B): raw=80 → z-score=1.10 → normalized=66.5
                                            ↓
                    NOW COMPARABLE ✅ (same 66.5)


ALGORITHM (Welford):
  For each new score x:
    count = count + 1
    delta = x - mean
    mean = mean + delta / count
    delta2 = x - mean
    M2 = M2 + delta * delta2

    variance = M2 / count
    std = sqrt(variance)
```

**Pros:**
- ✅ Preserves absolute meaning (80 = "strong" always)
- ✅ O(1) memory (just 3 numbers: count, mean, M2)
- ✅ O(n) per-batch (1 operation per score)
- ✅ Mathematically proven (TensorFlow uses this)
- ✅ Works without reprocessing history
- ✅ Numerically stable (Welford's algorithm)

**Cons:**
- Early batches influence later scores (requires bootstrap period)
- Assumes roughly normal distribution (usually OK for scores)

**Implementation:** 2-3 hours

**Cost:** Free (no API calls)

---

## Solution 2: Percentile Ranking

```
MECHANISM:
  Track ALL products ever scored.
  New batch arrives: assign percentile rank

  All 100 products sorted by score:
  [10, 15, 20, 25, ... 80, 82, 84, 85, ... 95, 98]
                           ↑ Product at position 92 = 92th percentile
  Final score = 92

Batch 1 (Product A): raw=80 → percentile=85 → final=85
Batch 2 (Product B): raw=80 → percentile=87 → final=87
                     (different! B is ranked slightly higher)

When new batch added: ALL scores might shift ⚠️
```

**Pros:**
- ✅ Guaranteed cross-batch consistency (by definition)
- ✅ No statistical assumptions
- ✅ Easy to understand ("top 20%")

**Cons:**
- ❌ Loses absolute meaning (80 just means "top 20%")
- ❌ All scores shift when new batch added
- ❌ Requires sorting all N products on every update
- ❌ Can't use for "scoring standards" (what's "good"?)

**Use case:** If you only care about ranking, not absolute quality

**Implementation:** 1 hour

**Cost:** Free

---

## Solution 3: ELO Rating System (NOT RECOMMENDED)

```
MECHANISM (simplified):
  Treat products like chess players.
  When two products "compete", ratings adjust.

  Product A (current rating 1200) faces Product B (rating 1150)
  A beats B in some metric → ratings adjust
  New A rating = 1210, New B rating = 1140

  Scale down to 0-100: 1210 → 60, 1140 → 57

PROBLEM: Your scoring isn't competitive!
- AI generates absolute score (80/100), not relative
- No "battle" between products to use ELO
- Would need to invent fake comparisons
- Over-engineered for normalization task
```

**Pros:**
- ✅ Theoretically elegant
- ✅ Used in model benchmarking

**Cons:**
- ❌ Designed for pairwise comparisons, not absolute scoring
- ❌ Requires tuning K-factor, constant D
- ❌ Adds state complexity without benefit
- ❌ Over-engineered for this problem

**Why skip:** Wrong tool for the job

---

## Solution 4: Bayesian Sequential Updating (NOT RECOMMENDED)

```
MECHANISM:
  Model score distribution as Beta prior.
  Each new batch updates to posterior.
  Posterior becomes next prior.

  Prior: Beta(α=5, β=5) [uniform, no assumptions]
  Batch 1: 80, 75, 90, 65, 45
  → Posterior updates parameters
  → Becomes new prior for Batch 2
  → Batch 2 updates it further

  Use posterior mean as normalized score

PROBLEM: Over-engineered
- Welford's running stats do the same job simpler
- Requires choosing prior (Beta? Normal?)
- More complexity, same end result
- Good for uncertainty quantification, not normalization
```

**Pros:**
- ✅ Principled Bayesian approach
- ✅ Naturally handles uncertainty

**Cons:**
- ❌ Overkill for normalization
- ❌ More complex to implement
- ❌ Requires prior selection
- ❌ No real benefit over simpler alternatives

**Why skip:** Bayesian sledgehammer for a screw

---

## Comparison Matrix

```
                        Z-Score    Percentile   ELO       Bayesian
─────────────────────────────────────────────────────────────────
Cross-batch ok          ✅          ✅           ⚠️        ✅
Preserves meaning       ✅          ❌           ❌        ⚠️
Memory cost             O(1)        O(n)        O(n)      O(1)
Time per score          O(1)        O(n log n)  O(1)      O(1)
Scores shift on batch   ❌          ✅           ⚠️        ⚠️
Implementation          2-3h        1h          8-10h     6-8h
Cost                    Free        Free        Free      Free
Production tested       ✅          ✅           ⚠️        ❌
Complexity              Low         Low         High      High
Suitable for task       ✅          ⚠️           ❌        ❌
─────────────────────────────────────────────────────────────────
RECOMMENDATION          ⭐⭐⭐⭐    ⭐⭐         ❌        ❌
                        PICK THIS
```

---

## Example Walkthrough: All Four Approaches

**Scenario:** You have 5 products, then import 3 more in a new batch

### Initial Products
```
Product 1: 45
Product 2: 65
Product 3: 75
Product 4: 80
Product 5: 92
Mean: 71.4, Std: 15.5
```

### New Batch Arrives: [52, 88, 60]

#### Z-Score Approach
```
Running stats BEFORE: count=5, mean=71.4, std=15.5

Process product 6 (raw=52):
  New mean = (71.4*5 + 52)/6 = 69.43
  New std ≈ 14.8
  z = (52 - 71.4) / 15.5 = -1.22
  normalized = -1.22 * 15 + 50 = 31.7 ✅

Process product 7 (raw=88):
  z = (88 - mean) / std ≈ 1.10
  normalized ≈ 66.5 ✅

Process product 8 (raw=60):
  z = (60 - mean) / std ≈ -0.60
  normalized ≈ 41 ✅

RESULT: All products (old + new) on same scale
```

#### Percentile Approach
```
Before: 5 products sorted by score
[45, 65, 75, 80, 92]
Product 1 percentile: 20
Product 2 percentile: 40
Product 3 percentile: 60
Product 4 percentile: 80
Product 5 percentile: 100

After new batch: 8 products sorted
[45, 52, 60, 65, 75, 80, 88, 92]
Product 1 percentile: 12.5 (was 20) ⚠️ DROPPED!
Product 2 percentile: 50 (was 40) ⚠️ CHANGED!
Product 3 percentile: 62.5 (was 60) ⚠️ CHANGED!
Product 4 percentile: 75 (was 80) ⚠️ DROPPED!
Product 5 percentile: 100 (stays same)

PROBLEM: All old scores shifted!
```

#### ELO Approach
```
Need to define "competition" between products
- Does Product 1 beat Product 6? (unclear metric)
- Requires inventing win/loss condition
- Not designed for this

SKIP: Wrong tool
```

#### Bayesian Approach
```
Too much machinery for same outcome as z-score
Would work, but unnecessary complexity

SKIP: Over-engineered
```

---

## Why Z-Score Wins: Detailed Rationale

### 1. Interpretability
```
Z-Score:
  Score of 80:
  - Exactly 1 standard deviation above mean
  - Tells you: "Strong product, ~84% of products worse"
  - Meaning is consistent across batches

Percentile:
  Score of 80:
  - Means "80th percentile"
  - Meaning changes when new batch added
  - Harder to set scoring standards ("what's good?")
```

### 2. Computational Efficiency
```
Z-Score:
  Per product: 1 add, 1 divide, 1 multiply = O(1)
  Total: 394 products × 3 ops = 1,182 ops
  Time: <1ms

Percentile:
  Per product: sorting all N products = O(n log n)
  Total: 8 products × log(8) × ~8 times = expensive
  Time: 5-10ms

ELO:
  Complex rating updates, K-factor tuning
  Time: 20-50ms

Bayesian:
  Distribution updates, parameter estimation
  Time: 50-100ms
```

### 3. Historical Data Handling
```
Z-Score:
  Running stats work WITHOUT reprocessing
  Just keep 3 numbers (count, mean, M2)
  New batches update incrementally

Percentile:
  Must re-sort all products when new batch added
  Old scores change automatically
  Can't lock in "historical rankings"

ELO:
  Ratings update incrementally (ok)
  But requires defining competitions (problem)

Bayesian:
  Similar to z-score (ok)
  But more complex with no benefit
```

### 4. Stability & Reliability
```
Z-Score:
  ✅ Welford's algorithm in TensorFlow production code
  ✅ Numerically stable (prevents rounding errors)
  ✅ 64-year history (published 1962)
  ✅ Simple to understand & debug

Percentile:
  ✅ Simple concept
  ⚠️ Sorting can have edge cases
  ⚠️ Less commonly used in production

ELO:
  ✅ Proven for chess/games
  ❌ Misapplied to non-competitive scoring

Bayesian:
  ✅ Mathematically sound
  ❌ More failure modes (prior mismatch, etc)
```

---

## Decision Tree

```
Do you need cross-batch comparable scores?
├─ YES
│  └─ Do you want to preserve absolute meaning (80 = "strong")?
│     ├─ YES → USE Z-SCORE NORMALIZATION ⭐
│     └─ NO  → USE PERCENTILE RANKING
│
└─ NO
   └─ Use per-batch min-max (current approach)
```

For PASTR: **Following tree → Z-SCORE NORMALIZATION** ⭐

---

## Implementation Timeline

### Z-Score (Recommended)
- Week 1: Database + normalizer class (2-3h)
- Week 2: Monitor + validate
- Week 3: Prompt anchoring (Phase 2)
- Month 2: Multi-model calibration (Phase 3)

### Alternative (if you chose percentile)
- Week 1: Add percentile ranking to scorer
- Week 2: Migrate old scores (1-2h SQL)
- Week 3: Monitor (all scores will change)

---

## Key Takeaway

**Running Z-Score Normalization** is the winner because it:
1. Preserves meaning ("80 always = strong")
2. Is computationally efficient (O(1) per score)
3. Works with batches (no reprocessing)
4. Is production-proven (TensorFlow, etc)
5. Is easy to implement (2-3 hours)
6. Is easy to understand (standard statistics)

**Next step:** Implement Phase 1 from `implementation-guide.md`

---

**Reference:** See `research-report.md` for full academic citations and deep dives
