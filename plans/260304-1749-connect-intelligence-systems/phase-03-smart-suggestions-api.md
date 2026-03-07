# Phase 3: Smart Content Suggestions API

## Context Links

- Current Widget: `components/dashboard/content-suggestions-widget.tsx`
- Win Probability: `lib/ai/win-probability.ts` (calculateWinProbability)
- Explore/Exploit: `lib/learning/explore-exploit.ts`
- Learning Weights: `LearningWeightP4` model
- Personalize: `lib/scoring/personalize.ts`
- Content Suggestions Audit: `docs/content-suggestions-audit.md`
- Lifecycle: `lib/ai/lifecycle.ts` (getProductLifecycle)

## Overview

- **Priority:** P1
- **Status:** ✅ Complete
- **Review Status:** ✅ Reviewed
- **Effort:** 3h
- **Description:** New server-side API endpoint that computes ranked content suggestions per channel using learning weights, explore/exploit ratio, calendar boost, lifecycle filter, and win probability formula. Returns grouped-by-channel results with reason strings and explore/exploit tags.

## Key Insights

- Current widget fetches `/api/inbox?sort=score&limit=20` and does client-side re-ranking. This is broken (see audit: briefed products waste slots, inconsistent ranking).
- `calculateWinProbability()` is currently orphaned (no call sites). It's a 4D formula: Market(40) + PersonalFit(30) + Timing(15) - Risk(15) = 0-100. It makes 4-6 DB queries per product — too slow for 20 products.
- Solution: implement a **lightweight server-side formula** inspired by win probability but without per-product DB queries. Use pre-fetched learning weights and calendar data.
- Explore/exploit tags: products matching top learning weights = "proven" (Da chung minh), others = "explore" (Kham pha).

## Requirements

### Functional
- `GET /api/dashboard/suggestions` endpoint (read-only, no resource creation)
- Query params: `?channelIds=id1,id2` (optional filter)
- Response: `{ channels: Array<{ channelId, channelName, products: Array<SuggestedProduct> }>, flatList?: SuggestedProduct[] }`
- Each `SuggestedProduct`: `{ id, title, category, imageUrl, combinedScore, smartScore, reason, tag, deltaType, commissionRate, lifecycleStage }`
  - `smartScore`: computed ranking score (0-100)
  - `reason`: human-readable Vietnamese string explaining why this product is suggested
  - `tag`: `"proven"` | `"explore"`
- Per channel: 3-5 products, sorted by smartScore DESC
- Fallback: if no channels exist, return `flatList` sorted by smartScore

### Scoring Formula (no LLM, no per-product queries)
Pre-fetch once:
1. Top learning weight categories, hooks, formats (from LearningWeightP4)
2. Upcoming calendar events (next 7 days)
3. Active channels with their niches

Per product scoring:
```
smartScore = combinedScore * 0.45                    // base AI score
           + categoryBonus * 0.15                     // learning weight match
           + contentMixBonus * 0.10                   // channel contentMix fit
           + deltaBonus * 0.10                        // trending momentum
           + calendarBonus * 0.10                     // timing relevance
           + contentPotentialScore * 0.05              // content potential
           + recencyBonus * 0.05                       // freshness
```

- `categoryBonus`: 0-100. If product.category matches a top-weight category (weight > 1.0), bonus = min(100, weight * 50).
- `deltaBonus`: breakout=100, surge=70, rising=40, new=20, stable=0, cool=-20
- `calendarBonus`: if upcoming event category matches product category, +100. Otherwise 0.
- `recencyBonus`: if created within 3 days, 100. 7 days: 50. Else 0.

### Explore/Exploit Tagging
- Fetch top 5 hook_type weights and top 3 format weights
- Product is "proven" if its category matches a high-weight category (weight > 1.0) OR if it was previously briefed with a high-weight hook
- Otherwise "explore"
- Target: ~70% proven, 30% explore in each channel's results

### Reason String Generation
Template-based (no LLM):
- High combinedScore: "Diem AI {score}/100 — tiem nang cao"
- Category match: "Danh muc {cat} dang hieu qua (weight: {w}x)"
- Delta surge: "Dang tang manh — nen lam som"
- Calendar: "Phu hop voi su kien {event} ngay {date}"
- Explore: "Chua thu — co the la hit moi"
- Combine top 2 reasons into 1 string, max 80 chars

### Channel Grouping + contentMix Factor
- For each active channel, filter products by channel niche match (if niche set)
- **contentMix bonus**: Read `TikTokChannel.contentMix` (JSON: `{ entertainment: 40, review: 20, ... }`). If channel has high % for a content type (e.g. 60% review), boost products with high visual appeal / unboxing potential for review format. Map contentMix keys to product attributes:
  - `review` → boost products with high contentPotentialScore
  - `selling` → boost products with high commissionRate
  - `education` → boost products in knowledge/health categories
  - `entertainment` → boost products with high deltaType (trending = entertaining content potential)
- contentMix bonus = sum of matching type weights / 100, normalized to 0-100 scale
- If no contentMix data, use all products
- Take top 5 per channel (at least 1 explore)
- Deduplicate: product appears in max 2 channels

### Lifecycle Filter
- Exclude products with lifecycleStage = "declining" from suggestions
- Warn (but include) products with lifecycleStage = "peak" with reason note

### Non-functional
- Must respond within 500ms for typical dataset (200 products, 3 channels)
- No LLM calls
- Single batch DB query for products, single query for weights, single for calendar

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `app/api/dashboard/suggestions/route.ts` | API route handler |
| `lib/suggestions/compute-smart-suggestions.ts` | Core scoring + grouping logic |
| `lib/suggestions/build-suggestion-reason.ts` | Reason string builder |

