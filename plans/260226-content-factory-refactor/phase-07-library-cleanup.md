# Phase 7 — Library Page + Dead Code Cleanup

**Priority:** High
**Status:** ⏳ Pending
**Depends on:** Phase 4
**TASKS.md ref:** Task 6

---

## Overview

Two parts:
1. Create `/library` — content assets library with filters
2. Delete dead features: Campaigns, FB/Shopee Ads parsers, budget tracker, old inbox cards, Playbook page

---

## Part 1: /library Page

### Data Source
- `ContentAsset` model — all generated content assets
- Join with `ContentBrief` → `ProductIdentity` for product info
- Join with `AssetMetric` for performance data

### Features
- **Filters:** status (draft/produced/published/archived), format (review/demo/compare/etc.), product (search by name)
- **Sort:** date created, views (from AssetMetric), reward score
- **Display:** Card grid or table view
  - Asset code, format badge, hook text preview
  - Product name + image (from ProductIdentity)
  - Status badge
  - Metrics (views, likes, shares) if published
  - Quick actions: view detail, copy script, mark status

### Related Code Files

#### Create
- `app/library/page.tsx` — Library page
- `components/library/library-page-client.tsx` — Client component
- `components/library/asset-card.tsx` — Single asset card
- `components/library/library-filters.tsx` — Filter bar
- `app/api/library/route.ts` — GET endpoint (or reuse /api/assets with filters)

---

## Part 2: Dead Code Deletion

### DELETE — Campaigns (entire feature)

**Routes:**
- `app/campaigns/page.tsx`
- `app/campaigns/[id]/page.tsx`

**Components (all of `components/campaigns/`):**
- `campaign-list-table.tsx`
- `campaign-detail-client.tsx`
- `campaign-create-modal.tsx`
- `campaign-summary-cards.tsx`
- `campaign-status-badge.tsx`
- `campaign-filters.tsx`
- `campaign-checklist.tsx`
- `campaign-content-list.tsx`
- `campaign-conclusion.tsx`
- `daily-result-form.tsx`
- `daily-results-table.tsx`
- `run-product-button.tsx`
- `goal-setting-modal.tsx`
- `campaign-import-zone.tsx` (in upload/)

**API Routes:**
- `app/api/campaigns/route.ts`
- `app/api/campaigns/[id]/route.ts`
- `app/api/campaigns/[id]/analysis/route.ts`
- `app/api/campaigns/[id]/daily-results/route.ts` (if exists)

**Lib:**
- `lib/validations/schemas-campaigns.ts`
- Campaign-related code in `lib/parsers/merge-import.ts`

### DELETE — Ad Platform Parsers
- `lib/parsers/fb-ads.ts`
- `lib/parsers/campaign-fb-ads.ts`
- `lib/parsers/campaign-tiktok-ads.ts`
- `lib/parsers/campaign-shopee-ads.ts`
- `lib/parsers/shopee-affiliate.ts`
- `lib/parsers/affiliate-shopee.ts`

### DELETE — Budget/Feedback Related
- `app/api/ai/budget/route.ts`
- `components/feedback/feedback-table.tsx`
- `components/feedback/feedback-upload.tsx`
- `components/feedback/manual-feedback-form.tsx`
- `app/feedback/page.tsx`
- `app/feedback/loading.tsx`

### DELETE — Playbook (merge into Insights)
- `app/playbook/page.tsx`
- `components/playbook/playbook-page-client.tsx`
- Move playbook content into Insights page (add as a tab or section)

### DELETE — Old Inbox Cards
- `components/inbox/inbox-page-client.tsx`
- `components/inbox/inbox-card.tsx`

### DELETE — Shops page (if not referenced in TASKS.md as kept)
- Actually: TASKS.md doesn't mention /shops. Check if referenced. Keep if used by production flow.

---

## Implementation Steps

### Part 1: Library
1. [ ] Create `/app/library/page.tsx` — server component with initial data
2. [ ] Create `components/library/library-page-client.tsx`:
   - Fetch ContentAssets with filters/sort
   - Display as card grid
   - Filter bar: status dropdown, format dropdown, product search
   - Sort toggle: date/views/reward
3. [ ] Create `components/library/asset-card.tsx`:
   - Asset code, format badge, hook text
   - Product name + thumbnail
   - Status badge (color-coded)
   - Metrics row (views/likes/shares)
   - Actions: view/copy/status change
4. [ ] Create or reuse API endpoint for filtered asset queries

### Part 2: Merge Playbook → Insights
5. [ ] Read playbook components to understand content
6. [ ] Add "Playbook" as a new tab in Insights page
7. [ ] Move playbook logic/components into insights

### Part 3: Delete Dead Code
8. [ ] Delete all campaign files listed above
9. [ ] Delete ad platform parser files
10. [ ] Delete feedback page + components
11. [ ] Delete playbook page (after merging into insights)
12. [ ] Delete old inbox cards components
13. [ ] Update `lib/parsers/parse-file.ts` to remove references to deleted parsers
14. [ ] Update `lib/parsers/detect-format.ts` to remove FB/Shopee detection
15. [ ] Run TypeScript compile to find broken imports
16. [ ] Fix all broken imports
17. [ ] Grep for any remaining references to deleted routes/components

### Part 4: DB Schema Cleanup (optional)
18. [ ] Consider: Keep Campaign model in schema for data preservation, or archive
19. [ ] Do NOT delete DB models that have existing data — mark as deprecated

---

## Success Criteria

- [ ] `/library` page loads with all ContentAssets
- [ ] Filters work (status, format, product)
- [ ] Sort works (date, views, reward)
- [ ] Playbook content accessible from Insights
- [ ] `/campaigns` route → 404 or redirect
- [ ] `/feedback` route → 404 or redirect
- [ ] `/playbook` route → redirect to /insights
- [ ] No TypeScript compile errors
- [ ] No runtime errors from broken imports
- [ ] No dead code references in nav or other pages

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Deleting code that's still referenced | Compile check + grep search |
| Losing useful campaign data | Keep DB models, just remove UI/API |
| Playbook integration breaks Insights | Test Insights page thoroughly |
