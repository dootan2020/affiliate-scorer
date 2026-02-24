# Progress Tracking

## Project Info
- **Project Size:** Medium
- **Review Level:** Standard
- **Status:** ✅ Phase 2 Complete

## Phase 2: Personal Layer

| Sub-phase | Nội dung | Status | Commit |
|-----------|---------|--------|--------|
| 2.0 | Schema migration (personalTags, affiliateLinkCreatedAt) | ✅ Done | 6d14028 |
| 2.1 | API routes: /notes, /shops, /financial, /calendar (9 routes) | ✅ Done | 6d14028 |
| 2.2 | Seed calendar events (18 events 2026) | ✅ Done | 6d14028 |
| 2.3 | Product detail — Ghi chú + Link Affiliate sections | ✅ Done | 6d14028 |
| 2.4 | Shop pages (/shops, /shops/[id]) + edit form + create modal | ✅ Done | 6d14028 |
| 2.5 | Insights redesign (5 tabs: overview, financial, calendar, feedback, learning) | ✅ Done | 6d14028 |
| 2.6 | Dashboard widget "Sắp tới" (upcoming events) | ✅ Done | 6d14028 |
| 2.7 | Build verification | ✅ Pass | 6d14028 |

## Deliverables Summary

**Schema:** +2 fields (personalTags, affiliateLinkCreatedAt) on Product model

**API Routes (9 new):**
- `POST/PATCH /api/products/[id]/notes` — personal notes, rating, tags, affiliate link
- `GET/POST /api/shops` + `GET/PATCH/DELETE /api/shops/[id]`
- `GET/POST /api/financial` + `PATCH/DELETE /api/financial/[id]` + `GET /api/financial/summary`
- `GET/POST /api/calendar` + `PATCH/DELETE /api/calendar/[id]` + `GET /api/calendar/upcoming`

**UI Components (11 new):**
- `personal-notes-section.tsx`, `affiliate-link-section.tsx`
- `insights-tabs.tsx`, `insights-page-client.tsx`, `overview-tab.tsx`
- `financial-tab.tsx`, `financial-transaction-form.tsx`, `financial-records-table.tsx`
- `calendar-tab.tsx`, `calendar-event-form.tsx`, `calendar-events-list.tsx`
- `upcoming-events-widget.tsx`

**Pages (4 new):**
- `/shops` — shop list with product count
- `/shops/[id]` — shop detail with ratings, edit form
- `shop-edit-form.tsx`, `shop-create-modal.tsx`

**Seed:** 18 calendar events for 2026-2027 (mega sales, seasonal)

## Last Updated: 2026-02-24T19:30:00
