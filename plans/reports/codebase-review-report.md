# Codebase Review Report -- AffiliateScorer

**Date:** 2026-02-25
**Reviewer:** Code Review Agent
**Scope:** Full codebase (5 completed phases)
**Tech Stack:** Next.js 16 + TypeScript (strict) + Prisma 7 (PostgreSQL/Supabase) + Tailwind CSS + Claude AI API
**Estimated LOC:** ~10,000+ (app/, lib/, components/)

---

## Overall Assessment

The codebase is well-structured for a solo-developer affiliate scoring tool. Code organization follows Next.js App Router conventions properly. TypeScript strict mode is enabled and mostly adhered to (no `as any`, no `@ts-ignore` in application code). Error handling is consistently applied across API routes. The UI follows Apple-inspired design guidelines with proper dark mode support.

However, there are several security, performance, and reliability issues that should be addressed, especially before any multi-user or production deployment.

**Quality Rating: 7/10** -- Solid for a personal tool; needs hardening for production.

---

## Critical Issues

### C-1. No Authentication or Authorization on ANY API Route

**Files:** All files under `C:/Users/Admin/affiliate-scorer/app/api/`
**Severity:** CRITICAL

No middleware.ts exists. All API routes (including destructive operations like DELETE campaigns, DELETE shops, POST scoring, POST financial records) are completely open. Anyone with the URL can:
- Delete all campaigns and shops
- Create arbitrary financial records
- Trigger AI scoring (consuming API credits)
- Export all product data
- Access the morning brief and financial summaries

**Impact:** Full data exposure and manipulation. API credit theft via scoring endpoint.

**Recommendation:** Add authentication middleware. Since this uses Supabase, implement `supabase.auth` with middleware session validation. At minimum, add a shared secret header check for all API routes.

---

### C-2. Image Proxy SSRF -- Allowlist Too Narrow but Pattern Is Fragile

**File:** `C:/Users/Admin/affiliate-scorer/app/api/image-proxy/route.ts` (line 17)
**Severity:** HIGH

```typescript
if (!parsed.hostname.endsWith("500fd.com")) {
  return new NextResponse("Domain not allowed", { status: 403 });
}
```

The check only validates `endsWith("500fd.com")` which is correct for subdomains of 500fd.com, but the proxy fetches arbitrary URLs from that domain server-side. This could be exploited if 500fd.com has open redirects or if an attacker registers a domain like `evil500fd.com` (which would NOT pass this check, so the hostname check is OK). However:

1. No response size limit -- a large image could exhaust server memory
2. No timeout on the fetch -- could keep connections open
3. The `User-Agent` spoofing and `Referer` header injection could violate terms of service

**Recommendation:** Add a response size limit (e.g., 5MB), add a fetch timeout (e.g., 10 seconds), and consider caching proxied images.

---

### C-3. Unvalidated JSON Body Casts Throughout API Routes

**Files:**
- `C:/Users/Admin/affiliate-scorer/app/api/campaigns/route.ts` (line 99)
- `C:/Users/Admin/affiliate-scorer/app/api/campaigns/[id]/route.ts` (line 59)
- `C:/Users/Admin/affiliate-scorer/app/api/campaigns/[id]/daily-results/route.ts` (line 56)
- `C:/Users/Admin/affiliate-scorer/app/api/commissions/route.ts` (line 7)
- `C:/Users/Admin/affiliate-scorer/app/api/goals-p5/route.ts` (line 7)
- `C:/Users/Admin/affiliate-scorer/app/api/financial/route.ts` (line 59)
- `C:/Users/Admin/affiliate-scorer/app/api/calendar/route.ts` (line 34)
- `C:/Users/Admin/affiliate-scorer/app/api/shops/route.ts` (line 32)
- `C:/Users/Admin/affiliate-scorer/app/api/inbox/paste/route.ts` (line 9)
- `C:/Users/Admin/affiliate-scorer/app/api/log/quick/route.ts` (line 23)
**Severity:** HIGH

