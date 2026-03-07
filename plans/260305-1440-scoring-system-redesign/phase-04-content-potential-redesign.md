# Phase 04: ContentPotential → ContentFit Redesign

## Priority: MEDIUM
## Status: Pending

## Context
- contentPotentialScore has ZERO discrimination (TOP 20 avg=66.1, BOTTOM 20 avg=67.8)
- market↔content correlation = -0.516 (negative! measuring different things)
- content↔combined correlation = -0.096 (content is irrelevant in combined score)
- Most products score 70-84 (225/394 = 57%) — no spread

## Root Cause Analysis

The current `content-potential.ts` gives points too easily:
- Has image (+8) → almost all products have images
- Category angles (*3, max 20) → most categories get 15-20
- AI friendliness (max 20) → most get 10-16
- Has KOL data (+14-18) → FastMoss products always have KOL data
- Commission (+6-10) → most have commission

Result: Nearly every FastMoss product scores 65-85. No discrimination.

## Decision: DEMOTE, Don't Remove

contentPotentialScore measures something real (how easy to make content) but currently it:
1. Has zero discrimination power
2. Doesn't affect combined ranking
3. Takes up 30% of combinedScore weight (post-R1)

### New Role
- contentPotentialScore becomes a **secondary display metric** — shown on UI as "Dễ làm content"
- NOT part of combinedScore formula
- Displayed as simple tier badge: "Dễ" / "TB" / "Khó"
- Used in suggestions contentMix matching only

### Simplified Content Ease Score

```typescript
// lib/scoring/content-potential.ts — simplified

export type ContentEase = "easy" | "medium" | "hard";

/** Quick content ease assessment — for display only, NOT in combinedScore */
export function assessContentEase(input: ContentScoreInput): { ease: ContentEase; score: number } {
  let score = 0;

  // 1. Visual hook potential (0-30)
  if (input.imageUrl) score += 10;
  if (input.price != null && input.price < 200000) score += 10; // Impulse = easy hook
  const cat = normalizeCategory(input.category);
  const angles = CATEGORY_ANGLES[cat] ?? 3;
  score += Math.min(10, angles * 2);

  // 2. UGC reference material (0-30)
  if (input.totalKOL != null) {
    if (input.totalKOL > 30) score += 20;
    else if (input.totalKOL > 10) score += 15;
    else if (input.totalKOL > 3) score += 10;
    else score += 5;
  }
  if (input.totalVideos != null && input.totalVideos > 50) score += 10;

  // 3. AI production feasibility (0-20)
  const aiFriendly = AI_FRIENDLY_CATEGORIES[cat] ?? 10;
  score += Math.min(20, aiFriendly);

  // 4. Risk penalty (0 to -20)
  const fullText = ((input.title || "") + " " + (input.description || "")).toLowerCase();
  let riskCount = 0;
  for (const kw of RISK_KEYWORDS) {
    if (fullText.includes(kw)) riskCount++;
  }
  score -= Math.min(20, riskCount * 5);

  score = Math.max(0, Math.min(100, score));

  const ease: ContentEase = score >= 65 ? "easy" : score >= 40 ? "medium" : "hard";

  return { ease, score };
}
```

### Store as-is
contentPotentialScore field still gets written (for UI display / sorting), but:
- NOT included in combinedScore formula (Phase 05)
- Displayed on inbox as badge only

## Files to modify
- MODIFY: `lib/scoring/content-potential.ts` — add `assessContentEase()`, keep `calculateContentPotentialScore()` for backward compat
- MODIFY: `lib/services/score-identity.ts` — still compute contentPotentialScore but don't blend into combined
- UI: Show as badge "Dễ làm content" / "TB" / "Khó"

## Success Criteria
- contentPotentialScore no longer inflates combinedScore
- UI shows meaningful ease indicator
- Backward compatible — field still populated
