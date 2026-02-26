# Phase 3 — Merge Inbox + Products → Unified /inbox

**Priority:** Critical (core change, many downstream dependencies)
**Status:** ⏳ Pending
**Depends on:** Phase 1
**TASKS.md ref:** Task 1

---

## Overview

The current app has TWO separate views:
- `/products` — Table view with filters, pagination, detail page, product images ✅ Good UI
- `/inbox` — Cards grid view with paste links, state tabs, quick enrich ❌ Cards have broken images, detail is empty

**Decision:** Keep `/products` table UI, move it to `/inbox` route, add inbox features (paste links, state filters, quick enrich).

---

## Related Code Files

### Keep & Modify
- `app/products/page.tsx` → Move logic to `app/inbox/page.tsx`
- `app/products/[id]/page.tsx` → Move to `app/inbox/[id]/page.tsx`
- `app/products/[id]/loading.tsx` → Move to `app/inbox/[id]/loading.tsx`
- `components/products/product-table.tsx` → Keep, enhance with new columns
- `components/products/product-image.tsx` → Keep
- `components/products/score-breakdown.tsx` → Keep
- `components/products/score-button.tsx` → Keep
- All `components/products/*` → Keep, adjust imports

### Port from Old Inbox
- `components/inbox/paste-link-box.tsx` → Keep, add to new /inbox page
- `components/inbox/quick-enrich-modal.tsx` → Keep, add to new /inbox page

### Create
- `app/inbox/page.tsx` — New unified inbox page (table view + paste box + state tabs)
- `app/inbox/[id]/page.tsx` — Product detail (from old /products/[id])
- `app/products/page.tsx` — Redirect to /inbox

### Delete (after migration)
- `components/inbox/inbox-page-client.tsx` — Old cards view
- `components/inbox/inbox-card.tsx` — Old card component

---

## Implementation Steps

### Step 1: Create new /inbox route structure
1. [ ] Create `app/inbox/page.tsx` — Server component that renders unified inbox
2. [ ] Create `app/inbox/[id]/page.tsx` — Copy from products/[id] with adjustments
3. [ ] Create `app/inbox/[id]/loading.tsx` — Copy from products/[id]

### Step 2: Build unified inbox page
4. [ ] At top: `PasteLinkBox` component (from old inbox)
5. [ ] Below: State filter tabs: `Tất cả | Mới | Đã bổ sung | Đã chấm | Đã brief | Đã xuất bản`
   - Map to `inboxState`: all | new | enriched | scored | briefed | published
6. [ ] Below tabs: Enhanced product table with new columns:
   - Existing: Image, Name, Price, Commission, Sales 7d, KOL, Score
   - **NEW: Delta** column — Badge showing NEW/SURGE/COOL/STABLE/REAPPEAR
   - **NEW: Content Score** column — contentPotentialScore from ProductIdentity
7. [ ] Table data source: Query `ProductIdentity` (joined with `Product`) instead of just `Product`
   - Filter by `inboxState` when tab selected
   - Sort by `combinedScore` by default

### Step 3: Update detail page
8. [ ] In `/inbox/[id]/page.tsx`: Add "Tạo Brief" button → links to `/production?productId=[id]`
9. [ ] Keep all existing detail features (score breakdown, profit estimator, notes, etc.)
10. [ ] Integrate `QuickEnrichModal` — accessible from detail page

### Step 4: Setup redirects
11. [ ] `app/products/page.tsx` → `redirect('/inbox')` (Next.js redirect)
12. [ ] `app/products/[id]/page.tsx` → `redirect('/inbox/${id}')` if needed, or keep as alias

### Step 5: Update API
13. [ ] `/api/inbox` GET → Return ProductIdentity data with Product join (table-friendly format)
14. [ ] Ensure pagination, sorting, filtering work with ProductIdentity model
15. [ ] Keep `/api/products` endpoints working (other code may depend on them)

### Step 6: Cleanup
16. [ ] Delete `components/inbox/inbox-page-client.tsx`
17. [ ] Delete `components/inbox/inbox-card.tsx`
18. [ ] Update imports across codebase

---

## Data Query Pattern

```typescript
// New /api/inbox GET query
const identities = await prisma.productIdentity.findMany({
  where: {
    ...(inboxState !== 'all' ? { inboxState } : {}),
    ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
  },
  include: {
    product: {
      select: {
        id: true,
        aiScore: true,
        aiRank: true,
        sales7d: true,
        totalKOL: true,
        imageUrl: true,
        price: true,
        commissionRate: true,
        category: true,
      }
    },
    urls: true,
  },
  orderBy: { combinedScore: 'desc' },
  skip: (page - 1) * pageSize,
  take: pageSize,
});
```

---

## Success Criteria

- [ ] `/inbox` shows table view with all products from ProductIdentity
- [ ] Paste links box works at top of page
- [ ] State filter tabs filter correctly
- [ ] Delta and Content Score columns display
- [ ] `/inbox/[id]` shows full product detail with "Tạo Brief" button
- [ ] `/products` redirects to `/inbox`
- [ ] Quick enrich modal works
- [ ] Product images display correctly
- [ ] Pagination works

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Data mismatch between Product and ProductIdentity | Join query ensures both are available |
| Broken links from other pages | Phase 4 handles all cross-references |
| Performance with joined queries | Index on inboxState already exists |
