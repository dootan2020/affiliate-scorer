# Phase 3: Content Analyzer Agent

## Context Links
- Parent: [plan.md](plan.md)
- Depends on: [Phase 1](phase-01-schema-nightly-learning.md) (actual* fields on ContentAsset)
- Research: [researcher-02](research/researcher-02-brief-api-ai.md) (quick-log API flow)
- Source: `app/api/log/quick/route.ts`, `lib/learning/match-tiktok-link.ts`

## Overview
- **Date:** 2026-03-08
- **Priority:** P1
- **Effort:** 2h
- **Status:** Complete
- **Description:** Agent that auto-extracts video metadata from TikTok oembed API when user logs results, classifies hookType/format/angle via lightweight AI call, and writes structured data to ContentAsset.actual* fields. Closes the biggest feedback loop gap.

## Key Insights
- TikTok oembed endpoint is free, no auth: `GET https://www.tiktok.com/oembed?url={url}`
- Returns: `{ title, author_name, thumbnail_url }` — title = caption text with hashtags
- `extractPostId()` in `match-tiktok-link.ts` already parses TikTok URLs
- Current quick-log flow: validate -> resolve asset -> calculate reward -> save metrics -> update status -> update weights -> analyze
- Content Analyzer hooks in AFTER asset status update, BEFORE learning weights update
- This ensures weights are updated with correct actual metadata, not just planned hookType
- AI classification call: ~500 tokens in, ~200 out = ~$0.001/call on Gemini Flash
- Existing `AiTaskType` needs `content_analysis` added (done in Phase 1)

## Requirements

### Functional
- F1: Extract caption + hashtags from TikTok oembed when tiktokUrl provided
- F2: AI classify: actualHookType, actualFormat, actualAngle from caption + existing asset context
- F3: Write actual* fields to ContentAsset
- F4: Write tiktokVideoId extracted from URL
- F5: Use actual* fields for learning weight update (prefer over planned fields)
- F6: Graceful degradation: if oembed fails, use existing asset fields; if AI fails, skip classification

### Non-Functional
- NF1: Oembed call < 2s timeout
- NF2: AI classification < 3s
- NF3: Total added latency to quick-log: < 5s
- NF4: Agent file under 200 lines

## Architecture

### Updated Quick-Log Flow
```
POST /api/log/quick
  |-> Validate input (Zod)
  |-> Resolve assetId
  |-> Calculate reward
  |-> Save AssetMetric
  |-> Update asset status -> "logged"
  |-> [NEW] Content Analyzer:
  |     |-> Extract oembed (if tiktokUrl)
  |     |-> AI classify hookType/format/angle
  |     |-> Update ContentAsset.actual* fields
  |-> Update learning weights (using actual* if available)
  |-> Win/Loss analysis
  |-> Return response
```

### Oembed Integration
```
GET https://www.tiktok.com/oembed?url=https://www.tiktok.com/@user/video/1234
Response:
{
  "title": "caption text #hashtag1 #hashtag2",
  "author_name": "username",
  "thumbnail_url": "https://..."
}
```

### AI Classification Prompt
```
Given this TikTok video context:
- Caption: "{caption}"
- Hashtags: ["{tags}"]
- Planned hook: "{asset.hookType}"
- Planned format: "{asset.format}"
- Product category: "{category}"

Classify the actual content:
{
  "hookType": "result|price|compare|myth|problem|unbox|trend",
  "format": "review_short|demo|compare|unbox|lifestyle|greenscreen|problem_solution",
  "angle": "brief description of actual content angle"
}
```

## Related Code Files

### Files to Create
- `lib/agents/content-analyzer.ts` — Agent logic (<180 lines)
- `lib/agents/tiktok-oembed.ts` — Oembed extraction helper (<60 lines)

### Files to Modify
- `app/api/log/quick/route.ts` — Hook Content Analyzer after asset update (lines 86-98)

## Implementation Steps

### Step 1: Create TikTok Oembed Helper (20 min)

1. Create `lib/agents/tiktok-oembed.ts`
2. Export interface:
   ```typescript
   interface OembedResult {
     caption: string;
     authorName: string;
     thumbnailUrl: string;
     hashtags: string[];
   }
   ```
3. Export `fetchTikTokOembed(url: string): Promise<OembedResult | null>`
4. Implementation:
   - `fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`)` with 2s timeout
   - Parse JSON response
   - Extract hashtags from title using regex: `/#[\w\u00C0-\u024F]+/g`
   - Return structured result, or null on any error
   - Try-catch entire function — never throw

### Step 2: Create Content Analyzer Agent (60 min)

