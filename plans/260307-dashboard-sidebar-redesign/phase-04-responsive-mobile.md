# Phase 04 — Responsive Mobile Adaptations

## Context Links
- [Current State Analysis](./reports/current-state-analysis.md)
- [Plan Overview](./plan.md)
- Mobile nav: `components/layout/mobile-nav.tsx`
- Dashboard page: `app/page.tsx`

## Overview
- **Priority:** P2
- **Status:** Complete
- **Description:** Adapt the new 3-column dashboard layout for mobile screens. Ensure sidebar changes reflect in mobile nav. Optimize widget display order for small screens.

## Key Insights
- Mobile already has `pt-14 pb-20` for top bar and bottom tab bar
- 3-col grid collapses to 1-col on mobile via `grid-cols-1 lg:grid-cols-3`
- Widget stacking order matters on mobile — user scrolls top-to-bottom
- MorningBriefWidget is verbose — should be collapsed by default on mobile
- ChannelTaskBoard horizontal scroll works on mobile but takes up significant vertical space

## Requirements

### Functional
- Dashboard 3-col grid collapses properly to single column
- Mobile widget order optimized for quick daily check
- MorningBriefWidget defaults collapsed on mobile
- Bottom tab bar and overflow menu match new sidebar structure

### Non-functional
- No horizontal overflow on 375px viewport
- Touch targets minimum 44px
- Smooth transitions between expanded/collapsed widgets

## Mobile Widget Order (top to bottom)

```
+-- MOBILE LAYOUT (375px) --+
|                            |
| [header: PASTR + menu]     |
|                            |
| +-- ALERT BAR -----------+ |
| | [!] 5 muc can xu ly    | |
| +------------------------+ |
|                            |
| +-- STAT CARDS (2x2) ----+ |
| | Videos | Views          | |
| | Orders | Commission     | |
| +------------------------+ |
|                            |
| +-- CONTENT SUGGESTIONS --+ |
| | [*] Nen tao noi dung    | |
| | Product rows...          | |
| +------------------------+ |
|                            |
| +-- MORNING BRIEF -------+ |
| | [Sun] Ban tin sang      | |
| | [collapsed by default]  | |
| | [tap to expand]         | |
| +------------------------+ |
|                            |
| +-- CHANNEL TASKS -------+ |
| | [TV] Kenh hom nay      | |
| | Horizontal scroll cards | |
| +------------------------+ |
|                            |
| +-- WINNING PATTERNS ----+ |
| | 2x2 stat grid          | |
| +------------------------+ |
|                            |
| +-- UPCOMING EVENTS -----+ |
| | Next 2 events           | |
| +------------------------+ |
|                            |
| [bottom tab bar]           |
+----------------------------+
```

**Order change vs desktop:** ContentSuggestions moves ABOVE MorningBrief on mobile because it's more actionable (direct "Brief" CTAs).

## Architecture

### Mobile-specific widget ordering

Use CSS `order` classes to reorder on mobile:

```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="order-2 lg:order-1">
    <MorningBriefWidget defaultCollapsed={isMobile} />
  </div>
  <div className="order-1 lg:order-2">
    <ContentSuggestionsWidget />
  </div>
  <div className="order-3">
    <ChannelTaskBoard />
  </div>
</div>
```

### MorningBriefWidget collapsed default on mobile

Add prop `defaultCollapsed?: boolean` to MorningBriefWidget. Dashboard passes it based on viewport. Since it's a Server Component parent, detect via CSS approach:

Option: Initialize `expanded` state from `window.innerWidth` in useEffect:
```typescript
const [expanded, setExpanded] = useState(true);
useEffect(() => {
  if (window.innerWidth < 1024) setExpanded(false);
}, []);
```

### Bottom row on mobile

2-col grid collapses to 1-col. WinningPatterns stat grid switches from `grid-cols-4` to `grid-cols-2`.

## Related Code Files

### Modify
- `app/page.tsx` — add CSS order classes for mobile reorder
- `components/dashboard/morning-brief-widget.tsx` — mobile default collapsed
- `components/dashboard/channel-task-board.tsx` — ensure horizontal scroll works in column layout
- `components/layout/mobile-nav.tsx` — already covered in Phase 02

### No new files needed

## Implementation Steps

1. Add CSS `order-*` classes to dashboard grid items for mobile reordering
2. Update MorningBriefWidget to detect mobile and default collapsed
3. Test 375px viewport — verify no horizontal overflow
4. Test widget collapse/expand touch interactions
5. Verify bottom tab bar overlay doesn't obscure content
6. Test landscape orientation on mobile
7. Verify ChannelTaskBoard scroll works within column layout on mobile

## Todo List
- [ ] Add order classes for mobile widget reordering
- [ ] MorningBriefWidget: detect mobile, default collapsed
- [ ] Test 375px viewport
- [ ] Test 768px tablet viewport
- [ ] Test landscape mode
- [ ] Verify bottom bar spacing
- [ ] Test touch interactions for all collapsible widgets

## Success Criteria
- No horizontal overflow on 375px
- ContentSuggestions appears before MorningBrief on mobile
- MorningBriefWidget collapsed by default on mobile, expandable on tap
- All touch targets >= 44px
- Dashboard scrollable without getting stuck behind bottom tab bar
- Sidebar changes reflected in mobile drawer nav

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| CSS order causes confusion in DOM vs visual order | Low | Accessibility still follows DOM order; visual reorder is minor |
| `window.innerWidth` check causes flash | Brief flash of expanded->collapsed on mobile | Use SSR-safe approach; layout shift is minimal |

## Security Considerations
No security implications.

## Next Steps
After Phase 04, the dashboard redesign is complete. Optional follow-ups:
- Add sparkline/mini-charts to YesterdayStatsWidget
- Add drag-to-reorder widgets (YAGNI for now)
- Add dashboard widget visibility preferences (YAGNI)

---

## Unresolved Questions

1. **Ultrawide cap:** Should we cap dashboard at `max-w-[1800px]` to prevent cards from being too wide on 2560px+ monitors? (Recommended: yes)
2. **ChannelTaskBoard vertical vs horizontal:** In 3-col layout, should ChannelTaskBoard keep horizontal scroll inside its column, or switch to vertical card stack? (Recommended: vertical stack with max-height scroll)
3. **InboxStatsWidget:** Delete the unused component file or leave it? (Recommended: leave for now, no cost)
