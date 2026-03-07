# Phase 4: Content Suggestions Widget UI

## Context Links

- Current Widget: `components/dashboard/content-suggestions-widget.tsx` (170 lines)
- New API: `GET /api/dashboard/suggestions` (Phase 3)
- Dashboard Page: `app/page.tsx`
- Design Tokens: `docs/design-guidelines.md`
- Shared Components: `components/shared/`

## Overview

- **Priority:** P1
- **Status:** ✅ Complete
- **Review Status:** ✅ Reviewed
- **Effort:** 2h
- **Description:** Refactor the Content Suggestions widget to consume the new smart suggestions API, show channel tabs, explore/exploit tags, reason text, calendar event banners, lifecycle warnings, and brief-to-channel linking.

## Key Insights

- Current widget is 170 lines, purely client-side. Fetches `/api/inbox?sort=score&limit=20`, filters client-side, re-ranks, shows top 5.
- New widget will fetch `GET /api/dashboard/suggestions` which returns pre-computed results grouped by channel.
- Widget should stay under 200 lines. Split into sub-components if needed.
- Must be mobile responsive (current widget already is, maintain that).

## Requirements

### Functional
1. **Channel Tabs**: If multiple channels, show PillTabs to switch between channels. Each tab shows channel name + product count.
2. **Product Cards**: Each product shows: title, category, combinedScore badge, smartScore badge (new), reason text, explore/exploit tag, commission rate.
3. **Explore/Exploit Tags**: "Da chung minh" (green badge) / "Kham pha" (purple badge) next to product name.
4. **Reason Text**: Small gray text under product name explaining why suggested.
5. **Calendar Banner**: If calendarEvents exist, show a small amber banner at top: "Su kien: {name} — {date}".
6. **Lifecycle Warning**: If product lifecycleStage = "peak", show small warning icon with tooltip "Dang o dinh — lam som".
7. **Brief CTA with Channel**: "Tao Brief" button passes channelId as query param: `/production?productId={id}&channelId={channelId}`.
8. **Flat List Fallback**: If no channels, show flatList as simple list (current behavior).
9. **Refresh Button**: Small refresh icon to re-fetch suggestions.
10. **Empty State**: If no products, show "Tat ca san pham da duoc brief!" with CTA to /sync.
11. **Pending Count**: Widget header shows "Còn X SP chờ brief" count from total unbriefed products in response.

### Non-functional
- Widget file < 200 lines (split sub-components if needed)
- Mobile: 1 column, no tabs (show first channel), score badge smaller
- Dark mode support
- Loading skeleton maintained

## Architecture

### File Structure

| File | Purpose | Lines |
|------|---------|-------|
| `components/dashboard/content-suggestions-widget.tsx` | MODIFY — main widget, fetch + tabs + layout | ~120 |
| `components/dashboard/suggestion-product-row.tsx` | CREATE — single product row component | ~60 |
| `components/dashboard/suggestion-calendar-banner.tsx` | CREATE — calendar event banner | ~25 |

### Data Flow

```
ContentSuggestionsWidget
  ├── fetch GET /api/dashboard/suggestions
  ├── SuggestionCalendarBanner (if events)
  ├── PillTabs (if multiple channels)
  └── SuggestionProductRow[] (per channel products)
        ├── ProductImage
        ├── Title + Reason + Tag
        ├── Score badges
        └── Brief CTA (with channelId)
```

## Related Code Files

| File | Action |
|------|--------|
| `components/dashboard/content-suggestions-widget.tsx` | MODIFY — rewrite fetch + layout |
| `components/dashboard/suggestion-product-row.tsx` | CREATE |
| `components/dashboard/suggestion-calendar-banner.tsx` | CREATE |
| `components/production/production-page-client.tsx` | MODIFY — add channelId searchParam reading |

## Implementation Steps

### Step 1: Create `suggestion-calendar-banner.tsx`

```tsx
interface CalendarBannerProps {
  events: Array<{ name: string; startDate: string; eventType: string }>;
}

export function SuggestionCalendarBanner({ events }: CalendarBannerProps) {
  if (events.length === 0) return null;
  const next = events[0];
  const dateStr = new Date(next.startDate).toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" });
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs mb-3">
      <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
      <span>Su kien: <strong>{next.name}</strong> — {dateStr}</span>
      {events.length > 1 && <span className="text-amber-500">+{events.length - 1}</span>}
    </div>
  );
}
```

### Step 2: Create `suggestion-product-row.tsx`

