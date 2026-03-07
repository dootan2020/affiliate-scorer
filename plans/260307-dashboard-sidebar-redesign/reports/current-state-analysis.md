# Current State Analysis — Dashboard + Sidebar

## 1. Layout Architecture

### Root Layout (`app/layout.tsx`)
```
<div class="flex min-h-screen">
  <Sidebar />                    <!-- fixed left, w-60 or w-16 -->
  <SidebarAwareMain>             <!-- flex-1, margin adjusts to sidebar -->
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {children}
    </div>
  </SidebarAwareMain>
</div>
```

**Bottleneck:** `max-w-6xl` (1152px) inside `SidebarAwareMain` — on 1920px+ screens, ~500px wasted on each side after sidebar.

### Sidebar (`components/layout/sidebar.tsx`)
- Fixed positioning: `fixed left-0 top-0 bottom-0`
- Width: `w-60` expanded, `w-16` collapsed
- Collapse state persisted in `localStorage` with custom event dispatch
- Badge counts fetched on mount + route change for inbox/production

### SidebarAwareMain (`components/layout/sidebar-aware-main.tsx`)
- Listens to `sidebar-collapsed-change` custom event
- Adjusts `ml-60` or `ml-16` based on sidebar state
- Wraps ALL pages — so removing `max-w-6xl` here affects every page

## 2. Dashboard Widgets (Current)

### Page: `app/page.tsx` (Server Component)
Renders 6 widgets in vertical stack:

| Row | Widget | Width | Component |
|-----|--------|-------|-----------|
| 0 | OnboardingChecklist | full | `niche-intelligence/onboarding-checklist.tsx` |
| 1 | OrphanAlertWidget | full | `dashboard/orphan-alert-widget.tsx` |
| 2 | YesterdayStatsWidget | full (4-col grid) | `dashboard/yesterday-stats-widget.tsx` |
| 3L | MorningBriefWidget | 1/2 | `dashboard/morning-brief-widget.tsx` |
| 3R | ContentSuggestionsWidget | 1/2 | `dashboard/content-suggestions-widget.tsx` |
| 4 | ChannelTaskBoard | full (h-scroll) | `dashboard/channel-task-board.tsx` |
| 5 | WinningPatternsWidget | full | `dashboard/winning-patterns-widget.tsx` |

### Unused widgets (exist in codebase but NOT rendered):
- `InboxStatsWidget` — shows inbox pipeline counts (new/enriched/scored/briefed)
- `UpcomingEventsWidget` — shows next 3 calendar events with urgency dots

## 3. Sidebar Menu Structure

| Group | Label | Items |
|-------|-------|-------|
| Cong viec hang ngay | Daily Work | Tong quan, Hop san pham, San xuat, Kenh TikTok, Tim ngach |
| Du lieu | Data | Nhat ky, Dong bo du lieu, Thu vien |
| Phan tich | Analytics | Phan tich |
| Ho tro | Support | Huong dan, Cai dat |

**Issues:**
- "Tim ngach" (Niche Finder) is a secondary feature shoved into "daily work" group
- "Nhat ky" (Log) is under "Data" but is actually a daily action (logging results)
- "Phan tich" group has only 1 item — feels like wasted space
- "Thu vien" (Library) and "Dong bo du lieu" (Sync) are infrequent actions mixed with daily ones
- No visual differentiation between primary and secondary actions

## 4. Known Bugs

### BUG-1: "PATTERN DANG THANG: null"
- **Location:** `components/dashboard/morning-brief-sections.tsx` line 133-149
- **Root cause:** `PatternHighlightCard` renders whenever `content.pattern_highlight` is truthy — but `morning-brief-widget.tsx` line 170 checks `content.pattern_highlight` which can be the literal string `"null"` returned by AI
- **AI prompt** in `brief-prompt-builder.ts` line 278 tells AI: `"pattern_highlight": "...hoac null neu chua co"` — AI may return the string `"null"` instead of JSON null
- **Fix needed:** Guard: `content.pattern_highlight && content.pattern_highlight !== "null"`

### BUG-2: YesterdayStatsWidget "vs hom kia" text
- Shows "vs hom kia" (vs day before yesterday) but doesn't display actual comparison values
- Misleading — suggests comparison data exists when it's just a static label

### BUG-3: InboxStatsWidget not used
- Component exists, fetches data, but is not imported in `app/page.tsx`
- Duplicate functionality with Orphan stats

## 5. Mobile Experience

### Current implementation:
- Top bar: hamburger + "PASTR" title + theme toggle
- Bottom tab bar: 4 tabs (Tong quan, Hop SP, San xuat, Kenh) + overflow "Them" menu
- Slide-over drawer from left edge for full nav
- Dashboard: all widgets stack vertically, `max-w-6xl` irrelevant on mobile

### Issues:
- No mobile-specific widget order optimization
- MorningBriefWidget is very tall on mobile (many nested sections)
- ChannelTaskBoard horizontal scroll works but dots are small on touch
- `pt-14 pb-20` on `SidebarAwareMain` for top bar + bottom bar spacing

## 6. Design System Constraints

- Tailwind 4 (not v3 — different config syntax)
- Radix UI for primitives
- Cards: `rounded-2xl shadow-sm` standard
- Dark mode: `next-themes` with `darkMode: "class"`
- Icons: lucide-react
- No new dependencies allowed
