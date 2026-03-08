# Phase 4: Telegram Bot + Trend Intelligence Agent

## Context Links
- Parent: [plan.md](plan.md)
- Depends on: [Phase 1](phase-01-schema-nightly-learning.md) (CompetitorCapture + TelegramChat models)
- Brainstorm: [report](../260308-ai-agent-system-brainstorm/report.md) Section 2.6

## Overview
- **Date:** 2026-03-08
- **Priority:** P2
- **Effort:** 2.5h
- **Status:** Pending
- **Description:** Telegram bot for capturing competitor TikTok videos while browsing mobile. Webhook handler saves to CompetitorCapture table. Nightly trend analysis cron batch-processes captures via AI to detect trending hooks/formats/angles. Results feed into ChannelMemory.trendingInsights.

## Key Insights
- Telegram Bot API is free, webhook-based, no polling needed
- User flow: see viral video -> share TikTok link to Telegram bot -> 2-3 second capture
- Bot scope intentionally limited: capture + channel selection only (no scoring, no brief triggers)
- Nightly batch analysis (not real-time) saves cost: 10 captures/day = 1 AI call vs 10
- TikTok oembed (from Phase 3) reused for caption/author extraction
- CompetitorCapture analyzed nightly at 22:30 UTC (after nightly-learning at 22:00)
- Trend analysis output stored in ChannelMemory.trendingInsights

## Requirements

