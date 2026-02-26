# Phase 6 — Dashboard Redesign

**Priority:** High
**Status:** ⏳ Pending
**Depends on:** Phase 3, 4
**TASKS.md ref:** Task 5

---

## Overview

Simplify dashboard: keep Morning Brief, add "Nên tạo content" (replaces Top Picks), remove outdated elements.

---

## What to KEEP

1. **Morning Brief** widget — keep, update SP links to `/inbox/[id]`
2. **Paste link nhanh** (QuickPasteWidget) — keep
3. **Inbox Pipeline** (InboxStatsWidget) — keep, update data source to ProductIdentity
4. **Sắp tới** (UpcomingEventsWidget) — keep

## What to ADD

5. **"Nên tạo content"** table/cards — NEW, replaces top products table
   - Source: `ProductIdentity` sorted by `combinedScore` DESC
   - Filter: `inboxState` NOT in ['briefed', 'published'] — chỉ SP chưa brief
   - Show: image, name, price, combinedScore, "Tạo Brief →" button
   - SAME ranking logic as Morning Brief recommendations
   - Max 10 items

## What to REMOVE

6. ~~Top products table (ProductTable with top 10 by aiScore)~~
7. ~~"AI chưa có data để học — Upload kết quả quảng cáo" banner~~
8. ~~"Upload CSV" button~~
9. ~~"Export" button~~
10. ~~Stat cards: Total Products, Scored Products, Feedback Entries, Current Accuracy~~

---

## Related Code Files

### Modify
- `app/page.tsx` — Main dashboard page (server component)
- `components/dashboard/morning-brief-widget.tsx` — Update links
- `components/dashboard/inbox-stats-widget.tsx` — Update data source

### Create
- `components/dashboard/content-suggestions-widget.tsx` — "Nên tạo content" widget

### Delete (from dashboard, may keep component files if used elsewhere)
- Remove ProductTable usage from dashboard
- Remove stat cards section
- Remove "AI chưa có data" banner
- Remove Upload/Export buttons

---

## Implementation Steps

1. [ ] Create `content-suggestions-widget.tsx`:
   - Fetch ProductIdentity where inboxState NOT in ['briefed', 'published']
   - Sort by combinedScore DESC, limit 10
   - Display as cards or compact table with image, name, score, CTA button
   - "Tạo Brief →" button links to `/production?productId=[id]`

2. [ ] Update `morning-brief-widget.tsx`:
   - Change product links from `/products/[id]` → `/inbox/[id]`
   - Ensure ranking logic matches content-suggestions-widget

3. [ ] Update `inbox-stats-widget.tsx`:
   - Query `ProductIdentity` grouped by `inboxState`
   - Show counts for each state

4. [ ] Redesign `app/page.tsx` layout:
   ```
   ┌─────────────────────────────────────────────┐
   │ Dashboard                                    │
   ├──────────────────────┬──────────────────────┤
   │ Morning Brief        │ Paste link nhanh      │
   │ (full width or 2/3)  │ (1/3 sidebar)         │
   ├──────────────────────┴──────────────────────┤
   │ Nên tạo content (combined_score ranking)     │
   │ [Product cards/rows with "Tạo Brief →"]     │
   ├──────────────────────┬──────────────────────┤
   │ Inbox Pipeline       │ Sắp tới (calendar)   │
   │ (state breakdown)    │ (upcoming events)     │
   └──────────────────────┴──────────────────────┘
   ```

5. [ ] Remove:
   - Top products table import & rendering
   - Stat cards (Total/Scored/Feedback/Accuracy)
   - "AI chưa có data" banner
   - Upload CSV / Export buttons

6. [ ] Ensure Morning Brief + "Nên tạo content" use SAME ranking API

---

## Ranking Consistency

Both Morning Brief and "Nên tạo content" must use identical logic:

```typescript
// Shared ranking query
const topProducts = await prisma.productIdentity.findMany({
  where: {
    inboxState: { notIn: ['briefed', 'published'] },
    combinedScore: { not: null },
  },
  orderBy: { combinedScore: 'desc' },
  take: 10,
  include: {
    product: {
      select: { imageUrl: true, sales7d: true, totalKOL: true }
    }
  }
});
```

Consider extracting to a shared lib function: `lib/queries/top-unbriefed-products.ts`

---

## Success Criteria

- [ ] Dashboard loads without Top Products table
- [ ] Morning Brief shows with correct links to /inbox/[id]
- [ ] "Nên tạo content" shows unbriefed products by score
- [ ] "Tạo Brief →" button works
- [ ] Inbox Pipeline shows correct state counts
- [ ] Quick paste widget works
- [ ] Upcoming events widget works
- [ ] No "Upload CSV" or "Export" buttons visible
- [ ] No "AI chưa có data" banner

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Morning Brief API uses different ranking | Extract shared query function |
| Empty state when no unbriefed products | Show "Tất cả sản phẩm đã được brief! 🎉" |
