# AI Agent System for PASTR — Brainstorm Report

**Date:** 2026-03-08
**Purpose:** Input for /plan:hard implementation
**Scope:** 5 agents, feedback loop closure, Telegram bot, per-channel memory

---

## PART 1: CURRENT STATE ASSESSMENT (Based on Code)

### 1.1 What the Learning Engine Actually Learns

**Data source:** `AssetMetric` records (created via `/api/metrics/capture` or `/api/log/quick`)

**Scopes learned:**
| Scope | Example Keys | Stored In |
|-------|-------------|-----------|
| hook_type | "result", "price", "compare", "myth", "problem", "unbox", "trend" | LearningWeightP4 |
| format | "review_short", "demo", "compare", "unbox", "lifestyle", "greenscreen" | LearningWeightP4 |
| angle | Free-text from ContentAsset.angle | LearningWeightP4 |
| category | Product category (e.g., "My pham") | LearningWeightP4 |

**Per-channel:** YES — `LearningWeightP4.channelId` supports both global ("") and channel-specific weights. `update-weights.ts` already writes both tiers when `asset.channelId` exists.

**Weight formula:** `weight = avgReward × log(1 + sampleCount)`

**Pattern detection:** Weekly cron groups by `hook_type × format`, labels as winning (winRate ≥ 50%) or losing. Min 2 samples.

### 1.2 The Feedback Loop Gap (Critical)

```
CURRENT FLOW (BROKEN):

Brief generates → hooks[], angles[], scripts[]
                        ↓ (LOOSE LINK)
ContentAsset created → hookText, hookType, format, angle (manually copied from script)
                        ↓ (GAP: many assets missing channelId, hookType)
User publishes video → sets publishedUrl, postId
                        ↓ (GAP: no auto-extraction of what was actually used)
User logs results → /api/log/quick creates AssetMetric
                        ↓ (WORKS if asset has hookType + format + channelId)
Learning weights update → per-channel + global
                        ↓ (GAP: runs only when user manually logs)
Morning brief reads weights → 70/30 proven/explore
                        ↓ (GAP: brief gen does NOT read weights — only morning brief does)
```

**5 specific breaks in the loop:**

1. **ContentAsset.hookType/format often empty** — Brief creates 3 assets with script data, but `hookType` is extracted from script JSON, which may be null if AI output format varies. ~30% of assets missing hookType based on schema optionality.

2. **Brief generation ignores learning weights** — `generate-brief.ts` injects channel persona + character bible but does NOT query `LearningWeightP4` for this channel. Only morning brief reads weights.

3. **VideoTracking ≠ AssetMetric** — Two parallel tracking systems. `VideoTracking` (manual form in TrackingTab) stores views24h/orders but does NOT trigger `updateLearningWeights()`. Only `AssetMetric` (via `/api/log/quick` or extension) feeds learning.

4. **No "what was actually posted" metadata** — When user publishes video, the actual hook used, format chosen, sound type, visual style are not captured. Brief suggested 10 hooks; which one did user actually use?

5. **Weekly learning too slow** — Pattern detection runs weekly. For rapid testing (3-5 videos/day), weekly is 15-35 videos late. Should be nightly at minimum.

### 1.3 Brief Generation — What Context Is Injected Today

**Already injected (generate-brief.ts + brief-prompt-builder.ts):**
- Channel persona (name, voice, audience, niche)
- Character Bible (values, catchphrases, red lines, voice DNA)
- Format Template (if exists)
- Video Bible (if exists)
- Calendar events (7-day window)
- Product details (price, category, commission, sales, lifecycle)
- Suggested hooks from explore-exploit.ts (70% proven + 30% explore)
- Suggested formats (top 3 from weights)