```tsx
interface SuggestionProductRowProps {
  product: SuggestedProduct;
  channelId?: string;
}

export function SuggestionProductRow({ product, channelId }: SuggestionProductRowProps) {
  const briefHref = channelId
    ? `/production?productId=${product.id}&channelId=${channelId}`
    : `/production?productId=${product.id}`;

  return (
    <tr className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
      {/* Thumbnail — hidden on mobile */}
      <td className="py-2.5 pr-2 hidden sm:table-cell">
        <ProductImage src={product.imageUrl} alt={product.title ?? "SP"} />
      </td>
      {/* Name + Reason + Tag */}
      <td className="py-2.5 pr-2">
        <div className="flex items-center gap-1.5">
          <Link href={`/inbox/${product.id}`} className="text-sm font-medium text-gray-900 dark:text-gray-50 hover:text-orange-600 line-clamp-1">
            {product.title ?? "San pham chua dat ten"}
          </Link>
          {/* Tag badge */}
          {product.tag === "proven" ? (
            <span className="shrink-0 inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
              Da CM
            </span>
          ) : (
            <span className="shrink-0 inline-flex items-center rounded-full bg-purple-50 dark:bg-purple-950 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 dark:text-purple-300">
              Kham pha
            </span>
          )}
        </div>
        {/* Reason */}
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">
          {product.reason}
        </p>
      </td>
      {/* Score */}
      <td className="py-2.5 pr-2 text-center">
        <span className="inline-flex items-center rounded-full bg-orange-50 dark:bg-orange-950 px-2 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-300">
          {product.smartScore.toFixed(0)}
        </span>
      </td>
      {/* CTA */}
      <td className="py-2.5 text-right">
        <Link href={briefHref} className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 whitespace-nowrap transition-colors">
          Tao Brief →
        </Link>
      </td>
    </tr>
  );
}
```

### Step 3: Refactor `content-suggestions-widget.tsx`

Key changes:
1. Replace fetch URL: `GET /api/dashboard/suggestions` (was GET /api/inbox)
2. Store `SuggestionsResult` in state
3. Add `activeChannel` state for tab selection
4. Render: CalendarBanner → PillTabs → Product rows
5. Add refresh button in header
6. Remove client-side `rankProduct()` function (server handles ranking now)
7. Fallback: use `result.flatList` if `result.channels.length === 0`

### Step 4: Mobile responsive considerations

- Tabs: horizontal scroll on mobile (overflow-x-auto)
- Product rows: hide thumbnail on mobile (already done), smaller text
- Calendar banner: full width, smaller text
- Score badge: single badge (smartScore), not both

### Step 5: Brief→Channel linking

When user clicks "Tao Brief →", the URL includes `channelId`:
```
/production?productId={id}&channelId={channelId}
```

**Production page does NOT currently read channelId from search params.** Must add:

### Step 5b: Add channelId query param support to production page

In `components/production/production-page-client.tsx` (or the page's client component):
1. Read `channelId` from `useSearchParams()`
2. If present, pre-select the channel in the ProductSelector dropdown
3. This is a small addition — read the param, set initial state

```typescript
const searchParams = useSearchParams();
const initialChannelId = searchParams.get("channelId");
// Pass to ProductSelector as defaultChannelId prop
```

## Todo List

- [ ] Create `components/dashboard/suggestion-calendar-banner.tsx`
- [ ] Create `components/dashboard/suggestion-product-row.tsx`
- [ ] Refactor `content-suggestions-widget.tsx` to use new API
- [ ] Add channel PillTabs with active state
- [ ] Add refresh button
- [ ] Add explore/exploit tag badges
- [ ] Add reason text display
- [ ] Add lifecycle warning icon for "peak" products
- [ ] Add channelId query param support to production page client
- [ ] Add "Còn X SP chờ brief" pending count in widget header
- [ ] Test mobile responsive
- [ ] Test dark mode
- [ ] Verify compile: `pnpm build`

## Success Criteria

- Widget shows products grouped by channel tabs
- Each product has reason text and proven/explore tag
- Calendar banner appears when events exist
- Refresh button re-fetches data
- Brief CTA includes channelId
- Mobile layout works (no horizontal overflow)
- Dark mode styles correct
- Empty state shows when no products
- Total widget file < 200 lines
- Build passes

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| API returns empty on first use | Low | Fallback to flatList, then to empty state |
| Too many channels → tabs overflow | Low | Horizontal scroll tabs |
| Production page doesn't read channelId | Medium | **Confirmed missing** — add searchParam reading in Step 5b |

## Security Considerations

- No new auth requirements. Widget is client-side, API already handles auth.
- No sensitive data in suggestions response.

## Next Steps

- Phase 5: Automation Cron Jobs
