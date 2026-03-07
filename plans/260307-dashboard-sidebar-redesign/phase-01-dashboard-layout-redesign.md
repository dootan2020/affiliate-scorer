# Phase 01 — Dashboard Layout Redesign

## Context Links
- [Current State Analysis](./reports/current-state-analysis.md)
- [Plan Overview](./plan.md)
- Layout wrapper: `components/layout/sidebar-aware-main.tsx`
- Dashboard page: `app/page.tsx`

## Overview
- **Priority:** P1
- **Status:** Complete
- **Description:** Remove fixed `max-w-6xl` constraint on dashboard, implement full-width bento grid layout with optimized widget zones.

## Key Insights
- `SidebarAwareMain` applies `max-w-6xl` to ALL pages — cannot simply remove it globally
- Dashboard needs full-width; other pages (settings, guide) benefit from constrained width
- Solution: pass a prop or use CSS class override at page level
- Widget priority order based on daily workflow: Stats > Morning Brief > Content Suggestions > Channel Tasks > Patterns

## ASCII Wireframe — Desktop (1920px, sidebar expanded w-60)

```
+--sidebar--+------------------------------- MAIN CONTENT (full width) ---------------------------------+
|            |                                                                                           |
| [P] PASTR  |  Tong quan                                                                    [date]     |
|            |                                                                                           |
| Cong viec  |  +--- ALERT BAR (orphan) ---- full width, conditional --------------------------------+ |
|  > Tong quan|  | [!] 5 muc can xu ly: 2 brief chua SX | 1 video chua tracking | 2 slot qua han     | |
|  > Hop SP  |  +------------------------------------------------------------------------------------+ |
|  > San xuat|                                                                                           |
|  > Kenh    |  +--- ROW 1: STAT CARDS (4 cols) --- full width -------------------------------------+  |
|            |  | [Videos hom qua] | [Views]       | [Don hang]     | [Hoa hong]                    |  |
| Hanh dong  |  | 12               | 45.2K          | 8              | 2.1tr                         |  |
|  > Nhat ky |  +-----------------------------------------------------------------------------------+  |
|  > Dong bo |                                                                                           |
|            |  +--- ROW 2: BENTO GRID (3 cols) ------------------------------------------------+       |
| Phan tich  |  |                          |                          |                          |       |
|  > Insights|  | MORNING BRIEF            | CONTENT SUGGESTIONS      | CHANNEL TASK BOARD       |       |
|  > Playbook|  | (col-span-1)             | (col-span-1)             | (col-span-1)             |       |
|            |  |                          |                          |                          |       |
| ---        |  | [Sun] Ban tin sang       | [*] Nen tao noi dung     | [TV] Kenh hom nay        |       |
| Ho tro     |  | 7/3/2026                 |                          |                          |       |
|  > Huong dan|  | Greeting text...         | Channel tabs...          | Channel cards...         |       |
|  > Cai dat |  | Pattern highlight        | Product table            | Slot progress            |       |
|            |  | Channel tasks            | Score + Brief CTA        | Metric badges            |       |
|  [theme]   |  | Produce today            |                          | Quick actions            |       |
|  [<<]      |  | New products             |                          |                          |       |
|            |  | Events                   |                          |                          |       |
+------------+  | Yesterday recap          |                          |                          |       |
             |  | Tip                      |                          |                          |       |
             |  +-----------------------------------------------------------------------------------+  |
             |                                                                                           |
             |  +--- ROW 3: BOTTOM BAR (2 cols) ------------------------------------------------+       |
             |  |                                    |                                           |       |
             |  | WINNING PATTERNS (30 ngay)         | UPCOMING EVENTS (restore unused widget)   |       |
             |  | 4-stat grid + top format/product   | Next 3 events with urgency dots           |       |
             |  |                                    |                                           |       |
             |  +-----------------------------------------------------------------------------------+  |
             +-------------------------------------------------------------------------------------------+
```

## ASCII Wireframe — Desktop (sidebar collapsed w-16)

```
+--+--------------------------------- MAIN CONTENT (wider) -----------------------------------------+
|  |                                                                                                 |
|[P]| Same layout, wider columns. 3-col bento gets more space per column.                           |
|  |                                                                                                 |
+--+-------------------------------------------------------------------------------------------------+
```

## Widget Specifications