**NOT injected (the personalization gap):**
- Past briefs for this channel (which angles were already used)
- Past performance per hook/format for this channel
- Which hooks failed (losing patterns)
- Total brief count per angle (to detect repetition)
- Competitor intelligence (what's trending in niche)
- Channel's specific winning combos (hook_type × format × category)

### 1.4 Morning Brief — Already Smart, But Limited

Morning brief (`brief-prompt-builder.ts`) already queries:
- Active channels + niche match
- Yesterday metrics
- Top learning weights (global, not per-channel)
- Winning/losing patterns (global UserPattern)
- Weekly goal progress

**Missing:** Per-channel weight comparison, channel-specific patterns, competitor signals.

---

## PART 2: AGENT ARCHITECTURE DESIGN

### 2.1 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    SHARED CONTEXT                     │
│  ChannelMemory (per-channel weights + patterns +      │
│  brief history + performance summary)                 │
└──────────┬────────────┬──────────────┬───────────────┘
           │            │              │
    ┌──────▼──────┐ ┌───▼────────┐ ┌──▼──────────────┐
    │ Agent 1:    │ │ Agent 2:   │ │ Agent 3:        │
    │ Content     │ │ Nightly    │ │ Brief           │
    │ Analyzer    │ │ Learning   │ │ Personalization │
    └──────┬──────┘ └───┬────────┘ └──┬──────────────┘
           │            │              │
           │     ┌──────▼──────┐      │
           │     │ Agent 4:    │      │
           │     │ Win         │      │
           │     │ Predictor   │      │
           │     └─────────────┘      │
           │                          │
    ┌──────▼──────────────────────────▼───┐
    │ Agent 5: Trend Intelligence         │
    │ (Telegram Bot → Competitor Analysis) │
    └─────────────────────────────────────┘
```

**Communication mechanism:** Database-mediated. No direct agent-to-agent calls. Each agent reads from and writes to shared tables. This avoids redundant AI calls and allows async execution.

### 2.2 Agent 1: Content Analyzer

**Trigger:** POST `/api/log/quick` or `/api/log/batch` (after user logs results)

**What it does:**
1. User submits TikTok link + basic metrics (views, likes, orders)
2. Agent extracts from TikTok URL (no API needed):
   - Post ID (already implemented in `match-tiktok-link.ts`)
   - Caption text (from TikTok oembed endpoint — free, no auth)
   - Hashtags (parsed from caption)
3. AI call (lightweight, ~500 tokens) to classify:
   - hookType (from first 3 seconds description or caption opening)
   - format (from video structure description)
   - soundStyle (from caption/hashtag signals)
   - contentType (entertainment/education/review/selling)
4. Write structured metadata to ContentAsset
5. Trigger `updateLearningWeights()` with complete data

**What user must input (minimum):**
- TikTok link (mandatory)
- Views, orders (mandatory — can't be auto-extracted without TikTok API)
- Channel selection (mandatory — FYP is random, can't auto-detect)
- Hook used (optional — AI can infer from caption, but user confirmation improves accuracy)

**What can be auto-extracted from TikTok oembed:**
```
GET https://www.tiktok.com/oembed?url={video_url}
Returns: { title, author_name, thumbnail_url }
- title = caption text (includes hashtags)
- author_name = creator handle
- thumbnail_url = video thumbnail
```

**Cost per call:** ~$0.001 (500 input + 200 output tokens on Gemini Flash)

**Schema changes needed:**
```prisma
// Add to ContentAsset:
  captionExtracted  String?    // Raw caption from TikTok
  hashtagsExtracted Json?      // Auto-parsed hashtags
  hookConfirmed     Boolean @default(false)  // User confirmed hookType
  analyzerVersion   Int?       // Track which analyzer version classified this
```

### 2.3 Agent 2: Nightly Learning

**Trigger:** Vercel cron daily at 22:00 UTC (5 AM Vietnam) — before morning brief at 23:00 UTC

**Current state:** Weekly learning is too slow. Change to nightly.

**What it does:**
1. Query all AssetMetric from last 24h + ContentAsset metadata
2. Per-channel analysis:
   - Update `LearningWeightP4` for each channel (already supported)
   - Detect channel-specific winning combos (hook_type × format × category)
   - Compare channel performance vs global average
3. Regenerate `UserPattern` — change from weekly to nightly
4. Generate `ChannelMemory` summary (new table — see below)
5. Pre-compute morning brief context (cache in DB, not AI call)

**Current LearningWeightP4 assessment:**
- Structure is SUFFICIENT for per-channel learning
- Already has `channelId`, `scope`, `key`, `weight`, `avgReward`, `sampleCount`
- **Change needed:** Run `regeneratePatterns()` nightly instead of weekly
- **Change needed:** Add `channelId` to `UserPattern` for per-channel patterns

**Schema changes needed:**
```prisma
// Add to UserPattern:
  channelId String @default("")  // "" = global, "clxxx" = channel-specific
  @@index([channelId])

// New model:
model ChannelMemory {
  id        String @id @default(cuid())
  channelId String @unique
  channel   TikTokChannel @relation(...)

  // Aggregated stats
  totalVideos       Int @default(0)
  totalOrders       Int @default(0)
  avgReward         Decimal @default(0) @db.Decimal(8,4)

  // Winning combos (top 5)
  winningCombos     Json @default("[]")  // [{hookType, format, category, winRate, samples}]
  losingCombos      Json @default("[]")

  // Used angles (for dedup)
  usedAngles        Json @default("[]")  // [{angle, briefId, assetCount, avgReward}]
  usedHooks         Json @default("[]")  // [{hookText, timesUsed, avgReward}]

  // AI summary (generated nightly)
  insightSummary    String?  // "Kenh nay manh ve review ngan + hook gia. Nen tranh demo dai."

  lastUpdated       DateTime @updatedAt
  createdAt         DateTime @default(now())
}
```

**Cost per night:** ~$0.01-0.02 (mostly DB queries, one AI call for insight summary per active channel)

### 2.4 Agent 3: Brief Personalization

**Trigger:** Before every brief generation (injected into `generate-brief.ts`)

**What it does — NOT a separate AI call, but a context enrichment layer:**
1. Read `ChannelMemory` for the target channel
2. Read last 10 `ContentBrief` for this channel → extract used angles
3. Read `LearningWeightP4` where channelId = target channel → top/bottom hooks, formats
4. Read `UserPattern` where channelId = target channel → winning/losing patterns
5. Build "personalization context" block injected into brief prompt

**Prompt injection (added to generate-brief.ts):**
```
## LỊCH SỬ KÊNH: {channelName}
- Đã tạo {n} briefs, {m} videos published
- Angles đã dùng: [{list}] — KHÔNG lặp lại
- Hooks đang thắng: [{hookType}: avgReward {x}, winRate {y}%]
- Hooks nên tránh: [{hookType}: avgReward {x}, failRate {y}%]
- Combos thắng: [{hookType} + {format} + {category}: winRate {z}%]
- Ghi chú AI: "{insightSummary from ChannelMemory}"
```

**Cost:** $0 extra AI cost — just DB queries + prompt enrichment. Brief token budget may increase ~500 tokens (6000 → 6500).

**Schema changes needed:** None beyond ChannelMemory (Agent 2).

### 2.5 Agent 4: Win Predictor

**Prerequisite:** Minimum 30 logged videos per channel with complete metadata.

**Trigger:** On-demand — called when user views product detail or before creating brief.

**What it does:**
1. For a given (product, channel) pair, predict order probability
2. Uses: product category, price range, commission %, channel's historical performance for similar products
3. Output: win probability 0-100%, confidence level, reasoning

**Model approach (NOT deep learning — too little data):**

```
Win Score = Σ (feature_weight × feature_match)

Features:
1. Category match: Does channel have winning patterns in this category? (from LearningWeightP4)
2. Price range match: Does channel perform well in this price range?
3. Hook availability: Are there proven hooks for this product type?
4. Format fit: Does channel's winning format suit this product?
5. Trending bonus: Is product trending (lifecycle = "rising" or "hot")?
6. Commission incentive: Higher commission = more effort = better odds?

Output: probability = sigmoid(Win Score) × 100
```

**Implementation:** Pure formula-based (like current scoring). NO AI call needed. Just weighted lookup from `LearningWeightP4` and `ChannelMemory`.

**When to add AI:** After 100+ logged videos, can train a simple logistic regression on actual outcomes. Until then, formula is more reliable than ML with sparse data.

**Cost:** $0 — pure DB computation.

**Schema changes needed:**
```prisma
// Add to ContentAsset or ContentBrief:
  predictedWinProb  Decimal? @db.Decimal(5,2)  // 0.00-100.00
  predictionVersion Int?
```

### 2.6 Agent 5: Trend Intelligence (Telegram Bot)

**Architecture:**

```
User on phone → sees viral video → shares to Telegram
    ↓
Telegram Bot receives message
    ↓
Bot extracts: TikTok URL + optional note + user's selected channel
    ↓
POST /api/telegram/webhook
    ↓
PASTR creates CompetitorCapture record
    ↓
Nightly agent analyzes all captures → detects trending patterns
    ↓
Feeds into morning brief + brief personalization
```

**Telegram Bot design:**

1. **Bot setup:** Single bot, user authenticates once with PASTR API key
2. **Channel selection:** User sends `/channel ChannelName` to set active channel context. Bot remembers last selected channel per chat.
3. **Capture flow:**
   - User shares TikTok link → Bot auto-detects URL
   - Bot replies: "Saved for {channelName}. Add note?" (inline keyboard: Skip / Add note)
   - If note → user types 1-line note → saved
   - Total interaction: 2-3 seconds
4. **Commands:**
   - `/channel` — List/select active channel
   - `/status` — Today's capture count
   - `/top` — Top 3 trending captures this week

**Webhook handler (`/api/telegram/webhook`):**
1. Verify Telegram webhook signature
2. Parse message for TikTok URL (regex)
3. Extract oembed data (caption, author)
4. Create `CompetitorCapture` record
5. Reply with confirmation

**Schema changes needed:**
```prisma
model CompetitorCapture {
  id        String @id @default(cuid())
  channelId String
  channel   TikTokChannel @relation(...)

  tiktokUrl     String
  authorHandle  String?
  caption       String?
  hashtags      Json @default("[]")
  thumbnailUrl  String?

  userNote      String?

  // AI analysis (filled by nightly agent)
  detectedHookType  String?
  detectedFormat    String?
  detectedAngle     String?
  trendScore        Int?       // 0-100 how viral/trending

  analyzedAt    DateTime?
  createdAt     DateTime @default(now())

  @@index([channelId])
  @@index([createdAt(sort: Desc)])
}

model TelegramChat {
  id              String @id @default(cuid())
  chatId          String @unique  // Telegram chat ID
  activeChannelId String?
  apiKey          String?         // PASTR auth
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

**Nightly trend analysis (part of Agent 2):**
1. Query all `CompetitorCapture` from last 7 days
2. Group by hashtag clusters, hookType, format
3. AI call: "Given these competitor videos, what patterns are trending in {niche}?"
4. Output: trending hooks, formats, angles → stored in `ChannelMemory.trendingInsights`
5. Fed into morning brief and brief personalization

**Cost:**
- Telegram Bot API: Free
- Oembed extraction: Free (no auth)
- Nightly AI analysis: ~$0.01-0.02 per channel (batch all captures into one call)

---

## PART 3: ANSWERS TO 8 QUESTIONS

### Q1: Learning Engine — what it learns, from what, biggest weakness?

**Learns:** Hook type effectiveness, format effectiveness, angle effectiveness, category performance — both globally and per-channel.

**From:** AssetMetric records (manual log or Chrome extension). Reward formula weights orders 10x, views log-scale.

**Biggest weakness:** Data sparsity. Learning only triggers when user manually logs via `/api/log/quick` or extension sends `/api/metrics/capture`. If user logs results via VideoTracking (TrackingTab UI), those metrics do NOT feed learning weights. Two parallel tracking systems that don't talk to each other.

### Q2: Feedback loop — DB schema and API changes needed?

**Schema changes:**
1. Add `captionExtracted`, `hashtagsExtracted`, `hookConfirmed` to `ContentAsset`
2. Add `channelId` to `UserPattern`
3. Create `ChannelMemory` model
4. Create `CompetitorCapture` + `TelegramChat` models
5. Add `predictedWinProb` to ContentAsset

**API changes:**
1. Merge VideoTracking into AssetMetric flow — when TrackingTab saves, also call `updateLearningWeights()`
2. `/api/log/quick` → add auto-extraction step (oembed + AI classify)
3. `generate-brief.ts` → inject ChannelMemory context
4. Change `/api/cron/weekly-learning` → `/api/cron/nightly-learning` (run daily)
5. New: `/api/telegram/webhook`

### Q3: Telegram Bot integration design

See Agent 5 (Section 2.6). Key decisions:
- Single bot, multi-channel via `/channel` command
- Share TikTok link → 2-3 second capture
- Webhook → PASTR API → CompetitorCapture table
- Nightly batch analysis (not real-time, to save costs)

### Q4: PWA for mobile quick-log

**Current state:** No PWA. No manifest.json, no service worker.

**What to add:**
1. `public/manifest.json` — app name, icons, theme color, `display: "standalone"`
2. `next.config.ts` — add `next-pwa` or manual service worker registration
3. Apple meta tags in `layout.tsx` (`apple-mobile-web-app-capable`, splash screens)
4. **Quick-log shortcut:** Add a floating action button (FAB) on mobile that opens `/log` in minimal mode — just URL input + metrics + submit

**Effort:** ~2-3 hours for basic PWA. The app is already responsive; PWA just makes it installable + adds home screen icon.

### Q5: Agent communication — how to share context, avoid redundant AI calls

**Approach: Database-mediated, not direct.**

```
Agent 1 (Analyzer) → writes to ContentAsset fields
Agent 2 (Nightly)  → reads ContentAsset + AssetMetric → writes ChannelMemory + UserPattern
Agent 3 (Brief)    → reads ChannelMemory + UserPattern + past briefs (NO separate AI call)
Agent 4 (Predictor) → reads LearningWeightP4 + ChannelMemory (NO AI call)
Agent 5 (Telegram) → writes CompetitorCapture → Agent 2 reads it nightly
```

**Zero redundant AI calls.** Only 3 AI calls in the entire system:
1. Content Analyzer: ~500 tokens per video logged (classification)
2. Nightly Learning: ~2000 tokens per channel per night (insight summary)
3. Brief generation: ~6500 tokens per brief (already exists, just enriched context)

Morning brief already exists and is unchanged.

### Q6: Per-channel memory — where and how

**Table:** `ChannelMemory` (1:1 with TikTokChannel)

**Contents:**
- Aggregated stats (totalVideos, totalOrders, avgReward)
- Winning combos (top 5 hook×format×category with winRate)
- Losing combos
- Used angles (for dedup in brief generation)
- Used hooks (with performance data)
- AI-generated insight summary (1-2 sentences)
- Trending insights from competitor captures

**Updated:** Nightly by Agent 2. Read by Agent 3 (brief) and Agent 4 (predictor).

### Q7: Build priority — what to build first

| Priority | Agent | Impact | Effort | Why First |
|----------|-------|--------|--------|-----------|
| **1** | Nightly Learning (Agent 2) + ChannelMemory | HIGH | 1-2 days | Foundation for everything else. Per-channel patterns enable personalization. |
| **2** | Brief Personalization (Agent 3) | HIGH | 0.5 day | Just prompt enrichment — reads ChannelMemory. Immediate quality improvement. |
| **3** | Content Analyzer (Agent 1) | HIGH | 1 day | Closes the feedback loop. Every logged video now has complete metadata. |
| **4** | Telegram Bot (Agent 5) | MEDIUM | 1-2 days | New data source. But useless without Agent 2 analyzing captures. |
| **5** | Win Predictor (Agent 4) | LOW now | 0.5 day | Needs 30+ videos per channel. Build the formula now, activate later. |
| **Bonus** | PWA | MEDIUM | 0.5 day | Quality of life for mobile logging. Can do anytime. |

**Rationale:** Agent 2 creates ChannelMemory, which Agent 3 reads. Agent 1 improves data quality, which makes Agent 2 smarter. Agent 5 adds competitor data, which Agent 2 also processes. Agent 4 is pure computation, no AI needed, can wait for data.

### Q8: Token cost management

**Current monthly cost (estimated):**
| Task | Frequency | Tokens/call | Cost/call (Gemini Flash) | Monthly |
|------|-----------|-------------|--------------------------|---------|
| Scoring | ~400 products/batch | 4096 × 14 batches | ~$0.02 | $0.02 (one-time) |
| Brief generation | ~5/day | 6000 | ~$0.003 | $0.45 |
| Morning brief | 1/day | 3000 | ~$0.0015 | $0.045 |
| Weekly learning | 1/week | 8192 | ~$0.004 | $0.016 |
| Weekly report | 1/week | 8192 | ~$0.004 | $0.016 |

**Current total: ~$0.55/month** (Gemini Flash pricing)

**With new agents:**
| New Task | Frequency | Tokens/call | Monthly Cost |
|----------|-----------|-------------|-------------|
| Content Analyzer (Agent 1) | ~5 videos/day | 500 | $0.075 |
| Nightly Learning (Agent 2) | 1/night × 8 channels | 2000 | $0.48 |
| Brief Personalization (Agent 3) | 0 extra | 0 (context only) | $0 |
| Win Predictor (Agent 4) | 0 | 0 (formula) | $0 |
| Trend Analysis (Agent 5) | 1/night | 1500 | $0.045 |

**New total: ~$1.15/month** — negligible even at Gemini Pro pricing (~$5/month).

**Cost optimization strategies:**
- Use Gemini Flash for Agent 1 (classification) and Agent 2 (nightly summary)
- Use Gemini Pro only for brief generation (quality matters)
- Batch competitor captures into single nightly call (not per-capture)
- Cache ChannelMemory — don't regenerate if no new data

---

## PART 4: RISKS AND TRADE-OFFS

### Risk 1: Data Quality Chicken-and-Egg
**Problem:** Agent 2 needs logged videos to learn. User needs good briefs to log videos. Cold start.
**Mitigation:** Start with global patterns (already have 393 scored products). Per-channel learning bootstraps from global weights with channel-specific overrides.

### Risk 2: TikTok Oembed Reliability
**Problem:** TikTok may rate-limit or block oembed endpoint.
**Mitigation:** Cache oembed responses. Fallback: user provides caption manually. Oembed is optional enrichment, not critical path.

### Risk 3: Over-engineering Agent Communication
**Problem:** Temptation to build event-driven pub/sub between agents.
**Mitigation:** Keep it simple — database-mediated. Each agent reads what it needs, writes its output. Vercel cron handles scheduling. No message queues, no Redis, no websockets.

### Risk 4: ChannelMemory Staleness
**Problem:** If nightly cron fails, ChannelMemory becomes stale → brief quality degrades.
**Mitigation:** Add `lastUpdated` timestamp. Brief generation checks if ChannelMemory is > 48h old → falls back to direct DB queries (slower but fresh).

### Risk 5: Telegram Bot Scope Creep
**Problem:** Users may want the bot to do more (check scores, trigger briefs, etc.)
**Mitigation:** V1 = capture only. Two actions: set channel, share link. Everything else stays in web app.

---

## PART 5: IMPLEMENTATION SUMMARY

### DB Schema Changes (All)
1. `ContentAsset` — add `captionExtracted`, `hashtagsExtracted`, `hookConfirmed`, `analyzerVersion`, `predictedWinProb`
2. `UserPattern` — add `channelId` field + index
3. New: `ChannelMemory` — per-channel aggregated learning state
4. New: `CompetitorCapture` — Telegram-captured competitor videos
5. New: `TelegramChat` — Bot authentication + channel context

### Cron Schedule Changes
```
BEFORE:
  00:00 UTC — retry-scoring
  01:00 UTC — decay
  Sunday 00:00 — weekly-learning
  Sunday 06:00 — weekly-report
  23:00 UTC — morning-brief

AFTER:
  00:00 UTC — retry-scoring
  01:00 UTC — decay
  22:00 UTC — nightly-learning (Agent 2, was weekly)
  22:30 UTC — trend-analysis (Agent 5, new)
  23:00 UTC — morning-brief (enhanced with ChannelMemory)
  Sunday 06:00 — weekly-report
```

### API Route Changes
| Route | Action |
|-------|--------|
| `/api/log/quick` | Add Content Analyzer step (Agent 1) |
| `/api/cron/nightly-learning` | New — replaces weekly-learning |
| `/api/cron/trend-analysis` | New — processes CompetitorCapture |
| `/api/telegram/webhook` | New — Telegram Bot handler |
| `/api/telegram/setup` | New — Bot registration + API key |
| `generate-brief.ts` | Inject ChannelMemory context (Agent 3) |

### Files to Create
- `lib/agents/content-analyzer.ts`
- `lib/agents/nightly-learning.ts`
- `lib/agents/brief-personalization.ts` (context builder)
- `lib/agents/win-predictor.ts`
- `lib/agents/trend-intelligence.ts`
- `app/api/telegram/webhook/route.ts`
- `app/api/telegram/setup/route.ts`
- `app/api/cron/nightly-learning/route.ts`
- `app/api/cron/trend-analysis/route.ts`

### Files to Modify
- `prisma/schema.prisma` (5 model changes)
- `lib/content/generate-brief.ts` (inject personalization context)
- `lib/learning/pattern-detection.ts` (add channelId grouping)
- `app/api/log/quick/route.ts` (add analyzer step)
- `vercel.json` (update cron schedule)

---

## PART 6: DECISION LOG

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Agent communication | Database-mediated | Simplest, no new infra, Vercel-compatible |
| Learning frequency | Nightly (was weekly) | 5 videos/day × 7 days = too late. Nightly = next-morning feedback |
| Telegram vs PWA for capture | Telegram for competitor, PWA for own videos | Different UX needs: Telegram = 2s capture while browsing; PWA = structured logging |
| Win Predictor model | Formula-based (not ML) | Too little data for ML. Formula readable, debuggable, adjustable |
| Competitor analysis timing | Nightly batch (not real-time) | Cost efficiency. 10 captures/day batched = 1 AI call vs 10 |
| Brief personalization | Prompt enrichment (not separate agent) | No extra AI call. Just richer context = better output |
| ChannelMemory storage | Dedicated table (not JSON in channel) | Queryable, indexable, independently updatable by cron |

---

**Next step:** Run `/plan:hard` with this report as input to create detailed implementation phases.
