# Phase 03: Base Formula Overhaul — VN Market Validated

## Priority: HIGH
## Status: Pending

## Context
- Current: 6 components with hardcoded tiers (formula.ts)
- Problem: tiers not validated against VN market data
- Real data shows: commission tiers give 100 to >=15% but avg commission = 7.8%
- contentFit and platform are weak signals (low discrimination)

## Real Data Analysis (394 products)

### Commission Distribution
```
>=15%: few    | 10-14%: moderate | 7-9%: most common | 4-6%: many | 1-3%: some
Avg: ~7.8% → Most products score 60 (tier >=7%) in current formula
```
Current tier `>=15% = 100` is too generous — very few products qualify but they get max.
Current tier `>=7% = 60` is where most products land → no discrimination.

### Price Distribution
```
<50K: many  | 50-150K: many | 150-500K: moderate | 500K-1M: few | >1M: very few
Avg: ~130K VND
```
VN TikTok sweet spot is actually 50K-200K (impulse buy range), not 150K-500K.

### Key Insight from Discriminative Analysis
```
TOP 20 avg: market=84.6, content=66.1, comm=11.6%, price=190K
BOT 20 avg: market=42.0, content=67.8, comm=4.6%,  price=77K
```
**Commission rate and marketScore are the most discriminative fields.**
Content potential has ZERO discrimination (66 vs 68).

## Pre-scoring Filter: Virtual Product Exclusion [UPDATED from review — Fix 10]

Top-scored products often include non-sellable items (thank-you cards, warranty cards, vouchers, gift wrapping) that score high on commission/sales but are not real affiliate products.

### Implementation
Add a filter at pipeline start (BEFORE scoring) to flag/exclude virtual products:

```typescript
// lib/scoring/virtual-product-filter.ts

const VIRTUAL_KEYWORDS = [
  "thẻ cảm ơn", "thank you card", "phiếu bảo hành", "warranty card",
  "voucher", "gift card", "thẻ quà tặng", "phiếu giảm giá",
  "gói quà", "gift wrap", "bao bì", "packaging",
  "phụ kiện đi kèm", "accessory bundle",
];

export function isVirtualProduct(name: string): boolean {
  const lower = name.toLowerCase();
  return VIRTUAL_KEYWORDS.some(kw => lower.includes(kw));
}
```

### Integration points:
1. In `lib/scoring/formula.ts` → `calculateBaseScore()`: check `isVirtualProduct(name)`, return score=0 if true
2. In ProductIdentity: optionally add `isVirtual: Boolean @default(false)` flag for UI filtering
3. In import pipeline: flag virtual products at import time so they never enter scoring

---

## New Formula Design

### Principles
1. **Keep what's discriminative**: commission, trending, competition
2. **Fix tiers based on real VN data**: adjust thresholds
3. **Remove low-value components**: platform (always TikTok), contentFit (redundant with AI)
4. **Add new signal**: salesVelocity (sales7d relative to category average)

### New 5-Component Formula

```typescript
// lib/scoring/formula.ts — rewrite

const NEW_WEIGHTS = {
  commission: 0.25,    // UP from 0.20 — most discriminative data signal
  trending: 0.25,      // UP from 0.20 — critical for affiliate timing
  competition: 0.20,   // SAME — important
  priceAppeal: 0.15,   // Renamed — VN-specific sweet spot
  salesVelocity: 0.15, // NEW — replaces contentFit + platform
};
```

### Component 1: Commission (25%)
VN TikTok affiliate commission reality:
- 3-5%: common (mass market, big brands)
- 7-10%: good (mid-tier)
- 10-15%: very good (direct from seller)
- 15-25%: excellent (high-margin categories)
- 25%+: exceptional (digital, courses)

