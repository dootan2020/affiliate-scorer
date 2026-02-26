# Phase 4 — Update Workflow References Post-Merge

**Priority:** Critical (broken references = broken UX)
**Status:** ⏳ Pending
**Depends on:** Phase 3
**TASKS.md ref:** Task 2

---

## Overview

After merging Inbox + Products into `/inbox`, ALL pages and APIs referencing the old "Inbox" or "Products" must update their logic to use `ProductIdentity` as the single source of truth.

---

## Changes by Page/Component

### 1. /production — Product Selector
**File:** `components/production/production-page-client.tsx`, `components/production/product-selector.tsx`

- "Chọn sản phẩm từ Inbox" → query `ProductIdentity` where `inboxState` in ['scored', 'briefed', 'published']
- Show: image + name + price + combinedScore
- Only products that have been scored (inboxState >= "scored")
- Link text/labels: reference "Inbox" not "Products"

### 2. /dashboard — Morning Brief Widget
**File:** `components/dashboard/morning-brief-widget.tsx`

- SP suggestions → link to `/inbox/[id]` instead of `/products/[id]`
- Data source: `ProductIdentity` sorted by `combinedScore`

### 3. /dashboard — Inbox Pipeline Widget
**File:** `components/dashboard/inbox-stats-widget.tsx`

- Count from `ProductIdentity` grouped by `inboxState`
- States: new, enriched, scored, briefed, published

### 4. /dashboard — "Nên tạo content" (replaces Top Picks)
**File:** NEW or modify existing widget

- Query `ProductIdentity` sorted by `combinedScore` DESC
- Filter: only where `inboxState` NOT in ['briefed', 'published'] (chưa brief)
- Show: image + name + score + "Tạo Brief →" button
- Must use SAME ranking logic as Morning Brief

### 5. /log — Video Link Matching
**File:** `components/log/log-page-client.tsx`, `app/api/log/match/route.ts`

- Match video link → `ContentAsset` → `ContentBrief` → `ProductIdentity`
- Display product info from ProductIdentity

### 6. Global: All inbox_items References
**Grep for:** `inbox_items`, `InboxItem`, `inboxItem`, `/api/inbox`
- Ensure all queries go through `ProductIdentity`
- `InboxItem` model may still exist for raw paste processing, but UI shows ProductIdentity

### 7. API Routes
- `/api/morning-brief` → Use ProductIdentity for recommendations
- `/api/brief/generate` → Accept ProductIdentity ID
- `/api/briefs/batch` → Already uses ProductIdentity IDs ✅
- `/api/production/create-batch` → Verify uses ProductIdentity

---

## Implementation Steps

1. [ ] Update ProductSelector to query ProductIdentity (scored+ only)
2. [ ] Update MorningBriefWidget links → `/inbox/[id]`
3. [ ] Update InboxStatsWidget → count by ProductIdentity.inboxState
4. [ ] Create/update "Nên tạo content" widget (Phase 6 detail, but data query here)
5. [ ] Update Log page matching logic
6. [ ] Grep entire codebase for `inbox_items`, `InboxItem` references → update
7. [ ] Grep for `/products/` URL references → update to `/inbox/`
8. [ ] Update Morning Brief API to use ProductIdentity data
9. [ ] Verify all API routes accept/return ProductIdentity IDs correctly

---

## Grep Targets

```bash
# Find all references to update
rg "inbox_items" --type ts
rg "InboxItem" --type ts
rg "/products/" --type tsx --type ts
rg "products/\[id\]" --type tsx --type ts
rg "inbox-page-client" --type tsx --type ts
```

---

## Success Criteria

- [ ] /production product selector shows scored+ products from ProductIdentity
- [ ] Dashboard morning brief links go to /inbox/[id]
- [ ] Dashboard pipeline counts from ProductIdentity
- [ ] /log matches videos to ProductIdentity chain
- [ ] No broken links referencing old /products/ routes
- [ ] No references to deleted inbox cards components

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Missed reference causes runtime error | Thorough grep + compile check |
| InboxItem still needed for paste processing | Keep model, just don't use in UI |
