# Phase 06: SmartScore Suggestions Upgrade

## Priority: MEDIUM
## Status: Pending
## Depends on: Phase 05

## Context
- After Phase 05: combinedScore is well-distributed 0-100 with absolute meaning
- SmartScore currently = 55% combinedScore + noise
- Need smartScore to add VALUE beyond just sorting by combinedScore

## Design Principle

**SmartScore should answer: "Which products should I make content about TODAY?"**

combinedScore answers "Is this a good product?" (timeless quality)
smartScore answers "Should I act on this NOW?" (timely urgency)

### New SmartScore Formula

```typescript
smartScore = combinedScore * 0.45      // Quality foundation
           + urgencyBonus * 0.25       // Time-sensitive signals
           + channelFitBonus * 0.20    // Channel relevance
           + diversityBonus * 0.10     // Explore/discover
```

### Component 1: Quality Foundation (45%)
Direct from combinedScore (already normalized, absolute meaning).

### Component 2: Urgency Bonus (25%) — "Why NOW?"
Combines delta, calendar, and recency into one "time to act" signal.

```typescript
function computeUrgencyBonus(
  deltaType: string | null,
  calendarMatch: boolean,
  ageDays: number,
  lifecycleStage: string | null,
): number {
  let score = 0;

  // Delta momentum (0-40)
  const deltaScores: Record<string, number> = {
    REAPPEAR: 40, SURGE: 35, NEW: 20, STABLE: 5, COOL: 0,
  };
  score += deltaScores[deltaType ?? "STABLE"] ?? 5;

  // Calendar relevance (0-30)
  if (calendarMatch) score += 30;

  // Recency — new products have urgency (0-20)
  if (ageDays <= 2) score += 20;
  else if (ageDays <= 5) score += 15;
  else if (ageDays <= 10) score += 10;
  else if (ageDays <= 21) score += 5;

  // Lifecycle peak = urgent (0-10)
  if (lifecycleStage === "peak") score += 10;
  else if (lifecycleStage === "hot") score += 5;

  // Staleness penalty (Case 5) — SP not re-imported >30 days loses urgency
  // Uses lastSeenAt (last import date) from ProductIdentity
  // Decay: -2%/week after 30 days, cap at -20% of total urgency
  // This does NOT affect combinedScore — only smartScore urgency
  if (ageDays > 30) {
    const staleWeeks = Math.floor((ageDays - 30) / 7);
    const decayPct = Math.min(0.20, staleWeeks * 0.02); // 2%/week, cap 20%
    score = Math.round(score * (1 - decayPct));
  }

  return Math.min(100, score);
}
```

### Component 3: Channel Fit Bonus (20%) — "Good for MY channel?"
Per-channel scoring based on niche + contentMix.

```typescript
function computeChannelFitBonus(
  product: { category: string | null; contentPotentialScore: number | null;
             commissionRate: unknown; deltaType: string | null },
  channelNiche: string | null,
  contentMix: Record<string, number> | null,
): number {
  let score = 0;

  // Niche match (0-50)
  // [UPDATED from review — Fix 11: Niche key format mismatch]
  // DB niche keys (e.g., "Home & Living") may not match NICHE_CATEGORY_MAP keys
  // (e.g., "home_living"). normalizeNicheKey() in niche-category-map.ts handles conversion.
  // PREREQUISITE: Before Phase 06 implementation, reconcile niche keys:
  //   1. Query distinct niche values: SELECT DISTINCT niche FROM "Channel"
  //   2. Query distinct category values: SELECT DISTINCT category FROM "ProductIdentity"
  //   3. Verify normalizeNicheKey(niche) produces valid NICHE_CATEGORY_MAP keys
  //   4. Document mapping table in niche-category-map.ts
  //   5. If mismatches found, add missing entries to NICHE_CATEGORY_MAP
  if (channelNiche && product.category) {
    if (matchesNiche(channelNiche, product.category)) {
      score += 50;
    }
  }

  // ContentMix match (0-50)
  if (contentMix) {
    score += Math.min(50, computeContentMixBonus(product, contentMix));
  }

  return Math.min(100, score);
}
```

### Component 4: Diversity Bonus (10%) — Explore mechanism

```typescript
function computeDiversityBonus(
  tag: "proven" | "explore",
  categoryUsedCount: number,  // how many times this category already suggested
  productId: string,          // [UPDATED from review — Fix 8] needed for seeded jitter
): number {
  let score = 0;

  // Explore bonus — reward less-seen products
  if (tag === "explore") score += 40;

  // Category diversity — penalize category concentration
  if (categoryUsedCount === 0) score += 40;      // Fresh category
  else if (categoryUsedCount === 1) score += 20;  // Seen once
  else if (categoryUsedCount >= 3) score -= 20;   // Over-represented

  // [UPDATED from review — Fix 8: seeded random for same-day determinism]
  // Math.random() gives different results each page load → unstable rankings.
  // Use seeded PRNG: hash(productId + YYYY-MM-DD) for deterministic daily jitter.
  const seed = hashCode(`${productId}-${new Date().toISOString().slice(0, 10)}`);
  score += Math.abs(seed % 21); // 0-20 jitter, deterministic per product per day

  // Helper (add to module):
  // function hashCode(str: string): number {
  //   let hash = 0;
  //   for (let i = 0; i < str.length; i++) {
  //     hash = ((hash << 5) - hash) + str.charCodeAt(i);
  //     hash |= 0;
  //   }
  //   return hash;
  // }

  return Math.max(0, Math.min(100, score));
}
```

