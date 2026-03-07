# Phase 03 — Widget Improvements

## Context Links
- [Current State Analysis](./reports/current-state-analysis.md)
- [Plan Overview](./plan.md)
- Morning brief sections: `components/dashboard/morning-brief-sections.tsx`
- Morning brief widget: `components/dashboard/morning-brief-widget.tsx`
- Yesterday stats: `components/dashboard/yesterday-stats-widget.tsx`
- Brief prompt builder: `lib/brief/brief-prompt-builder.ts`

## Overview
- **Priority:** P1
- **Status:** Complete
- **Description:** Fix known bugs and improve widget quality. Primary target: "PATTERN DANG THANG: null" bug.

## Key Insights
- AI prompt tells model to return `null` as string in JSON — model sometimes returns literal string `"null"` instead of JSON `null`
- `PatternHighlightCard` renders whenever truthy — string `"null"` is truthy
- YesterdayStatsWidget shows "vs hom kia" label without actual comparison data
- InboxStatsWidget exists but unused — evaluate whether to restore or remove

## Requirements

### Functional
- Fix "PATTERN DANG THANG: null" display bug
- Fix YesterdayStatsWidget misleading comparison label
- Restore UpcomingEventsWidget on dashboard (moved to Phase 01)

### Non-functional
- No layout shift when widgets load
- Consistent skeleton loading across all widgets

## Bug Fixes

### BUG-1: "PATTERN DANG THANG: null"

**Root cause chain:**
1. `lib/brief/brief-prompt-builder.ts` line 278: AI prompt says `"pattern_highlight": "...hoac null neu chua co"`
2. AI returns `"pattern_highlight": "null"` (string) instead of `null` (JSON null)
3. `lib/brief/brief-types.ts` line 65: type is `string | null` — string `"null"` is valid
4. `morning-brief-widget.tsx` line 170: `{content.pattern_highlight && (` — truthy check passes for string `"null"`
5. `morning-brief-sections.tsx` line 143-146: renders `"Pattern dang thang"` label with `"null"` as content

**Fix (2 locations for defense-in-depth):**

Location 1 — `morning-brief-widget.tsx` line 170:
```typescript
// BEFORE
{content.pattern_highlight && (
  <PatternHighlightCard highlight={content.pattern_highlight} />
)}

// AFTER
{content.pattern_highlight && content.pattern_highlight !== "null" && (
  <PatternHighlightCard highlight={content.pattern_highlight} />
)}
```

Location 2 — `lib/brief/brief-prompt-builder.ts` line 278:
```typescript
// BEFORE
"pattern_highlight": "Combo hook+format win rate XX% — hoac null neu chua co"

// AFTER
"pattern_highlight": "Combo hook+format win rate XX% — hoac de trong '' neu chua co du lieu"
```

### BUG-2: YesterdayStatsWidget "vs hom kia"

**Location:** `components/dashboard/yesterday-stats-widget.tsx` line 63

**Fix:** Remove misleading static text, or replace with actual delta if API supports it.

```typescript
// BEFORE
<p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">vs hom kia</p>

// AFTER — remove entirely, or:
// Only show delta if API returns comparison data
```

### BUG-3: InboxStatsWidget orphaned

**Decision:** Do NOT restore InboxStatsWidget. Its data overlaps with OrphanAlertWidget and ContentSuggestionsWidget. Remove the component file to reduce dead code.

Or keep file but leave unimported — no action needed if we don't want to delete.

## Architecture

No architectural changes. Pure bug fixes and guard clauses.

## Related Code Files

### Modify
- `components/dashboard/morning-brief-widget.tsx` — add null-string guard
- `components/dashboard/morning-brief-sections.tsx` — optional: add guard in PatternHighlightCard itself
- `components/dashboard/yesterday-stats-widget.tsx` — remove or fix "vs hom kia"
- `lib/brief/brief-prompt-builder.ts` — improve AI prompt to avoid string "null"

### Optional Delete
- `components/dashboard/inbox-stats-widget.tsx` — dead code (evaluate)

## Implementation Steps

1. Fix morning-brief-widget.tsx: add `&& content.pattern_highlight !== "null"` guard
2. Fix PatternHighlightCard: add early return if `highlight === "null"` or `highlight.trim() === ""`
3. Update brief-prompt-builder.ts: change prompt wording for pattern_highlight
4. Remove "vs hom kia" static text from yesterday-stats-widget.tsx
5. Test morning brief with mock data that includes `"null"` string
6. Verify all widgets render correctly in new 3-col layout

## Todo List
- [ ] Fix pattern_highlight null-string guard in morning-brief-widget.tsx
- [ ] Add defensive guard in PatternHighlightCard component
- [ ] Update AI prompt in brief-prompt-builder.ts
- [ ] Fix "vs hom kia" text in yesterday-stats-widget.tsx
- [ ] Test with various AI response formats
- [ ] Verify no visual regression

## Success Criteria
- "Pattern dang thang: null" never renders on dashboard
- YesterdayStatsWidget shows clean stat cards without misleading comparison
- All widget loading states are consistent (skeleton pulse)
- No console errors from dashboard widgets

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI prompt change affects existing cached briefs | Low — old briefs still display fine; guard handles both cases | Defense-in-depth: both prompt fix AND render guard |
| Removing "vs hom kia" loses future-planned feature | Low | Can add back when comparison API exists |

## Security Considerations
No security implications.

## Next Steps
- Phase 04: Mobile responsive adjustments for new layout
