# Review: /production & /channels — Issues & Upgrade Proposals

**Date:** 2026-02-28
**Scope:** Workflow testing, bug identification, UX/DX assessment, upgrade recommendations

---

## Table of Contents

1. [/production — Current Issues](#1-production--current-issues)
2. [/production — Upgrade Proposals](#2-production--upgrade-proposals)
3. [/channels — Current Issues](#3-channels--current-issues)
4. [/channels — Upgrade Proposals](#4-channels--upgrade-proposals)
5. [Cross-page Issues](#5-cross-page-issues)
6. [Priority Matrix](#6-priority-matrix)

---

## 1. /production — Current Issues

### 1.1 Critical

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| P1 | **Silent error handling** — Most catch blocks swallow errors (`catch(() => {})`) with no toast/feedback | `product-selector.tsx`, `calendar-tab.tsx`, `tracking-tab.tsx` | User thinks action succeeded when it failed |
| P2 | **Brief regeneration orphans assets** — Old brief marked "replaced" but its assets stay in ProductionBatch. Export may include stale assets | `production-in-progress-tab.tsx`, API `/briefs/[id]/regenerate` | Export packs contain wrong/outdated scripts |
| P3 | **No error boundary** — Single component crash (e.g. bad data in AssetCard) kills entire Production page | `production-page-client.tsx` | Blank page on any render error |

### 1.2 High

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| P4 | **Calendar slot status never auto-syncs** — Slot stays "planned" even after linked video published | `calendar-tab.tsx`, no sync logic exists | Calendar shows wrong status permanently |
| P5 | **Asset status update fails silently** — Optimistic UI update with no error toast if PATCH fails | `asset-card-with-status.tsx` | User sees "published" status, actual DB still "draft" |
| P6 | **No video status transition validation** — Can jump draft → published directly, skipping produced/rendered | `video-status-radio.tsx`, `PATCH /api/assets/[id]` | Workflow integrity broken, metrics unreliable |
| P7 | **Calendar timezone issues** — `scheduledDate` stored as Date, may shift across timezones (UTC+7 → UTC) | `calendar-tab.tsx`, API | Slot appears on wrong day for some users |

### 1.3 Medium

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| P8 | **ProductSelector loads all products at once** (limit=50, no pagination/virtualization) | `product-selector.tsx` | Slow load with 500+ products |
| P9 | **No undo for brief regeneration** — One-way replace, can't restore original brief | `production-in-progress-tab.tsx` | Accidental regenerate = lost content |
| P10 | **Progress indicator misleading** — Shows batch result count after completion, not real-time per-product progress | `production-create-tab.tsx:113` | User sees 0/5 then suddenly 5/5 |
| P11 | **Compliance status not enforced** — "Blocked" badge shown but asset can still be exported/published | `asset-card-with-status.tsx`, export API | Non-compliant content reaches production |
| P12 | **Calendar slot deletion uses `confirm()`** — Native browser dialog, no soft delete, no undo | `calendar-tab.tsx` | Accidental delete unrecoverable |
| P13 | **No caching between calendar week navigations** — Each prev/next re-fetches entire week | `calendar-tab.tsx` | Slow navigation, redundant API calls |
| P14 | **Tracking CSV import has no match validation** — Asset code mismatch creates orphaned entries | `tracking-tab.tsx` | Disconnected tracking data |

### 1.4 Low

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| P15 | **Product gallery: no file size/type validation in UI** | `product-gallery.tsx` | Large files uploaded, only fails on backend |
| P16 | **429 rate limit on regenerate** not clearly communicated to user | `production-in-progress-tab.tsx` | Confusing error message |
| P17 | **Batch export buttons only appear in Create tab** — Not accessible from In Progress tab's batch context | `production-create-tab.tsx` only | Must remember batchId or re-generate |

---

## 2. /production — Upgrade Proposals

### 2.1 Quick Wins (1-2h each)

| # | Proposal | Effort | Impact |
|---|----------|--------|--------|
| U1 | **Add toast notifications** — Replace silent catches with `sonner` toasts for success/error feedback | 1h | High — UX trust |
| U2 | **Add Error Boundary** — Wrap `ProductionPageClient` and each tab with error boundaries | 30m | High — prevents blank page |
| U3 | **Real-time progress** — Change batch generation to report progress per-product (stream or polling) | 1h | Medium — UX clarity |
| U4 | **Enforce status transitions** — Backend PATCH validates allowed transitions (draft→produced→rendered→published→archived) | 1h | Medium — data integrity |
| U5 | **Confirmation dialog for regenerate** — Custom modal instead of immediate action, show "this replaces current brief" warning | 30m | Medium — prevent accidents |

### 2.2 Medium Effort (2-4h each)

| # | Proposal | Effort | Impact |
|---|----------|--------|--------|
| U6 | **Calendar ↔ Asset status sync** — When asset status changes to "published", auto-update linked ContentSlot | 2h | High — calendar accuracy |
| U7 | **Batch export from In Progress tab** — Add export buttons to BriefPreviewCard or batch group header | 2h | High — workflow continuity |
| U8 | **Virtual scroll for ProductSelector** — Replace flat list with react-window or intersection observer | 2h | Medium — performance |
| U9 | **Soft delete + undo for calendar slots** — Replace `confirm()` with custom modal, add 10s undo toast | 2h | Medium — safety |
| U10 | **Compliance gate** — Prevent publishing/exporting assets with "blocked" compliance status | 2h | High — content quality |

### 2.3 Larger Features (4h+)

| # | Proposal | Effort | Impact |
|---|----------|--------|--------|
| U11 | **Batch overview dashboard** — Summary card showing batch stats: total assets, status breakdown, export links, creation date | 4h | High — production visibility |
| U12 | **Drag-and-drop calendar** — Drag assets from "In Progress" into calendar slots | 6h | High — workflow speed |
| U13 | **Brief version history** — Keep old briefs accessible (read-only) after regeneration | 4h | Medium — content safety |
| U14 | **Auto-match tracking imports** — Fuzzy match CSV rows to assets by title/date when code doesn't match | 4h | Medium — data completeness |
| U15 | **SWR/React Query for data fetching** — Replace manual fetch+state with cached, revalidating queries | 6h | Medium — performance + DX |

---

## 3. /channels — Current Issues

### 3.1 High

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| C1 | **No `isActive` toggle in UI** — DB field exists but user can't activate/deactivate channel from form or detail page | `channel-form.tsx`, `channel-detail-client.tsx` | Must delete & recreate to "pause" channel |
| C2 | **No pagination** — `findMany()` loads all channels without limit | `api/channels/route.ts` | Performance issue with many channels (unlikely but possible) |
| C3 | **Delete is hard delete** — No soft delete, no confirmation beyond native `confirm()`, no undo | `channel-detail-client.tsx` | Permanent data loss, orphaned ContentSlots/Assets |

### 3.2 Medium

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| C4 | **contentMix and postingSchedule have no UI** — DB fields exist, stored as JSON, but no form inputs | `channel-form.tsx` | Key strategy data only settable via DB/API |
| C5 | **Form doesn't clear on re-edit** — If user navigates away and back to edit same channel, form shows stale data until re-mount | `channel-form.tsx` | Stale form state edge case |
| C6 | **No channel usage stats** — Can't see how many briefs/assets/slots reference a channel | `channel-detail-client.tsx` | No visibility into channel activity |
| C7 | **Race condition on list refresh** — `onSaved()` calls `fetchChannels()` immediately; if API is slow, user sees stale list | `channel-list-client.tsx` | Brief stale UI after create |

### 3.3 Low

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| C8 | **Color picker is raw `<input type="color">`** — Not styled, looks out of place on some browsers | `channel-form.tsx` | Minor UI inconsistency |
| C9 | **No avatar upload** — Uses first letter of name as avatar; no image upload option | `channel-list-client.tsx`, `channel-detail-client.tsx` | Limited personalization |
| C10 | **voiceStyle/editingStyle enums not enforced client-side** — Select dropdown prevents invalid values but TypeScript type is `string` | `channel-form.tsx` | Low risk, type safety gap |

---

## 4. /channels — Upgrade Proposals

### 4.1 Quick Wins (1-2h each)

| # | Proposal | Effort | Impact |
|---|----------|--------|--------|
| CU1 | **Add isActive toggle** — Switch/toggle on detail page header + include in edit form | 1h | High — essential channel management |
| CU2 | **Soft delete with cascade check** — Before deleting, warn if channel has slots/assets. Use soft delete (isActive=false) or hard delete with confirmation | 1h | High — data safety |
| CU3 | **Channel usage stats card** — On detail page, show counts: briefs, assets, calendar slots linked to this channel | 1h | Medium — visibility |

### 4.2 Medium Effort (2-4h each)

| # | Proposal | Effort | Impact |
|---|----------|--------|--------|
| CU4 | **Content Mix editor** — Visual pie chart / slider UI for setting % breakdown (entertainment/education/review/selling) | 3h | High — content strategy |
| CU5 | **Posting Schedule editor** — Weekly grid showing time slots per day (Mon-Sun), add/remove times | 3h | High — scheduling strategy |
| CU6 | **Channel analytics preview** — Show recent asset performance metrics grouped by channel | 4h | Medium — insights |

### 4.3 Larger Features (4h+)

| # | Proposal | Effort | Impact |
|---|----------|--------|--------|
| CU7 | **Multi-channel brief generation** — Select channel in production → auto-apply persona/voice to all briefs | 4h | High — workflow speed |
| CU8 | **Channel templates** — Pre-built channel configs (beauty, tech, food) for quick setup | 3h | Medium — onboarding |
| CU9 | **Channel comparison view** — Side-by-side performance metrics across channels | 6h | Medium — strategy |

---

## 5. Cross-page Issues

| # | Issue | Pages | Impact |
|---|-------|-------|--------|
| X1 | **Channel selection in Create tab fetches channels silently** — If `/api/channels` fails, dropdown is empty with no explanation | Production + Channels | Confusing empty dropdown |
| X2 | **No link from channel detail → production briefs** — Can't see which briefs/assets belong to a channel | Both | Navigation gap |
| X3 | **Inactive channels still appear in Production's channel selector** — No filter for `isActive` | Production `production-create-tab.tsx:81-84` | Can assign brief to paused channel |
| X4 | **No shared data caching** — Channel list fetched separately in Channels page and Production tab | Both | Redundant API calls |
| X5 | **Inconsistent loading states** — Channels page uses spinner icon, Production tabs use various patterns (some have none) | Both | UX inconsistency |

---

## 6. Priority Matrix

### Must Fix (before next deploy)

| ID | Description |
|----|------------|
| P1 | Add toast notifications for all error/success states |
| P3 | Add error boundaries to prevent blank pages |
| P5 | Show error toast when asset status update fails |
| C1 | Add isActive toggle for channels |

### Should Fix (next sprint)

| ID | Description |
|----|------------|
| P2 | Handle orphaned assets on brief regeneration |
| P4 | Auto-sync calendar slot status with asset status |
| P6 | Enforce video status transition rules |
| P10 | Real-time generation progress feedback |
| C3 | Soft delete with cascade warning for channels |
| X3 | Filter inactive channels from production selector |

### Nice to Have (backlog)

| ID | Description |
|----|------------|
| U8 | Virtual scroll for product selector |
| U11 | Batch overview dashboard |
| U12 | Drag-and-drop calendar |
| CU4 | Content mix visual editor |
| CU5 | Posting schedule weekly grid |
| U15 | SWR/React Query migration |

---

## Unresolved Questions

1. **Calendar timezone strategy** — Should we store dates as ISO strings (YYYY-MM-DD) instead of Date objects to avoid UTC conversion?
2. **Brief versioning scope** — Should we keep full version history or just the previous version?
3. **Compliance enforcement level** — Hard block (prevent export) or soft block (warning + require override)?