Most POST/PATCH routes use `as CreateCampaignBody` or similar type assertions without Zod validation. Only `app/api/products/route.ts` and `app/api/score/route.ts` properly use Zod schemas. The rest rely on manual `if (!body.name)` checks which are incomplete -- they do not validate types, lengths, or malicious payloads.

Example from campaigns/route.ts:
```typescript
const body = (await request.json()) as CreateCampaignBody;
if (!body.name || !body.platform) { ... }
```

This allows arbitrary extra fields to pass through to Prisma, string fields of unlimited length, and no type validation (e.g., `plannedBudgetDaily` could be a string).

**Recommendation:** Create Zod schemas for every POST/PATCH endpoint. The `lib/validations/schemas.ts` file already exists but only has 3 schemas -- extend it to cover all endpoints.

---

### C-4. Campaign PATCH Passes Raw Body to Prisma Update

**File:** `C:/Users/Admin/affiliate-scorer/app/api/shops/[id]/route.ts` (line 92-95)
**Severity:** HIGH

```typescript
const updated = await prisma.shop.update({
  where: { id },
  data: body,  // <-- Raw request body passed directly
});
```

The shop PATCH endpoint passes the entire unvalidated request body directly to Prisma's `update()`. An attacker could inject unexpected fields like `id`, `createdAt`, etc. While Prisma will reject unknown fields, this pattern is dangerous and relies on Prisma's validation as the sole defense.

The campaign PATCH endpoint at `C:/Users/Admin/affiliate-scorer/app/api/campaigns/[id]/route.ts` is better -- it explicitly maps fields -- but the checklist field accepts `unknown` type (line 48, 80).

**Recommendation:** Always explicitly map allowed fields in update operations. Never pass raw request bodies to ORM update calls.

---

## High Priority Issues

### H-1. N+1 Query Pattern in Product Upload (Scoring Pipeline)

**File:** `C:/Users/Admin/affiliate-scorer/app/api/upload/products/route.ts` (lines 105-262)
**Severity:** HIGH

The product upload loop iterates over every deduplicated product and performs 2-4 database queries per product:
1. `findExistingProduct` -- 1-2 queries (tiktokUrl match, then name+shopName fallback)
2. `findFirst` for today's snapshot
3. `update` or `create` for the product
4. `syncProductIdentity` -- additional queries internally

For a 500-product CSV upload, this could mean 2,000+ individual database queries.

**Also in:** `C:/Users/Admin/affiliate-scorer/lib/ai/scoring.ts` (lines 57-72) -- the `fetchProducts` function loops through products one at a time to enrich with snapshots.

**Recommendation:** Batch lookup existing products using `findMany` with `where: { tiktokUrl: { in: urls } }` before the loop. Use `$transaction` for bulk operations.

---

### H-2. Unbounded findMany Queries -- Missing Pagination on Multiple Endpoints

**Files affected:**
- `C:/Users/Admin/affiliate-scorer/app/api/campaigns/route.ts` -- No `take` limit, fetches ALL campaigns
- `C:/Users/Admin/affiliate-scorer/app/api/shops/route.ts` -- No `take` limit, fetches ALL shops
- `C:/Users/Admin/affiliate-scorer/app/api/calendar/route.ts` -- No `take` limit, fetches ALL events
- `C:/Users/Admin/affiliate-scorer/app/api/financial/route.ts` -- No `take` limit, fetches ALL records for a month
- `C:/Users/Admin/affiliate-scorer/app/api/content-posts/route.ts` -- Unknown (not fully inspected)
- `C:/Users/Admin/affiliate-scorer/lib/ai/scoring.ts` (line 50-53) -- `scoreProducts` fetches ALL unscored products
- `C:/Users/Admin/affiliate-scorer/lib/ai/scoring.ts` (line 220-222) -- `scoreAllProducts` fetches ALL products
**Severity:** HIGH

As the database grows, these unbounded queries will degrade performance and could cause memory issues.

**Recommendation:** Add `take` limits with pagination to all list endpoints. The inbox route (`/api/inbox`) is a good example of proper pagination implementation.

---

### H-3. updateRankings Transaction Contains Unbounded Individual Updates

