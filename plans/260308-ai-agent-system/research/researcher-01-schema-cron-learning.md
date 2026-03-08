# Research Report: Database Schema, Cron Jobs & Learning Engine
**Date:** 2026-03-08 | **Project:** AI Agent System Implementation
**Researcher:** Technical Analysis

---

## 1. DATABASE SCHEMA — CURRENT STATE & REQUIRED CHANGES

### ContentAsset Model (Current)
**Location:** Prisma schema lines 583–660

**Existing fields relevant to agent system:**
- `hookType` (String?) — already exists ✅
- `format` (String?) — already exists ✅
- `angle` (String?) — already exists ✅
- `status` (String) — "draft" | "produced" | "rendered" | "published" | "logged" | "archived" | "failed"
- `publishedUrl`, `postId`, `publishedAt` — for tracking published content
- `metrics` (relation to AssetMetric) — performance data
- `channelId` (String?) — already exists ✅

**Missing fields for agent system:**
- `actualHookType` (String?) — MISSING — needed to capture what actually performed vs. planned
- `actualFormat` (String?) — MISSING — needed to track format performance variance
- `actualAngle` (String?) — MISSING — needed for content angle learning
- `postedAt` (DateTime?) — MISSING — distinct from publishedAt; needed for cron tracking
- `tiktokVideoId` (String?) — MISSING — TikTok video ID for API queries

### LearningWeightP4 Model (Current)
**Location:** Prisma schema lines 717–737

**Status:** ✅ READY FOR AGENT SYSTEM
- `channelId` field already exists (default: "" for global weights, "clxxxx" for channel-specific)
- `scope`: "hook_type" | "format" | "angle" | "category" | "price_range"
- Supports both channel-specific and global weights via single table

### UserPattern Model (Current)
**Location:** Prisma schema lines 739–755

**Status:** ⚠️ NEEDS channelId
- Missing `channelId` field — patterns should be per-channel for agent system
- Currently stores global winning/losing patterns only
- No way to track channel-specific pattern evolution

### New Models Needed

**ChannelMemory** — NOT FOUND
- Should store agent observations: what works for this channel, recent trends
- Needed for contextual decision-making per channel

**CompetitorCapture** — NOT FOUND
- Should track competitor content trends, hooks, formats
- Feed for trend analysis cron job

**TelegramChat** — NOT FOUND
- For agent → user messaging (notifications, alerts)
- Or if using web-only, not needed

---

## 2. CRON JOBS — CURRENT SETUP

### Current Schedule (vercel.json)
| Path | Schedule | Purpose |
|------|----------|---------|
| `/api/cron/retry-scoring` | Daily 0h UTC | Retry failed product scoring |
| `/api/cron/decay` | Daily 1h UTC | Apply weight decay (14-day half-life) |
| `/api/cron/weekly-learning` | Sunday 0h UTC | Learning cycle + pattern regeneration |
| `/api/cron/weekly-report` | Sunday 6h UTC | Generate weekly insights report |
| `/api/cron/morning-brief` | Daily 23h UTC (6h VN) | Auto-generate morning brief |

### Status & Implications for Agent System

**Decay Cron** (`/api/cron/decay`)
- Runs daily at 1h UTC
- Applies half-life decay to `LearningWeightP4`
- ✅ Ready: supports per-channel weights already

**Weekly Learning Cron** (`/api/cron/weekly-learning`)
- Runs Sunday 0h UTC
- Calls `runLearningCycle()` + `regeneratePatterns()`
- ⚠️ Too infrequent for agent system: agent needs nightly weight updates + trend analysis
- Suggested change: Move weight update to nightly (11h UTC / 6h VN next day)

**Morning Brief Cron** (`/api/cron/morning-brief`)
- Runs daily 23h UTC (6h VN morning)
- Generates daily brief from patterns + top products
- ✅ Ready: can feed agent context

### Missing Crons for Agent System

**Trend Analysis Cron** — NOT FOUND
- Should run nightly to detect emerging trends, hooks, formats
- Feeds agent's trend-awareness context
- Suggested schedule: 22h UTC (5h VN)

**Competitor Monitor Cron** — NOT FOUND
- Should track competitor channels for content ideas
- Suggested schedule: Every 12h

