# Plan: Scoring System Redesign — Target 9/10

## Status: DRAFT
## Priority: HIGH
## Complexity: LARGE

---

## Phases

| Phase | Title | Status | Files |
|-------|-------|--------|-------|
| 01 | Global Running Stats + Cross-batch Normalization | Pending | `lib/scoring/global-stats.ts`, `lib/services/score-identity.ts` |
| 02 | AI Prompt Redesign — Rubric Anchoring | Pending | `lib/ai/prompts.ts`, `lib/ai/scoring.ts` |
| 03 | Base Formula Overhaul — VN Market Validated | Pending | `lib/scoring/formula.ts` |
| 04 | ContentPotential → ContentFit Redesign | Pending | `lib/scoring/content-potential.ts` |
| 05 | Combined Score Final Formula | Pending | `lib/services/score-identity.ts` |
| 06 | SmartScore Suggestions Upgrade | Pending | `lib/suggestions/compute-smart-suggestions.ts` |
| 07 | Feedback Loop Bootstrap | Pending | `lib/scoring/personalize.ts`, API routes |
| 07b | Reactive Re-scoring Triggers | Pending | `lib/scoring/rescore-dispatcher.ts`, API routes |
| 08 | Migration + Re-score + Verify | Pending | `app/api/internal/rescore-identities/route.ts` |

## Key Dependencies
- Phase 01 must complete first (global stats infrastructure)
- Phase 02-04 are independent, can parallelize
- Phase 05 depends on 01-04
- Phase 06 depends on 05
- Phase 07 is independent
- Phase 07b depends on 01, 05, 07 (reactive re-scoring uses global stats + formula + feedback events)
- Phase 08 depends on all

## Links
- Audit: `docs/scoring-suggestions-logic-report.md`
- Phase details: `phase-01-*.md` through `phase-08-*.md`

---

# Comprehensive Scoring Redesign — Answers to A-G

## Real DB Data (394 products, 2026-03-05, post-R1/R2)

### Distribution
| Metric | Min | Max | Avg | StdDev | P25 | P50 | P75 | P90 |
|--------|-----|-----|-----|--------|-----|-----|-----|-----|
| combinedScore | 20 | 100 | 57.8 | - | 49 | 58 | 68 | 75 |
| marketScore | 35 | 93 | 60.8 | 11.2 | - | - | - | - |
| contentPotential | 41 | 93 | 71.2 | 11.4 | - | - | - | - |

### Discriminative Analysis (TOP 20 vs BOTTOM 20)
| Field | TOP 20 | BOTTOM 20 | Diff | Discriminative? |
|-------|--------|-----------|------|-----------------|
| marketScore | 84.6 | 42.0 | **42.6** | VERY HIGH |
| contentPotential | 66.1 | 67.8 | **-1.7** | ZERO |
| commissionRate | 11.6% | 4.6% | **7.0%** | HIGH |
| price | 190K | 77K | **113K** | MODERATE |

### Correlations
| Pair | Correlation | Interpretation |
|------|-------------|----------------|
| market↔content | **-0.516** | Negative — measure opposite things |
| market↔combined | **0.901** | Combined ≈ market (after 70/30 blend) |
| content↔combined | **-0.096** | Content is irrelevant |
| commission↔combined | **0.409** | Moderate positive |

### Key Insight
**contentPotentialScore has ZERO discriminative power.** It inflates all scores equally (avg 71 across all products). The only signal that matters is marketScore (= aiScore). Commission rate is the strongest data-level discriminator.

---

## A. Scoring Architecture

### Layers: 3
```
Layer 1: BASE FORMULA (no AI, pure data) → raw 0-100
  5 components: commission(25%) + trending(25%) + competition(20%)
                + priceAppeal(15%) + salesVelocity(15%)

Layer 2: AI EXPERT (rubric-anchored, 4 criteria) → raw 0-100
  4 criteria: market_demand(35%) + quality_trust(25%)
              + viral_potential(25%) + risk(15%)

Layer 3: COMBINED (blend + global normalize)
  raw = aiScore * 0.55 + baseFormula * 0.45  (if AI available)
  raw = baseFormula                           (if no AI)
  combinedScore = sigmoid_normalize(raw, globalMean, globalStdDev)
```

