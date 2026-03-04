# Phase 5: Automation Cron Jobs

## Context Links

- Existing Cron: `app/api/cron/retry-scoring/route.ts` (pattern reference)
- Decay: `lib/learning/decay.ts` (applyDecay)
- Learning Cycle: `lib/ai/learning.ts` (runLearningCycle)
- Pattern Detection: `lib/learning/pattern-detection.ts` (regeneratePatterns)
- Weekly Report: `lib/reports/generate-weekly-report.ts` (generateWeeklyReport)
- Vercel Config: `vercel.json` (cron schedule — native Vercel support)

## Overview

- **Priority:** P2
- **Status:** Pending
- **Review Status:** Pending
- **Effort:** 1.5h
- **Description:** Create 3 cron job endpoints to automate: (a) daily weight decay, (b) weekly learning cycle + pattern regeneration, (c) weekly report generation. All follow existing cron pattern.

## Key Insights

- Only 1 cron exists: `retry-scoring` at daily midnight. Pattern: `vercel.json` schedule + GET route handler + maxDuration=30.
- Deployment is on **Vercel** — native cron support via `vercel.json`. Just add entries to the crons array.
- `applyDecay()`: simple loop, updates weights. Fast (~1-2s for 50 weights). Safe for daily run.
- `runLearningCycle()`: calls Claude AI, processes feedbacks, updates weights. Can take 10-30s depending on data size. Must complete within 60s.
- `regeneratePatterns()`: queries all assets with metrics, groups, saves patterns. ~2-5s.
- `generateWeeklyReport()`: calls Claude AI, aggregates metrics. Guards on `videosPublished < 5` (returns null). ~10-20s.

## Requirements

### Functional

**5a: Daily Weight Decay** (`/api/cron/decay`)
- Schedule: daily at 1:00 AM UTC
- Calls `applyDecay()`
- Logs result: `{ updated, skipped }`
- maxDuration: 30s

**5b: Weekly Learning Cycle** (`/api/cron/weekly-learning`)
- Schedule: Sunday at 00:00 UTC
- Calls `runLearningCycle()` then `regeneratePatterns()`
- Logs results of both
- maxDuration: 60s (learning cycle needs AI call)

**5c: Weekly Report** (`/api/cron/weekly-report`)
- Schedule: Sunday at 06:00 UTC (after learning cycle completes)
- Calls `generateWeeklyReport()`
- If returns null (not enough data), log and return 200 OK
- maxDuration: 60s

### Non-functional
- Each cron must complete within Vercel free tier limits (60s max)
- Auth: Vercel automatically validates cron requests via `authorization` header
- Idempotent: running same cron twice in a day should be safe
- Error handling: catch all errors, return 200 with error details (cron retries on 5xx)

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `app/api/cron/decay/route.ts` | Daily decay cron handler |
| `app/api/cron/weekly-learning/route.ts` | Weekly learning + patterns cron handler |
| `app/api/cron/weekly-report/route.ts` | Weekly report cron handler |

### Cron Pattern (from existing retry-scoring)

```typescript
export const maxDuration = 30;

import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  try {
    // ... business logic ...
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cron/name]", error);
    // Return 200 to prevent cron retry on expected errors
    return NextResponse.json({ ok: false, error: String(error) });
  }
}
```

## Related Code Files

| File | Action |
|------|--------|
| `app/api/cron/decay/route.ts` | CREATE |
| `app/api/cron/weekly-learning/route.ts` | CREATE |
| `app/api/cron/weekly-report/route.ts` | CREATE |
| `vercel.json` | MODIFY — add 3 new cron entries |

## Implementation Steps

### Step 1: Create `app/api/cron/decay/route.ts`

```typescript
export const maxDuration = 30;

import { NextResponse } from "next/server";
import { applyDecay } from "@/lib/learning/decay";

export async function GET(): Promise<NextResponse> {
  try {
    const result = await applyDecay();
    console.log("[cron/decay]", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[cron/decay]", msg);
    return NextResponse.json({ ok: false, error: msg });
  }
}
```

### Step 2: Create `app/api/cron/weekly-learning/route.ts`

