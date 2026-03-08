# Research Report: Brief Generation Pipeline & AI Provider Setup
**Date:** 2026-03-08
**Focus:** Current brief generation context injection, quick log API flow, AI provider configuration

---

## 1. Brief Generation Pipeline

### Current Context Injection Points

**File:** `lib/content/generate-brief.ts`

**Context Layers Injected (in order):**
1. **Channel Context** (optional) — `ChannelContext` interface
   - `personaName`, `personaDesc`, `voiceStyle`, `targetAudience`, `editingStyle`, `niche`
   - Builds prompt block: "KÊNH TIKTOK"
   - Ensures content aligns with channel identity

2. **Character Bible** (optional) — `CharacterBibleData`
   - Includes: `coreValues`, `catchphrases`, `redLines`, `voiceDna`
   - Builds dedicated prompt block via `buildCharacterBlock()`
   - Enforces personality consistency

3. **Format Template** (optional) — `FormatTemplateData`
   - Builds prompt block via `buildFormatBlock()`
   - Defines script structure

4. **Video Bible** (optional) — `Record<string, unknown>`
   - Scene descriptions, video generation prompts
   - Builds block via `buildVideoBibleBlock()`

5. **Calendar Events** (optional) — array of upcoming events
   - Time-sensitive content triggers
   - Block: "SỰ KIỆN SẮP TỚI"

6. **Suggested Hooks & Formats** (optional)
   - Split into "proven" (70%) vs "explore" (30%)
   - Blocks: "HOOKS GỢI Ý", "FORMATS GỢI Ý"

7. **Product Details** — mandatory
   - Title, price, category, commission, description, shop, sales, trending status, score

**Current Prompt Structure:**
```
[Channel] → [Character] → [Format] → [Video Bible] → [Calendar] → [Explore/Exploit]
→ [Content Type] → [Video Format] → [Duration] → [Product] → [Requirements]
```

### Where ChannelMemory Should Hook In

**Injection Point:** After Character Bible, before Format Template.

**New Context Block Needed:**
```
CHANNEL PERFORMANCE HISTORY (ChannelMemory):
- Best performing categories (last 30 days)
- Winning hook types + patterns
- Format performance matrix
- Time slots with highest engagement
- Audience insights from logs

→ Adapt brief recommendations based on what ACTUALLY WORKS for this channel
```

**Implementation:** In `buildBriefPrompt()`, add conditional block after line 225:
```typescript
const channelMemoryBlock = options?.channelMemory ? `
CHANNEL PERFORMANCE HISTORY:
[Insert ChannelMemory context here]
→ Prioritize hooks/formats proven for this channel.
` : "";
```

---

## 2. Quick Log API Current Implementation

**File:** `app/api/log/quick/route.ts`

### Request Flow

1. **Validate Input** — `quickLogSchema` (Zod validation)
   - `views`, `likes`, `comments`, `shares`, `saves`, `orders`, `commissionAmount`
   - Optional: `assetId` OR `tiktokUrl` (auto-match)

2. **Resolve Asset**
   - If only URL provided: `matchTikTokLink()` → finds assetId from post URL
   - If no match: return error "Không match được video. Chọn asset thủ công."

3. **Calculate Reward**
   - `calculateReward()` — formula-based scoring (weights per metric)
   - Returns single `rewardScore` number

4. **Save Metrics**
   - Create `assetMetric` row with source="manual"
   - Stores all 7 metrics + rewardScore

5. **Update Asset**
   - Status: `draft` → `logged` (state machine validation)
   - Sets `publishedUrl`, `postId`, `publishedAt`

6. **Update Learning Weights**
   - `updateLearningWeights()` — stores performance per:
     - Hook type, format, angle, category, channel
     - Reward score updates learning matrices

7. **Win/Loss Analysis**
   - `analyzeAsset()` — compares reward vs channel/category/format averages
   - Returns verdict: "win" | "loss" | "neutral"
   - Analyzes 4 factors: hook, format, category, timing

**Response:**
```json
{
  "data": {
    "metricId": "string",
    "rewardScore": number,
    "analysis": { "verdict": "win|loss|neutral", "factors": [...] }
  },
  "message": "Đã log. Reward: X — WIN/LOSS/Trung bình"
}
```

### Where Content Analyzer Agent Should Hook In

**Insertion Point:** After step 5 (asset status update), before step 6 (learning update).

**New Agent Flow:**
```
CONTENT ANALYZER AGENT:
Input: assetId, rewardScore, asset full context
Tasks:
  1. Audit script quality (compliance, hooks, CTA)
  2. Compare actual performance vs predicted score
  3. Identify success factors (what made this video work)
  4. Suggest improvements for next brief

Output: analysis_details stored in assetMetric or separate table
→ Informs next brief generation
```

**Code Injection Pattern:**
```typescript
// After line 86 (asset update)
const contentAnalysis = await analyzeAssetContent(assetId, asset, reward);

// Before line 89 (learning update)
// Store analysis somewhere
```

---

