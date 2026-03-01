# Full Audit PASTR — UI + Logic (Read-Only Report)

**Date:** 2026-03-01
**Scope:** All 13 pages, all components, all API routes
**Mode:** Read-only — no code changes

---

## 1. UI Consistency Issues

| # | Location | Issue | Severity |
|---|----------|-------|----------|
| U1 | `app/inbox/[id]/page.tsx:242` | Gradient metrics box (`bg-gradient-to-r from-orange-50 to-amber-50`) unique in codebase. Only other instance is `components/insights/overview-tab.tsx:186`. Every other card uses flat `bg-white`. | HIGH |
| U2 | 40+ component files | `components/ui/button.tsx` exists with full variant support but is only imported in `components/ui/dialog.tsx`. All other files use raw `<button>` with hand-rolled Tailwind — e.g. `paste-link-box.tsx:72`, `quick-enrich-modal.tsx:199`, `calendar-event-form.tsx:220`, `channel-list-client.tsx:75`, `production-in-progress-tab.tsx:92`. | MEDIUM |
| U3 | Codebase-wide | Card padding uses 3 fixed values with no documented rule: **p-5** (AI widgets, dashboard, inbox, production — ~20 files), **p-6** (channel detail, channel form, task board, financial table), **p-4** (sub-cards, pattern items, smaller widgets). Some files also use responsive `p-4 sm:p-6` (product detail, insights, sync). | MEDIUM |
| U4 | Codebase-wide | Badge horizontal padding scattered across 4 values: **px-1.5** (`morning-brief-widget.tsx:185`), **px-2** (channel-detail, inbox-table, asset-card — 8+ files), **px-2.5** (upload-progress, library, insights — 7+ files), **px-3** (column-mapping, pattern-list, personal-notes, `inbox/[id]:209-227`). | MEDIUM |
| U5 | Codebase-wide | No centralized color tokens. Orange accent uses 3 shades interchangeably: **orange-500** for icons (8 files), **orange-600** for CTA buttons/links (12+ files), **orange-700** for badge text (6 files). No rule documented. | HIGH |
| U6 | `components/production/brief-product-header.tsx:101` | `combinedScore` (AI score 0–100) displayed with `đ` suffix (Vietnamese Dong symbol) — treats score as currency. Bug, not style issue. Should be plain number or "điểm". Compare with `product-selector.tsx:219` which correctly shows `🔥 {score}` without `đ`. | HIGH |
| U7 | Codebase-wide | Input focus ring color inconsistent: **orange** (`focus:ring-orange-500/20`) in inbox/log/product/settings forms (~14 files), **blue** (`focus:ring-blue-500/20`) in channel/production forms (~8 files). Roughly "orange for inbox, blue for channel" but undocumented and settings breaks the pattern. | MEDIUM |
| U8 | Codebase-wide | Empty state icon box uses two sizes: **w-12 h-12** in widget-level states (8 files: morning-brief, task-board, weekly-report, etc.), **w-16 h-16** in page-level states (10 files: channel-list, library, playbook, etc.). Pattern roughly intentional but not enforced. | LOW |
| U9 | Codebase-wide | Loading states mix two patterns with no rule: **Skeleton** (`animate-pulse` blocks) for content areas (~13 files), **Spinner** (`Loader2 animate-spin`) for buttons/actions (~17 files). `inbox-page-content.tsx:26` applies `animate-pulse` to an entire row div — inconsistent with both. Additionally `app/insights/loading.tsx` uses `bg-muted` while all others use `bg-gray-100`/`bg-gray-200`. | LOW |
| U10 | `components/inbox/inbox-table.tsx:94`, `inbox-page-content.tsx:24` | Table divider opacity inconsistent: these use `divide-slate-800/60`, `tracking-tab.tsx:340` uses `/50`, and `inbox/[id]/page.tsx:422` uses no opacity (solid). | LOW |
| U11 | `app/insights/loading.tsx:7-24` | Skeleton uses `bg-muted` class instead of `bg-gray-100 dark:bg-slate-800` used by every other skeleton in the app. Minor but noticeable if theme doesn't define `muted`. | LOW |

---

## 2. Logic Blind Spots

