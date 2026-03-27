# Phase 4: UI — Score Column, Recommendations, Kill Badges

## Priority: MEDIUM
## Status: Pending
## Effort: Medium

## Overview
Update the niche-finder UI: add Niche Score column to table, top 3 recommendation cards above table, and kill criteria badges for eliminated categories.

## Context
- Table currently has columns: Ngách, SP, Có sales, KOL, Comm%, Giá TB, Rev/Đơn, Videos, Đánh giá (verdict), Xem SP
- Verdict column (PASS/CONSIDER/SKIP) gets REPLACED by Niche Score (0-100)
- Scored data comes from API (Phase 2), includes breakdown, highlights, risks
- Navigation to inbox already works (handleSelect → `/inbox?nicheCode=X&nicheName=Y`)

## Files to Create

### `components/niche-finder/niche-recommendation-cards.tsx`

**Props**:
```typescript
interface Props {
  recommendations: ScoredNiche[]; // top 3
  onSelect: (code: number) => void;
}
```

**Layout**: 3 cards in a row (desktop), stacked (mobile).

```
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ 🥇 Trang sức     │ │ 🥈 Nội thất      │ │ 🥉 Sách & Audio  │
│ Score: 87        │ │ Score: 82        │ │ Score: 78        │
│                  │ │                  │ │                  │
│ ✓ Nhu cầu cao   │ │ ✓ Ít cạnh tranh  │ │ ✓ Hoa hồng cao  │
│ ✓ HH cao        │ │ ✓ Đang tăng      │ │ ✓ Phù hợp AI    │
│ ⚠ Cạnh tranh TB │ │ ⚠ HH thấp       │ │ ⚠ Ít KOL        │
│                  │ │                  │ │                  │
│ [Xem sản phẩm →]│ │ [Xem sản phẩm →]│ │ [Xem sản phẩm →]│
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

**Design**:
- Card: `bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer`
- Score: large number with color coding
  - 80-100: `text-emerald-600`
  - 60-79: `text-blue-600`
  - 40-59: `text-amber-600`
  - 0-39: `text-gray-400`
- Medal emoji: 🥇 🥈 🥉
- Highlights: checkmark bullets, `text-sm text-gray-600`
- Risks: warning bullets, `text-sm text-amber-600`
- CTA: "Xem sản phẩm →" link
- Click card → `onSelect(code)` → navigates to inbox

## Files to Modify

### `components/niche-finder/niche-summary-table.tsx`

**Changes**:

1. **Update NicheSummary interface** — add scoring fields:
```typescript
export interface NicheSummary {
  // ... existing fields ...
  nicheScore: number;
  opportunityScore: number;
  fitScore: number;
  breakdown: ScoreBreakdown;
  kill: KillResult;
  tags: string[];
}
```

2. **Replace verdict column with Niche Score column**:
- Remove `VerdictBadge` component
- Add `NicheScoreBadge` — circular progress or colored number
- Score display: `87` in colored badge (same color coding as cards)
- Add tooltip on hover showing breakdown:
  ```
  Demand: 72 | Supply Gap: 85 | Economics: 91
  Opportunity: 83 | Fit: 78
  ```

3. **Add Niche Score as sortable column**:
- Add `"nicheScore"` to `SortKey` type
- Default sort by nicheScore desc

4. **Kill criteria display**:
- Killed rows: `opacity-40` on entire row
- Badge: red "Không phù hợp" pill after category name
- Title attribute on badge: join kill reasons
- Sort killed categories to bottom regardless of sort

5. **Add score column between "Videos" and action column**:
```
Ngách | SP | Sales | KOL | Comm% | Giá | Rev/Đơn | Videos | Score | →
```

### `components/niche-finder/niche-finder-client.tsx`

**Changes**:

1. **Update SummaryResponse** to match new API shape:
```typescript
interface SummaryResponse {
  niches: ScoredNiche[];
  lastSync: string | null;
  totalProducts: number;
  hasProfile: boolean;
}
```

2. **Add recommendations section** before table:
```tsx
{/* Top 3 Recommendations */}
{top3.length > 0 && (
  <NicheRecommendationCards
    recommendations={top3}
    onSelect={handleSelect}
  />
)}
```

Where `top3 = niches.filter(n => !n.kill.killed).slice(0, 3)` (already sorted by score from API).

3. **Update sort default** to `"nicheScore"` instead of `"revPerOrder"`.

4. **Separate killed vs active niches** for table:
```typescript
const active = sorted.filter(n => !n.kill.killed);
const killed = sorted.filter(n => n.kill.killed);
const tableData = [...active, ...killed]; // active first, killed at bottom
```

## Implementation Steps

1. Create `niche-recommendation-cards.tsx`
2. Update `NicheSummary` interface in `niche-summary-table.tsx`
3. Replace verdict column with score column + tooltip
4. Add kill criteria visual treatment (opacity, badge)
5. Update sort key type and default
6. Update `niche-finder-client.tsx` to render recommendations
7. Update `niche-finder-client.tsx` sorting to separate killed/active
8. Test responsive layout
9. TypeScript compile check

## Success Criteria
- [ ] Top 3 cards show above table with highlights + risks
- [ ] Cards clickable → navigate to inbox
- [ ] Score column shows 0-100 with color coding
- [ ] Tooltip shows score breakdown on hover
- [ ] Default sort by Niche Score desc
- [ ] Killed categories at bottom with opacity + badge
- [ ] Mobile: cards stack, table scrolls horizontally
- [ ] Score column replaces verdict column (no extra width)