**File:** `C:/Users/Admin/affiliate-scorer/lib/ai/scoring.ts` (lines 271-286)
**Severity:** HIGH

```typescript
async function updateRankings(): Promise<void> {
  const all = await prisma.product.findMany({
    where: { aiScore: { not: null } },
    orderBy: { aiScore: "desc" },
    select: { id: true },
  });
  await prisma.$transaction(
    all.map((p, index) =>
      prisma.product.update({
        where: { id: p.id },
        data: { aiRank: index + 1 },
      }),
    ),
  );
}
```

With 1,000+ products, this creates a single transaction with 1,000+ UPDATE statements. PostgreSQL has limits on transaction size, and this will be extremely slow.

**Recommendation:** Use raw SQL with `ROW_NUMBER()` window function or batch the updates in chunks of 100.

---

### H-4. Duplicated anomaly detection queries (campaign data fetched 5 times)

**File:** `C:/Users/Admin/affiliate-scorer/lib/ai/anomaly-detection.ts` (lines 26-178)
**Severity:** MEDIUM-HIGH

`detectAnomalies()` runs 5 check functions in parallel, but `checkRoasDeclining`, `checkConsecutiveLoss`, and `checkOverspend` all query `prisma.campaign.findMany({ where: { status: "running" } })` independently. Similarly, `checkCompetitionSpike` and `checkSalesDrop` both query running campaigns with products.

This results in 5 separate full-table scans of the campaigns table, each also querying snapshots.

**Recommendation:** Fetch running campaigns once and pass the data to each check function.

---

### H-5. Concurrent Array Mutation in detectAnomalies

**File:** `C:/Users/Admin/affiliate-scorer/lib/ai/anomaly-detection.ts` (lines 180-192)
**Severity:** MEDIUM

```typescript
export async function detectAnomalies(): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];
  await Promise.all([
    checkConsecutiveLoss(anomalies),
    checkRoasDeclining(anomalies),
    ...
  ]);
```

Multiple async functions push to the same `anomalies` array concurrently via `Promise.all`. While JavaScript is single-threaded, the interleaving of async operations means push operations could theoretically conflict in edge cases with V8 optimizations, and it makes the code harder to reason about.

**Recommendation:** Have each function return its own array, then concatenate results.

---

### H-6. Prisma Decimal Fields Cast Without Number() in Multiple Places

**File:** `C:/Users/Admin/affiliate-scorer/lib/learning/update-weights.ts` (line 35)
**Severity:** MEDIUM

```typescript
const oldAvg = Number(existing.avgReward);
```

This is correctly handled here, but there are potential issues in components that read Decimal fields from `ProductIdentity` (combinedScore, marketScore, etc.) and `AssetMetric` (rewardScore, avgWatchTimeS, completionRate) -- they may not be consistently cast with `Number()` before arithmetic.

Prisma returns `Decimal` type as `Prisma.Decimal` objects, not JavaScript `number`. Arithmetic with them directly can produce unexpected results.

**Recommendation:** Create a utility `toNumber(decimal: Decimal | null): number | null` and use it consistently whenever reading Decimal fields.

---

## Medium Priority Issues

### M-1. Inconsistent Vietnamese Text -- Missing Diacritics in Some Files

**Files:**
- `C:/Users/Admin/affiliate-scorer/app/api/campaigns/[id]/route.ts` -- Uses unaccented "Khong tim thay", "Da cap nhat", "Da xoa"
- `C:/Users/Admin/affiliate-scorer/app/api/upload/import/route.ts` -- Uses unaccented "Vui long chon file de upload"
- `C:/Users/Admin/affiliate-scorer/components/campaigns/campaign-detail-client.tsx` -- "Ngay", "Chi phi", "Don hang", "Ghi chu", "Dang ngay", "Ket qua", "Co lai", "Hoa von", "Lo", "Bai hoc rut ra"
**Severity:** MEDIUM

Inconsistent: some files use proper Vietnamese diacritics, others don't. This affects UX for Vietnamese users.

**Recommendation:** Standardize all user-facing strings with proper diacritics.

