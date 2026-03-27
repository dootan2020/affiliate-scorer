# Niche Scoring Algorithm — Implementation Plan

## Summary
Add automated niche scoring + recommendation to `/niche-finder`. Three-layer algorithm (kill criteria → opportunity score → fit score) ranks 29 categories. User answers 4 profile questions once. Top 3 recommendations with explanations. Pure formula, no AI calls.

## Current State
- `/api/niche-finder/summary` aggregates ProductIdentity by fastmossCategoryId → returns category-level stats
- `niche-finder-client.tsx` fetches summary, sorts, renders `NicheSummaryTable`
- Table shows: SP count, withSales, withKOL, avgCommission, avgPrice, revPerOrder, totalVideos, verdict (PASS/CONSIDER/SKIP)
- Clicking row → `/inbox?nicheCode=X&nicheName=Y`
- Data available per product: price, commissionRate, day28SoldCount, relateAuthorCount, relateVideoCount, deltaType
- No user profile/preferences stored yet

## Architecture Decision
- **Scoring logic**: New `lib/niche-scoring/` module (pure functions, testable)
- **API**: Extend existing `/api/niche-finder/summary` with optional `?profile=<json>` query param
- **Category tags**: Hardcoded map in `lib/niche-scoring/category-tags.ts`
- **User profile**: localStorage on client, passed as query param to API
- **No DB changes needed** — all data already exists in ProductIdentity

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 1 | Scoring engine (`lib/niche-scoring/`) | Done | Medium |
| 2 | API integration | Done | Small |
| 3 | User profile form component | Done | Medium |
| 4 | UI — score column, recommendations, kill badges | Done | Medium |

## Key Files

### Create
- `lib/niche-scoring/category-tags.ts` — hardcoded AI content tags per category
- `lib/niche-scoring/opportunity-score.ts` — demand + supply gap + unit economics
- `lib/niche-scoring/fit-score.ts` — user constraint modifiers
- `lib/niche-scoring/kill-criteria.ts` — binary pass/fail filters
- `lib/niche-scoring/niche-scorer.ts` — orchestrator combining all 3 layers
- `lib/niche-scoring/types.ts` — shared types
- `components/niche-finder/niche-profile-form.tsx` — 4-question user profile
- `components/niche-finder/niche-recommendation-cards.tsx` — top 3 cards

### Modify
- `app/api/niche-finder/summary/route.ts` — add delta aggregation + scoring
- `components/niche-finder/niche-finder-client.tsx` — add profile state, pass to API, render recommendations
- `components/niche-finder/niche-summary-table.tsx` — add Niche Score column + kill badges

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| Score normalization skewed by outlier categories | Medium | Use percentile-based normalization, not min-max |
| Profile form friction on first visit | Low | Make it optional — show scores without fit if no profile |
| Mobile table too wide with new column | Low | Niche Score replaces verdict column (more useful) |
