# Code Review Report: AI Agent System

**Date:** 2026-03-08
**Reviewer:** Code Reviewer Agent
**Scope:** 15 new files + 7 modified files (AI Agent System implementation)
**LOC:** ~1,200 new lines across agent modules, API routes, and UI components

---

## Overall Assessment

Solid implementation with good architectural separation. Each agent has a clear single responsibility, error handling is generally defensive, and AI costs are well-managed (win-predictor and brief-personalization are $0 pure-DB). However, there are several security gaps in the Telegram webhook, performance concerns with sequential DB writes in loops, and missing input validation that need attention before production.

---

## Critical Issues

### C1. Telegram Webhook Has No Authentication (SECURITY)
**File:** `app/api/telegram/webhook/route.ts` (lines 5-25)
**Severity:** CRITICAL

The webhook endpoint accepts any POST request without verifying the sender is Telegram. An attacker can forge updates to inject fake competitor captures, manipulate channel data, or trigger unlimited TikTok oembed fetches.

**Impact:** Data poisoning, SSRF via crafted TikTok URLs, resource exhaustion.

**Fix:** Verify the request comes from Telegram using a webhook secret token. Telegram supports a `secret_token` parameter in `setWebhook` that gets sent as `X-Telegram-Bot-Api-Secret-Token` header.

```typescript
// In webhook route.ts
const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;
if (secretToken && request.headers.get("x-telegram-bot-api-secret-token") !== secretToken) {
  return NextResponse.json({ ok: true }); // Silent reject
}
```

```typescript
// In setup route.ts — add secret_token to setWebhook call
body: JSON.stringify({ url: webhookUrl, secret_token: process.env.TELEGRAM_WEBHOOK_SECRET }),
```

### C2. SSRF Risk via TikTok Oembed Fetch (SECURITY)
**File:** `lib/agents/tiktok-oembed.ts` (line 20-21)
**Severity:** CRITICAL

`fetchTikTokOembed` passes any URL through `encodeURIComponent` to TikTok's oembed API. While TikTok's API itself is the target, the Telegram bot handler at `lib/agents/telegram-bot-handler.ts` (line 118-120) extracts URLs with a regex that matches `tiktok.com` patterns. However, a crafted URL like `tiktok.com.evil.com/@user/video/123` could match the regex. The regex anchoring is insufficient.

**Impact:** Attackers could send crafted URLs through Telegram to probe internal services or abuse the oembed endpoint.

**Fix:** Validate the URL hostname strictly before making the fetch:

```typescript
export async function fetchTikTokOembed(url: string): Promise<OembedResult | null> {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    const validHosts = ["www.tiktok.com", "tiktok.com", "vm.tiktok.com", "vn.tiktok.com"];
    if (!validHosts.includes(parsed.hostname)) return null;
    // ... rest of fetch
  }
}
```

---

## High Priority

### H1. Trend Intelligence: N+1 DB Writes in Loop (PERFORMANCE)
**File:** `lib/agents/trend-intelligence.ts` (lines 92-104)
**Severity:** HIGH

Each `CompetitorCapture` is updated individually inside a loop, producing N sequential DB writes per channel batch. With 100 captures across 5 channels, this could mean 100 individual UPDATE queries.

**Fix:** Use `prisma.competitorCapture.updateMany` with a shared `detectedHookType`/`detectedFormat` for the batch, or accumulate IDs and batch-update:

```typescript
const captureIds = channelCaptures.map(c => c.id);
const trend = trends[0];
await prisma.competitorCapture.updateMany({
  where: { id: { in: captureIds } },
  data: {
    detectedHookType: trend?.hook || null,
    detectedFormat: trend?.format || null,
    detectedAngle: trend?.angle || null,
    trendScore: trend?.trendScore || null,
    analyzedAt: new Date(),
  },
});
```

### H2. Nightly Learning: No Concurrency Guard (RACE CONDITION)
**File:** `app/api/cron/nightly-learning/route.ts`
**Severity:** HIGH

