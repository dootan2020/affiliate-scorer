# Phase 6: Personalization Cache

## Context Links

- Personalize: `lib/scoring/personalize.ts`
- Feedback Model: Prisma `Feedback`
- Inbox API: `app/api/inbox/route.ts` (calls getPersonalizedScore per product)

## Overview

- **Priority:** P2
- **Status:** ✅ Complete
- **Review Status:** ✅ Reviewed
- **Effort:** 1h
- **Description:** Add module-level cache to `personalize.ts` to avoid redundant DB queries per product. Remove hardcoded `take: 200` limit with recency-based approach. Add cache invalidation hook on feedback insert.

## Key Insights

- `getPersonalizedScore()` makes 3 DB queries per product call:
  1. `feedback.count()` — same result for all products in a request
  2. `feedback.findMany({ where: { overallSuccess: "success" }, take: 200 })` — same result for all products
  3. `feedback.groupBy({ by: ["videoType"] })` — same result for all products
  4. `feedback.groupBy({ by: ["adPlatform"] })` — same result for all products
- When called for 20 products (inbox list), that's 80 identical DB queries.
- Solution: cache the feedback summary data (success feedbacks, type stats, platform stats) with 5-minute TTL.
- `take: 200` hardcoded limit is arbitrary. Better approach: use `orderBy: { feedbackDate: "desc" }` and take recent 100, which gives more relevant (less stale) data.

## Requirements

### Functional
1. Cache feedback summary data (successFeedbacks, successByType, platformPerf, feedbackCount) at module level
2. TTL: 5 minutes
3. Invalidate cache when new feedback is inserted
4. Replace `take: 200` with `take: 100, orderBy: { feedbackDate: "desc" }`
5. Export `invalidatePersonalizationCache()` for use in feedback API

### Non-functional
- Cache is in-memory (module-level Map), no Redis needed
- Thread-safe for serverless (module cache lives per instance)
- Cache miss = normal DB query path (no behavior change)

## Architecture

```
personalize.ts
  ├── feedbackCache: { data, timestamp }        // NEW
  ├── getCachedFeedbackSummary()                 // NEW — returns cached or fresh data
  ├── invalidatePersonalizationCache()           // NEW — export for feedback API
  └── getPersonalizedScore() — uses cached data  // MODIFY
```

```
app/api/feedback/route.ts (or wherever feedback is saved)
  └── after saving feedback → call invalidatePersonalizationCache()
```

## Related Code Files

| File | Action |
|------|--------|
| `lib/scoring/personalize.ts` | MODIFY — add cache, refactor queries |
| Feedback save endpoint(s) | MODIFY — add cache invalidation call |

## Implementation Steps

### Step 1: Add cache structure to personalize.ts

```typescript
interface FeedbackSummaryCache {
  feedbackCount: number;
  successFeedbacks: Array<{
    product: { category: string; price: number; commissionRate: number; platform: string };
  }>;
  successByType: Array<{ videoType: string | null; _count: number }>;
  platformPerf: Array<{ adPlatform: string | null; _avg: { adROAS: number | null } }>;
  timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let feedbackCache: FeedbackSummaryCache | null = null;

export function invalidatePersonalizationCache(): void {
  feedbackCache = null;
}
```

### Step 2: Create getCachedFeedbackSummary()

```typescript
async function getCachedFeedbackSummary(): Promise<FeedbackSummaryCache> {
  const now = Date.now();

  if (feedbackCache && now - feedbackCache.timestamp < CACHE_TTL_MS) {
    return feedbackCache;
  }

  const [feedbackCount, successFeedbacks, successByType, platformPerf] = await Promise.all([
    prisma.feedback.count(),
    prisma.feedback.findMany({
      where: { overallSuccess: "success" },
      include: { product: { select: { category: true, price: true, commissionRate: true, platform: true } } },
      orderBy: { feedbackDate: "desc" },
      take: 100, // Recency-based instead of arbitrary 200
    }),
    prisma.feedback.groupBy({
      by: ["videoType"],
      where: { overallSuccess: "success", videoType: { not: null } },
      _count: true,
    }),
    prisma.feedback.groupBy({
      by: ["adPlatform"],
      where: { adROAS: { not: null } },
      _avg: { adROAS: true },
    }),
  ]);

  feedbackCache = {
    feedbackCount,
    successFeedbacks,
    successByType,
    platformPerf,
    timestamp: now,
  };

  return feedbackCache;
}
```

