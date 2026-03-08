# System Architecture — PASTR

Complete system design documentation for the PASTR affiliate video production platform.

---

## 1. Architecture Overview

```mermaid
graph TB
    subgraph Client["Browser (React 19)"]
        Pages["Pages (SSR + CSR)"]
        Components["UI Components"]
    end

    subgraph Server["Next.js Server (App Router)"]
        API["API Route Handlers (140+ endpoints)"]
        MW["Middleware (auth + origin check)"]
        ServerComponents["Server Components"]
    end

    subgraph Compute["Serverless Compute Layer"]
        InitialReq["Initial Upload Route"]
        ChunkRelay["Chunk Relay Endpoints"]
        ScoringRelay["Scoring Relay Endpoint"]
        CronJob["Cron Retry Service"]
    end

    subgraph Data["Data Layer"]
        Prisma["Prisma ORM v7"]
        PgPool["PostgreSQL (Supabase)"]
    end

    subgraph AI["AI Providers"]
        Claude["Claude (Anthropic)"]
        GPT["GPT/O3 (OpenAI)"]
        Gemini["Gemini (Google)"]
    end

    subgraph External["External Data Sources"]
        FastMoss["FastMoss XLSX"]
        KaloData["KaloData CSV"]
        TikTokStudio["TikTok Studio Export"]
        AdsPlatforms["FB/TikTok/Shopee Ads"]
    end

    Pages --> API
    API --> MW
    MW --> API
    API --> InitialReq
    InitialReq --> ChunkRelay
    ChunkRelay --> ScoringRelay
    ScoringRelay --> CronJob
    API --> Prisma --> PgPool
    API --> AI
    External --> API
    CronJob --> Prisma
    ServerComponents --> Prisma
```

---

## 2. Niche Intelligence Module Architecture

### Overview

The Niche Intelligence module guides users through a 4-step wizard to discover profitable niches and auto-create TikTok channels.

**Flow:**
1. **Explore:** User selects from 10+ niche categories
2. **Analyze:** AI analyzes market potential, competition, profit margin
3. **Create:** System auto-creates TikTok channel with Character Bible
4. **Success:** Channel ready, user can start importing products

### 2.1 Niche Finder Wizard

**Pages:** `/niche-finder`

**Components:**
- `NicheExploreStep` — Display 10 niche categories with descriptions
- `NicheAnalyzeStep` — AI analysis results (market potential, competition level, avg margin, recommendations)
- `NicheCreateStep` — Channel creation confirmation, auto-fill channel name
- `NicheSuccessStep` — Success message, link to start importing

**API Endpoints:**
- `POST /api/ai/analyze-niche` — AI analyzes niche market data
- `POST /api/channels/create-from-niche` — Auto-create channel with generated Character Bible
- `GET /api/niche-finder/categories` — List 10 niche categories

### 2.2 Niche Analysis Engine

**Code:** `lib/ai/analyze-niche.ts`

AI performs market analysis on selected niche:
- **Market potential (30%):** Search volume, trend trajectory, market size
- **Competition level (25%):** Number of competitors, market saturation
- **Profit margin (25%):** Typical commission rates, product prices, profit estimates
- **Content difficulty (20%):** Ease of creating compelling videos, asset availability

**Output:** JSON with scores, recommendations, suggested channel name, description

### 2.3 Auto-Channel Creation

**Code:** `lib/content/create-niche-channel.ts`

When user confirms channel creation:
1. **Generate channel profile:** AI creates channel name, description, persona
2. **Generate Character Bible:** AI creates 7-layer character framework for the niche
3. **Create TikTokChannel record:** Store in database with generated profile + Character Bible
4. **Create NicheProfile:** Link channel to original niche selection (for analytics)

**Benefits:** Users don't manually create 50+ fields; AI handles entire setup in 2 minutes

---

## 3. Chunked Import & Relay Architecture

### Overview

The system handles file imports up to 3000+ products by chunking across multiple serverless invocations:

1. **Upload Route** — Receives file, parses, deduplicates (first 300 products)
2. **Import-Chunk Relay** — Processes remaining 300-product chunks
3. **Scoring Relay** — Triggers batch scoring after last import chunk
4. **Cron Retry** — Safety net; retries failed/stuck batches every 5 minutes

### 2.1 Import Phase