1. Create `lib/agents/content-analyzer.ts`
2. Export interface:
   ```typescript
   interface AnalyzerResult {
     actualHookType: string | null;
     actualFormat: string | null;
     actualAngle: string | null;
     caption: string | null;
     hashtags: string[];
     tiktokVideoId: string | null;
   }
   ```
3. Export `analyzeContent(assetId: string, tiktokUrl: string | null): Promise<AnalyzerResult>`
4. Implementation:
   a. Fetch asset with productIdentity (for category)
   b. If tiktokUrl: call `fetchTikTokOembed(tiktokUrl)`
   c. Extract tiktokVideoId from URL via `extractPostId()`
   d. If oembed succeeded or asset has hookType/format:
      - Build classification prompt (see Architecture)
      - Call `callAI(systemPrompt, prompt, 500, "content_analysis")`
      - Parse JSON response
      - Validate hookType/format against allowed values
   e. If AI call fails: fallback to asset's existing hookType/format as actual*
   f. Update ContentAsset:
      ```typescript
      await prisma.contentAsset.update({
        where: { id: assetId },
        data: {
          actualHookType: result.actualHookType,
          actualFormat: result.actualFormat,
          actualAngle: result.actualAngle,
          tiktokVideoId: result.tiktokVideoId,
          postedAt: new Date(),
        },
      });
      ```
   g. Return AnalyzerResult

### Step 3: Hook into Quick-Log API (30 min)

1. Open `app/api/log/quick/route.ts`
2. After line 86 (asset status update), before line 88 (learning weights):
   ```typescript
   // Content Analyzer: extract actual metadata
   let actualAsset = asset;
   try {
     const analyzerResult = await analyzeContent(assetId, body.tiktokUrl || null);
     if (analyzerResult.actualHookType || analyzerResult.actualFormat) {
       actualAsset = {
         ...asset,
         hookType: analyzerResult.actualHookType || asset.hookType,
         format: analyzerResult.actualFormat || asset.format,
         angle: analyzerResult.actualAngle || asset.angle,
       };
     }
   } catch (err) {
     console.warn("[log/quick] Content analyzer failed, using original asset:", err);
   }
   ```
3. Update learning weights call to use `actualAsset` instead of `asset`:
   ```typescript
   await updateLearningWeights(
     {
       hookType: actualAsset.hookType,
       format: actualAsset.format,
       angle: actualAsset.angle,
       category: asset.productIdentity?.category || null,
       channelId: asset.channelId || null,
     },
     reward,
   );
   ```

### Step 4: Verify & Test (30 min)

1. Run `pnpm build` — verify no errors
2. Test with real TikTok URL: verify oembed extraction works
3. Test with invalid URL: verify graceful fallback
4. Test without URL (assetId only): verify skip behavior
5. Verify ContentAsset.actual* fields populated after log

## Todo List
- [ ] Create lib/agents/tiktok-oembed.ts
- [ ] Create lib/agents/content-analyzer.ts
- [ ] Hook analyzer into app/api/log/quick/route.ts
- [ ] Use actual* fields for learning weight update
- [ ] Graceful fallback on oembed/AI failure
- [ ] Build check passes
- [ ] Test with real TikTok URL
- [ ] Test graceful degradation

## Success Criteria
- Quick-log with TikTok URL populates actual* fields on ContentAsset
- Learning weights use actual metadata when available
- Quick-log without URL still works (no regression)
- Oembed failure doesn't break quick-log flow
- AI classification failure doesn't break quick-log flow
- Total added latency < 5s

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| TikTok rate-limits oembed | Medium | 2s timeout; fallback to existing asset fields; cache responses |
| AI classification inaccurate | Low | Only used for learning — bad classification self-corrects via weight averaging |
| Added latency to quick-log | Medium | Run analyzer async (fire-and-forget) if latency becomes issue |
| Oembed endpoint deprecation | Low | Oembed is optional enrichment; core flow works without it |

## Security Considerations
- Oembed URL validated via `extractPostId()` before fetch (prevents SSRF)
- AI response validated against allowed hookType/format values
- No user input passed directly to AI beyond validated TikTok URL

## Next Steps
- Phase 1's nightly learning processes assets with actual* fields for better ChannelMemory
- Phase 2's personalization benefits from more accurate learning weights

## Unresolved Questions
1. Should Content Analyzer run synchronously (blocking quick-log response) or async (fire-and-forget)?
   - Sync: ensures learning weights use actual data immediately
   - Async: faster response, but learning weights use planned data until next nightly run
   - Proposed: sync for now (< 5s), switch to async if latency complaints
2. Should we cache oembed responses to avoid re-fetching for same URL?