```typescript
// [UPDATED from review — Fix 5: commissionVND source clarification]
// Product model HAS commissionVND field. However, ProductIdentity does NOT.
// When scoring from ProductIdentity context, compute: commissionVND = price × commissionRate / 100
// When scoring from Product context, use product.commissionVND directly.
function scoreCommission(rate: number, commissionVND: number): number {
  // Continuous scoring instead of discrete tiers
  // Maps 0-25% rate to 0-100 score with diminishing returns
  let base: number;
  if (rate <= 0) base = 0;
  else if (rate <= 3) base = rate * 7;          // 0-21
  else if (rate <= 7) base = 21 + (rate - 3) * 8; // 21-53
  else if (rate <= 12) base = 53 + (rate - 7) * 7; // 53-88
  else if (rate <= 20) base = 88 + (rate - 12) * 1.5; // 88-100
  else base = 100;

  // VND bonus: commission per sale in sweet spot 20K-100K VND
  const vndBonus = (commissionVND >= 20000 && commissionVND <= 100000) ? 5
                 : (commissionVND > 100000) ? 3
                 : 0;

  return Math.min(100, Math.round(base + vndBonus));
}
```

### Component 2: Trending (25%)
```typescript
// [UPDATED from review — Fix 6: salesGrowth7d source clarification]
// Product model HAS salesGrowth7d (Float?). However, ProductIdentity does NOT.
// When scoring from ProductIdentity context: compute from 2 latest ProductSnapshot records:
//   salesGrowth7d = ((snapshot_new.sales7d - snapshot_old.sales7d) / snapshot_old.sales7d) * 100
// When scoring from Product context: use product.salesGrowth7d directly.
// If neither available, fall through to sales7d/salesTotal ratio fallback.
function scoreTrending(product: ProductModel): number {
  // Priority 1: Real growth data (from Product.salesGrowth7d or computed from snapshots)
  if (product.salesGrowth7d !== null) {
    const g = product.salesGrowth7d;
    if (g <= -30) return 0;      // Crashing
    if (g <= -10) return 15;     // Declining
    if (g <= 0) return 25;       // Flat/slight decline
    if (g <= 10) return 35;      // Slight growth
    if (g <= 30) return 50;      // Moderate growth
    if (g <= 80) return 70;      // Strong growth
    if (g <= 200) return 85;     // Very strong
    if (g <= 500) return 95;     // Explosive but sustained
    // [UPDATED from review — Fix 16: spike >500% is risky, should score LOWER than strong growth]
    // Previous: returned 75 for >500% but 70 for "strong growth" — inverted logic.
    // >500% growth in 7d is likely a spike that crashes. Score lower than sustained growth.
    return 55;                    // >500% = spike risk, likely crashes — lower than sustained growth
  }

  // Priority 2: Estimate from sales7d/salesTotal ratio
  const sales7d = product.sales7d ?? 0;
  const salesTotal = product.salesTotal ?? 0;
  if (salesTotal <= 0 || sales7d <= 0) return 20;

  const ratio = sales7d / salesTotal;
  if (ratio > 0.5) return 70;   // Very new, may spike
  if (ratio > 0.2) return 90;   // Sweet spot — strong momentum
  if (ratio > 0.1) return 75;   // Good momentum
  if (ratio > 0.05) return 55;  // Moderate
  if (ratio > 0.02) return 35;  // Cooling
  return 15;                     // Cold
}
```

### Component 3: Competition (20%)
Keep existing logic but adjust VN thresholds:
```typescript
function scoreCompetition(product: ProductModel): number {
  const kol = product.totalKOL ?? 0;
  const videos = product.totalVideos ?? 0;
  const kolRate = product.kolOrderRate ?? 0;

  // KOL count — VN specific thresholds
  let kolScore: number;
  if (kol <= 3) kolScore = 100;      // Blue ocean
  else if (kol <= 10) kolScore = 85;  // Low competition
  else if (kol <= 25) kolScore = 65;  // Moderate
  else if (kol <= 50) kolScore = 45;  // Competitive
  else if (kol <= 100) kolScore = 25; // Saturated
  else kolScore = 10;                  // Red ocean

  // Video saturation penalty (adjusted)
  let videoPenalty = 0;
  if (videos > 1000) videoPenalty = -20;
  else if (videos > 500) videoPenalty = -15;
  else if (videos > 200) videoPenalty = -10;
  else if (videos > 50) videoPenalty = -5;

  // KOL conversion bonus
  let rateBonus = 0;
  if (kolRate > 60) rateBonus = 15;
  else if (kolRate > 40) rateBonus = 10;
  else if (kolRate > 20) rateBonus = 5;

  return Math.max(0, Math.min(100, kolScore + videoPenalty + rateBonus));
}
```

