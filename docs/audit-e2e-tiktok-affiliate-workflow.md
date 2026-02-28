# Audit: End-to-End TikTok Affiliate Workflow

**Date:** 2026-02-28
**Scope:** Full workflow from channel creation → product selection → scheduling → brief generation → tracking → insights

---

## Table of Contents

1. [Workflow Overview](#1-workflow-overview)
2. [Step-by-step Flow Audit](#2-step-by-step-flow-audit)
3. [Data Flow Gaps](#3-data-flow-gaps)
4. [UX Continuity Issues](#4-ux-continuity-issues)
5. [Recommendations](#5-recommendations)
6. [Priority Matrix](#6-priority-matrix)

---

## 1. Workflow Overview

### Intended E2E Flow

```
Channels    →    Inbox       →    Production     →    Calendar    →    Tracking    →    Insights
(setup)         (discover)       (create content)     (schedule)      (measure)       (learn)
                    │
              paste links
              enrich metadata
              AI score products
```

### Actual Flow — Gaps Identified

```
Channels ──────────────────────────────── Production ─── Calendar ─── Tracking ─── Insights
   │                                          │              │            │            │
   │  ✅ Channel data flows to briefs         │              │            │            │
   │  ❌ Inactive channels not filtered       │              │            │            │
   │  ❌ niche/contentMix not used            │              │            │            │
   │                                          │              │            │            │
   │              Inbox ─────────────────────→│              │            │            │
   │              ❌ productId param ignored   │              │            │            │
   │              ❌ no nav hints to Production│              │            │            │
   │                                          │              │            │            │
   │                                          │──── ❌ ──────│            │            │
   │                                          │  No asset    │            │            │
   │                                          │  linking     │            │            │
   │                                          │              │─── ❌ ─────│            │
   │                                          │              │  Slot status never      │
   │                                          │              │  syncs from tracking    │
   │                                          │              │            │            │
   │                                          │              │            │── ✅ ──────│
   │                                          │              │            │  Patterns  │
   │                                          │              │            │  feed back │
```

---

## 2. Step-by-step Flow Audit

### Step 1: Create Channel (`/channels`)

**Status:** ✅ Works, minor gaps

| Check | Result | Detail |
|-------|--------|--------|
| Form collects all needed data | ✅ | 11 fields: name, handle, persona, voice, colors, editing style |
| Data persists to DB | ✅ | All fields stored in TikTokChannel |
| isActive toggle on detail page | ✅ | Added in latest commit |

**Gaps:**
- `contentMix` (% breakdown entertainment/education/review/selling) — **no UI to set it**
- `postingSchedule` (daily posting times) — **no UI to set it**
- Both are JSON fields in DB, stored as `null` forever

---

### Step 2: Discover Products (`/inbox`)

**Status:** ✅ Works well

| Check | Result | Detail |
|-------|--------|--------|
| Paste links → create ProductIdentity | ✅ | PasteLinkBox sends to `/api/inbox/paste` |
| State tabs show pipeline | ✅ | Mới → Đã bổ sung → Đã chấm → Đã brief → Đã xuất bản |
| Quick enrich modal | ✅ | Fill title/price/category → state: "enriched" |
| AI scoring | ✅ | combinedScore calculated, state: "scored" |
| "Tạo Brief AI" button on detail | ✅ | Links to `/production?productId={id}` |

**Gap:** After clicking "Tạo Brief AI", the `productId` query param is **NOT consumed** by Production page. Product is not pre-selected.

---

### Step 3: Create Briefs (`/production` → "Tạo mới" tab)

**Status:** ⚠️ Works but disconnections exist

| Check | Result | Detail |
|-------|--------|--------|
| ProductSelector loads scored products | ✅ | Fetches state=scored/briefed/published, sorted by score |
| Channel selector available | ✅ | Dropdown loads from `/api/channels` |
| Content options (type, format, duration) | ✅ | All optional, AI chooses defaults |
| Brief generation (batch) | ✅ | POST `/api/briefs/batch`, creates 3 assets per product |
| Channel persona/voice used in AI prompt | ✅ | personaName, personaDesc, voiceStyle, targetAudience, editingStyle |
| Auto-switch to "Đang sản xuất" on success | ✅ | `onBriefsCreated()` callback |

**Gaps:**

| Issue | Severity | Detail |
|-------|----------|--------|
| **Inactive channels shown in dropdown** | High | No `isActive` filter in channel fetch or batch API |
| **Channel `niche` not in AI prompt** | Medium | Stored but never sent to `generateBrief()` |
| **Channel `contentMix` ignored** | Medium | If user set 80% entertainment, briefs still generate any type |
| **`productId` query param not handled** | High | User clicks "Tạo Brief AI" from inbox, arrives at production with no pre-selection |
| **ProductSelector empty state has no link** | Medium | Says "Vào Inbox" but no clickable link |

---

### Step 4: Schedule Content (`/production` → "Lịch đăng" tab)

**Status:** ❌ Critical disconnections

| Check | Result | Detail |
|-------|--------|--------|
| Create calendar slots | ✅ | Channel + date + time + content type |
| Link slot to product | ✅ | Optional `productIdentityId` |
| Link slot to specific asset | ❌ | `contentAssetId` field **exists in schema but never used** |
| Slot status updates from asset | ❌ | Slot stays "planned" forever regardless of asset state |

**Root cause:** Schema has `contentAssetId` on `ContentSlot` (line 902), but:
- POST `/api/calendar/slots` schema **doesn't accept it**
- UI has no asset selector in slot form
- No cascade logic when asset status changes

**Impact:** Calendar is disconnected from actual production. Slot shows "⏳ planned" even when the video is already published.

---

### Step 5: Track Results (`/production` → "Kết quả" tab)

**Status:** ✅ Works, but isolated from calendar

| Check | Result | Detail |
|-------|--------|--------|
| Manual entry form | ✅ | Select asset, enter views/likes/orders/revenue |
| CSV import from TikTok Studio | ✅ | Auto-match by asset code |
| Auto-detect winner | ✅ | views ≥ 500 AND (orders ≥ 3 OR engagement ≥ 1.5%) |
| Asset status → "published" on track | ✅ | `/api/tracking` line 135 updates asset |
| Summary stats (total videos, winners, views, revenue) | ✅ | Calculated from entries |

**Gaps:**

| Issue | Severity | Detail |
|-------|----------|--------|
| **Tracking doesn't update slot status** | High | Asset becomes "published" but slot stays "planned" |
| **No reverse nav: tracking → calendar slot** | Medium | Can't see which slot a winning video was scheduled for |
| **CSV import fallback is risky** | Low | Falls back to "first untracked asset" if code doesn't match |

---

### Step 6: Learn & Improve (`/insights`)

**Status:** ✅ Well-connected

| Check | Result | Detail |
|-------|--------|--------|
| Dashboard morning brief | ✅ | Aggregates top products, financial, goals, account stats |
| Winning patterns widget | ✅ | Pulls from `/api/tracking/patterns` — format stats, top products |
| Feedback tab | ✅ | Historical results table with ROAS, success flag |
| Learning tab | ✅ | Accuracy trend, detected patterns, weight changes |
| Playbook tab | ✅ | Accumulated winning/losing patterns from UserPattern table |
| Pattern → next production loop | ✅ | Patterns visible, weights inform next scoring cycle |

**Minor gaps:**
- Dashboard doesn't show per-channel performance breakdown
- No "recommended next action" based on patterns

---

## 3. Data Flow Gaps

### Gap A: Channel → Brief (Partial)

```
FLOWS:     personaName, personaDesc, voiceStyle, targetAudience, editingStyle
MISSING:   niche, contentMix, postingSchedule
NOT FILTERED: isActive (inactive channels can generate briefs)
```

### Gap B: Inbox → Production (Broken Link)

```
Inbox detail sends:     /production?productId={id}
Production receives:    IGNORES the query param
Result: User must manually find & select the product
```

### Gap C: Calendar ↔ Asset (Disconnected)

```
Schema has:    ContentSlot.contentAssetId (String?)
API accepts:   NOT in createSlotSchema
UI shows:      Product selector only, no asset selector
Sync:          NONE — slot status never updates from asset status
```

**Status enum mismatch:**
| Slot Status | Asset Status | Mapping |
|-------------|-------------|---------|
| planned | draft | ✅ Matches conceptually |
| briefed | — | ❌ No equivalent asset status |
| produced | produced | ✅ Matches |
| published | published | ✅ Matches |
| skipped | archived | ⚠️ Loose match |
| — | rendered | ❌ No equivalent slot status |
| — | logged | ❌ No equivalent slot status |

### Gap D: Tracking → Calendar (No Sync)

```
POST /api/tracking:
  ✅ Updates ContentAsset.status = "published"
  ❌ Does NOT find/update linked ContentSlot
  ❌ Does NOT propagate isWinner to slot
```

### Gap E: Orphaned Pages

| Page | Status | Notes |
|------|--------|-------|
| `/products` | Orphaned | Legacy M1 page, no nav link |
| `/shops` | Orphaned | Legacy M2 page, no nav link |
| `/upload` | Orphaned | Replaced by `/sync` |

---

## 4. UX Continuity Issues

### Issue 1: No Step Indicators in Production

Production has 5 tabs but no indication of the recommended workflow order. New users don't know to start at "Tạo mới", then check "Đang sản xuất", etc.

**Current:** Flat pill nav with labels only
**Expected:** Step numbers or workflow progress indicator

### Issue 2: No Cross-page Navigation Hints

| From | To | Current | Expected |
|------|----|---------|----------|
| Inbox detail | Production | "Tạo Brief AI" button ✅ | Pre-select product ❌ |
| Production empty | Inbox | Text "Vào Inbox" only | Clickable link + guidance |
| Production "Đang sản xuất" | Log/Tracking | None | "Đăng video xong? Nhập kết quả" hint |
| Calendar slot | Asset detail | None | Link to associated brief/asset |
| Tracking winner | Next production | None | "Tạo thêm video tương tự?" CTA |

### Issue 3: Calendar Feels Disconnected

Calendar tab exists inside Production but operates independently:
- Creates slots but can't link to actual video assets
- Shows status icons but they never update
- No way to see "which brief's video is scheduled for this slot?"

### Issue 4: Feedback Loop Not Visible

Insights/Playbook teaches patterns, but those patterns don't surface in Production:
- When generating briefs, AI should reference winning patterns from Playbook
- No "Your best format is Before/After (85% win rate)" hint in create tab
- No "Avoid Tutorial format (12% win rate)" warning

---

## 5. Recommendations

### 🔴 Must Fix (Workflow Broken)

| # | Issue | Fix | Files |
|---|-------|-----|-------|
| R1 | **Inactive channels in brief dropdown** | Filter `isActive: true` in channel fetch + batch API validation | `production-create-tab.tsx`, `app/api/briefs/batch/route.ts` |
| R2 | **`productId` param ignored** | Add `useSearchParams()` in ProductionPageClient, pass to ProductSelector as `initialSelected` | `production-page-client.tsx`, `product-selector.tsx` |
| R3 | **Calendar slot ↔ asset disconnected** | Add `contentAssetId` to slot create schema + asset selector in CalendarTab form | `app/api/calendar/slots/route.ts`, `calendar-tab.tsx` |

### 🟡 Should Fix (UX Friction)

| # | Issue | Fix | Files |
|---|-------|-----|-------|
| R4 | **Slot status never syncs** | After asset PATCH, find linked slots and update status. After tracking POST, update slot to "published" | `app/api/assets/[id]/route.ts`, `app/api/tracking/route.ts` |
| R5 | **ProductSelector empty state: no link** | Change text to `<Link href="/inbox">` with CTA button | `product-selector.tsx` |
| R6 | **No channel niche in AI prompt** | Add `niche` to `ChannelContext` and include in prompt | `app/api/briefs/batch/route.ts`, `lib/content/generate-brief.ts` |
| R7 | **contentMix/postingSchedule have no UI** | Add visual editors in channel form (pie chart for mix, weekly grid for schedule) | `channel-form.tsx` |
| R8 | **No workflow step indicators** | Add step numbers or breadcrumb to Production tabs | `production-page-client.tsx` |

### 🟢 Nice to Have (Polish)

| # | Issue | Fix |
|---|-------|-----|
| R9 | Surface winning patterns in Create tab | Show "Your best format: X" hint above content options |
| R10 | Add per-channel performance to dashboard | Channel breakdown widget with views/orders per channel |
| R11 | Remove orphaned pages | Delete `/products`, `/shops`, `/upload` routes and components |
| R12 | Add "Tạo thêm video tương tự" CTA | On tracking winner row, link back to production with same product pre-selected |
| R13 | Persist ProductSelector selections | Use localStorage to survive page refreshes |

---

## 6. Priority Matrix

### Critical Path (blocks daily workflow)

```
R1  Filter inactive channels          [1h]   ← Prevents wrong channel assignment
R2  Handle productId query param      [1h]   ← Fixes inbox→production navigation
R3  Connect calendar slots to assets  [3h]   ← Makes calendar functional
R4  Sync slot status from assets      [2h]   ← Makes calendar accurate
```

### High Value (improves daily UX)

```
R5  ProductSelector empty state link  [15m]  ← Quick win
R6  Add niche to AI prompt            [30m]  ← Better brief quality
R8  Production step indicators        [1h]   ← Onboarding clarity
```

### Backlog

```
R7  contentMix/postingSchedule UI     [4h]
R9  Winning patterns in Create tab    [3h]
R10 Per-channel dashboard widget      [4h]
R11 Remove orphaned pages             [30m]
R12 "Tạo thêm tương tự" CTA          [1h]
R13 Persist selections in localStorage[30m]
```

---

## Unresolved Questions

1. **Calendar slot ↔ asset relationship** — Should it be 1:1 (one slot = one video) or 1:N (one slot = multiple video options to choose from)?
2. **Status mapping** — Should we unify slot/asset statuses or maintain a mapping layer?
3. **Content mix enforcement** — Should contentMix be a hard constraint (reject briefs that violate mix) or a soft hint in the AI prompt?
4. **Orphaned pages** — Are `/products` and `/shops` still used by any external links or bookmarks?
