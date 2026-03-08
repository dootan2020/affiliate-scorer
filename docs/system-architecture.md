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
        API["API Route Handlers (90+ endpoints)"]
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

**Endpoint:** `POST /api/upload`

```typescript
// Phase 1: Parse file, normalize data, deduplicate URLs
const { totalRows, deduplicatedProducts } = parseAndNormalize(file);

// Phase 2: Create batch with initial asset assignments (atomic)
const batch = await prisma.$transaction(async (tx) => {
  const batch = await tx.importBatch.create({
    data: {
      batchId: generateId(),
      fileName: file.name,
      format: detectFormat(file),
      status: "processing",
      totalRows,
      recordCount: deduplicatedProducts.length,
      scoringStatus: "pending",
      importDate: new Date(),
    },
  });

  // Atomic: only create if batch creation succeeds
  for (const product of deduplicatedProducts.slice(0, 10)) {
    await tx.productAsset.create({
      data: {
        batchId: batch.id,
        productUrl: product.url,
        status: "assigned",
      },
    });
  }
  return batch;
});

// Fire processProductBatch immediately (async, background)
await processProductBatch(batch.id, deduplicatedProducts);
// Returns 202 Accepted to client
```

**Transaction Safety:**
- Batch creation + initial asset assignments succeed or fail together
- Prevents partial batch creation if asset assignment fails
- Uses `$transaction()` for atomic operations (only where needed)

**Config:**
- `IMPORT_CHUNK = 300` — Products per invocation (in `lib/import/process-product-batch.ts`)
- Respects Vercel `maxDuration = 60s` per invocation
- Parallel queries: `PARALLEL = 20` concurrent database operations

### 2.2 Process Product Batch (Initial Chunk)

**Code:** `lib/import/process-product-batch.ts`

```typescript
export async function processProductBatch(
  batchId: string,
  deduplicated: NormalizedProduct[],
): Promise<void> {
  // Split into chunks
  const chunk = deduplicated.slice(0, IMPORT_CHUNK);      // [0:300]
  const remaining = deduplicated.slice(IMPORT_CHUNK);     // [300:N]

  // Process first chunk (classify, upsert, sync identities, update progress)
  await processChunk(batchId, chunk);

  if (remaining.length > 0) {
    // Fire relay to handle remaining
    fireRelay(
      "/api/internal/import-chunk",
      { batchId, products: remaining },
      "import-chunk",
    );
  } else {
    // All chunks done, trigger scoring
    await finalizeImportAndFireScoring(batchId);
  }
}
```

### 2.3 Import-Chunk Relay Endpoint

**Endpoint:** `POST /api/internal/import-chunk`

```typescript
export async function POST(req: NextRequest) {
  const { batchId, products } = await req.json();

  // Process current chunk (same logic as initial)
  const chunk = products.slice(0, IMPORT_CHUNK);
  const remaining = products.slice(IMPORT_CHUNK);

  await processChunk(batchId, chunk);

  if (remaining.length > 0) {
    // Relay next chunk
    fireRelay(
      "/api/internal/import-chunk",
      { batchId, products: remaining },
      "import-chunk",
    );
  } else {
    // Final chunk, trigger scoring
    await finalizeImportAndFireScoring(batchId);
  }
}
```

**Key Characteristics:**
- Each invocation handles **exactly 300 products** (or fewer for final chunk)
- Processes in ~10-15s, leaving 45-50s buffer within 60s limit
- Parallel updates (no `$transaction`) to avoid PgBouncer timeout

### 2.4 Fire-and-Forget Relay Utility

**Code:** `lib/import/fire-relay.ts`

```typescript
export function fireRelay(
  path: string,
  body: Record<string, unknown>,
  label?: string,
): void {
  // Non-blocking relay with internal retries
  void attemptRelay(`${base}${path}`, body, 0, label);
}

async function attemptRelay(
  url: string,
  body: Record<string, unknown>,
  attempt: number,
  label: string,
): Promise<void> {
  try {
    const res = await fetch(url, { method: "POST", body });
    if (res.ok) return;
    if (res.status < 500) {
      console.warn(`${label} relay got ${res.status} — not retrying`);
      return;
    }
    throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    if (attempt < MAX_RETRIES - 1) {
      await sleep(BACKOFF_MS[attempt]); // 1s, 2s, 4s
      return attemptRelay(url, body, attempt + 1, label);
    }
    console.error(`${label} relay failed after ${MAX_RETRIES} attempts:`, err);
  }
}
```