```typescript
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { runLearningCycle } from "@/lib/ai/learning";
import { regeneratePatterns } from "@/lib/learning/pattern-detection";

export async function GET(): Promise<NextResponse> {
  try {
    // Step 1: Run learning cycle (updates weights via AI)
    const learningResult = await runLearningCycle();
    console.log("[cron/weekly-learning] learning:", {
      accuracy: learningResult.accuracy,
      weightsAdjusted: learningResult.weightsAdjusted,
    });

    // Step 2: Regenerate patterns (uses updated data)
    const patternResult = await regeneratePatterns();
    console.log("[cron/weekly-learning] patterns:", patternResult);

    return NextResponse.json({
      ok: true,
      learning: {
        accuracy: learningResult.accuracy,
        previousAccuracy: learningResult.previousAccuracy,
        weightsAdjusted: learningResult.weightsAdjusted,
        patterns: learningResult.patterns.length,
      },
      patternDetection: patternResult,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[cron/weekly-learning]", msg);
    return NextResponse.json({ ok: false, error: msg });
  }
}
```

### Step 3: Create `app/api/cron/weekly-report/route.ts`

```typescript
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { generateWeeklyReport } from "@/lib/reports/generate-weekly-report";

export async function GET(): Promise<NextResponse> {
  try {
    const reportId = await generateWeeklyReport();

    if (!reportId) {
      console.log("[cron/weekly-report] Skipped — not enough published videos (<5)");
      return NextResponse.json({ ok: true, skipped: true, reason: "not_enough_data" });
    }

    console.log("[cron/weekly-report] Generated:", reportId);
    return NextResponse.json({ ok: true, reportId });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[cron/weekly-report]", msg);
    return NextResponse.json({ ok: false, error: msg });
  }
}
```

### Step 4: Update vercel.json

```json
{
  "crons": [
    {
      "path": "/api/cron/retry-scoring",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/decay",
      "schedule": "0 1 * * *"
    },
    {
      "path": "/api/cron/weekly-learning",
      "schedule": "0 0 * * 0"
    },
    {
      "path": "/api/cron/weekly-report",
      "schedule": "0 6 * * 0"
    }
  ]
}
```

### Step 5: Verify Vercel cron deployment

After deploying, verify crons appear in Vercel dashboard → Settings → Crons.
All 4 crons (retry-scoring + 3 new) should be listed with correct schedules.
No external service needed — Vercel handles scheduling natively.

## Todo List

- [ ] Create `app/api/cron/decay/route.ts`
- [ ] Create `app/api/cron/weekly-learning/route.ts`
- [ ] Create `app/api/cron/weekly-report/route.ts`
- [ ] Update `vercel.json` with new cron entries
- [ ] Verify compile: `pnpm build`
- [ ] Test each cron endpoint manually: `curl localhost:3000/api/cron/decay`
- [ ] Test weekly-learning with empty feedback (should handle gracefully)
- [ ] Test weekly-report with < 5 published videos (should return skipped)
- [ ] Verify crons appear in Vercel dashboard after deploy

## Success Criteria

- All 3 cron routes respond 200 OK
- Decay cron updates weights correctly
- Learning cron calls AI and updates weights + regenerates patterns
- Report cron generates report or skips gracefully
- Each completes within maxDuration
- Existing retry-scoring cron unaffected
- Build passes

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| weekly-learning exceeds 60s (AI call slow) | Medium | runLearningCycle already handles timeout internally; maxDuration=60 |
| Vercel free tier cron limits | Low | Free tier allows 2 cron jobs; Hobby plan allows unlimited. May need upgrade. |
| applyDecay runs when no weights exist | Low | Function handles empty array gracefully |
| Double-run in same period | Low | All functions are idempotent (upsert patterns, additive weights) |

## Security Considerations

- Cron endpoints are GET routes — could be called by anyone with the URL
- Current retry-scoring has no auth check either (consistent)
- For production: add `CRON_SECRET` header validation. Low priority since single-user app.
- No sensitive data exposed in responses

## Next Steps

- Phase 6: Personalization Cache
