# Phase 2: Brief Personalization Agent

## Context Links
- Parent: [plan.md](plan.md)
- Depends on: [Phase 1](phase-01-schema-nightly-learning.md) (ChannelMemory model must exist)
- Research: [researcher-02](research/researcher-02-brief-api-ai.md)
- Source: `lib/content/generate-brief.ts` (line 192, `buildBriefPrompt()`)

## Overview
- **Date:** 2026-03-08
- **Priority:** P1
- **Effort:** 2h
- **Status:** Pending
- **Description:** Inject ChannelMemory + per-channel learning weights + past brief history into brief generation prompt. NOT a separate AI call — pure context enrichment layer that makes existing brief generation channel-aware.

## Key Insights
- `generate-brief.ts` already accepts `BriefOptions` with channel context — extend it
- Current prompt injects channel persona but NOT performance history
- `buildBriefPrompt()` assembles blocks linearly — add ChannelMemory block after Character Bible block (line 219-221)
- Cost: $0 extra AI — just ~500 more tokens in prompt context (6000 -> 6500)
- `getWeights(channelId)` already returns per-channel weights with global fallback
- Past briefs queryable via `ContentBrief.where({ channelId })` — extract used angles

## Requirements

### Functional
- F1: Build "channel performance history" prompt block from ChannelMemory
- F2: Include top winning hooks + formats with stats
- F3: Include losing patterns to avoid
- F4: Include used angles from last 10 briefs (for dedup)
- F5: Include winning combos (hookType x format x category)
- F6: Include AI insight summary from ChannelMemory
- F7: Graceful fallback if ChannelMemory missing or stale (>48h)

### Non-Functional
- NF1: No additional AI calls — pure DB queries + prompt injection
- NF2: Added latency < 100ms (3-4 DB queries)
- NF3: Prompt token increase < 600 tokens

## Architecture

### Data Flow
```
Brief generation request (with channelId)
  |-> buildBriefPersonalization(channelId)
  |     |-> Query ChannelMemory
  |     |-> Query LearningWeightP4 (top 5 per scope)
  |     |-> Query ContentBrief (last 10 for this channel)
  |     |-> Query UserPattern (channelId patterns)
  |     |-> Build prompt block string
  |-> Inject into buildBriefPrompt() after characterBlock
  |-> Existing AI call generates brief with richer context
```

### Prompt Block Format
```
LICH SU KENH: {channelName}
- Da tao {n} briefs, {m} videos published
- Angles da dung: [{list}] — KHONG lap lai
- Hooks dang thang: [{hookType}: avgReward {x}, winRate {y}%]
- Hooks nen tranh: [{hookType}: avgReward {x}, failRate {y}%]
- Combos thang: [{hookType} + {format} + {category}: winRate {z}%]
- Ghi chu AI: "{insightSummary}"
```

## Related Code Files

### Files to Create
- `lib/agents/brief-personalization.ts` — Context builder (<150 lines)

### Files to Modify
- `lib/content/generate-brief.ts` — Add personalization block + BriefOptions extension
  - Add `channelMemory` to BriefOptions interface (optional)
  - Call `buildBriefPersonalization()` in `buildBriefPrompt()`
  - Inject result after characterBlock in prompt assembly
- `app/api/briefs/generate/route.ts` (or wherever brief generation is triggered) — Pass channelId to personalization builder

## Implementation Steps

### Step 1: Create Brief Personalization Builder (60 min)

1. Create `lib/agents/brief-personalization.ts`
2. Export interface:
   ```typescript
   interface PersonalizationContext {
     promptBlock: string;    // Ready-to-inject prompt text
     channelName: string;
     totalBriefs: number;
     totalPublished: number;
     topHooks: Array<{ type: string; avgReward: number; sampleCount: number }>;
     avoidHooks: Array<{ type: string; avgReward: number }>;
     usedAngles: string[];
     winningCombos: Array<{ hook: string; format: string; category: string; winRate: number }>;
   }
   ```
3. Export `buildBriefPersonalization(channelId: string): Promise<PersonalizationContext | null>`
4. Implementation:
   a. Query ChannelMemory by channelId — if not found, return null
   b. Check staleness: if `lastUpdated` > 48h ago, log warning but still use
   c. Query LearningWeightP4 where channelId, scope = "hook_type", orderBy weight desc, take 5
   d. Query LearningWeightP4 where channelId, scope = "hook_type", orderBy weight asc, take 3 (losing)
   e. Query ContentBrief where channelId, orderBy createdAt desc, take 10
   f. Extract unique angles from those briefs (deduplicate)
   g. Query UserPattern where channelId, patternType = "winning", take 5
   h. Build prompt block string with Vietnamese labels
   i. Return PersonalizationContext

### Step 2: Integrate into generate-brief.ts (40 min)

1. Open `lib/content/generate-brief.ts`
2. Add to BriefOptions interface:
   ```typescript
   personalizationContext?: PersonalizationContext | null;
   ```
3. In `buildBriefPrompt()`, after `characterBlock` (line ~221), add:
   ```typescript
   const personalizationBlock = options?.personalizationContext?.promptBlock
     ? `\n${options.personalizationContext.promptBlock}\n`
     : "";
   ```
4. Add `${personalizationBlock}` to the prompt assembly string (line 257)
5. In `generateBrief()`, before calling `buildBriefPrompt()`:
   ```typescript
   let personalizationContext = options?.personalizationContext;
   if (!personalizationContext && options?.channel?.channelId) {
     personalizationContext = await buildBriefPersonalization(options.channel.channelId);
   }
   // Pass to buildBriefPrompt via options
   ```

### Step 3: Verify & Test (20 min)

1. Run `pnpm build` — verify no TypeScript errors
2. Check prompt output includes personalization block when channel has ChannelMemory
3. Verify graceful null handling when ChannelMemory doesn't exist

## Todo List
- [ ] Create lib/agents/brief-personalization.ts
- [ ] Add PersonalizationContext interface
- [ ] Implement buildBriefPersonalization()
- [ ] Add personalizationContext to BriefOptions
- [ ] Inject personalization block in buildBriefPrompt()
- [ ] Auto-fetch personalization in generateBrief() if channelId present
- [ ] Build check passes
- [ ] Verify null-safe when no ChannelMemory exists

## Success Criteria
- Brief prompt includes channel performance history when ChannelMemory exists
- Brief prompt unchanged when no ChannelMemory (backward compatible)
- No additional AI calls added
- Used angles from past briefs included to prevent repetition
- `pnpm build` passes

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Prompt too long causing AI truncation | Low | Cap personalization block at 500 tokens; summarize if longer |
| ChannelMemory stale data misleading AI | Medium | Show lastUpdated in prompt; AI can judge recency |
| DB queries slow down brief generation | Low | 4 simple indexed queries; total < 100ms |

## Security Considerations
- No new endpoints — context injected server-side only
- No user input directly in personalization block (all from DB)

## Next Steps
- Phase 3 (Content Analyzer) improves data quality feeding into ChannelMemory
- Better data = better personalization over time

## Unresolved Questions
1. Should personalization context be cached in-memory during batch brief generation (multiple briefs for same channel)?
2. Cap on used angles list length? (Proposed: last 20 unique angles)