**Features:**
- **Exponential backoff:** 1s → 2s → 4s between retries
- **Max 3 retries** before giving up
- **Non-blocking:** Returns immediately; retries run in background
- **Auth header:** Includes `x-auth-secret` for server-to-server validation
- **No await:** Caller does not wait; safety net is cron job

### 2.5 Scoring Relay Endpoint

**Endpoint:** `POST /api/internal/score-batch`

```typescript
export async function POST(req: NextRequest) {
  const { batchId } = await req.json();

  // Fetch batch + all imported products
  const batch = await prisma.importBatch.findUnique({ where: { id: batchId } });
  const products = await prisma.productIdentity.findMany({
    where: { importBatchId: batchId },
  });

  // Trigger scoring
  await scoreProductsInBatch(batchId, products);
  // Max 30 concurrent scores (3 chunks of 10)
}
```

**Key Points:**
- Called after **final import chunk** completes
- Batches 30 concurrent AI scoring requests
- Chunks: 10 → 10 → 10 products per parallel batch
- If scoring fails or gets stuck, cron job retries

### 2.6 Retry-Scoring Cron Service

**Endpoint:** `GET /api/cron/retry-scoring`

**Schedule:** Every 5 minutes (Vercel cron config in `vercel.json`)

```typescript
export async function GET(): Promise<NextResponse> {
  const now = new Date();

  // Two-pass approach:
  // Pass 1: Find candidates with generous cutoff
  const potentials = await prisma.importBatch.findMany({
    where: {
      status: { in: ["completed", "partial"] },
      OR: [
        { scoringStatus: "failed" },
        {
          scoringStatus: "processing",
          importDate: { lt: maxCutoff },  // 3 min base
        },
      ],
    },
    take: 10,
  });

  // Pass 2: Filter stuck batches using scaled threshold
  // Scale: +1 min per 150-product scoring chunk
  const candidates = potentials.filter((batch) => {
    if (batch.scoringStatus === "failed") return true;
    const chunks = Math.ceil(batch.recordCount / 150);
    const threshold = BASE_STUCK_MS + chunks * PER_CHUNK_STUCK_MS;
    const age = now.getTime() - batch.importDate.getTime();
    return age > threshold;
  }).slice(0, 5);

  // Retry up to 3 times per batch
  for (const batch of candidates) {
    const retryCount = batch.errorLog.scoringRetryCount ?? 0;
    if (retryCount >= 3) continue;

    // Reset status and increment counter
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        scoringStatus: "processing",
        completedAt: null,
        errorLog: { ...log, scoringRetryCount: retryCount + 1 },
      },
    });

    // Fire scoring relay
    fireRelay("/api/internal/score-batch", { batchId: batch.id });
  }
}
```

**Features:**
- **Scaled stuck detection:** Threshold increases by 1 min per 150 products
- **Max 3 retries** per batch (tracked in `errorLog.scoringRetryCount`)
- **Retroactive:** Handles both initial failures and stuck processing
- **Rate-limited:** Max 5 candidates per cron run to avoid cascade failures
- **Runs every 5 min:** Provides safety net for missed relay chains

---

## 4. Import Progress Tracking

**Code:** `lib/import/update-batch-progress.ts`

```typescript
// Atomic progress updates (no $transaction)
await prisma.importBatch.update({
  where: { id: batchId },
  data: {
    processedRows: { increment: chunk.length },
    // OR
    processedRows: processed,  // atomic set
  },
});
```

**UI Component:** `components/upload/upload-progress.tsx`

```typescript
// Shows: "Đang import 600/3000..." during processing
// Polling: client refreshes status every 500ms
const { processed, total } = await fetchImportStatus(batchId);
return <Progress value={(processed / total) * 100} />;
```

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