**Endpoint:** `POST /api/upload` — Parses file, normalizes, deduplicates, fires initial batch processing.

**Config:** `IMPORT_CHUNK = 300` products/invocation, `PARALLEL = 20` concurrent DB operations.

### 2.2-2.3 Chunked Relay Pipeline

**Flow:**
1. `/api/upload` parses first 300 products, fires `/api/internal/import-chunk` for remainder
2. Each relay processes 300 products (~10-15s), fires next if remaining
3. Final chunk triggers `/api/internal/score-batch`

**Features:**
- Chunks execute in parallel (no waiting)
- Exponential backoff retry (1s → 2s → 4s) with max 3 attempts
- Atomic progress updates (no transactions to avoid PgBouncer conflicts)
- Non-blocking: returns 202 Accepted to client immediately

### 2.4 Retry-Scoring Cron Service

**Endpoint:** `GET /api/cron/retry-scoring` — Every 5 minutes

**Logic:**
- Detects stuck batches using scaled threshold: `BASE (3 min) + (recordCount / 150) * 1 min`
- Retries failed/stuck scoring up to 3 times per batch
- Rate-limited to 5 candidates per run to prevent cascade failures

**Benefits:** Safety net catches missed relays, network transients, DB connection drops

---

## 5. Product Data Flow

### Step 1: Classification

Files (FastMoss XLSX, KaloData CSV, etc.) → Normalized products with fields:
- `name`, `price`, `category`
- `sales7d`, `salesTotal`, `revenue7d`, `revenueTotal`
- `commissionRate`, `totalKOL`, `kolOrderRate`

### Step 2: Deduplication

Normalize URLs (strip params, trailing slash) → detect duplicates within batch

### Step 3: Identity Sync

Match against existing `ProductIdentity` → Create new or link `ProductUrl` variants

### Step 4: Snapshot Creation

Create historical `ProductSnapshot` (for delta classification: NEW/SURGE/COOL/STABLE)

### Step 5: Scoring

Parallel batch scoring (max 30 concurrent):
- **Market Score** — 60% weight (revenue, growth, competition, commission, trend, seasonality)
- **Content Score** — 40% weight (visuals, angles, assets, AI feasibility, risk flags)

### Step 6: Learning Update

If >= 30 feedbacks exist → Apply personalized weight adjustments

---

## 6. Database Schema

**Key Tables for Import:**

| Table | Columns | Purpose |
|-------|---------|---------|
| `ImportBatch` | id, batchId, fileName, format, status, totalRows, processedRows, recordCount, scoringStatus, completedAt, errorLog | Track import session |
| `ProductIdentity` | id, combinedScore, lifecycleStage, deltaType, inboxState | Canonical product entity |
| `ProductUrl` | id, productId, url, urlType (tiktok_shop/fastmoss/kalodata/video/shop) | URL variants |
| `ProductSnapshot` | id, productId, importBatchId, price, salesTotal, ..., createdAt | Historical snapshots for delta |
| `DataImport` | id, batchId, source, rawData (JSON), createdAt | Generic import record |

**Key Relationships:**
- `ImportBatch` 1:N `ProductSnapshot`, `DataImport`
- `ProductIdentity` 1:N `ProductUrl`, `ProductSnapshot`
- `ImportBatch.id` → linked products via `ProductSnapshot.importBatchId`

**Data Integrity & Cascading Rules:**

Database enforces referential integrity with cascade/setNull rules on 10 critical relations:

| Relation | On Delete | Purpose |
|----------|-----------|---------|
| `Feedback` → `Product` | Cascade | Remove feedback when product deleted |
| `ProductSnapshot` → `Product` | Cascade | Remove snapshots when product identity removed |
| `ProductSnapshot` → `ImportBatch` | Cascade | Cleanup snapshots when batch deleted |
| `ContentBrief` → `ProductIdentity` | Cascade | Remove briefs when product deleted |
| `ContentBrief` → `TikTokChannel` | SetNull | Preserve brief when channel deleted |
| `ContentAsset` → `ProductIdentity` | Cascade | Remove assets when product deleted |
| `ContentAsset` → `ContentBrief` | SetNull | Preserve asset when brief deleted |
| `ContentSlot` → `ProductIdentity` | SetNull | Preserve slot when product deleted |
| `ContentSlot` → `ContentAsset` | SetNull | Preserve slot when asset deleted |
| `NicheProfile` → `TikTokChannel` | SetNull | Preserve profile when channel deleted |