---

### M-2. JSONB Column Typed as `unknown` -- Repeated Unsafe Casts

**Files:** All files accessing `campaign.dailyResults`, `campaign.checklist`
**Severity:** MEDIUM

Prisma's `Json` type returns `JsonValue` which is essentially `unknown`. The codebase consistently casts these as:
```typescript
(campaign.dailyResults as unknown as DailyResultEntry[]) ?? []
```

This pattern is used in 6+ locations (anomaly-detection, brief-campaign-analyzer, daily-results route, recommendations). There is no runtime validation that the JSON actually matches the expected shape.

**Recommendation:** Create typed accessor functions like `getDailyResults(campaign)` that validate the JSON structure at runtime using Zod or manual checks, eliminating the scattered `as unknown as` casts.

---

### M-3. JSON.parse(JSON.stringify(...)) for Prisma JSON Fields

**Files:**
- `C:/Users/Admin/affiliate-scorer/app/api/campaigns/route.ts` (line 124)
- `C:/Users/Admin/affiliate-scorer/app/api/campaigns/[id]/daily-results/route.ts` (lines 116, 217)
- `C:/Users/Admin/affiliate-scorer/lib/ai/weekly-report.ts` (line 148)
**Severity:** LOW-MEDIUM

```typescript
dailyResults: JSON.parse(JSON.stringify(updatedResults)),
```

This `JSON.parse(JSON.stringify())` round-trip is used to convert plain objects to JSON-compatible format for Prisma. While functional, it's unnecessary overhead and can silently drop undefined values, Dates, etc.

**Recommendation:** Prisma accepts plain JavaScript objects for Json fields. The round-trip is only needed if the data contains non-serializable types. Verify if this is actually needed, and if so, document why.

---

### M-4. Duplicated Code in scoreProducts and scoreAllProducts

**File:** `C:/Users/Admin/affiliate-scorer/lib/ai/scoring.ts` (lines 159-268)
**Severity:** MEDIUM

`scoreProducts` and `scoreAllProducts` share ~90% identical code (batch processing, merging, updating). The only difference is the initial query filter.

**Recommendation:** Refactor into a single function that accepts a query filter parameter.

---

### M-5. scoreBreakdown Stored as JSON String, Not JSONB

**File:** `C:/Users/Admin/affiliate-scorer/prisma/schema.prisma` (line 59)
**Severity:** MEDIUM

```
scoreBreakdown    String?
```

The `scoreBreakdown` field on Product is a `String?` that stores serialized JSON. This requires `JSON.parse()` on read (done manually in `app/api/products/[id]/route.ts` line 57). Using a `Json?` field type would let PostgreSQL handle this natively, enable JSON queries, and avoid parse errors.

Similarly, `contentSuggestion`, `platformAdvice`, `weightsBefore`, `weightsAfter`, `patternsFound`, `insights` in LearningLog are all stored as `String` but contain structured data.

**Recommendation:** Migrate these to Prisma `Json?` type for proper JSONB storage and querying.

---

### M-6. No Rate Limiting on AI-Consuming Endpoints

**Files:**
- `C:/Users/Admin/affiliate-scorer/app/api/score/route.ts`
- `C:/Users/Admin/affiliate-scorer/app/api/ai/weekly-report/route.ts` (POST)
- `C:/Users/Admin/affiliate-scorer/app/api/briefs/generate/route.ts`
**Severity:** MEDIUM

Any request to these endpoints triggers Claude API calls with real cost. Without rate limiting, accidental or malicious repeated calls could incur significant API charges.

**Recommendation:** Implement rate limiting using either a middleware-based approach or a simple in-memory counter. At minimum, debounce scoring requests per batch.

---

### M-7. morning-brief Route Is Too Complex -- Single GET Does 9+ Queries

**File:** `C:/Users/Admin/affiliate-scorer/app/api/morning-brief/route.ts`
**Severity:** MEDIUM

