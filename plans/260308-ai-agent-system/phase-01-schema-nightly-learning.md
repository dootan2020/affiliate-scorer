# Phase 1: Schema Migrations + Nightly Learning Agent + ChannelMemory

## Context Links
- Parent: [plan.md](plan.md)
- Dependencies: None (foundation phase)
- Research: [researcher-01](research/researcher-01-schema-cron-learning.md)
- Brainstorm: [report](../260308-ai-agent-system-brainstorm/report.md)
- Code standards: [docs/code-standards.md](../../docs/code-standards.md)

## Overview
- **Date:** 2026-03-08
- **Priority:** P0
- **Effort:** 3h
- **Status:** Complete
- **Description:** Add 3 new DB models (ChannelMemory, CompetitorCapture, TelegramChat), extend ContentAsset + UserPattern, convert weekly-learning to nightly-learning, create Nightly Learning agent that generates ChannelMemory summaries.

## Key Insights
- `LearningWeightP4` already supports per-channel weights via `channelId` field — no changes needed there
- `UserPattern` lacks `channelId` — currently global only, needs per-channel support
- `ContentAsset` has `hookType`/`format`/`angle` but lacks "actual" fields for post-publish metadata
- Weekly learning (Sunday cron) too slow for 5 videos/day cadence — nightly enables next-morning feedback
- `update-weights.ts` already dual-writes channel + global — pattern detection needs same treatment
- Existing `regeneratePatterns()` deletes all patterns then recreates — needs channelId grouping added

## Requirements

### Functional
- F1: Add `actualHookType`, `actualFormat`, `actualAngle`, `postedAt`, `tiktokVideoId` to ContentAsset
- F2: Add `channelId` to UserPattern with index
- F3: Create ChannelMemory model (1:1 with TikTokChannel)
- F4: Create CompetitorCapture model (for Phase 4, schema only now)
- F5: Create TelegramChat model (for Phase 4, schema only now)
- F6: Nightly Learning agent: update weights + regenerate patterns + generate ChannelMemory
- F7: Replace `/api/cron/weekly-learning` with `/api/cron/nightly-learning`
- F8: Update `vercel.json` cron schedule

### Non-Functional
- NF1: Nightly cron must complete within 60s (Vercel limit)
- NF2: ChannelMemory generation: max 1 AI call per active channel
- NF3: Skip ChannelMemory regeneration if no new data since last update

## Architecture

### ChannelMemory Model
```prisma
model ChannelMemory {
  id        String @id @default(cuid())
  channelId String @unique
  channel   TikTokChannel @relation(fields: [channelId], references: [id], onDelete: Cascade)

  totalVideos       Int     @default(0)
  totalOrders       Int     @default(0)
  avgReward         Decimal @default(0) @db.Decimal(8,4)

  winningCombos     Json @default("[]")
  losingCombos      Json @default("[]")
  usedAngles        Json @default("[]")
  usedHooks         Json @default("[]")
  trendingInsights  Json @default("[]")

  insightSummary    String?

  lastUpdated       DateTime @updatedAt
  createdAt         DateTime @default(now())
}
```

### Nightly Learning Agent Flow
```
22:00 UTC trigger
  |-> Query all AssetMetric from last 24h
  |-> For each active channel:
  |     |-> Recalculate LearningWeightP4 (already handled by update-weights on log)
  |     |-> Regenerate UserPattern per-channel + global
  |     |-> Compute winning/losing combos (hookType x format x category)
  |     |-> Count used angles + hooks from ContentAsset
  |     |-> If new data exists: AI call for insightSummary (~500 tokens)
  |     |-> Upsert ChannelMemory
  |-> Log results
```

### Data Flow
```
AssetMetric (logged) --> NightlyLearning agent
ContentAsset (metadata) --> NightlyLearning agent
                                |
                                v
                          ChannelMemory (upsert)
                          UserPattern (regenerate per-channel)
```

## Related Code Files

### Files to Create
- `lib/agents/nightly-learning.ts` — Main agent logic (<200 lines)
- `lib/agents/channel-memory-builder.ts` — ChannelMemory computation (<150 lines)
- `app/api/cron/nightly-learning/route.ts` — Cron endpoint