This design prevents orphaned records while preserving production assets when source products are cleaned up.

---

## 7. Widget Error Boundaries & Dashboard Resilience

8 key dashboard widgets wrapped in React ErrorBoundary components prevent single widget crashes from affecting entire dashboard. Each shows graceful fallback UI ("Widget unavailable. Retry").

---

## 8. Idempotency & Race Condition Prevention

**ProductIdentity Upsert:** Uses `prisma.upsert()` to prevent duplicates on concurrent paste events. Idempotent: safe to retry without duplicates.

---

## 9. Error Handling & Resilience

### Dashboard Widget Error Boundaries

**8 Widgets wrapped in ErrorBoundary:** Morning Brief, Inbox Stats, Quick Paste, Chart widgets, Metric cards, Skill indicator, Pattern analysis, Calendar.

**Benefits:** Isolated failures prevent cascading crashes. Users continue with other features while one widget recovers.

### Relay Chain Failures

**Scenario 1: Import-chunk relay fails after 3 retries**
- Error logged in `ImportBatch.errorLog`
- Status remains `processing` or becomes `partial`
- Cron job detects stuck batch after BASE_STUCK_MS + (chunks × PER_CHUNK_STUCK_MS)
- Cron retries scoring (up to 3 times)

**Scenario 2: Scoring relay fails**
- `scoringStatus` = `failed`
- Cron immediately detects and retries
- Max 3 scoring retries per batch

**Scenario 3: UI detects import stuck (polling)**
- Client shows "Retry" button
- User clicks → calls `POST /api/internal/score-batch`
- Manually triggers scoring (alternative to waiting for cron)

### Data Integrity

- **Partial imports allowed** — If import chunk fails, previously imported chunks remain
- **Atomic progress updates** — No transaction locking; each update is independent
- **Snapshot isolation** — Each `ProductSnapshot` linked to `ImportBatch` for auditing
- **Idempotent upserts** — Re-running import chunk safe (duplicate products deduplicated)

---

## 10. Performance Tuning

### Database Optimization

| Optimization | Detail |
|--------------|--------|
| **Parallel queries** | 20 concurrent operations per chunk |
| **No transactions** | Avoid PgBouncer conflicts on Supabase |
| **Pooled connection** | pgBouncer on port 6543 for app traffic |
| **Direct connection** | Port 5432 for Prisma migrations only |
| **Index on URL** | Fast deduplication lookups |
| **Index on importBatchId** | Fast batch filtering |

### Serverless Constraints

| Constraint | Handling |
|-----------|----------|
| **60s maxDuration** | Process 300 products/chunk; ~10-15s per chunk |
| **Memory limit** | Avoid loading entire file into memory; stream parse |
| **CPU throttle** | Parallel queries (not sequential) to maximize throughput |

### Timeouts & Backoff

| Metric | Value | Rationale |
|--------|-------|-----------|
| Relay backoff | 1s, 2s, 4s | Exponential; avoids thundering herd |
| Stuck threshold base | 3 min | Allows for normal processing + clock skew |
| Stuck threshold per chunk | +1 min per 150 products | Scales with batch size |
| Cron interval | 5 min | Frequent enough for timely retry |
| Cron candidates | Max 5 per run | Prevents cascade failures |

---

## 11. Monitoring & Logging

### Key Metrics

- **Import batch status:** `processing` → `completed` / `partial` / `failed`
- **Scoring status:** `pending` → `processing` → `succeeded` / `failed`
- **Relay attempts:** Logged with attempt number and backoff duration
- **Error logs:** JSON object in `ImportBatch.errorLog` (fatal, parsing errors, retry counts)

### Client-Side Polling

**Upload Progress Page:**
```typescript
// Poll every 500ms during import
const { status, processedRows, totalRows } = await fetchImportStatus(batchId);
if (status === "completed") showSuccess();
if (status === "failed") showRetryButton();
```

### Server-Side Logging

- `console.error()` on fatal relay failures (checked by monitoring)
- `console.warn()` on non-500 HTTP responses (indicates client error)
- `ImportBatch.errorLog` persists structured error details

---

## 12. API Endpoints (Import & Scoring)

