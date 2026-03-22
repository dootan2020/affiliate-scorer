# Phase 07: Feedback Loop Bootstrap

## Priority: MEDIUM
## Status: Pending

## Context
- 0 feedback entries in DB → personalization never activates (needs 30)
- Learning weights are all defaults → categoryBonus always 0
- Without feedback, system can't learn what works for THIS user

## Problem: Cold Start
- Current threshold: 30 feedback entries → way too many for first-time user
- User has to manually log 30 products before system starts learning
- Typical affiliate creator: 3-5 videos/week = 6+ weeks to reach threshold

## Design: Low-Friction Feedback Collection

### Feedback Types (from lowest to highest effort)

```
Level 1: IMPLICIT (zero effort)
  - User adds product to production queue → positive signal
  - User publishes content → strongest positive signal
  - User archives product from inbox → negative signal
  - User skips suggestion → soft negative signal

Level 2: QUICK REACTION (1 tap)
  - Thumbs up/down on suggestion → binary feedback
  - Star rating on inbox product → 1-5 rating

Level 3: OUTCOME DATA (from TikTok Studio sync)
  - Video views, engagement → automatic from sync
  - Actual orders/commission → strongest signal
```

### Lower Activation Threshold

```typescript
// lib/scoring/personalize.ts

// OLD: const MIN_FEEDBACK = 30;
// NEW: Tiered activation
const FEEDBACK_TIERS = {
  BASIC: 5,      // Start learning category preferences
  STANDARD: 15,  // Learn price/commission preferences
  FULL: 30,      // Full personalization with historical matching
};

export async function getPersonalizedScore(
  product: Product,
  baseScore: number,
): Promise<PersonalizationResult | null> {
  const cached = await getCachedFeedbackSummary();

  if (cached.feedbackCount < FEEDBACK_TIERS.BASIC) return null;

  // BASIC tier: just category weight adjustment
  if (cached.feedbackCount < FEEDBACK_TIERS.STANDARD) {
    const categoryBonus = computeCategoryPreference(product.category, cached);
    return {
      historicalMatchScore: 50,
      contentTypeScore: 50,
      audienceScore: 50,
      personalizedTotal: Math.round(baseScore * 0.9 + categoryBonus * 0.1),
    };
  }

  // STANDARD tier: category + price + commission preferences
  if (cached.feedbackCount < FEEDBACK_TIERS.FULL) {
    const catBonus = computeCategoryPreference(product.category, cached);
    const priceBonus = computePricePreference(product.price, cached);
    return {
      historicalMatchScore: 50,
      contentTypeScore: 50,
      audienceScore: 50,
      personalizedTotal: Math.round(
        baseScore * 0.8 + catBonus * 0.1 + priceBonus * 0.1
      ),
    };
  }

  // FULL tier: existing logic with all components
  // ... existing personalization code ...
}
```

### Implicit Feedback Collection

```typescript
// Collect implicit feedback from user actions

// When user adds to production:
async function logImplicitPositive(productIdentityId: string): Promise<void> {
  await prisma.feedback.upsert({
    where: { productId_source: { productId: productIdentityId, source: "implicit" } },
    create: {
      productId: productIdentityId,
      overallSuccess: "success",
      source: "implicit",
      feedbackDate: new Date(),
    },
    update: {
      overallSuccess: "success",
      feedbackDate: new Date(),
    },
  });
}

// When user archives from inbox:
async function logImplicitNegative(productIdentityId: string): Promise<void> {
  await prisma.feedback.upsert({
    where: { productId_source: { productId: productIdentityId, source: "implicit" } },
    create: {
      productId: productIdentityId,
      overallSuccess: "skip",
      source: "implicit",
      feedbackDate: new Date(),
    },
    update: {
      overallSuccess: "skip",
      feedbackDate: new Date(),
    },
  });
}
```

### Auto-populate LearningWeightP4

When feedback reaches BASIC threshold (5), compute initial category weights:

```typescript
async function bootstrapLearningWeights(): Promise<void> {
  const successProducts = await prisma.feedback.findMany({
    where: { overallSuccess: "success" },
    include: { product: { select: { category: true } } },
  });

  // Count category frequency in successful products
  const catCounts = new Map<string, number>();
  for (const fb of successProducts) {
    const cat = fb.product?.category?.toLowerCase() ?? "unknown";
    catCounts.set(cat, (catCounts.get(cat) ?? 0) + 1);
  }

  // Write as LearningWeightP4 entries
  for (const [cat, count] of catCounts) {
    const weight = Math.min(3.0, count * 0.5); // 1 success = 0.5, max 3.0
    await prisma.learningWeightP4.upsert({
      where: { scope_key: { scope: "category", key: cat } },
      create: { scope: "category", key: cat, weight },
      update: { weight },
    });
  }
}
```

### Schema Status: Feedback model already has `source` field [UPDATED from review — Fix 2]

Current Feedback model (prisma/schema.prisma) ALREADY has:
- `source String @default("manual")` field (line 151)
- `@@unique([productId, source], name: "productId_source")` constraint (line 153)

**No schema migration needed for `source` field.**

**However, data deduplication may be required:** If any existing rows violate the unique constraint (duplicate `[productId, source]` pairs), the constraint would have failed during the migration that added it. Before relying on upsert logic, verify data integrity:

```sql
-- Check for duplicate productId+source pairs
SELECT "productId", source, COUNT(*) as cnt
FROM "Feedback"
GROUP BY "productId", source
HAVING COUNT(*) > 1;
```

If duplicates exist, deduplicate before proceeding:
```sql
-- Keep only the latest feedback per productId+source
DELETE FROM "Feedback" f1
USING "Feedback" f2
WHERE f1."productId" = f2."productId"
  AND f1.source = f2.source
  AND f1."feedbackDate" < f2."feedbackDate";
```

Add this deduplication check as Step 0 of Phase 07 implementation.

### Source Field Validation [UPDATED from review — Fix 15]

Add Zod enum validation for the `source` field instead of relying on string literals:

```typescript
// lib/feedback/feedback-schema.ts
import { z } from "zod";

export const FeedbackSourceSchema = z.enum(["manual", "implicit", "outcome", "quick"]);
export type FeedbackSource = z.infer<typeof FeedbackSourceSchema>;

// Use in API routes that accept/create feedback:
const body = FeedbackSourceSchema.parse(requestBody.source);
```

This prevents invalid source values from entering the DB (e.g., typos like "manaul" or "auto").

## Files to modify
- MODIFY: `lib/scoring/personalize.ts` — tiered activation, category/price preference
- CREATE: `lib/feedback/implicit-feedback.ts` — implicit signal collection
- CREATE: `lib/feedback/feedback-schema.ts` — Zod enum for source field [Fix 15]
- MODIFY: Various API routes to emit implicit feedback signals + validate source with Zod

## Success Criteria
- System starts learning after 5 feedback entries (not 30)
- Implicit feedback from production/archive actions works
- LearningWeightP4 auto-populates from feedback
- categoryBonus in smartScore becomes non-zero