### Files to Modify
- `prisma/schema.prisma` — Add 3 models, extend 2 models
- `lib/learning/pattern-detection.ts` — Add channelId grouping to `regeneratePatterns()`
- `vercel.json` — Change weekly-learning to nightly-learning schedule

### Files to Delete
- `app/api/cron/weekly-learning/route.ts` — Replaced by nightly-learning

## Implementation Steps

### Step 1: Schema Migration (30 min)

1. Open `prisma/schema.prisma`
2. Add fields to ContentAsset (after line 632, before publishedUrl):
   ```prisma
   // Agent-extracted actual metadata (post-publish)
   actualHookType  String?
   actualFormat    String?
   actualAngle     String?
   postedAt        DateTime?
   tiktokVideoId   String?
   ```
3. Add `channelId` to UserPattern:
   ```prisma
   model UserPattern {
     // ... existing fields ...
     channelId String @default("")
     @@index([channelId])
   }
   ```
4. Add ChannelMemory model (see Architecture section above)
5. Add CompetitorCapture model:
   ```prisma
   model CompetitorCapture {
     id        String @id @default(cuid())
     channelId String
     channel   TikTokChannel @relation(fields: [channelId], references: [id], onDelete: Cascade)
     tiktokUrl     String
     authorHandle  String?
     caption       String?
     hashtags      Json @default("[]")
     thumbnailUrl  String?
     userNote      String?
     detectedHookType  String?
     detectedFormat    String?
     detectedAngle     String?
     trendScore        Int?
     analyzedAt    DateTime?
     createdAt     DateTime @default(now())
     @@index([channelId])
     @@index([createdAt(sort: Desc)])
   }
   ```
6. Add TelegramChat model:
   ```prisma
   model TelegramChat {
     id              String @id @default(cuid())
     chatId          String @unique
     activeChannelId String?
     apiKey          String?
     createdAt       DateTime @default(now())
     updatedAt       DateTime @updatedAt
   }
   ```
7. Add relations to TikTokChannel: `channelMemory ChannelMemory?`, `competitorCaptures CompetitorCapture[]`
8. Run `npx prisma db push` (or create migration)
9. Run `npx prisma generate`

### Step 2: Update Pattern Detection (30 min)

1. Open `lib/learning/pattern-detection.ts`
2. Add `channelId` parameter to `regeneratePatterns(channelId?: string)`
3. When channelId provided: filter assets by channelId, delete only channel patterns, create channel patterns
4. When channelId absent: run global patterns (existing behavior)
5. Update UserPattern creation to include channelId field
6. Change `deleteMany()` to `deleteMany({ where: { channelId } })` for targeted cleanup

### Step 3: Create Channel Memory Builder (45 min)

1. Create `lib/agents/channel-memory-builder.ts`
2. Export `buildChannelMemory(channelId: string): Promise<ChannelMemoryData>`
3. Logic:
   - Query ContentAsset where channelId + has metrics, ordered by createdAt desc
   - Count totalVideos, sum totalOrders from AssetMetric
   - Compute avgReward across all metrics
   - Group by hookType x format x category, calculate winRate per combo
   - Top 5 winning combos (winRate >= 50%, sampleSize >= 2)
   - Top 5 losing combos (winRate < 30%, sampleSize >= 2)
   - Extract used angles from ContentAsset.angle (deduplicated)
   - Extract used hooks from ContentAsset.hookText (with avgReward per hook)
4. Export `generateInsightSummary(channelName: string, memory: ChannelMemoryData): Promise<string>`
   - Call `callAI()` with task type `content_analysis`
   - Prompt: summarize channel performance in 1-2 Vietnamese sentences
   - Max 200 tokens output

### Step 4: Create Nightly Learning Agent (45 min)