| Endpoint | Method | Responsibility |
|----------|--------|-----------------|
| `/api/upload` | POST | Parse file, normalize, deduplicate, fire initial batch |
| `/api/internal/import-chunk` | POST | Process 300-product chunk, fire next relay |
| `/api/internal/score-batch` | POST | Score all products in batch |
| `/api/cron/retry-scoring` | GET | Detect & retry failed/stuck batches every 5 min |
| `/api/imports/[id]/status` | GET | Poll import progress |

---

## 13. Deployment Configuration

**Vercel Config** (`vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/cron/retry-scoring",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Environment Variables:**
- `NEXT_PUBLIC_APP_URL` — For relay base URL construction
- `VERCEL_URL` — Fallback for base URL
- `AUTH_SECRET` — For server-to-server `x-auth-secret` header

**Build Command:** `pnpm build`
**Dev Command:** `pnpm dev`

---

## 14. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Chunked import** | Supports unlimited file sizes (3000+ products) without timeout |
| **Fire-and-forget relay** | Non-blocking; instant response to user; cron safety net |
| **No $transaction** | Avoid PgBouncer deadlocks; parallel atomic updates instead |
| **Parallel queries** | Maximize throughput within 60s serverless limit |
| **Cron fallback** | Handles missed relays, network transients, DB connection drops |
| **Scaled stuck detection** | Account for batch size; larger batches naturally take longer |
| **Progress polling** | Client-driven; avoids server-sent events complexity |

---

## 16. AI Agent System Architecture (Phases 1-6)

### Overview

6-phase intelligent agent system for continuous learning, content optimization, competitor analysis, and win prediction. Runs asynchronously with zero UI overhead.

**Key Design:** $0 AI cost where possible (pure DB queries + formula-based scoring), strategic AI calls for learning + analysis only.

### Phase 1: Schema + Nightly Learning

**New Models:**
- `ChannelMemory` — Stores successful patterns, character traits, format preferences per channel
- `CompetitorCapture` — Logs competitor TikTok videos for trend analysis
- `TelegramChat` — Telegram bot conversation threads

**Extended Models:**
- `ContentAsset` — Added `actual_format`, `actual_style`, `actual_trend`, `actual_engagement` fields
- `UserPattern` — Added `channelId` for channel-scoped learning

**Cron Job:** `/api/cron/nightly-learning` (22:00 UTC daily)
- Aggregates recent feedback by channel
- Updates `ChannelMemory` with winning patterns
- Triggers Phase 2 (brief personalization)

**Code:** `lib/agents/nightly-learning.ts`

### Phase 2: Brief Personalization ($0 AI Cost)

**Module:** `lib/agents/brief-personalization.ts`

Auto-injects `ChannelMemory` context into brief prompts:
```typescript
// Pure DB query: 0 cost
const memory = await prisma.channelMemory.findUnique({
  where: { channelId },
});

// Enrich prompt with memory (character traits, winning formats, etc.)
const enrichedPrompt = `
  Channel memory: ${memory.successPatterns}
  Winning formats: ${memory.successFormats}
  Character tone: ${memory.characterDescription}
  [Original prompt]
`;

// Single AI call with richer context
const brief = await generateBrief(enrichedPrompt);
```

**Benefits:**
- $0 extra cost (memory already stored)
- Briefs auto-adapt to channel history
- No manual prompt tuning needed

### Phase 3: Content Analyzer

**Modules:** `lib/agents/content-analyzer.ts`, `lib/agents/tiktok-oembed.ts`

Triggered when asset posted on TikTok:
1. Extract metadata via TikTok oembed API
2. AI classifies format, style, engagement pattern
3. Update `ContentAsset.actual_*` fields
4. Feed data into learning loop

**Code Flow:**
```typescript
// /api/log/quick → asset updated → analyzer triggered
const video = await getTikTokOembed(videoUrl);
const analysis = await classifyVideo(video);

// Atomic update
await prisma.contentAsset.update({
  where: { id: assetId },
  data: {
    actual_format: analysis.format,
    actual_style: analysis.style,
    actual_engagement: analysis.engagementScore,
  },
});
```

**Cost:** 1 AI call per posted video (on-demand)

### Phase 4: Telegram Bot + Trend Intelligence

**Modules:** `lib/agents/telegram-bot-handler.ts`, `lib/agents/trend-intelligence.ts`

**Setup Routes:**
- `POST /api/telegram/setup` — Initialize Telegram webhook
- `POST /api/telegram/webhook` — Receive messages from bot

**Workflow:**
1. User sends TikTok video link in Telegram
2. Bot extracts metadata + AI analysis
3. Save to `CompetitorCapture`
4. Nightly trend analysis (22:30 UTC) batch-analyzes captured videos
5. Update `TelegramChat` with insights

**Cron Job:** `/api/cron/trend-analysis` (22:30 UTC daily)
```typescript
// Batch analyze all competitor captures from past 24h
const captures = await prisma.competitorCapture.findMany({
  where: { capturedAt: { gte: yesterday } },
});

// Batch AI call: analyze trends
const trends = await analyzeCompetitorTrends(captures);
await prisma.trendReport.create({
  data: { insights: trends, generatedAt: now },
});
```

**Cost:** 2 AI calls/day (nightly trend batch)

### Phase 5: Win Predictor

**Module:** `lib/agents/win-predictor.ts`

Route: `POST /api/agents/predict-win`

**Formula-Based (No AI Cost):**
```typescript
// 6-feature win probability score
const winScore = (
  0.2 * engagementRate +
  0.2 * formatMatchChannel +
  0.15 * trendAlignment +
  0.15 * contentConsistency +
  0.15 * audienceMatch +
  0.15 * seasonalityBoost
) * 100; // 0-100 scale
```

**Input:** ContentAsset, ChannelMemory, TrendReport
**Output:** Win probability %, 6-dimension breakdown
**Cost:** $0 (pure DB + formula)

### Phase 6: PWA + Mobile Quick-Log

**Files:**
- `public/manifest.json` — PWA manifest
- `public/sw.js` — Service worker for offline
- `components/layout/mobile-fab.tsx` — Quick-log FAB button
- `components/layout/pwa-head.tsx` — PWA meta tags

**Features:**
- Installable on mobile home screen
- Offline support (service worker caches key routes)
- Quick-log FAB floats on inbox/dashboard
- One-click video log from homescreen

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ Content Workflow                                        │
└─────────────────────────────────────────────────────────┘

User Creates Brief
       ↓
  Phase 2: Personalization
  (Inject ChannelMemory)
       ↓
   Brief Generated
       ↓
   User Posts Video
       ↓
  Phase 3: Content Analyzer
  (Extract actual_ fields via oembed)
       ↓
   Feedback Recorded
       ↓
  Phase 1: Nightly Learning (22:00 UTC)
  (Update ChannelMemory, track patterns)
       ↓
  Phase 4: Trend Analysis (22:30 UTC)
  (Analyze competitor captures, generate trends)
       ↓
  Phase 5: Win Prediction
  (Score future content via formula)
       ↓
  Next Brief Creation (loop to Phase 2)

┌─────────────────────────────────────────────────────────┐
│ Telegram Integration (Async)                            │
└─────────────────────────────────────────────────────────┘

User sends TikTok link in Telegram
       ↓
  Phase 4: Bot Handler
  (Extract metadata, save CompetitorCapture)
       ↓
  Nightly Trend Analysis (22:30 UTC)
  (Batch AI analysis of all captures)
       ↓
  Insights → Morning Brief recommendations
```

### Cron Schedule

| Cron Job | Schedule | Module | Purpose |
|----------|----------|--------|---------|
| Nightly Learning | 22:00 UTC daily | `nightly-learning.ts` | Aggregate feedback, update ChannelMemory |
| Trend Analysis | 22:30 UTC daily | `trend-intelligence.ts` | Analyze competitor captures, generate insights |
| Retry Scoring | Every 5 min | existing | Safety net for failed imports |

### Cost Analysis (Monthly)

| Phase | AI Calls/Day | Cost/Month | Strategy |
|-------|-------------|-----------|----------|
| 1 (Nightly) | 1 batch | ~$0.10 | Aggregate only |
| 2 (Personalization) | Same as briefs | ~$5 (included) | Enrichment only |
| 3 (Analyzer) | Per video posted | Variable | On-demand classification |
| 4 (Trends) | 1 batch | ~$0.10 | Nightly batch analysis |
| 5 (Win Predictor) | 0 | $0 | Formula-based only |
| 6 (PWA) | 0 | $0 | No AI overhead |
| **Total** | **~3-5 AI calls/day** | **~$5-10/month** | **Optimized for cost** |

---

## 17. Advisory Agent System — Company Hierarchy Model

### Overview

The Advisory Agent System transforms user questions into structured decisions through a company hierarchy pipeline. Unlike the previous 4-persona system (GROK, SOCRATES, LIBRARIAN, MUNGER), the new architecture organizes analysis by organizational roles: data gathering → parallel analysis → executive decision.

**Pipeline:** ANALYST (data) → [CMO, CFO, CTO parallel] → CEO (decision)

### Step 1: ANALYST — Data Aggregation

**Role:** Queries top 10 products, winning/losing patterns, channel memory, system metrics. Formats into readable briefing for decision-makers.

**Code:** `lib/advisor/gather-advisor-data.ts` — Parallel queries via `Promise.all()` to avoid sequential DB hits.

### Step 2: C-Level Analysis (Parallel)

Three roles analyze the ANALYST briefing independently, each providing their perspective:

#### CMO, CFO, CTO — Parallel C-Level Analysis

**CMO (Chief Marketing Officer):** Content strategy, format trends, audience insights, growth opportunities.

**CFO (Chief Financial Officer):** ROI analysis, opportunity cost, financial risk, efficiency metrics.

**CTO (Chief Technical Officer):** Execution feasibility, workflow optimization, technical risks.

**Parallel Execution:** All 3 roles execute simultaneously via `Promise.all()` → faster than sequential analysis.

### Step 3: CEO — Decision Synthesis

**Role:** Synthesize C-level perspectives into 1 final decision with clear action steps (today).

**Output:** Decision statement + reasoning + numbered action steps (max 200 words, tiếng Việt, no theory).

**Code:** `lib/advisor/analyze-pipeline.ts` — Builds synthesis prompt from C-level responses, calls AI CEO role.

### Full Pipeline Orchestration

**Flow:** ANALYST data → [CMO, CFO, CTO parallel] → CEO decision

**Code:** `lib/advisor/analyze-pipeline.ts` — Orchestrates all 3 steps, returns structured result with CEO decision, C-level responses, and analyst briefing.

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/advisor/analyze` | POST | Run full pipeline: ANALYST → C-levels → CEO |
| `/api/advisor/followup` | POST | Follow-up question (same pipeline) |

**Example Request:** `{ question: "Nên focus vào ngách nào tháng này?", context: "3 kênh TikTok khác ngành" }`

**Response:** `{ ceoDecision, cLevelResponses[], analystBriefing, question, timestamp }`

### Morning Brief Integration

**Function:** `ceoBriefReview(briefSummary: string)` — Lightweight CEO review (skips ANALYST + C-levels). Used for morning brief generation.

**Speed:** Faster than full pipeline (single AI call vs 5 calls total).

### UI & Database Integration

**Component:** `components/advisor/advisor-page-client.tsx` — CEO decision displayed prominently, expandable C-level details, role badges with icons.

**Database Queries:** ProductIdentity (top 10), UserPattern (winning/losing), ChannelMemory (latest 5), system counts.

### Performance & Optimization

| Aspect | Strategy |
|--------|----------|
| **DB queries** | Parallel `Promise.all()` in gatherAdvisorData |
| **C-level analysis** | Parallel `Promise.all()` for CMO, CFO, CTO |
| **Token limits** | C-levels: 1024 tokens; CEO: 1200 tokens |
| **Context reuse** | ANALYST data passed to all C-levels → no redundancy |
| **Caching** | None (real-time DB queries every request) |
| **Timeout** | Per-role AI calls have individual error handling |

### Error Handling

**Partial failures:**
- If ANALYST fails → proceed with empty data briefing
- If 1 C-level fails → CEO synthesis with 2 successful responses + failure note
- If CEO fails → return last successful pipeline state

**Retry logic:**
- No automatic retries (single attempt per pipeline)
- Errors logged for debugging
- User can retry entire pipeline by submitting question again

---

## 15. Future Improvements

- **Webhook callbacks** instead of polling (requires client-side event listener)
- **Server-sent events (SSE)** for real-time progress updates
- **Batch prioritization** (user can pause/resume imports)
- **Resumable uploads** (restart from failed chunk)
- **Metrics dashboard** (import success rate, scoring latency, etc.)
- **Multi-language support** for brief generation
- **A/B testing framework** for content variants
