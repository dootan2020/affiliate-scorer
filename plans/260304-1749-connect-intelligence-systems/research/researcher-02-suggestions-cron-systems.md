# Researcher 02 — Content Suggestions Widget & Automation Systems

Date: 2026-03-04 | Scope: suggestions widget, personalization, learning, decay, weekly report, cron

---

## 1. ContentSuggestionsWidget (`components/dashboard/content-suggestions-widget.tsx`)

**Data fetch:** `GET /api/inbox?sort=score&limit=20` → filters `EXCLUDED_STATES = ["briefed","published"]` → sorts by `rankProduct()` → takes top 5.

**rankProduct(p) logic (client-side):**
```
score = combinedScore
+ deltaType bonus (breakout +15, surge +10, rising +5)
+ contentPotentialScore * 0.3
+ recency bonus (+5 if created within 3 days)
```

**UI columns:** thumbnail | product name (with 🔥/📈 emoji) | category | combinedScore badge | "Brief →" CTA link to `/production?productId=`.

**Integration points for new features:**
- Channel-based grouping: add `channelId` field to `ProductIdentityItem`, group items by channel before/after ranking
- Learning weights: `rankProduct()` currently uses hardcoded bonuses — replace/supplement with `learningWeightP4` weights from API
- Explore/exploit tags: add tag column based on `deltaType` (exploit = surge/breakout, explore = new/low-confidence)
- No server-side personalization in this widget — purely client-side re-rank of `/api/inbox` results

---

## 2. Personalization (`lib/scoring/personalize.ts`)

**Signature:** `getPersonalizedScore(product: Product, baseScore: number): Promise<PersonalizationResult | null>`

**Gate:** returns `null` if `feedback.count() < 30`.

**Hardcoded limit problem:** `prisma.feedback.findMany({ where: { overallSuccess: "success" }, take: 200 })` — only last 200 success feedbacks used regardless of total data size.

**Scoring formula:**
```
personalizedTotal = baseScore * 0.5
                  + historicalMatchScore * 0.3  (matches on category/price/commission/platform)
                  + contentTypeScore * 0.1       (flat 65 if any success by videoType exists)
                  + audienceScore * 0.1           (80 if product.platform matches best ROAS adPlatform)
```

**Caching opportunity:** 3 separate DB queries per product call (successFeedbacks, successByType, platformPerf) — all cacheable with short TTL (~5 min).

**Integration point:** `historicalMatchScore` logic could incorporate channel-specific patterns by filtering `where: { product: { channelId: x } }`.

---

## 3. Learning System (`lib/ai/learning.ts`)

**Signature:** `runLearningCycle(): Promise<LearningResult>`

**Returns:**
```ts
interface LearningResult {
  accuracy: number;        // Claude-assessed accuracy %
  previousAccuracy: number;
  patterns: string[];      // identified patterns
  insights: string;
  weightsAdjusted: boolean;
  weekNumber: number;
}
```

**Flow:**
1. Fetch ALL feedbacks (no limit) with `product.{ name, category }`
2. Load `currentWeights` from DB via `getWeights()`
3. Load `previousLog` (last LearningLog) for previousAccuracy + previousPatterns
4. Build feedback summary with time-decay via `getTimeDecayWeight()` (from `lib/utils/product-badges`)
5. Call Claude via `callAI(system, user, MAX_TOKENS_LEARNING, "scoring")`
6. Parse JSON response → `{ accuracy, patterns, weightAdjustments, insights }`
7. Save new weights via `saveWeights(newWeights, meta)` — creates LearningLog record

**Weights adjusted:** `commission, trending, competition, contentFit, price, platform`

**No cron trigger** — currently only called manually. Integration point for automation cron.

---

## 4. Decay System (`lib/learning/decay.ts`)

**Signature:** `applyDecay(): Promise<{ updated: number; skipped: number }>`