### Step 3: Refactor getPersonalizedScore()

Replace the 4 individual queries with a single `getCachedFeedbackSummary()` call:

```typescript
export async function getPersonalizedScore(
  product: Product,
  baseScore: number,
): Promise<PersonalizationResult | null> {
  const cached = await getCachedFeedbackSummary();

  if (cached.feedbackCount < 30) return null;

  // Historical Match — use cached.successFeedbacks
  let historicalMatchScore = 50;
  if (cached.successFeedbacks.length > 0) {
    let matches = 0;
    let total = 0;
    for (const fb of cached.successFeedbacks) {
      const past = fb.product;
      total++;
      if (past.category === product.category) matches += 3;
      const priceDiff = Math.abs(past.price - product.price) / Math.max(past.price, product.price, 1);
      if (priceDiff < 0.3) matches += 2;
      if (Math.abs(past.commissionRate - product.commissionRate) < 3) matches += 2;
      if (past.platform === product.platform) matches += 1;
    }
    const maxPossible = total * 8;
    historicalMatchScore = Math.min(100, Math.round((matches / Math.max(maxPossible, 1)) * 100));
  }

  // Content Type Match — use cached.successByType
  let contentTypeScore = 50;
  if (cached.successByType.length > 0) {
    contentTypeScore = 65;
  }

  // Audience Match — use cached.platformPerf
  let audienceScore = 50;
  if (cached.platformPerf.length > 0) {
    const best = cached.platformPerf.reduce((a, b) =>
      (b._avg.adROAS ?? 0) > (a._avg.adROAS ?? 0) ? b : a
    );
    if (best.adPlatform && product.platform.toLowerCase().includes(best.adPlatform.toLowerCase())) {
      audienceScore = 80;
    }
  }

  const personalizedTotal = Math.round(
    baseScore * 0.5 + historicalMatchScore * 0.3 + contentTypeScore * 0.1 + audienceScore * 0.1,
  );

  return {
    historicalMatchScore,
    contentTypeScore,
    audienceScore,
    personalizedTotal: Math.min(100, personalizedTotal),
  };
}
```

### Step 4: Find feedback save endpoints and add invalidation

Search for where `prisma.feedback.create` is called:

```typescript
import { invalidatePersonalizationCache } from "@/lib/scoring/personalize";

// After saving feedback:
await prisma.feedback.create({ data: { ... } });
invalidatePersonalizationCache(); // NEW
```

## Todo List

- [ ] Add cache structure and TTL constant to `personalize.ts`
- [ ] Create `getCachedFeedbackSummary()` function
- [ ] Export `invalidatePersonalizationCache()` function
- [ ] Refactor `getPersonalizedScore()` to use cached summary
- [ ] Change `take: 200` to `take: 100, orderBy: { feedbackDate: "desc" }`
- [ ] Find feedback create/update endpoints and add cache invalidation
- [ ] Verify compile: `pnpm build`
- [ ] Test: personalization with cache hit (second call faster)
- [ ] Test: cache invalidation on feedback insert

## Success Criteria

- `getPersonalizedScore()` called 20 times makes only 4 DB queries total (not 80)
- Cache expires after 5 minutes
- New feedback insert invalidates cache
- Recency-based query returns more recent feedbacks
- No behavior change in personalization scores
- Build passes

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Stale cache shows outdated data | Low | 5-minute TTL is acceptable for dashboard |
| Serverless cold start resets cache | Known | Expected behavior; first request does full query |
| Cache invalidation missed (edge case) | Low | TTL ensures max 5 min staleness |

## Security Considerations

- No new endpoints exposed
- Cache is in-memory, no persistence risk
- No cross-user data leakage (single-user app)

## Next Steps

- All phases complete. Integration testing across the full intelligence pipeline.