---

## 3. LEARNING ENGINE — CURRENT IMPLEMENTATION

### updateLearningWeights (`lib/learning/update-weights.ts`)
**Strategy:** Running average + log-quantity weighting

```
Weight = avgReward × log(1 + sampleCount)
```

**How it works:**
1. For each asset's metric update, extracts: `hookType`, `format`, `angle`, `category`
2. Creates/updates both channel-specific AND global `LearningWeightP4` entries
3. Recalculates: `newAvg = (oldAvg × n + reward) / (n+1)`
4. New weight = `newAvg × log(1 + newCount)`
5. Records `lastRewardAt` for decay calculation

**Status:** ✅ PRODUCTION-READY
- Supports channel-specific learning (via `channelId` parameter)
- Log-weighting prevents outlier dominance
- Dual-write (channel + global) enables both personalization + trend detection

### Pattern Detection (`lib/learning/pattern-detection.ts`)
**Strategy:** Group by (hookType, format) → detect win/loss vs. system avg

**Grouping:** `hookType::format::category` combinations
**Win threshold:** reward > 1.5× system average
**Loss threshold:** reward < 0.5× system average
**Minimum sample:** ≥2 assets in group

**Current limitations for agent:**
- Only groups by `hook_type` + `format` — no multi-dimensional patterns
- Regenerates WEEKLY only (Sunday cron)
- No real-time pattern detection for agent decision-making

### Reward Calculation (`lib/learning/reward-score.ts`)
**Formula components:**

| Signal | Weight | Formula |
|--------|--------|---------|
| Views | 1.0× | `log(1 + views)` |
| Shares | 0.5× | linear |
| Saves | 0.3× | linear |
| Likes | 0.3× | `log(1 + likes)` |
| Comments | 0.2× | linear |
| Completion Rate | 5× | linear (0-1) |
| Orders | 10× | linear (ultimate metric) |
| Commission | 2× | `log(1 + VND/1000)` |

**Status:** ✅ BUSINESS-ALIGNED
- Orders weighted 10x (profit focus)
- Engagement (shares/saves) prioritized over vanity metrics
- Log-scaling prevents outlier views from distorting weights

---

## 4. AGENT SYSTEM READINESS ASSESSMENT

### Green Flags ✅
1. **LearningWeightP4 channel support** — Already built for per-channel learning
2. **Dual-write architecture** — Updates both channel + global weights atomically
3. **Reward calculation** — Sophisticated, business-aligned formula
4. **Daily decay** — Prevents stale weights from corrupting learning
5. **Comprehensive asset tracking** — hooks, formats, angles already logged

### Red Flags ⚠️
1. **UserPattern missing channelId** — Global patterns only; agent can't learn per-channel patterns
2. **Weekly learning cycle** — Too slow; agent needs nightly updates
3. **No trend detection cron** — Agent flying blind on emerging trends
4. **Missing actual_ fields** — Can't compare planned vs. actual performance
5. **No agent memory tables** — No persistence layer for agent's observations

### Required Migrations
| Item | Impact | Priority |
|------|--------|----------|
| Add `actualHookType`, `actualFormat`, `actualAngle`, `postedAt`, `tiktokVideoId` to ContentAsset | Medium | HIGH |
| Add `channelId` to UserPattern | Medium | HIGH |
| Create `ChannelMemory` model | High | HIGH |
| Create `CompetitorCapture` model | Medium | MEDIUM |
| Add trend-analysis + competitor-monitor crons | Medium | MEDIUM |
| Move weight-update from weekly to nightly | Low | LOW |

---

## 5. SUMMARY

**Schema:** 85% ready. Need 5 fields on ContentAsset + channelId on UserPattern + 2 new models.

**Crons:** 60% ready. Have decay + learning + brief. Need trend-analysis + competitor-monitor crons. Recommend moving weight-update to nightly.

**Learning:** 90% ready. Weights and rewards are solid. Pattern detection works but needs real-time mode for agent.

---

## Unresolved Questions
1. Should agent trigger weight updates immediately post-publish, or batch nightly?
2. Which platforms to monitor for competitor capture? (TikTok only, or expand to YouTube?)
3. Should ChannelMemory include long-term strategy notes, or only recent observations?