### Overview

8 key dashboard widgets are wrapped in React ErrorBoundary components to prevent single widget errors from crashing the entire dashboard.

### Applied Widgets

| Widget | Component | Error Fallback |
|--------|-----------|-----------------|
| Morning Brief | `MorningBriefWidget` | "Widget unavailable. Retry" + error details |
| Inbox Stats | `InboxStatsWidget` | Show cached count or "0 items" |
| Quick Paste | `QuickPasteBox` | Show input disabled + error message |
| Chart Widget | `TrendChart` | Empty state with explanation |
| Metric Cards | `StatCard` | Loading skeleton or "N/A" |
| Skill Level | `SkillIndicator` | "N/A" gracefully |
| Pattern Analysis | `PatternInsights` | Empty state message |
| Calendar Widget | `EventCalendar` | Fallback text |

### Implementation Pattern

```typescript
// components/dashboard/dashboard.tsx
import { ErrorBoundary } from "react-error-boundary";
import { WidgetError } from "./widget-error";

export function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <ErrorBoundary fallback={<WidgetError title="Morning Brief" />}>
        <MorningBriefWidget />
      </ErrorBoundary>

      <ErrorBoundary fallback={<WidgetError title="Inbox Stats" />}>
        <InboxStatsWidget />
      </ErrorBoundary>

      {/* Other widgets... */}
    </div>
  );
}

// components/dashboard/widget-error.tsx
export function WidgetError({ title }: { title: string }) {
  return (
    <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 rounded-lg p-4">
      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
        {title} không khả dụng
      </p>
      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
        Vui lòng refresh trang hoặc liên hệ hỗ trợ
      </p>
    </div>
  );
}
```

### Benefits

- **Isolated Failures:** Single widget error doesn't crash dashboard
- **Graceful Degradation:** Users continue with other features while one widget is broken
- **Better UX:** Clear message instead of blank page
- **Debug-Friendly:** Errors logged to console; dev can inspect
- **Production-Ready:** Prevents cascading failures from affecting entire app

---

## 8. Idempotency & Race Condition Prevention

### ProductIdentity Upsert Pattern

**Problem:** Concurrent paste events could create duplicate ProductIdentity records for same URL.

**Solution:** `processInboxItem` uses Prisma `upsert` instead of `create`:

```typescript
const identity = await prisma.productIdentity.upsert({
  where: { productUrl: normalizedUrl },
  create: {
    productUrl: normalizedUrl,
    combinedScore: 0,
    lifecycleStage: "new",
    inboxState: "pending",
    source: "paste",
  },
  update: {
    lastSeenAt: new Date(),
    inboxState: "pending", // refresh state if re-pasted
  },
});
```

**Benefits:**
- Prevents race condition when user pastes same URL twice
- Idempotent: safe to retry without creating duplicates
- Single source of truth for product identity

---

## 9. Error Handling & Resilience

### Dashboard Widget Error Boundaries

**Problem:** Single widget crash could take down entire dashboard.

**Solution:** All dashboard widgets wrapped in ErrorBoundary:

```typescript
// components/dashboard/widget-wrapper.tsx
export function WidgetWrapper({ children, title }: Props) {
  return (
    <ErrorBoundary fallback={<WidgetError title={title} />}>
      {children}
    </ErrorBoundary>
  );
}

// WidgetError shows: "Widget unavailable. Retry" button + error details in dev
```

**Applied to:**
- Morning Brief widget
- Inbox Stats widget
- Quick Paste widget
- Chart widgets
- Metric cards

**Benefits:**
- Isolated failures: one widget error doesn't cascade
- User can continue with other features
- Fallback UI guides users to retry or report issue

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

## 15. Future Improvements

- **Webhook callbacks** instead of polling (requires client-side event listener)
- **Server-sent events (SSE)** for real-time progress updates
- **Batch prioritization** (user can pause/resume imports)
- **Resumable uploads** (restart from failed chunk)
- **Metrics dashboard** (import success rate, scoring latency, etc.)
- **Multi-language support** for brief generation
- **A/B testing framework** for content variants