If Vercel retries the cron job (e.g., due to timeout near 60s), two instances could run simultaneously, both regenerating patterns and upserting ChannelMemory. `regeneratePatterns` does a `deleteMany` + `create` loop (line 116-135 in pattern-detection.ts), which could cause data loss if interleaved.

**Fix:** Add a simple distributed lock check. For example, use a DB row with a timestamp:

```typescript
// Check if already running (within last 5 minutes)
const recentRun = await prisma.channelMemory.findFirst({
  where: { lastUpdated: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
});
// Or use a dedicated lock table / advisory lock
```

### H3. Predict-Win API Has No Auth (SECURITY)
**File:** `app/api/agents/predict-win/route.ts`
**Severity:** HIGH

The endpoint is publicly accessible. While it only reads data, it exposes business intelligence (channel win rates, product scoring, learning weights). Any user can enumerate productId/channelId combinations to extract competitive intelligence.

**Fix:** Add authentication middleware or at minimum a session check. Even a simple API key check would help.

### H4. Content Analyzer Blocks Quick Log Response (PERFORMANCE)
**File:** `app/api/log/quick/route.ts` (lines 93-100)
**Severity:** HIGH

`analyzeContent` makes an external fetch to TikTok oembed (up to 3s timeout) + an AI classification call (potentially 5-10s). This runs synchronously in the quick-log request path, significantly slowing the user-facing API.

**Fix:** Fire-and-forget the analyzer, or queue it as a background task:

```typescript
// Don't await — fire and forget
analyzeContent(assetId, body.tiktokUrl || null).catch(err => {
  console.warn("[log/quick] Background content analysis failed:", err);
});
```

### H5. JSON.parse of AI Responses Without Try-Catch Isolation (TYPE SAFETY)
**File:** `lib/agents/trend-intelligence.ts` (line 84)
**Severity:** HIGH

The `JSON.parse(cleaned)` call is inside a try-catch, but the catch block at line 121-124 still counts `capturesAnalyzed += channelCaptures.length` even on error, and does NOT mark captures as analyzed. This means on the next cron run, the same captures will be re-processed, potentially causing infinite AI cost if the AI consistently returns unparseable JSON.

**Fix:** Mark captures as analyzed even on AI parse failure, to prevent retry loops:

```typescript
} catch (err) {
  console.error(`[trend-intelligence] Error for channel ${channelId}:`, err);
  // Mark as analyzed to prevent retry storm
  await prisma.competitorCapture.updateMany({
    where: { id: { in: channelCaptures.map(c => c.id) } },
    data: { analyzedAt: new Date() },
  });
  result.capturesAnalyzed += channelCaptures.length;
}
```

---

## Medium Priority

### M1. ChannelMemory Upsert Missing Required Fields (DATA INTEGRITY)
**File:** `lib/agents/trend-intelligence.ts` (lines 108-117)
**Severity:** MEDIUM

The `channelMemory.upsert` in trend-intelligence only provides `trendingInsights` in the create block but the schema requires defaults for all JSON fields. This works due to Prisma defaults, but the created ChannelMemory will have `totalVideos: 0, avgReward: 0`, which is misleading — it looks like the channel was analyzed but has no data.

**Fix:** Only use `update`, not `upsert`. If no ChannelMemory exists, it means nightly-learning hasn't run yet for that channel, so don't create a misleading empty one:

```typescript
await prisma.channelMemory.updateMany({
  where: { channelId },
  data: { trendingInsights: trendingJson },
});
```

### M2. Brief Personalization Casts JSON Without Validation (TYPE SAFETY)
**File:** `lib/agents/brief-personalization.ts` (lines 76, 110)
**Severity:** MEDIUM

`memory.winningCombos` is cast from `Json` to a specific array type without runtime validation. If the stored JSON doesn't match (e.g., from a schema migration or manual DB edit), this will throw at runtime.