The morning brief GET handler performs:
1. Campaign findMany (running)
2. Campaign count (paused)
3. Calendar findMany (upcoming events)
4. detectAnomalies() -- 5+ additional queries internally
5. getNewProductItems() -- 1 query
6. Financial findMany (week records)
7. UserGoal findFirst
8. calculateConfidence() -- 9+ count queries

Total: ~20+ database queries in a single API call. On the dashboard, this runs on every page load.

**Recommendation:** Cache the morning brief result (e.g., in a DailyBrief record) and refresh it periodically or on demand, rather than computing from scratch on every request.

---

### M-8. No Index on FinancialRecord.campaignId

**File:** `C:/Users/Admin/affiliate-scorer/prisma/schema.prisma` (FinancialRecord model)
**Severity:** MEDIUM

The `FinancialRecord` model has indexes on `type`, `date`, and `source`, but no index on `campaignId`. The daily-results PATCH endpoint queries `financialRecord.findFirst({ where: { campaignId, type, date } })` which would benefit from a composite index.

Also: `ContentBrief` has no index on `status`, and `Commission` queries by `earnedDate` range + `platform` which would benefit from a composite index.

**Recommendation:** Add indexes:
```prisma
@@index([campaignId, type, date])  // FinancialRecord
```

---

## Low Priority Issues

### L-1. Unused SNAPSHOT_FIELDS Constant

**File:** `C:/Users/Admin/affiliate-scorer/app/api/upload/products/route.ts` (lines 98-103)
**Severity:** LOW

The `SNAPSHOT_FIELDS` constant is defined with `as const` but its type is never used for type-checking. It serves as a select clause but the return type is not constrained by it.

---

### L-2. Dashboard getConfidence Function Duplicates lib/ai/confidence.ts Logic

**File:** `C:/Users/Admin/affiliate-scorer/app/page.tsx` (lines 129-186)
**Severity:** LOW

The dashboard has a local `getConfidence(feedbackCount)` function that computes confidence levels based solely on feedback count. Meanwhile, `lib/ai/confidence.ts` has a much more comprehensive `calculateConfidence()` that considers products, campaigns, shops, financial records, etc.

The dashboard should use the same confidence calculation as the rest of the app.

**Recommendation:** Remove the local function and use `calculateConfidence()` from the shared module. Alternatively, call the `/api/ai/confidence` endpoint.

---

### L-3. Mobile Bottom Nav Shows All 9 Items

**File:** `C:/Users/Admin/affiliate-scorer/components/layout/nav-header.tsx` (lines 88-114)
**Severity:** LOW

All 9 navigation items are rendered in the mobile bottom tab bar. With 9 items plus the theme toggle, each tab gets ~36px width which is very cramped. Most mobile apps show 4-5 tabs maximum.

**Recommendation:** Show only the 4-5 most important tabs on mobile (Dashboard, Inbox, Campaigns, Upload) and put the rest in a "More" menu.

---

### L-4. No Error Boundary in Client Components

**Severity:** LOW

While `app/error.tsx` exists as a top-level error boundary, individual client components (campaign-detail-client, inbox-page-client, etc.) do not have their own error boundaries. A crash in one component will take down the entire page.

---

### L-5. Campaign Delete Does Not Cascade to Related Records

**File:** `C:/Users/Admin/affiliate-scorer/app/api/campaigns/[id]/route.ts` (line 137)
**Severity:** LOW

Deleting a campaign does not clean up:
- Related `FinancialRecord` entries (campaignId references)
- Related `Feedback` entries (campaignId references)
- Related `ContentPost` entries (has `onDelete: Cascade` in schema, so these ARE cleaned up)

The schema does not have `onDelete: Cascade` on Feedback.campaignId or explicit cleanup logic.

---

## Database Schema Notes

### Schema Strengths
- Good use of indexes on frequently queried columns (category, aiScore, dataDate, status, platform)
- Proper use of `@db.Decimal` for financial precision fields
- Unique constraints on canonical URLs and fingerprint hashes
- Composite unique constraints where appropriate (scope+key, periodType+periodStart)