1. Create `lib/agents/nightly-learning.ts`
2. Export `runNightlyLearning(): Promise<NightlyLearningResult>`
3. Logic:
   - Query all active TikTokChannels
   - For each channel with recent metrics (last 24h):
     a. Call `regeneratePatterns(channelId)` for per-channel patterns
     b. Call `buildChannelMemory(channelId)` for memory data
     c. Check if ChannelMemory.lastUpdated exists and no new data -> skip AI call
     d. If new data: `generateInsightSummary()` for AI insight
     e. Upsert ChannelMemory record
   - Run `regeneratePatterns()` (no channelId = global patterns)
   - Return summary: { channelsProcessed, patternsGenerated, memoriesUpdated }

### Step 5: Create Nightly Learning Cron Route (20 min)

1. Create `app/api/cron/nightly-learning/route.ts`
2. Pattern: same as existing weekly-learning (verifyCronAuth, try-catch, JSON response)
3. Call `runNightlyLearning()` + `runLearningCycle()` (from existing `lib/ai/learning`)
4. Log results, return JSON summary

### Step 6: Update Cron Schedule (10 min)

1. Delete `app/api/cron/weekly-learning/route.ts`
2. Update `vercel.json`:
   - Remove weekly-learning entry
   - Add: `{ "path": "/api/cron/nightly-learning", "schedule": "0 22 * * *" }`
3. Keep retry-scoring, decay, morning-brief, weekly-report unchanged

### Step 7: Add AI Task Type (10 min)

1. Open `lib/ai/claude.ts`
2. Add `"content_analysis"` to `AiTaskType` union
3. Default model: use Gemini Flash (configured via aiModelConfig DB table at runtime)

### Step 8: Verify & Test (30 min)

1. Run `pnpm build` — verify no TypeScript errors
2. Manually test nightly-learning endpoint: `curl POST /api/cron/nightly-learning` with auth header
3. Verify ChannelMemory records created
4. Verify UserPattern records have channelId

## Todo List
- [ ] Schema: Add actual* fields to ContentAsset
- [ ] Schema: Add channelId to UserPattern
- [ ] Schema: Create ChannelMemory model
- [ ] Schema: Create CompetitorCapture model
- [ ] Schema: Create TelegramChat model
- [ ] Schema: Add relations to TikTokChannel
- [ ] Schema: Run migration
- [ ] Update pattern-detection.ts with channelId support
- [ ] Create lib/agents/channel-memory-builder.ts
- [ ] Create lib/agents/nightly-learning.ts
- [ ] Create app/api/cron/nightly-learning/route.ts
- [ ] Add content_analysis to AiTaskType
- [ ] Delete app/api/cron/weekly-learning/route.ts
- [ ] Update vercel.json cron schedule
- [ ] Build check passes
- [ ] Manual test of nightly-learning endpoint

## Success Criteria
- `pnpm build` passes with zero errors
- Prisma schema validates and migrates successfully
- Nightly learning cron creates/updates ChannelMemory for active channels
- UserPattern records include channelId for per-channel patterns
- Global patterns still generated (backward compatible)
- Cron completes within 60s for up to 10 active channels

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Migration breaks existing data | High | Use `db push` with additive changes only (all new fields nullable or have defaults) |
| Nightly cron exceeds 60s | Medium | Skip AI call if no new data; batch channels; limit to 10 channels |
| Pattern detection regression | Medium | Keep global pattern behavior unchanged; add channelId as optional param |
| ChannelMemory stale after cron failure | Low | Brief gen checks lastUpdated; falls back to direct queries if >48h old |

## Security Considerations
- Cron endpoint protected by `verifyCronAuth()` — requires CRON_SECRET header
- AI calls use existing encrypted API key infrastructure
- No user-facing endpoints in this phase

## Next Steps
- Phase 2 reads ChannelMemory for brief personalization
- Phase 3 writes actual* fields on ContentAsset via Content Analyzer
- Phase 4 writes CompetitorCapture via Telegram Bot

## Unresolved Questions
1. Should `runLearningCycle()` (from `lib/ai/learning`) also run nightly, or keep it weekly? It does accuracy evaluation which may need weekly cadence.
2. Max number of channels to process per nightly run? (Proposed: 10, configurable)
3. Should we keep weekly-learning as fallback, or fully replace?