Similarly, `memory.trendingInsights` at line 110 is cast without validation.

**Fix:** Add defensive checks:

```typescript
const rawCombos = memory.winningCombos;
const winningCombos = Array.isArray(rawCombos)
  ? (rawCombos as Array<{hookType?: string; format?: string; category?: string; winRate?: number}>)
      .filter(c => c.hookType && c.format)
      .slice(0, 5)
  : [];
```

### M3. Telegram Bot: chatId Type Inconsistency
**File:** `lib/agents/telegram-bot-handler.ts`
**Severity:** MEDIUM

Telegram sends `chat.id` as a number, but `TelegramChat.chatId` in Prisma is a String. The code converts via `String(chatId)` in `getOrCreateChat` (line 192) and `setActiveChannel` (line 200), but the `BotResponse.chatId` is typed as `number` and passed directly to `sendTelegramMessage`. This works but is fragile — if someone adds chatId filtering on the DB side, the type mismatch could cause silent failures.

### M4. PwaHead Registers SW Without Checking manifest.json Exists
**File:** `components/shared/pwa-head.tsx` (line 8)
**Severity:** MEDIUM

`navigator.serviceWorker.register("/sw.js")` is called but there's no evidence that `/public/sw.js` exists. If it doesn't exist, every page load will trigger a 404 fetch + console warning.

**Fix:** Verify `sw.js` exists in the public directory, or add a conditional check.

### M5. Nightly Learning: Channel Limit of 10 Is Hardcoded
**File:** `lib/agents/nightly-learning.ts` (line 26)
**Severity:** MEDIUM

`take: 10` means if the user has more than 10 active channels, some will never get their patterns regenerated. This limit should be documented or configurable.

### M6. callAI Import Not Used in channel-memory-builder.ts
**File:** `lib/agents/channel-memory-builder.ts` (line 3)
**Severity:** LOW (but noted as medium because it imports a heavy module)

`callAI` is imported but only used in `generateInsightSummary`. The import is valid, but `buildChannelMemory` is also exported and called independently. The heavy import is loaded even when only the pure-DB function is needed.

---

## Low Priority

### L1. Redundant JSON.parse(JSON.stringify(trends)) in trend-intelligence.ts
**File:** `lib/agents/trend-intelligence.ts` (line 107)
**Severity:** LOW

`JSON.parse(JSON.stringify(trends))` is used to deep-clone the trends array. This is unnecessary since `trends` is already a freshly parsed object from `JSON.parse`. The cloning adds CPU overhead for no benefit.

### L2. Win Predictor sigmoid Threshold Magic Number
**File:** `lib/agents/win-predictor.ts` (line 150)
**Severity:** LOW

`sigmoid(totalContribution - 5)` uses a magic number `5` as the centering point. Should be documented as a named constant (e.g., `SIGMOID_CENTER = 5`) to explain why this value was chosen.

### L3. MobileFab Hardcoded Route
**File:** `components/shared/mobile-fab.tsx` (line 9)
**Severity:** LOW

The FAB links to `/log` which is hardcoded. If the route changes, this will break silently. Consider importing route constants.

### L4. Telegram Setup Leaks webhookUrl in Response
**File:** `app/api/telegram/setup/route.ts` (lines 37-41)
**Severity:** LOW

The response includes the full `webhookUrl` and the raw Telegram API result. This reveals internal infrastructure details. Since this endpoint requires `CRON_SECRET` auth, the risk is low, but it's still unnecessary information exposure.

---

## Edge Cases Found

1. **Empty channel memory on first nightly run:** When `existingMemory` is null AND `recentMetrics === 0`, the channel is skipped (line 46-49 in nightly-learning.ts). This means a channel with old data but no ChannelMemory record will never get its memory built until new metrics arrive.