### Schema Concerns
- **Product model is oversized** -- 40+ fields in a single model. Consider splitting into Product + ProductMetrics + ProductMedia
- **No foreign key index on Feedback.campaignId** -- This FK has no explicit index, relying on Prisma's auto-index
- **`dailyResults` and `checklist` as JSONB** -- Storing time-series data in a JSONB column makes it impossible to query individual days efficiently. Consider a separate DailyResult table for better queryability
- **No composite indexes for common query patterns** -- e.g., `[platform, status]` for campaign filtering, `[type, date]` for financial aggregation

---

## Positive Observations

1. **Consistent error handling** -- Every API route has try-catch with structured error responses including error codes
2. **TypeScript strict mode** -- No `as any` or `@ts-ignore` in application code
3. **Claude API resilience** -- Exponential backoff retry logic with proper error classification (retryable vs non-retryable)
4. **File upload security** -- File size validation (10MB limit) on all upload endpoints
5. **Graceful AI degradation** -- When Claude API fails, scoring falls back to formula-based base scores
6. **Proper Prisma singleton pattern** -- Global singleton avoids connection pool exhaustion in development
7. **Good use of Zod** -- Where it's used (products list, score request), validation is proper
8. **CSV export XSS protection** -- `escapeCsvField` properly handles CSV injection vectors
9. **Image proxy domain allowlist** -- Prevents arbitrary SSRF
10. **Dark mode support throughout** -- Consistent dark mode classes across all components
11. **Responsive design** -- Mobile bottom nav, responsive grids, overflow handling
12. **Proper SEO metadata** -- Layout and page-level metadata with OpenGraph tags
13. **Well-structured scoring formula** -- Clear, documented scoring criteria with configurable weights

---

## Recommended Actions (Priority Order)

1. **[CRITICAL] Add authentication** -- Implement Supabase Auth middleware to protect all API routes
2. **[HIGH] Add Zod validation to all POST/PATCH endpoints** -- Extend `lib/validations/schemas.ts`
3. **[HIGH] Fix N+1 queries in product upload** -- Batch lookup existing products before the loop
4. **[HIGH] Add pagination to campaigns, shops, calendar, financial list endpoints**
5. **[HIGH] Refactor updateRankings** -- Use raw SQL or batch updates
6. **[MEDIUM] DRY up anomaly detection** -- Fetch campaigns once, pass to check functions
7. **[MEDIUM] Create typed accessors for JSONB columns** -- Eliminate scattered `as unknown as` casts
8. **[MEDIUM] Cache morning brief** -- Avoid 20+ queries on every dashboard load
9. **[MEDIUM] Add rate limiting to AI endpoints** -- Prevent API cost runaway
10. **[MEDIUM] Add FinancialRecord.campaignId index** -- Improve daily-results PATCH performance
11. **[MEDIUM] Fix inconsistent Vietnamese diacritics** -- Standardize all user-facing text
12. **[LOW] Remove duplicate getConfidence from dashboard** -- Use shared module
13. **[LOW] Reduce mobile nav items** -- Show 4-5 tabs + "More" menu

---

## Metrics

| Metric | Value |
|--------|-------|
| Type Coverage | ~95% (strict mode, no `as any`, minimal `unknown` casts) |
| Test Coverage | 0% (no test files found) |
| Linting Issues | Not measured (eslint configured but not run during review) |
| API Routes | ~40+ route handlers |
| Database Models | 21 models |
| Zod Validation Coverage | ~15% of POST/PATCH endpoints |
| Authentication | None |
| Rate Limiting | None |

---

## Unresolved Questions

1. Is this intended to remain a single-user personal tool, or will it be deployed for multiple users? The answer significantly affects the urgency of the authentication issue.
2. Are there plans to add server-side caching (Redis, etc.)? The morning brief and confidence calculations would benefit significantly.
3. The `DATABASE_URL` uses pgbouncer pooling -- has connection pooling been tested under concurrent requests?
4. The `scoreAllProducts` function re-scores every product including already-scored ones. Is this intentional? It could incur significant AI API costs with a large product database.
5. The Product model has both `personalNotes`/`personalRating`/`personalTags` (Phase 2) AND the ProductIdentity model has the same fields. Which is the source of truth?