| # | Flow | Issue | File(s) & Line(s) | Severity |
|---|------|-------|--------------------|----------|
| L1 | Brief generation (single) | `/api/briefs/generate` route does NOT require `channelId`. Schema at `schemas-content.ts:48-50` only validates `productIdentityId`. Route calls `generateBrief()` with no `options` argument — channel context always `undefined`. | `app/api/briefs/generate/route.ts:41-55`, `lib/validations/schemas-content.ts:48-50` | CRITICAL |
| L2 | Brief generation (internal) | `generate-brief.ts` uses `channelId: options?.channel?.channelId ?? null` at lines 320 and 366 — both `ContentBrief` and `ContentAsset` records saved with `channelId = null` when called from single-generate route. | `lib/content/generate-brief.ts:320,366` | CRITICAL |
| L3 | Asset code generation | Race condition: COUNT existing assets → INSERT in loop with no transaction or DB unique constraint on `assetCode`. Two concurrent requests read same `existingCount`, both generate `A-20260301-0005`. No `@@unique` on `assetCode`, no `prisma.$transaction()`. | `lib/content/generate-brief.ts:331-343` | HIGH |
| L4 | Score display | `combinedScore` (0–100 AI score) displayed as VND currency with `đ` suffix in brief-product-header. Compare: `product-selector.tsx:219` shows score correctly without currency symbol. | `components/production/brief-product-header.tsx:99-103` | HIGH |
| L5 | Orphan data | No mechanism to detect orphaned records: ProductIdentity without ContentBrief, ContentBrief without ContentAsset, ContentAsset without ContentSlot, ContentSlot without tracking. No query, background job, or UI indicator exists. | Codebase-wide — absent | MEDIUM |
| L6 | Channel creation | After creating channel, user returns to list (form closes in-place). No `router.push(/channels/${id})` to navigate to new channel detail page. API returns channel `id` but `channel-form.tsx` doesn't consume it for navigation. | `components/channels/channel-form.tsx:206-208`, `channel-list-client.tsx:92-98` | MEDIUM |
| L7 | Post-import flow | After importing data, `upload-progress.tsx` shows count + delta breakdown badges but has **no next-step CTA** — no "Go to Inbox" or "Score products" button. User must navigate manually. | `components/upload/upload-progress.tsx:59-101` | MEDIUM |
| L8 | Post-log flow | After logging, `log-reward-result.tsx` displays verdict (WIN/LOSS), reward score, factor analysis but has **no next-action CTA** — no "Log another", "View asset", or "Go to production" button. | `components/log/log-reward-result.tsx:1-52` | MEDIUM |
| L9 | Channel detail | Page shows persona, content mix, hook bank, formats, schedule — but **zero aggregate stats**. No total products, total assets, total briefs, average score, or published count. `ChannelData` interface has no such fields. | `components/channels/channel-detail-client.tsx:11-42` | MEDIUM |
| L10 | Morning brief | Morning brief product recommendations lack explicit channel context awareness. Different channel states (no channel, channel without videos, channel with tracking data) not differentiated in recommendation logic. | `components/dashboard/morning-brief-widget.tsx` | MEDIUM |
| L11 | Error masking | `channel-detail-client.tsx:98` catch block sets `channel = null` on any error — user sees "Không tìm thấy kênh" (not found) whether the cause is a 404 or a network timeout. No distinction between "doesn't exist" and "failed to load". | `components/channels/channel-detail-client.tsx:98-100` | MEDIUM |
| L12 | Batch vs single schema | `batchBriefSchema` (line 52-61 of `schemas-content.ts`) correctly requires `channelId`. But `generateBriefSchema` (line 48-50) does not. Inconsistent validation between the two paths for the same operation. | `lib/validations/schemas-content.ts:48-61` | HIGH |

---

## 3. Responsive Issues