### Explore/Proven Tagging — Simplified

```typescript
// After Phase 05 normalization, scores have absolute meaning
const tag: "proven" | "explore" = combinedScore >= 60 ? "proven" : "explore";
// Score 60+ = above average = proven track record
// Score <60 = below average = worth exploring, might surprise
```

### Selection Algorithm — Per Channel

```typescript
// Per channel: select 10 products
function selectForChannel(scored: ScoredProduct[], channelNiche: string): ScoredProduct[] {
  const sorted = [...scored].sort((a, b) => b.smartScore - a.smartScore);

  const selected: ScoredProduct[] = [];
  const categoryCount = new Map<string, number>();

  // Ensure diversity:
  // - Min 2 explore products
  // - Max 3 from same category
  // - Max 2 usages across channels (existing dedup)

  const explore = sorted.filter(sp => sp.tag === "explore");
  const proven = sorted.filter(sp => sp.tag === "proven");

  // Add top 2 explore
  for (const sp of explore) {
    if (selected.length >= 2) break;
    selected.push(sp);
    categoryCount.set(sp.category ?? "", (categoryCount.get(sp.category ?? "") ?? 0) + 1);
  }

  // Fill with proven (max 3 per category)
  for (const sp of proven) {
    if (selected.length >= 10) break;
    const cat = sp.category ?? "";
    if ((categoryCount.get(cat) ?? 0) >= 3) continue; // Skip over-represented category
    if (selected.some(s => s.id === sp.id)) continue;
    selected.push(sp);
    categoryCount.set(cat, (categoryCount.get(cat) ?? 0) + 1);
  }

  // Fill remaining with any
  for (const sp of sorted) {
    if (selected.length >= 10) break;
    if (selected.some(s => s.id === sp.id)) continue;
    selected.push(sp);
  }

  return selected.sort((a, b) => b.smartScore - a.smartScore);
}
```

### Case 5: Staleness Decay in Urgency Component

**Problem:** SP scored 90 three months ago, seller out of stock, product no longer trending. combinedScore still 90 — SP ranks high in inbox forever.

**Solution:** Apply staleness penalty to urgency component of smartScore (NOT to combinedScore).

**Design decisions:**
- **Do NOT decay combinedScore** — it reflects product quality at time of scoring. Decaying it loses the reference point needed when SP is re-imported.
- **Decay urgency only** — staleness means "less urgent to act on NOW", not "worse product"
- **Use `lastSeenAt`** (ProductIdentity field set on import) or `updatedAt` as fallback
- **Grace period: 30 days** — products stay fresh for a month after last import
- **Decay rate: 2% per week** after grace period, **cap at -20%** of urgency score
- **Reset on re-import** — when SP is re-imported, `lastSeenAt` updates → staleness resets to 0

```typescript
// In computeUrgencyBonus() — staleness calculation
function computeStalenessDecay(lastSeenAt: Date | null): number {
  if (!lastSeenAt) return 0.20; // Unknown → max decay (conservative)

  const daysSinceImport = Math.floor(
    (Date.now() - lastSeenAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceImport <= 30) return 0; // Within grace period

  const staleWeeks = Math.floor((daysSinceImport - 30) / 7);
  return Math.min(0.20, staleWeeks * 0.02); // 2%/week, max 20%
}
```

**Impact examples:**
| Days since import | Staleness decay | Urgency 80 → |
|-------------------|----------------|---------------|
| 0-30              | 0%             | 80            |
| 37                | 2%             | 78            |
| 44                | 4%             | 77            |
| 58                | 8%             | 74            |
| 100               | 20% (cap)      | 64            |

**UI indicator:** Show "Dữ liệu cũ X ngày" badge on stale products in suggestions widget.

### matchesNiche() Implementation Note [UPDATED from review — Fix 13]

`matchesNiche()` already exists in `lib/suggestions/niche-category-map.ts`. It uses `normalizeNicheKey()` + `NICHE_CATEGORY_MAP` lookup with string-includes fallback. Import from there — do NOT redefine.

Key risk: if niche keys from DB don't normalize to valid map keys, `matchesNiche()` silently falls back to substring matching (which may produce false positives/negatives). See Fix 11 — reconcile keys before Phase 06.

```typescript
// Import in compute-smart-suggestions.ts:
import { matchesNiche } from "@/lib/suggestions/niche-category-map";
```

## Files to modify
- MODIFY: `lib/suggestions/compute-smart-suggestions.ts` — new smartScore formula + selection + staleness decay + seeded jitter
- MODIFY: `lib/suggestions/build-suggestion-reason.ts` — update for new tag logic + stale indicator
- VERIFY: `lib/suggestions/niche-category-map.ts` — ensure matchesNiche() handles all DB niche keys (Fix 11)

## Success Criteria
- smartScore range wider than combinedScore sort alone
- SURGE/NEW products get +15-25 boost over STABLE equivalent
- Calendar-matching products visible during prep period
- At least 2 explore products per channel
- Category diversity: no channel gets 5+ same-category products
- Stale products (>30 days) lose up to 20% urgency score
- Re-imported products reset staleness immediately