### combinedScore Final Formula
```
rawScore = aiScore × 0.55 + baseFormulaScore × 0.45

z = (rawScore - globalMean) / globalStdDev
sigmoid = 1 / (1 + exp(-K × z))  // [UPDATED from review — Fix 4] K≈0.8-1.0 (not 1.5), validate via simulation
combinedScore = round(sigmoid × 100)
```
- Score 50 = ALWAYS means "average product" (at global mean)
- Score 80+ = ALWAYS means "top ~10%"
- Score 30- = ALWAYS means "bottom ~10%"

### Normalization: Global Running Statistics
- Single-row `ScoringGlobalStats` table tracks: count, sumRaw, sumSqRaw, globalMin, globalMax
- Each batch updates running stats incrementally (O(1) per normalize)
- New batch does NOT change old product scores (EXCEPT when drift >3pt, see Fix 18/Phase 07b)
- Sigmoid prevents extreme outlier distortion

### When to use AI vs Formula
| Situation | Score used |
|-----------|-----------|
| Normal import (FastMoss/KaloData) | AI + Formula blend |
| AI API unavailable | Formula only |
| Quick paste URL (no batch) | Formula only (score immediately, AI later) |
| Re-score (formula change) | Formula only (no AI re-call) |

### contentPotentialScore Role
- Computed and stored but NOT in combinedScore
- Displayed as "Content Ease" badge on UI
- Used in suggestions contentMix matching only

---

## B. AI Prompt

### System Prompt: Rubric-anchored Expert
- 4 criteria with explicit 5-tier rubric (20/40/60/80/100 per tier)
- Criteria: market_demand, quality_trust, viral_potential, risk
- Mean-centering instruction: "batch average should be 50-60"

### Rubric > Holistic
- 5 discrete tiers per criterion → more consistent across models
- AI doesn't decide holistic score — weighted average computed deterministically
- `aiScore = demand×0.35 + quality×0.25 + viral×0.25 + risk×0.15`

### Prompt Anchoring
3 anchor examples in every prompt:
- 85-point product (excellent — e.g., Xiaomi air fryer)
- 55-point product (average — e.g., generic phone case)
- 25-point product (poor — e.g., sketchy health supplement)

### Output Format: Same JSON array, updated fields
```json
[{
  "id": "...",
  "scores": { "market_demand": 60, "quality_trust": 40, "viral_potential": 80, "risk": 60 },
  "aiScore": 58,
  "reason": "...",
  "contentAngle": "..."
}]
```

### Two-pass scoring? NO
- Token cost 2x for marginal gain
- Rubric + anchors + global normalization handles consistency
- Mean shift logged and flagged if > 10 points from expected

---

## C. Base Formula

### 5 components (was 6)
| Component | Weight | Changed? | Why |
|-----------|--------|----------|-----|
| Commission | 25% (was 20%) | UP | Most discriminative data signal |
| Trending | 25% (was 20%) | UP | Critical for timing |
| Competition | 20% (same) | SAME | Still important |
| PriceAppeal | 15% (was 15% "Price") | ADJUSTED | VN-specific sweet spot 80-200K |
| SalesVelocity | 15% (NEW) | NEW | Replaces contentFit + platform |

### Removed
- **contentFit** (15%): Redundant with AI `viral_potential` criterion
- **platform** (10%): All products are TikTok — always same score, no discrimination

### Tier Validation (VN market data)
- Commission: Continuous curve 0→100 mapped to 0-25% rate (not discrete tiers)
- Price: Sweet spot moved from 150-500K → 80-200K (VN TikTok impulse buy)
- SalesVelocity: Uses absolute sales7d volume (100 → 45, 500 → 60, 2000 → 75, 5000 → 90)

### Content Potential: Separate metric
- NOT in combinedScore (zero discrimination proven)
- Kept as UI badge "Dễ/TB/Khó"
- Used in suggestions contentMix matching

### Market Score vs Content Score
- SEPARATE: marketScore (= aiScore) goes into combinedScore
- contentPotentialScore is display-only
- No merge — they measure different things (r = -0.516)

---

## D. Cross-model Calibration

### When user switches model (Gemini → Claude)
- Old scores do NOT need re-calculation
- Global normalization absorbs model drift:
  - If new model scores higher on average → global mean shifts up → sigmoid compensates
  - Shift < 5 points absorbed naturally
  - Shift > 5 points: log warning, still valid due to normalization