| Widget | Position | Grid Spec | Priority | Reasoning |
|--------|----------|-----------|----------|-----------|
| OrphanAlertWidget | Row 0 | full-width, conditional | P0 | Actionable alerts must be seen first |
| YesterdayStatsWidget | Row 1 | `grid-cols-2 sm:grid-cols-4` full-width | P1 | Quick glance KPIs |
| MorningBriefWidget | Row 2, Col 1 | `lg:col-span-1` | P1 | Daily production guidance |
| ContentSuggestionsWidget | Row 2, Col 2 | `lg:col-span-1` | P1 | What to produce — actionable |
| ChannelTaskBoard | Row 2, Col 3 | `lg:col-span-1` | P2 | Channel status — reference |
| WinningPatternsWidget | Row 3, Col 1 | `lg:col-span-1` (or `lg:col-span-2` if no events) | P2 | Performance context |
| UpcomingEventsWidget | Row 3, Col 2 | `lg:col-span-1` | P3 | Upcoming prep — restored widget |

## Architecture

### Approach: Page-level width override

**Option A (chosen):** Add optional `fullWidth` support to `SidebarAwareMain`, or override at page level.

Since `SidebarAwareMain` wraps ALL pages, best approach:
1. Remove `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8` from `SidebarAwareMain`
2. Add a `<PageContainer>` shared component with default `max-w-6xl` padding
3. Dashboard page uses custom layout (no PageContainer)
4. All other pages wrap content in `<PageContainer>`

**Alternative:** CSS class on dashboard page that overrides the container constraint. Simpler but less clean.

### Layout CSS for Dashboard

```tsx
// app/page.tsx
<div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
  {/* Alert */}
  <OrphanAlertWidget />

  {/* Stats */}
  <YesterdayStatsWidget />

  {/* Bento 3-col */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <MorningBriefWidget />
    <ContentSuggestionsWidget />
    <ChannelTaskBoard />
  </div>

  {/* Bottom row */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <WinningPatternsWidget />
    <UpcomingEventsWidget />
  </div>
</div>
```

### ChannelTaskBoard Adaptation
Currently uses horizontal scroll. In new layout (col-span-1), convert to vertical card stack with scroll. Cards stack vertically inside constrained column.

## Design Decisions

| Decision | Why | Trade-off |
|----------|-----|-----------|
| 3-col bento instead of 2-col | Utilizes full width, shows more info at glance | Columns narrower — widgets must be compact |
| ChannelTaskBoard in column | Vertical scroll in column vs horizontal full-width | Loses panoramic channel view; gains balanced layout |
| Restore UpcomingEventsWidget | Already coded, provides event-driven planning context | Slightly more API calls on dashboard load |
| `PageContainer` shared component | Clean separation of full-width vs constrained pages | Requires updating all 13 page files to wrap in PageContainer |

## Related Code Files

### Modify
- `components/layout/sidebar-aware-main.tsx` — remove inner max-w container
- `app/page.tsx` — new layout grid, import UpcomingEventsWidget
- `components/dashboard/channel-task-board.tsx` — vertical mode option
- All other `app/*/page.tsx` files — wrap in `<PageContainer>`

### Create
- `components/shared/page-container.tsx` — shared max-w-6xl wrapper

## Implementation Steps

1. Create `components/shared/page-container.tsx` with `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6`
2. Remove the inner `<div className="max-w-6xl...">` from `SidebarAwareMain`
3. Wrap all non-dashboard pages in `<PageContainer>` (inbox, production, channels, library, insights, log, sync, guide, settings, playbook, niche-finder)
4. Rewrite `app/page.tsx` layout with new grid structure
5. Add `UpcomingEventsWidget` import to dashboard
6. Adapt `ChannelTaskBoard` for vertical layout in column mode
7. Test sidebar expand/collapse transitions with new full-width layout
8. Verify dark mode rendering for all widget positions

## Todo List
- [ ] Create PageContainer component
- [ ] Refactor SidebarAwareMain to remove inner max-w
- [ ] Update all page files to use PageContainer
- [ ] Rewrite dashboard grid layout
- [ ] Restore UpcomingEventsWidget on dashboard
- [ ] Adapt ChannelTaskBoard for column layout
- [ ] Test sidebar collapse/expand
- [ ] Test 1920px and 1440px viewport
- [ ] Verify dark mode

## Success Criteria
- Dashboard uses full viewport width (minus sidebar)
- 3-column bento grid renders correctly on lg+ screens
- All other pages maintain existing max-w-6xl constraint
- Sidebar collapse/expand transitions smoothly
- No horizontal overflow on any viewport size

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Updating 11+ page files for PageContainer | High effort, merge conflicts | Can be done incrementally — dashboard first, then batch update others |
| ChannelTaskBoard losing horizontal scroll | Users accustomed to current UX | Provide vertical stack with max-height scroll; cards remain same size |
| Full-width cards too wide on ultrawide | Cards stretch awkwardly on 2560px | Add `max-w-[1800px] mx-auto` safety cap on dashboard container |

## Security Considerations
No security implications — layout-only changes.

## Next Steps
- Phase 02: Sidebar restructure (can run in parallel)
- Phase 03: Widget bug fixes (depends on Phase 01 layout being done)