## 3. AI Provider Configuration

### Current Multi-Provider Setup

**File:** `lib/ai/providers.ts` + `lib/ai/call-ai.ts`

**Supported Providers:**
- **Anthropic** (Claude) — Default
- **OpenAI** (GPT-4o, o3)
- **Google** (Gemini 2.0/2.5)

### API Key Management

**Storage:** PostgreSQL `apiProvider` table
- `provider` (PK): "anthropic" | "openai" | "google"
- `encryptedKey`: AES-256 encrypted
- `isConnected`: boolean flag

**Encryption:**
- Key from `ENCRYPTION_KEY` env var
- `decrypt()` function in `lib/encryption`
- All API keys encrypted at rest

**Configuration Flow:**
1. User enters API key in UI → Settings → API Keys
2. Encrypted + stored in DB
3. Retrieved at runtime via `getApiKey(provider)`
4. Passed to provider-specific caller

### How Calls Work

**Entry Point:** `lib/ai/call-ai.ts` — `callAI()`

**Router Logic:**
```typescript
modelId = getModelForTask(taskType) → Reads from aiModelConfig DB table
provider = getProviderFromModelId(modelId) → Detects: claude|gpt|gemini
apiKey = getApiKey(provider) → Retrieves encrypted key
→ Routes to callClaude() | callOpenAI() | callGemini()
```

**Task Types Configured:**
- `scoring` — Scoring products
- `content_brief` — Generate briefs
- `channel_profile` — Channel analysis
- `morning_brief` — Daily recommendations
- `weekly_report` — Performance summaries
- `niche_intelligence` — Market analysis

### Cost Patterns (Inferred)

**Current Config:**
```
DEFAULT_MODEL_ID = "claude-sonnet-4-6"
MAX_TOKENS_SCORING = 4096
MAX_TOKENS_LEARNING = 8192
```

**Retry Logic:**
- Max 3 retries with exponential backoff (1s → 2s → 4s)
- Retryable errors: 429 (rate limit), 5xx (server error)
- Non-retryable: 4xx client errors, invalid JSON responses

### Where Agent System Hooks In

**Integration Point:** New task type needed.

```typescript
// Add to AiTaskType union
export type AiTaskType = ... | "content_analysis";

// Configure model preference in DB
INSERT INTO aiModelConfig (taskType, modelId) VALUES
  ('content_analysis', 'claude-opus-4-6'); // Stronger analysis
```

**Execution Pattern:**
```
Content Analyzer Agent:
  → Uses callAI(..., "content_analysis")
  → Routes to best model configured for analysis
  → Gets result through multi-provider abstraction
  → Stores findings for learning
```

---

## 4. Telegram Integration Status

### Current State

**No app-level Telegram integration** in main codebase.

**Found Only in CI/CD Hooks:**
- `.claude/hooks/notifications/providers/telegram.cjs` — Notification hook
- `.claude/hooks/notifications/telegram_notify.sh` — Shell wrapper
- `.claude/hooks/notifications/docs/telegram-hook-setup.md` — Documentation

**Purpose:** GitHub Actions notifications only (not product feature).

### Recommendation for Agent System

**Do NOT integrate Telegram for agent communication.** Instead:
1. Use HTTP webhooks (already supports REST endpoints)
2. Log agent outputs to DB → UI retrieval
3. Optional: Use existing Telegram hook for admin alerts only

---

## 5. API Route Architecture

**Patterns Observed:**

1. **Validation-First:**
   - All routes use Zod schemas (e.g., `quickLogSchema`)
   - Centralized `validateBody()` helper

2. **Transaction Safety:**
   - Generate brief uses Prisma `$transaction` for atomicity
   - Optimistic locking for concurrent requests

3. **Error Handling:**
   - Try-catch with descriptive Vietnamese messages
   - Returns NextResponse.json with proper HTTP codes

4. **Async Operations:**
   - AI calls happen outside DB transactions (slow)
   - Pre-compute results before writes

5. **State Machine Validation:**
   - `validateTransition()` prevents invalid state changes
   - Guards against concurrent modifications

---

## Summary: Agent System Integration Points

| Component | Hook Location | New Context Needed |
|-----------|---------------|--------------------|
| **Brief Generation** | `buildBriefPrompt()` line 225+ | ChannelMemory block |
| **Quick Log API** | After asset update, line 87 | ContentAnalyzer agent call |
| **AI Provider** | `lib/ai/call-ai.ts` | Task type: "content_analysis" |
| **Config** | `aiModelConfig` DB table | New model assignment |
| **Database** | Prisma schema | Asset analysis storage table |

---

## Unresolved Questions

1. **ChannelMemory Source:** Should it aggregate from `assetMetric` + `learningWeight` tables, or separate dedicated table?
2. **Analysis Storage:** Where to store Content Analyzer results — new table or extend `assetMetric`?
3. **Agent Frequency:** Should analysis run synchronously (immediate response) or async (background job)?
4. **Performance Threshold:** What reward score triggers analysis (all, or only top X%)?