### Data Flow

```
GET /api/dashboard/suggestions
  └── computeSmartSuggestions(channelIds?)
        ├── Batch fetch: products (state=scored/enriched, limit 100)
        ├── Batch fetch: LearningWeightP4 (all, ~50 records)
        ├── Batch fetch: CalendarEvent (next 7 days)
        ├── Batch fetch: TikTokChannel (active)
        ├── Per product: compute smartScore (pure math, no DB)
        ├── Tag explore/exploit
        ├── Build reason strings
        ├── Group by channel
        └── Return sorted results
```

## Related Code Files

| File | Action |
|------|--------|
| `app/api/dashboard/suggestions/route.ts` | CREATE |
| `lib/suggestions/compute-smart-suggestions.ts` | CREATE |
| `lib/suggestions/build-suggestion-reason.ts` | CREATE |

## Implementation Steps

### Step 1: Create `lib/suggestions/build-suggestion-reason.ts`

```typescript
interface ReasonInput {
  combinedScore: number | null;
  categoryWeight: number | null;
  category: string | null;
  deltaType: string | null;
  calendarEvent: { name: string; date: string } | null;
  tag: "proven" | "explore";
  lifecycleStage: string | null;
}

export function buildSuggestionReason(input: ReasonInput): string {
  const parts: string[] = [];

  if (input.tag === "explore") {
    parts.push("Chua thu — co the la hit moi");
  }
  if (input.deltaType === "breakout" || input.deltaType === "surge") {
    parts.push("Dang tang manh");
  }
  if (input.calendarEvent) {
    parts.push(`Phu hop ${input.calendarEvent.name}`);
  }
  if (input.categoryWeight && input.categoryWeight > 1.0) {
    parts.push(`${input.category} dang hieu qua`);
  }
  if ((input.combinedScore ?? 0) >= 80) {
    parts.push(`Diem AI ${input.combinedScore}/100`);
  }
  if (input.lifecycleStage === "peak") {
    parts.push("Dang o dinh — nen som");
  }

  // Take top 2 reasons, join with " · "
  return parts.slice(0, 2).join(" · ") || "Tiem nang tot";
}
```

### Step 2: Create `lib/suggestions/compute-smart-suggestions.ts`

Core logic:
1. Batch fetch products WHERE inboxState IN ('scored', 'enriched'), orderBy combinedScore DESC, take 100
2. Batch fetch all LearningWeightP4
3. Batch fetch CalendarEvent next 7 days
4. Batch fetch active TikTokChannels (include contentMix field)
5. Build weight maps: categoryWeights, hookWeights, formatWeights, contentMixMaps per channel
6. For each product:
   - Compute smartScore using formula
   - Determine tag (proven/explore)
   - Build reason string
7. Group by channel (match niche to category, fallback: all products)
8. Per channel: sort by smartScore, ensure at least 1 explore, take 5
9. Deduplicate across channels
10. Return result

### Step 3: Create `app/api/dashboard/suggestions/route.ts`

```typescript
import { NextResponse } from "next/server";
import { computeSmartSuggestions } from "@/lib/suggestions/compute-smart-suggestions";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const channelIds = searchParams.get("channelIds")?.split(",").filter(Boolean) || undefined;
    const result = await computeSmartSuggestions(channelIds);
    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Loi khong xac dinh";
    console.error("[dashboard/suggestions]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
```

### Step 4: Define response types

```typescript
export interface SuggestedProduct {
  id: string;
  title: string | null;
  category: string | null;
  imageUrl: string | null;
  combinedScore: number | null;
  contentPotentialScore: number | null;
  smartScore: number;
  reason: string;
  tag: "proven" | "explore";
  deltaType: string | null;
  commissionRate: number | null;
  lifecycleStage: string | null;
}

export interface ChannelSuggestions {
  channelId: string;
  channelName: string;
  products: SuggestedProduct[];
}

export interface SuggestionsResult {
  channels: ChannelSuggestions[];
  flatList: SuggestedProduct[];
  calendarEvents: Array<{ name: string; startDate: string; eventType: string }>;
}
```

## Todo List

- [ ] Create `lib/suggestions/build-suggestion-reason.ts`
- [ ] Create `lib/suggestions/compute-smart-suggestions.ts` with types
- [ ] Implement batch data fetching (products, weights, calendar, channels)
- [ ] Implement smartScore formula (pure math, no DB per product)
- [ ] Implement explore/exploit tagging
- [ ] Implement channel grouping with niche matching
- [ ] Implement deduplication across channels
- [ ] Create `app/api/dashboard/suggestions/route.ts`
- [ ] Verify compile: `pnpm build`
- [ ] Test: with channels + learning data, without channels, with empty DB

## Success Criteria

- API responds within 500ms for 200 products, 3 channels
- Products grouped by channel with 3-5 per channel
- Each product has reason string and explore/exploit tag
- ~70% proven / 30% explore ratio maintained
- Fallback flat list works when no channels exist
- Declining products excluded
- Calendar events included in response
- Build passes

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| 100 products * scoring formula = slow | Low | Pure math, no DB queries per product |
| Channel niche matching too strict | Medium | Fallback: if no niche match, use all products |
| Explore tag on bad products | Low | Still ranked by smartScore, explore just means untested |
| Empty learning weights | Low | categoryBonus defaults to 0, tag defaults to "explore" |

## Security Considerations

- GET endpoint, no auth bypass needed (app is single-user)
- No sensitive data exposed beyond what inbox already shows
- No LLM API calls (no API key exposure risk)

## Next Steps

- Phase 4: Widget UI refactor to consume this API