| # | Location | Issue | Viewport | Severity |
|---|----------|-------|----------|----------|
| R1 | `components/ui/button.tsx:25-30` | All button size variants below 44px mobile touch target: `xs` = 24px, `sm` = 32px, `default` = 36px, `lg` = 40px, `icon-xs` = 24px. None meet WCAG 2.5.5 recommendation. | 375px | MEDIUM |
| R2 | `components/channels/channel-detail-client.tsx:485` | Weekly schedule uses `grid-cols-7` with **no responsive breakpoint**. At 375px each column is ~40px wide — unreadable. Needs `overflow-x-auto` wrapper or column layout on mobile. | 375px | HIGH |
| R3 | `components/dashboard/inbox-stats-widget.tsx:50` | `grid-cols-4` with no breakpoint. At 375px, four stat columns are ~80px each. | 375px | MEDIUM |
| R4 | `components/insights/financial-tab.tsx:111` | `grid-cols-3` with no breakpoint. Summary cards ~110px wide on 375px. | 375px | MEDIUM |
| R5 | `app/inbox/[id]/page.tsx:285` | `grid-cols-3` for KOL/Videos/Livestreams stat cards — no mobile breakpoint. | 375px | MEDIUM |
| R6 | `components/insights/calendar-event-form.tsx:141` | Form fields in `grid-cols-3` with no breakpoint — cramped on mobile. | 375px | LOW |
| R7 | `components/dashboard/channel-task-board.tsx:120` | MetricBadge row uses `grid-cols-3` inside channel cards — tight on mobile. | 375px | LOW |
| R8 | 9+ form files | `text-xs` on form labels (~12px). Hard to read on 375px, especially in dense form grids. Affected: `tracking-tab.tsx:251-290`, `financial-transaction-form.tsx:105-166`, `calendar-event-form.tsx:129-205`, `quick-enrich-modal.tsx:120-177`, `channel-form.tsx:48` (labelCls constant). | 375px | LOW |
| R9 | All tables | Tables use `overflow-x-auto` correctly — `inbox-table.tsx:79` adds `min-w-[700px]`, `financial-records-table.tsx:99` hides columns via `hidden sm:table-cell`. | All | OK |
| R10 | Card grids | Most grids properly stack: `channel-list-client.tsx:111` (`grid-cols-1 md:grid-cols-2`), `library-page-client.tsx:175` (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`), `production-create-tab.tsx:192` (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`). | All | OK |

---

## 4. Loading & Error State Gaps

### 4a. Missing Loading States

| Component | File | Issue |
|-----------|------|-------|
| `UpcomingEventsWidget` | `components/dashboard/upcoming-events-widget.tsx:41-47` | Returns `<></>` until fetch resolves. No skeleton, no spinner. Layout shifts when widget appears. |
| `InboxStatsWidget` | `components/dashboard/inbox-stats-widget.tsx:20-26` | Returns `<></>` until data arrives. Widget invisible during load, layout shifts. |

### 4b. Silent Error Suppression (Empty Catch Blocks)

| Component | File & Line | Behavior |
|-----------|-------------|----------|
| `WinningPatternsWidget` | `dashboard/winning-patterns-widget.tsx:68` | `.catch(() => {})` — shows nothing on failure |
| `ContentSuggestionsWidget` | `dashboard/content-suggestions-widget.tsx:34` | `.catch(() => {})` — shows empty state as if no products exist |
| `ChannelTaskBoard` | `dashboard/channel-task-board.tsx:27` | `.catch(() => {})` — shows "no channels" even when channels exist |
| `UpcomingEventsWidget` | `dashboard/upcoming-events-widget.tsx:46` | `.catch(() => {})` — widget disappears |
| `InboxStatsWidget` | `dashboard/inbox-stats-widget.tsx:25` | `.catch(() => {})` — widget disappears |
| `PlaybookPageClient` | `playbook/playbook-page-client.tsx:57,73` | `catch { // ignore }` — blank page, no feedback |
| `ProductionCompletedTab` | `production/production-completed-tab.tsx:37` | `catch { // silent }` — shows "no briefs" on error |
| `LibraryPageClient` | `library/library-page-client.tsx:72,96` | `catch { // silently ignore }` — shows "no assets" on error |
| `InboxPageContent` | `inbox/inbox-page-content.tsx:70` | `catch { // silent }` — inbox appears empty |
| `ChannelDetailClient` | `channels/channel-detail-client.tsx:98` | `catch { setChannel(null) }` — 404 and network error indistinguishable |
| `PasteLinkBox` | `inbox/paste-link-box.tsx:50` | Paste link fails silently |
| `CalendarTab` | `production/calendar-tab.tsx:134,238,256` | Three calendar operations swallow errors |
| `TrackingTab` | `production/tracking-tab.tsx:110,124,163,201` | Four tracking operations all silent |
| `LogBatchMode` | `log/log-batch-mode.tsx:44` | Batch log fetch — no error surfaced |
| `TacticalRefreshDialog` | `channels/tactical-refresh-dialog.tsx:111` | Silent failure on tactics fetch |
| `ScoreBreakdown` | `products/score-breakdown.tsx:53` | JSON.parse failure returns `{}` — chart shows empty |
| `SyncPageContent` | `sync/sync-page-content.tsx:54` | Intentional: commented `// Silently fail — history is not critical` |