**Logic:** Fetches all `LearningWeightP4` records. For each:
- Skip if `lastRewardAt` is null or < 1 day old
- Apply `weight *= 0.5^(daysSince / decayHalfLifeDays)` (exponential)
- Updates DB record

**Comment in source:** "Chạy khi generate brief hoặc admin trigger" — not on a cron yet.

**Integration point:** Should be called before `runLearningCycle()` to ensure decayed weights are used as baseline, or run on its own weekly cron.

---

## 5. Weekly Report (`lib/reports/generate-weekly-report.ts`)

**Signature:** `generateWeeklyReport(weekStart?: Date): Promise<string | null>`

**Returns:** `dailyBrief.id` (string) or `null` if `videosPublished < 5`.

**Data gathered (parallel):**
- `contentAsset` this week (hookType, format, angle, status, latest metrics)
- `assetMetric` this week (views, likes, shares, saves, rewardScore)
- `commission` this week (amount)
- Top 15 `learningWeightP4` by weight
- Top 5 `userPattern` with sampleSize ≥ 2

**Claude call:** `callAI(SYSTEM_PROMPT, prompt, 1500, "weekly_report")` → JSON `{ summary, wins[], improvements[], next_week_focus, playbook_update }`

**Storage:** Upserts to `DailyBrief` with `briefDate = Monday of week`, content includes `type: "weekly_report"` marker.

**No cron trigger** — not scheduled yet.

---

## 6. Cron Infrastructure (`vercel.json` + `app/api/cron/retry-scoring/route.ts`)

**Current vercel.json:**
```json
{ "crons": [{ "path": "/api/cron/retry-scoring", "schedule": "0 0 * * *" }] }
```
Only 1 cron, runs daily at midnight UTC.

**retry-scoring route behavior:**
- Finds `importBatch` with `scoringStatus: failed` or stuck `processing` (scaled by chunk count: 3min base + 1min/150 products)
- Retries up to `MAX_SCORING_RETRIES = 3` via `fireRelay("/api/internal/score-batch", ...)`
- Cleans zombie `BackgroundTask` stuck > 3min → marks `failed`
- `maxDuration = 30` seconds

**Pattern for new cron routes:**
- Add to `vercel.json` crons array
- Create `app/api/cron/[name]/route.ts` with `export async function GET()`
- Use `maxDuration` if needed
- Can call `fireRelay` for non-blocking work or call functions directly

---

## Summary: Integration Points

| Feature | Where to add | What to call |
|---|---|---|
| Widget learning weights | `rankProduct()` in widget | Fetch from `/api/learning/weights` or pass via API response |
| Widget channel grouping | Widget data fetch + render | Add `channelId` to `/api/inbox` response, group in UI |
| Widget explore/exploit tag | `rankProduct()` + render | Tag based on `deltaType` + confidence threshold |
| Personalize caching | `getPersonalizedScore()` | Wrap 3 DB queries in Redis/in-memory cache 5min TTL |
| Increase feedback limit | `personalize.ts` line 23 | Raise `take: 200` or add recency filter |
| Learning cron | New `app/api/cron/run-learning/route.ts` | Call `runLearningCycle()` |
| Decay cron | New `app/api/cron/apply-decay/route.ts` | Call `applyDecay()` |
| Weekly report cron | New `app/api/cron/weekly-report/route.ts` | Call `generateWeeklyReport()` |
| All 3 new crons | `vercel.json` crons array | Weekly: `0 2 * * 1`, daily: `0 1 * * *` |

---

## Unresolved Questions
- What schedule for `runLearningCycle()`? Weekly seems right (matches `weekNumber` logic) but no current guidance.
- Should `applyDecay()` run before or after `runLearningCycle()`? Source comment is ambiguous.
- `personalize.ts` `take: 200` — is this a performance guard or oversight? Need clarification before raising limit.
- `ContentSuggestionsWidget` has no channel filter — is channel scoping needed at widget level or only at page level?