### How to ensure Gemini 80 ≈ Claude 80
1. **Rubric scoring** (primary): 5 discrete tiers → models agree on tier boundaries
2. **Anchor examples**: Same 3 reference products in every prompt
3. **Mean-centering instruction**: "batch average 50-60"
4. **Post-processing**: Validate sub-scores are valid tiers (20/40/60/80/100), snap to nearest

### Prompt anchoring sufficient? YES for <5pt drift
- Rubric + anchors handle calibration
- Residual drift handled by global normalization
- No post-processing normalization needed per model

---

## E. Normalization Strategy

### Replace per-batch with Global z-score + Sigmoid
```
z = (rawScore - globalMean) / globalStdDev
combinedScore = round(sigmoid(1.5 * z) * 100)
```

### Global statistics: Running (not per-batch)
- `ScoringGlobalStats` singleton stores: count, sumRaw, sumSqRaw, min, max
- Updated incrementally with each batch
- O(1) to normalize any score

### When import new batch: old scores normally unchanged [UPDATED from review — Fix 18]
- Global stats update with new data points
- Old normalized scores are normally NOT recomputed
- **EXCEPTION**: If global mean shifts >3pt after large batch (>50 SP), old scores ARE re-normalized via reactive re-scoring (Phase 07b, Trigger 3). This ensures drift doesn't accumulate.
- Drift: minimal for small batches — sigmoid is stable, mean/std shift slowly with more data

### Edge case: batch of 3 SP
- Uses global stats (count=394+) → well-calibrated
- 3 new products normalize against 394-product baseline
- No absurd spread like per-batch min-max would give

### Edge case: batch of 300 SP
- Updates global stats significantly but gradually
- Old scores remain valid (sigmoid smooth)

---

## F. Feedback Loop

### Format: Multi-level
1. **Implicit** (zero effort): add-to-production = positive, archive = negative
2. **Quick** (1 tap): thumbs up/down on suggestion
3. **Outcome** (auto): TikTok Studio sync → views, orders

### Activation threshold: Tiered
| Level | Feedback needed | What it learns |
|-------|----------------|----------------|
| BASIC | 5 | Category preferences |
| STANDARD | 15 | Category + price + commission preferences |
| FULL | 30 | Historical matching, content type, audience |

### Feedback affects scoring
- Adjusts `LearningWeightP4` category weights → boosts/penalizes categories
- Adjusts base formula component weights (via `LearningLog`)
- Does NOT directly change AI prompt (too risky)
- Changes smartScore suggestions via categoryBonus

### Cold start (0 feedback)
- Score is still useful — based on AI + formula
- Suggestions work but without personalization
- System explicitly says "Chưa đủ data để cá nhân hóa"

---

## G. SmartScore Suggestions

### Formula change (after scoring redesign)
```
smartScore = combinedScore × 0.45 + urgency × 0.25 + channelFit × 0.20 + diversity × 0.10
```

### Urgency (25%) = delta + calendar + recency + lifecycle + staleness
- REAPPEAR=40, SURGE=35, NEW=20, STABLE=5, COOL=0
- Calendar match: +30 (15 VN events already seeded)
- Recency: ≤2d=20, ≤5d=15, ≤10d=10
- Lifecycle peak/hot: +10/+5
- Staleness: SP not re-imported >30 days → urgency decays 2%/week, cap -20%

### Explore/Proven — Simplified
- Score ≥ 60 → proven (above average, known good)
- Score < 60 → explore (below average, might surprise)
- Min 2 explore per channel, max 3 same-category

### Calendar bonus logic (with 15 events)
- Match via `notes` field keywords (already implemented R8)
- Prep period: 7 days before event start → bonus active
- Calendar now contributes to urgency component (not separate 10% weight)

---

## Constraints Compliance

| Constraint | Solution |
|-----------|----------|
| Keep Prisma schema fields | Yes — marketScore, contentPotentialScore, combinedScore all kept |
| Keep multi-provider AI | Yes — rubric works with any model |
| Vercel 60s timeout | Yes — formula is O(n), AI batch unchanged |
| Token efficient | Yes — 30% fewer tokens (reduced fields in prompt) |
| Migration without AI re-call | Yes — only formula + normalize changes, $0 cost |