### Component 4: Price Appeal (15%)
VN TikTok Shop impulse buy reality:
```typescript
function scorePriceAppeal(priceVND: number): number {
  // VN TikTok sweet spot: 50K-200K (impulse buy, good commission VND)
  if (priceVND >= 80000 && priceVND <= 200000) return 100;   // Perfect impulse
  if (priceVND >= 50000 && priceVND < 80000) return 80;      // Cheap but decent commission
  if (priceVND > 200000 && priceVND <= 400000) return 75;    // Still OK
  if (priceVND >= 30000 && priceVND < 50000) return 55;      // Too cheap, low commission VND
  if (priceVND > 400000 && priceVND <= 800000) return 50;    // Higher consideration
  if (priceVND > 800000 && priceVND <= 1500000) return 35;   // Niche
  if (priceVND < 30000) return 20;                            // Too cheap to bother
  return 15;                                                   // >1.5M too expensive for TikTok
}
```

### Component 5: Sales Velocity (15%) — NEW
Replaces contentFit + platform. Measures actual market validation:
```typescript
function scoreSalesVelocity(product: ProductModel): number {
  const sales7d = product.sales7d ?? 0;

  // Absolute sales volume — proven market
  if (sales7d >= 10000) return 100;   // Mega seller
  if (sales7d >= 5000) return 90;     // Very high
  if (sales7d >= 2000) return 75;     // High
  if (sales7d >= 500) return 60;      // Good
  if (sales7d >= 100) return 45;      // Moderate
  if (sales7d >= 20) return 30;       // Low
  if (sales7d > 0) return 15;        // Minimal
  return 5;                            // No sales data
}
```

### Full Formula
```typescript
export function calculateBaseScore(product: ProductModel): BaseScoreResult {
  // [UPDATED from review — Fix 5] Compute commissionVND if not available directly
  const commissionVND = product.commissionVND ?? (product.price * product.commissionRate / 100);
  const commissionScore = scoreCommission(product.commissionRate, commissionVND);
  const trendingScore = scoreTrending(product);
  const competitionScore = scoreCompetition(product);
  const priceScore = scorePriceAppeal(product.price);
  const velocityScore = scoreSalesVelocity(product);

  const total = Math.min(100, Math.round(
    commissionScore * 0.25 +
    trendingScore * 0.25 +
    competitionScore * 0.20 +
    priceScore * 0.15 +
    velocityScore * 0.15
  ));

  return { total, breakdown: { commission: commissionScore, trending: trendingScore, competition: competitionScore, priceAppeal: priceScore, salesVelocity: velocityScore } };
}
```

## Pre-implementation: Niche Key Reconciliation [UPDATED from review — Fix 11]

Before implementing formula changes, reconcile niche/category key formats:
1. Export distinct DB category values: `SELECT DISTINCT category FROM "ProductIdentity"`
2. Export distinct niche values from Channel settings
3. Verify `normalizeNicheKey()` and `normalizeCategory()` in `niche-category-map.ts` produce matching keys
4. Add missing entries to `NICHE_CATEGORY_MAP`
5. Document the mapping table in a code comment

This prevents silent failures in `matchesNiche()` (Phase 06) and category-based scoring.

## Files to modify
- MODIFY: `lib/scoring/formula.ts` — rewrite all score functions
- MODIFY: `lib/ai/scoring.ts` — update ScoreBreakdown type references
- MODIFY: `lib/suggestions/niche-category-map.ts` — reconcile keys, add missing entries

## Success Criteria
- Formula output range: 10-95 (not 46-79 like before)
- Commission discrimination: top 20 avg 75+ vs bottom 20 avg 25-
- Trending discrimination: SURGE products score 80+, COOL products score 20-
- Price: VN sweet spot (80-200K) gets highest scores