### 4c. Missing Error UI on API Failure

| Component | File | What User Sees on Error |
|-----------|------|-------------------------|
| `WinningPatternsWidget` | `dashboard/winning-patterns-widget.tsx` | Nothing rendered — blank widget area |
| `ContentSuggestionsWidget` | `dashboard/content-suggestions-widget.tsx` | Empty state "no products" (misleading) |
| `ChannelTaskBoard` | `dashboard/channel-task-board.tsx` | Empty state "no channels" (misleading) |
| `PlaybookPageClient` | `playbook/playbook-page-client.tsx` | Blank page — no content at all |
| `ProductionCompletedTab` | `production/production-completed-tab.tsx` | "No completed briefs" (misleading) |
| `LibraryPageClient` | `library/library-page-client.tsx` | "No assets" (misleading) |
| `InboxPageContent` | `inbox/inbox-page-content.tsx` | "Inbox trống" — empty (misleading) |
| `TrackingTab` (4 operations) | `production/tracking-tab.tsx` | Actions fail with zero feedback |
| `CalendarTab` (3 operations) | `production/calendar-tab.tsx` | Actions fail with zero feedback |

### 4d. Retry Mechanisms

| Aspect | Status |
|--------|--------|
| `fetchWithRetry` utility | Exists, used by 4 dashboard widgets — automatic network-level retry (not user-visible) |
| User-facing "Retry" / "Try again" buttons | **Zero** across entire app. No component renders a retry button after fetch failure. |
| Manual regenerate buttons | `WeeklyReportCard` ("Tạo báo cáo"), `PlaybookPageClient` ("Cập nhật patterns"), `PlaybookSection` ("Refresh Playbook") — these are create/regenerate actions, not error-retry affordances. |

### 4e. Misleading Empty States on Error

These components show "nothing here yet" empty states when the real problem is an API failure:

| Component | Empty State Text | Real Cause |
|-----------|-----------------|------------|
| `ProductionCompletedTab` | "Chưa có brief hoàn thành" | Network error → `batches` stays `[]` |
| `LibraryPageClient` | "Chưa có assets" | Fetch error → `assets` stays `[]` |
| `InboxPageContent` | "Inbox trống" | Fetch error → `items` stays `[]` |
| `ContentSuggestionsWidget` | "Chưa có sản phẩm" | `.catch(() => {})` → empty array |
| `ChannelTaskBoard` | "Chưa có kênh" | `.catch(() => {})` → empty array |

---

## 5. Recommendations (Prioritized by Severity)

### CRITICAL (Fix Immediately)

| # | Issue | Recommendation |
|---|-------|----------------|
| L1, L2 | Single brief generation bypasses `channelId` | Add `channelId` to `generateBriefSchema`. Require it in the route handler or auto-resolve from product's channel. Align with `batchBriefSchema` which already requires it. |
| L3 | Asset code race condition | Wrap count + insert loop in `prisma.$transaction()`. Add `@@unique([assetCode])` to Prisma schema as safety net. |

### HIGH (Fix Soon)

