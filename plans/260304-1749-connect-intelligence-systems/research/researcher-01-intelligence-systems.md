# Intelligence Systems Research — PASTR

## 1. Morning Brief Generation
**File:** `lib/brief/generate-morning-brief.ts`
**Entry:** `generateMorningBrief(): Promise<string>`

### Data already injected into prompt
- Active channels (id, personaName, slot counts, draft counts)
- New products (scored/enriched state, combinedScore, deltaType)
- Briefed-not-produced products
- Upcoming CalendarEvents (next 7 days — name, date, eventType)
- Yesterday metrics (published count, totalViews, avgReward)
- LearningWeightP4 (topHook, topFormat, topCategories)
- Current GoalP5 (weekly target vs actual)

### UserPattern injection — MISSING
- `UserPattern` records are never queried in this file
- Injection point: after `topWeights` block (line ~94–101), add a `WINNING PATTERNS:` section to the prompt
- Pattern fields to include: `label`, `patternType`, `winRate`, `avgViews`, `conditions`

---

## 2. Content Brief Generation
**File:** `lib/content/generate-brief.ts`
**Entry:** `generateBrief(product: ProductInput, options?: BriefOptions): Promise<string>`
**Prompt builder:** `buildBriefPrompt(product, options)` (line 171)

### BriefOptions interface (current)
```ts
interface BriefOptions {
  channel?: ChannelContext | null;      // personaName, personaDesc, voiceStyle, targetAudience, editingStyle, niche
  contentType?: string | null;
  videoFormat?: string | null;
  targetDuration?: number | null;
  characterBible?: CharacterBibleData | null;
  formatTemplate?: FormatTemplateData | null;
  videoBible?: Record<string, unknown> | null;
  bibleVersion?: number | null;
  videoBibleVersion?: number | null;
}
```

### CalendarEvent injection — MISSING
- Prompt has no awareness of upcoming events
- Injection point: in `buildBriefPrompt()` after `channelBlock`, before product section
- Would add: "SỰ KIỆN SẮP TỚI: [event.name] (eventType) — [date]"
- Requires passing events into `BriefOptions` or fetching inside `buildBriefPrompt`

### Channel Persona deeper use
- `ChannelContext` already injected via `channelBlock` (lines 172–180)
- Current: renders personaName, personaDesc, voiceStyle, targetAudience, editingStyle, niche
- Nothing missing here — persona is already well-injected

### Caller: `app/api/briefs/batch/route.ts`
- Builds `ChannelContext` from DB (line 41–49)
- Fetches characterBible, formatTemplate, videoBible
- Does NOT fetch CalendarEvents — must add fetch + pass via BriefOptions

---

## 3. Win Probability (4D Scoring)
**File:** `lib/ai/win-probability.ts`
**Entry:** `calculateWinProbability(product, confidenceLevel): Promise<WinProbability>`

### Formula breakdown
| Dimension | Max | Key signals |
|-----------|-----|-------------|
| Market (scoreMarket) | 40 | commissionRate, sales7d/salesTotal ratio, price range, KOL count |
| PersonalFit (scorePersonalFit) | 30 | LearningWeightP4 category weight, price sweet spot from AssetMetric, top format |
| Timing (scoreTiming) | 15 | CalendarEvent in 14d, lifecycle stage, salesGrowth7d |
| Risk (scoreRisk) | 15 | KOL surge >50%, shopRating < 3, declining category trend |
| **Total** | **100** | `market + personalFit + timing - risk` |

### Output: `WinProbability`
```ts
{ total, market, personalFit, timing, risk, confidenceLevel, insights: string[] }
```

### Use for Content Suggestions ranking — MISSING
- `calculateWinProbability` is not called in brief pipeline or content suggestions
- Would need: a content suggestions endpoint that iterates `ProductIdentity` records, calls `calculateWinProbability`, sorts by `total`, returns ranked list
- `confidenceLevel` is based on how many content cycles the user has completed (drives which scoring sub-functions run)

---

## 4. Explore/Exploit
**File:** `lib/learning/explore-exploit.ts`

### Functions
```ts
selectHooksForBrief(exploreRatio = 0.3, channelId?: string): Promise<HookTemplate[]>
selectFormatsForBrief(count = 3, channelId?: string): Promise<FormatTemplate[]>
```

### Logic
- **70% exploit**: top hooks/formats by `LearningWeightP4.weight` (channel-specific if `channelId` provided, else global)
- **30% explore**: hooks with `sampleCount < 3` (under-tested) → random shuffle
- Returns `HookTemplate[]` / `FormatTemplate[]` from static libraries

### Not connected to brief generation
- `selectHooksForBrief` / `selectFormatsForBrief` are never called in `generateBrief` or `buildBriefPrompt`
- They should be called before `buildBriefPrompt`, results passed in `BriefOptions` as `suggestedHooks` / `suggestedFormats`

---

## 5. Pattern Detection
**File:** `lib/learning/pattern-detection.ts`
**Entry:** `regeneratePatterns(): Promise<{ patterns: number }>`

### UserPattern record structure (written to DB)
```ts
{
  patternType: "winning" | "losing",
  label: string,                         // "Hook \"X\" + format + category"
  conditions: { hook_type, format, category? },
  assetIds: string[],
  sampleSize: number,
  avgViews: number,
  avgReward: number,
  winRate: number,                        // wins / total assets in group
}
```

### Detection algorithm
- Groups assets by `hookType × format`
- Win = rewardScore > 1.5× system avg; Loss = rewardScore < 0.5× avg
- Pattern saved if winRate ≥ 0.5 (winning) or lossRate ≥ 0.5 (losing) with ≥ 2 assets
- Clears all patterns before re-inserting (`deleteMany` + `create` loop — no upsert)

---

## Summary: Missing Connections

| Gap | Where to fix | What to add |
|-----|-------------|-------------|
| UserPattern → Morning Brief | `generate-morning-brief.ts` prompt | Query winning patterns, inject as "PATTERN THẮNG:" block |
| CalendarEvent → Content Brief | `BriefOptions` + `batch/route.ts` + `buildBriefPrompt` | Add `upcomingEvents` field to BriefOptions; fetch in batch route; render in prompt |
| WinProbability → Content Suggestions | New endpoint or existing suggestions route | Call `calculateWinProbability` per product, sort/rank results |
| Explore/Exploit → Brief generation | `generateBrief` / `buildBriefPrompt` | Call `selectHooksForBrief(0.3, channelId)` before prompt build; inject selected hooks as constraints |

## Unresolved Questions
1. Where does `confidenceLevel` come from in `calculateWinProbability` callers? No existing call site found — needs to be determined (user profile? count of published assets?).
2. Is `UserPattern.deleteMany` + re-insert safe under concurrent requests? No transaction wraps the clear+insert cycle.
3. `selectHooksForBrief` returns `HookTemplate[]` from a static library — what is the shape of `HookTemplate`? Need to verify `lib/content/libraries.ts` to confirm inject format.
