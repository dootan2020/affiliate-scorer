# Phase 2: API Integration

## Priority: HIGH
## Status: Pending
## Effort: Small

## Overview
Extend `/api/niche-finder/summary` to include delta aggregation and scoring. Add user profile as optional query parameter.

## Context
- Current API queries: groupBy fastmossCategoryId for counts, averages, sums
- Missing data: per-category avgSales28d, totalKOL (sum of relateAuthorCount), deltaType distribution
- Scoring engine from Phase 1 takes CategoryStats[] + UserProfile → ScoredNiche[]

## Files to Modify

### `app/api/niche-finder/summary/route.ts`

**New queries needed** (add to existing Promise.all):

```typescript
// 1. Average sales per product in each category
prisma.productIdentity.groupBy({
  by: ["fastmossCategoryId"],
  where: { ...baseWhere, day28SoldCount: { gt: 0 } },
  _avg: { day28SoldCount: true },
}),

// 2. Total KOL (sum of relateAuthorCount) per category
prisma.productIdentity.groupBy({
  by: ["fastmossCategoryId"],
  where: baseWhere,
  _sum: { relateAuthorCount: true },
}),

// 3. Count of NEW/SURGE delta products per category
prisma.productIdentity.groupBy({
  by: ["fastmossCategoryId"],
  where: { ...baseWhere, deltaType: { in: ["NEW", "SURGE"] } },
  _count: true,
}),
```

**Profile handling**:
```typescript
const profileParam = url.searchParams.get("profile");
const profile: UserProfile | null = profileParam
  ? JSON.parse(profileParam)
  : null;
```

**Scoring integration**:
After building CategoryStats[] from existing + new query results:
```typescript
import { scoreNiches } from "@/lib/niche-scoring/niche-scorer";

const scored = scoreNiches(categoryStatsList, profile);
```

**Response shape change**:
```typescript
// Before:
{ niches: NicheSummary[], lastSync, totalProducts }

// After:
{
  niches: ScoredNiche[],  // includes all existing fields + score + breakdown
  lastSync: string | null,
  totalProducts: number,
  hasProfile: boolean,
}
```

Keep backward compat: ScoredNiche extends existing fields. Old fields (verdict, etc.) can be derived from score.

## Implementation Steps

1. Add 3 new groupBy queries to Promise.all
2. Build lookup maps for new data (avgSalesMap, totalKOLMap, newSurgeMap)
3. Construct CategoryStats[] with all fields (existing + new)
4. Parse optional `profile` query param
5. Call `scoreNiches(stats, profile)`
6. Map results to response format preserving existing fields
7. Add `hasProfile` to response
8. Test with and without profile param

## Success Criteria
- [ ] API returns scored niches when called without profile (opportunity-only scores)
- [ ] API returns scored niches with fit scores when profile provided
- [ ] Killed niches have score=0 and reasons array
- [ ] Existing response fields still present (backward compat)
- [ ] No N+1 queries — all data from batch queries
- [ ] TypeScript compiles clean