2. **Division by zero in channel-memory-builder.ts:** If `assets.length` is 0, `avgReward` would be `0/0 = NaN`. This is guarded by the early return on line 30-31, so it's safe. However, if `groups` contain entries where all metrics are null, `rewards` will be all-zero, leading to `winRate = 0` universally. Not a bug, but could mask data quality issues.

3. **Telegram URL with trailing whitespace:** The regex `TIKTOK_URL_REGEX` at line 24 of telegram-bot-handler.ts doesn't account for Telegram's markdown parsing which may wrap URLs in angle brackets or add invisible characters. The `text.trim()` at line 50 helps, but `text.match(TIKTOK_URL_REGEX)` could still fail on URLs embedded in longer messages with special characters.

4. **Concurrent brief generation + nightly learning race:** If nightly learning runs `deleteMany` on UserPattern while `brief-personalization` is reading patterns for a brief, the brief could get stale/empty pattern data. Low probability but possible during the nightly window.

5. **`maxDuration = 60` may be insufficient:** Both cron routes set `maxDuration = 60` (seconds). The nightly-learning route processes up to 10 channels sequentially, each with AI calls. If each AI call takes 5-10s, processing 10 channels could exceed 60s. The trend-analysis route processes up to 100 captures with AI calls, also risky.

---

## Positive Observations

1. **Cost-conscious architecture:** Win predictor and brief-personalization are $0 pure-DB computation. AI calls are only made when genuinely needed (content-analyzer skips when no context, trend-intelligence skips single captures).

2. **Defensive error handling:** Most agent functions return fallback values rather than throwing. The content-analyzer returns a fallback result, the oembed helper returns null, and the Telegram webhook always returns 200 to prevent retry storms.

3. **Clean separation of concerns:** Each agent has a single clear responsibility. The data flow is well-defined: Telegram captures -> trend analysis -> channel memory -> brief personalization -> content brief generation.

4. **Zod validation on API inputs:** The predict-win route properly validates request body with Zod schema.

5. **Channel memory as a caching layer:** ChannelMemory acts as a materialized view, avoiding expensive real-time aggregation during brief generation.

6. **Vercel cron auth:** Both cron routes verify `CRON_SECRET` via `verifyCronAuth`, which correctly falls back to allow in development.

---

## Recommended Actions

1. **[CRITICAL]** Add webhook secret verification to Telegram webhook endpoint
2. **[CRITICAL]** Add URL hostname validation in tiktok-oembed.ts before fetching
3. **[HIGH]** Batch DB updates in trend-intelligence.ts loop
4. **[HIGH]** Make content analyzer non-blocking in quick-log route
5. **[HIGH]** Mark captures as analyzed even on AI parse failure (prevent retry cost explosion)
6. **[HIGH]** Add auth to predict-win API endpoint
7. **[MEDIUM]** Don't upsert empty ChannelMemory in trend-intelligence — use updateMany instead
8. **[MEDIUM]** Add runtime validation for JSON casts from Prisma Json fields
9. **[MEDIUM]** Verify sw.js exists or remove PwaHead service worker registration
10. **[MEDIUM]** Make channel limit configurable or increase from 10

---

## Metrics

- **Type Coverage:** ~90% (Good use of interfaces, but several `Json` -> typed casts lack runtime validation)
- **Test Coverage:** Not assessed (no test files found for agent modules)
- **Linting Issues:** 0 syntax errors detected in manual review
- **Security Issues:** 2 critical, 1 high
- **Performance Issues:** 3 high

---

## Unresolved Questions

1. Does `/public/sw.js` exist? If not, `PwaHead` will cause 404s on every page load.
2. Is there an existing auth middleware that could protect `/api/agents/predict-win`? The codebase uses `verifyCronAuth` for crons but there's no session/auth check pattern for user-facing API routes.
3. What happens when `maxDuration = 60` is exceeded? Vercel will kill the function, but the partially-processed data may leave ChannelMemory in an inconsistent state (some channels updated, others not, patterns deleted but not re-created).