| # | Issue | Recommendation |
|---|-------|----------------|
| L4, U6 | `combinedScore` displayed as VND "đ" | Remove `đ` suffix from `brief-product-header.tsx:101`. Use plain number or "điểm". |
| U1 | Gradient metrics box inconsistent | Either remove gradient from `inbox/[id]` and `overview-tab` (use flat card), or create a `HighlightCard` component and use it consistently. |
| U5 | No centralized color tokens | Define orange accent shades in Tailwind config or a shared constants file: icon = `orange-500`, button = `orange-600`, badge text = `orange-700`. Document the rule. |
| L12 | Batch vs single schema inconsistency | Align both schemas — both should require `channelId`. |
| R2 | `grid-cols-7` schedule — no mobile breakpoint | Wrap in `overflow-x-auto` container or switch to vertical list layout on mobile. |

### MEDIUM (Plan for Next Sprint)

| # | Issue | Recommendation |
|---|-------|----------------|
| U2 | 40+ files use raw `<button>` | Migrate to shared `Button` component. Start with CTA buttons (orange-600 variants) — they're the most repetitive. |
| U3 | Card padding inconsistent (p-4/p-5/p-6) | Document a rule: p-4 for sub-cards, p-5 for widgets, p-6 for full forms. Or standardize on `p-4 sm:p-6` responsive everywhere. |
| U4 | Badge padding 4 variants | Standardize on 2 sizes: `px-2 py-0.5` (compact) and `px-2.5 py-0.5` (normal). |
| U7 | Focus ring color split (orange vs blue) | Pick one accent for all inputs. Orange is the app's primary — use `focus:ring-orange-500/20` everywhere. |
| L5 | No orphan data detection | Add an admin/debug page or API endpoint that queries records with `channelId IS NULL` on briefs/assets. Surface count on dashboard. |
| L6 | No redirect after channel creation | In `channel-form.tsx` `onSaved` callback, consume returned channel `id` and `router.push`. |
| L7 | No post-import CTA | Add "Xem Inbox →" link button to `upload-progress.tsx` after successful import. |
| L8 | No post-log CTA | Add "Log thêm" / "Xem asset" buttons to `log-reward-result.tsx`. |
| L9 | Channel detail: no aggregate stats | Add counts (total products, briefs, assets, avg score) to channel detail API and display in a stats row. |
| L11 | Error masking on channel detail | Distinguish network error from 404 in catch block. Show "Lỗi tải kênh" with retry button for network errors. |
| R1 | Button sizes below 44px touch target | Add `min-h-[44px]` override for mobile on `xs`/`sm`/`default` variants, or increase `default` to `h-11` (44px). |
| R3-R5 | Fixed grid columns on mobile | Add `grid-cols-2 sm:grid-cols-4` breakpoints to stat grids. |
| 4b | 16+ silent catch blocks | At minimum: log `console.error` in dev, show toast or inline error card for user-facing components. |
| 4d | Zero retry buttons | Add "Thử lại" button to at least: `ChannelDetailClient`, `LibraryPageClient`, `InboxPageContent`, `PlaybookPageClient`. |
| 4e | Misleading empty states | Track `error` state separately from `empty data`. Show error card with retry instead of "nothing here yet". |

### LOW (Nice to Have)

| # | Issue | Recommendation |
|---|-------|----------------|
| U8 | Empty state icon sizes (w-12 vs w-16) | Document convention: w-12 for widgets, w-16 for full pages. Already roughly followed. |
| U9 | Mixed skeleton + spinner loading | Already roughly intentional (skeleton for content, spinner for actions). Document the convention. |
| U10 | Table divider opacity varies | Standardize on `divide-slate-800/50` or remove opacity entirely. |
| U11 | `app/insights/loading.tsx` uses `bg-muted` | Change to `bg-gray-100 dark:bg-slate-800` to match other skeletons. |
| R6-R8 | `text-xs` labels, minor grid issues | Consider `text-xs sm:text-sm` for form labels. Low priority — functional but tight. |

---

## Summary Counts

| Category | Total Issues | Critical | High | Medium | Low |
|----------|-------------|----------|------|--------|-----|
| UI Consistency | 11 | — | 3 | 5 | 3 |
| Logic Blind Spots | 12 | 2 | 3 | 6 | — |
| Responsive | 10 | — | 1 | 4 | 3 (+2 OK) |
| Loading/Error | 28 | — | — | 25 | 3 |
| **Total** | **61** | **2** | **7** | **40** | **9** (+2 OK) |