### Functional
- F1: Telegram bot receives TikTok URLs via shared messages
- F2: Bot commands: `/start`, `/channel` (set active channel), `/status` (today's count)
- F3: Bot auto-detects TikTok URLs in messages
- F4: Webhook handler creates CompetitorCapture record with oembed data
- F5: Bot confirms capture with channel name
- F6: Nightly trend analysis cron processes unanalyzed captures
- F7: AI detects trending patterns (hooks, formats, angles) from batch
- F8: Results stored in ChannelMemory.trendingInsights

### Non-Functional
- NF1: Webhook response < 1s (Telegram requires fast response)
- NF2: Trend analysis cron < 60s
- NF3: Bot API key stored in env var (TELEGRAM_BOT_TOKEN)
- NF4: Webhook URL validated via Telegram webhook verification

## Architecture

### Telegram Bot Flow
```
User shares TikTok link in Telegram
  |-> Telegram sends webhook POST to /api/telegram/webhook
  |-> Verify webhook (check Telegram source)
  |-> Parse message for TikTok URL (regex)
  |-> Fetch oembed data (caption, author)
  |-> Lookup TelegramChat -> activeChannelId
  |-> Create CompetitorCapture record
  |-> Reply: "Da luu cho {channelName}. Them ghi chu?" (inline keyboard)
```

### Trend Analysis Flow
```
22:30 UTC nightly cron
  |-> Query CompetitorCapture where analyzedAt IS NULL
  |-> Group by channelId
  |-> For each channel batch:
  |     |-> Build prompt with all captures (caption, hashtags, author)
  |     |-> AI call: "What patterns are trending in {niche}?"
  |     |-> Parse: trending hooks, formats, angles
  |     |-> Update captures: set detectedHookType, detectedFormat, trendScore, analyzedAt
  |     |-> Update ChannelMemory.trendingInsights
```

### Bot Commands
| Command | Action |
|---------|--------|
| `/start` | Welcome message + setup instructions |
| `/channel` | List channels (inline keyboard), set active channel |
| `/channel {name}` | Set active channel by name |
| `/status` | Today's capture count for active channel |

## Related Code Files

### Files to Create
- `lib/agents/telegram-bot-handler.ts` — Message processing logic (<180 lines)
- `lib/agents/trend-intelligence.ts` — Nightly trend analysis (<150 lines)
- `app/api/telegram/webhook/route.ts` — Webhook endpoint (<80 lines)
- `app/api/telegram/setup/route.ts` — Bot registration + webhook URL setup (<60 lines)
- `app/api/cron/trend-analysis/route.ts` — Nightly cron (<40 lines)

### Files to Modify
- `vercel.json` — Add trend-analysis cron entry
- `.env.example` — Add TELEGRAM_BOT_TOKEN

## Implementation Steps

### Step 1: Create Telegram Bot Handler (60 min)

1. Create `lib/agents/telegram-bot-handler.ts`
2. Export types:
   ```typescript
   interface TelegramUpdate {
     message?: { chat: { id: number }; text?: string; from?: { id: number } };
     callback_query?: { id: string; data: string; message: { chat: { id: number } } };
   }
   interface BotResponse { method: string; chat_id: number; text: string; reply_markup?: unknown }
   ```
3. Export `handleTelegramUpdate(update: TelegramUpdate): Promise<BotResponse | null>`
4. Logic:
   a. Extract chatId, text from update
   b. Find or create TelegramChat record by chatId
   c. If text starts with `/start`: return welcome message with instructions
   d. If text starts with `/channel`:
      - Query all TikTokChannels
      - If arg provided: find by name, set activeChannelId
      - If no arg: return inline keyboard with channel list
   e. If text starts with `/status`:
      - Count CompetitorCapture for activeChannelId today
      - Return count message
   f. If text contains TikTok URL (regex: `tiktok\.com\/@[\w.]+\/video\/\d+|vm\.tiktok\.com\/\w+`):
      - Check activeChannelId set — if not, prompt to set channel first
      - Fetch oembed via `fetchTikTokOembed(url)` (reuse from Phase 3)
      - Create CompetitorCapture: { channelId, tiktokUrl, caption, authorHandle, hashtags, thumbnailUrl }
      - Return confirmation: "Da luu cho {channelName}"
   g. Else: return help text

5. Export `sendTelegramMessage(chatId: number, text: string, replyMarkup?: unknown): Promise<void>`
   - POST to `https://api.telegram.org/bot{token}/sendMessage`

### Step 2: Create Webhook Route (20 min)

1. Create `app/api/telegram/webhook/route.ts`
2. POST handler:
   ```typescript
   export async function POST(request: Request): Promise<NextResponse> {
     try {
       const update = await request.json() as TelegramUpdate;
       const response = await handleTelegramUpdate(update);
       if (response) {
         await sendTelegramMessage(response.chat_id, response.text, response.reply_markup);
       }
       return NextResponse.json({ ok: true });
     } catch (error) {
       console.error("[telegram/webhook]", error);
       return NextResponse.json({ ok: true }); // Always 200 to Telegram
     }
   }
   ```
3. Note: Always return 200 to Telegram even on error (prevents retry storm)

### Step 3: Create Setup Route (15 min)

1. Create `app/api/telegram/setup/route.ts`
2. POST handler: sets Telegram webhook URL
   ```typescript
   const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/webhook`;
   await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ url: webhookUrl }),
   });
   ```

### Step 4: Create Trend Intelligence Agent (45 min)

1. Create `lib/agents/trend-intelligence.ts`
2. Export `analyzeTrends(): Promise<{ capturesAnalyzed: number; channelsUpdated: number }>`
3. Logic:
   a. Query CompetitorCapture where `analyzedAt IS NULL`, orderBy createdAt, take 100
   b. Group by channelId
   c. For each channel group (with >= 2 captures):
      - Get channel niche from TikTokChannel
      - Build prompt with all captures: caption, hashtags, author
      - AI call (~1500 tokens): "Analyze these {n} competitor videos in {niche}. What hooks, formats, angles are trending? Output JSON: { trendingHooks: [], trendingFormats: [], trendingAngles: [], summary: string }"
      - Parse response
      - Update each CompetitorCapture: detectedHookType, detectedFormat, detectedAngle, trendScore, analyzedAt
      - Update ChannelMemory.trendingInsights for this channel
   d. For channels with only 1 capture: mark as analyzed without AI call (save cost)
   e. Return summary

### Step 5: Create Trend Analysis Cron (15 min)

1. Create `app/api/cron/trend-analysis/route.ts`
2. Pattern: verifyCronAuth, try-catch, call `analyzeTrends()`, return JSON
3. Update `vercel.json`: add `{ "path": "/api/cron/trend-analysis", "schedule": "30 22 * * *" }`

### Step 6: Update Environment (10 min)

1. Add to `.env.example`:
   ```
   # Telegram Bot (optional — for competitor video capture)
   TELEGRAM_BOT_TOKEN=        # Get from @BotFather on Telegram
   ```

### Step 7: Verify & Test (15 min)

1. Run `pnpm build`
2. Test webhook handler with mock TelegramUpdate
3. Test trend analysis with mock CompetitorCapture data

## Todo List
- [ ] Create lib/agents/telegram-bot-handler.ts
- [ ] Create app/api/telegram/webhook/route.ts
- [ ] Create app/api/telegram/setup/route.ts
- [ ] Create lib/agents/trend-intelligence.ts
- [ ] Create app/api/cron/trend-analysis/route.ts
- [ ] Update vercel.json with trend-analysis cron
- [ ] Add TELEGRAM_BOT_TOKEN to .env.example
- [ ] Build check passes
- [ ] Test webhook with mock data
- [ ] Test trend analysis with mock captures

## Success Criteria
- Telegram webhook receives messages and creates CompetitorCapture records
- `/channel` command lists and sets active channel
- TikTok URLs auto-detected and oembed data extracted
- Nightly trend analysis processes unanalyzed captures
- ChannelMemory.trendingInsights updated with trend data
- Bot gracefully handles errors (always returns 200 to Telegram)
- `pnpm build` passes

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Telegram webhook URL not HTTPS | Medium | Netlify/Vercel provide HTTPS by default |
| Bot scope creep | Medium | V1 strictly: capture + channel selection only |
| Spam/abuse via bot | Low | Rate limit: max 50 captures/day per chat |
| TikTok oembed failures on competitor URLs | Low | Oembed optional; capture URL even if oembed fails |
| Trend analysis prompt too large (many captures) | Low | Cap at 100 captures per cron run; batch if needed |

## Security Considerations
- Webhook endpoint should verify Telegram source (check `x-telegram-bot-api-secret-token` header)
- TELEGRAM_BOT_TOKEN stored as env var, never in code
- Setup route should be admin-only (check auth or require secret)
- TelegramChat.apiKey encrypted if storing user auth tokens
- CompetitorCapture URLs validated before oembed fetch (prevent SSRF)

## Next Steps
- Phase 2 (Brief Personalization) reads ChannelMemory.trendingInsights to inject trends into brief prompts
- Phase 5 (Win Predictor) can use trending data as bonus signal

## Unresolved Questions
1. Should bot support inline mode (user types @bot_name in any chat to share)?
2. Rate limit per user or per chat? (Proposed: per chat, 50/day)
3. Should trend analysis also query TikTok trending hashtags API, or rely solely on user captures?
4. How to handle bot setup for users without Telegram? (Feature is fully optional)
