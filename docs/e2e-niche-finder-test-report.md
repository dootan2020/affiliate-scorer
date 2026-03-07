# E2E Test Report: Niche Intelligence Module

**Date:** 2026-03-07
**Environment:** Production (https://affiliate-scorer.vercel.app)
**Tester:** Automated (agent-browser)
**Commit:** `98a1ce3` (fix: read channel id from nested response)

---

## Test Summary

| Step | Description | Result |
|------|-------------|--------|
| 1 | Page load + questionnaire Step 1 | PASS |
| 2 | Complete 4-step questionnaire | PASS |
| 3 | AI analysis loading + results | PASS |
| 4 | Recommendation quality + data | PASS |
| 5 | Niche selection + channel redirect | PASS (after hotfix) |
| 6 | Dashboard onboarding checklist | PASS |

**Overall: 6/6 PASS**

---

## Step Details

### Step 1: Page Load — PASS
- Sidebar "Tim ngach" link navigates to `/niche-finder`
- Step 1 (Linh vuc) visible with 10 niche categories
- All labels display Vietnamese diacritics correctly
- "Quay lai" disabled, "Tiep theo" disabled until selection made

### Step 2: 4-Step Questionnaire — PASS
- **Step 1** (Linh vuc): 10 categories, toggle selection works, "Tiep theo" enables after pick
- **Step 2** (Kinh nghiem): 3 levels, default "Moi bat dau" pre-selected, immediate Next available
- **Step 3** (Muc tieu + Ngan sach): Goal + budget required, "Tiep theo" disabled until both selected
- **Step 4** (Phong cach): 4 content styles, "Phan tich ngach" button appears instead of "Tiep theo"
- Navigation: Back button works, stepper allows going back (not forward to unvisited steps)

### Step 3: AI Analysis — PASS
- Loading state: "AI dang phan tich..." with spinner icon, descriptive subtitle
- Analysis completes in ~20-25 seconds
- No timeout errors observed
- Transition from loading to results is smooth

### Step 4: Recommendation Quality — PASS
- **Test 1** (Thoi trang + beginner): 4 recommendations, scores 88/80/75/70, relevant content ideas
- **Test 2** (Suc khoe + beginner): 4 recommendations with health-related niches
- **Test 3** (Cong nghe + experienced): 3 recommendations, top score 95/100
- All cards show: score bar, competition badge, reasoning, market insight, content ideas, estimated earning
- Market insights reference actual DB data (product counts, avg scores, active channels)
- Top recommendation has orange ring highlight + trophy icon

### Step 5: Niche Selection + Channel Creation — PASS (after hotfix)

**Bug found during test:** Clicking "Chon ngach nay" redirected to `/channels/undefined`.

**Root cause:** Channel POST API returns `{ data: { id, ... } }` but client read `channel.id` from response root.

**Fix applied:** Commit `98a1ce3` — reads `channelRes.data?.id ?? channelRes.id` with null guard.

**After fix:**
- Click "Chon ngach nay" shows "Dang tao kenh..." loading state
- Redirects to `/channels/cmmg2sarl000004kzdckmg0z2` (valid ID)
- Channel page shows: correct niche label, persona auto-filled, niche = "tech", status = active

### Step 6: Dashboard Onboarding Checklist — PASS
- Checklist visible on dashboard after channel creation
- Shows 3 steps: "Ket noi API key" (done), "Dong bo san pham" (done), "Tao content brief" (pending)
- Progress bar reflects 2/3 completion
- Dismiss button ("An checklist") present
- Links navigate to correct pages (/settings, /sync, /channels/{id})

---

## Bugs Found & Fixed

| # | Severity | Issue | Status |
|---|----------|-------|--------|
| 1 | Critical | Channel redirect to `/channels/undefined` — API returns `{ data: channel }` but client reads `channel.id` from root | Fixed (98a1ce3) |

## UX Observations

**Smooth:**
- Questionnaire flow is intuitive, 4 steps feel natural
- AI analysis loading state communicates progress well
- Recommendation cards are information-rich without being overwhelming
- Onboarding checklist provides clear next actions

**Could improve (non-blocking):**
- No back-to-results navigation after visiting channel page — user must redo questionnaire
- Duplicate channel check uses client-side filter on all channels (works but not scalable)
- No confirmation dialog before channel creation
- Channel persona description is generic ("Kenh affiliate X tren TikTok")
