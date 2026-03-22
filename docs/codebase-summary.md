# Codebase Summary — PASTR (AffiliateScorer)

## Tổng Quan

PASTR (Paste links. Ship videos. Learn fast.) là ứng dụng AI-powered TikTok affiliate video production tool cho marketer Việt Nam. Ứng dụng bao gồm toàn bộ pipeline: product discovery → AI scoring → content brief generation → video production → performance tracking → reinforcement learning.

## Tech Stack

| Thành phần | Công nghệ | Phiên bản |
|-----------|----------|-----------|
| Framework | Next.js (App Router) | 16.1 |
| Language | TypeScript | strict mode |
| ORM | Prisma | 7.4 |
| Database | PostgreSQL (Supabase) | — |
| AI Engine | Claude, GPT, Gemini | Multi-provider |
| UI | Tailwind CSS 4 + Radix UI + lucide-react | — |
| Theme | next-themes (dark mode) | — |
| Charts | Recharts | 3.7 |
| Animation | Framer Motion | 4.x |
| Command Palette | cmdk | 0.x |
| Validation | Zod | 4.3 |
| Package Manager | pnpm | — |
| Deployment | Netlify + @netlify/plugin-nextjs | — |

## Thống Kê Dự Án

- **Source Files:** 475 (.ts/.tsx files) ~53,600 LOC
- **Database Models:** 51
- **Pages:** 14 page routes + 3 special pages (error, not-found, loading)
- **API Endpoints:** 138 route handlers across 37 groups (advisory, briefs, channels, production, inbox, learning, cron, telegram, and more)
- **Component Files:** ~147 across 21 directories (layout, advisor, channels, production, insights, guide, inbox, products, dashboard, ai, settings, log, niche-intelligence, advisor, shared, ui)
- **Shared Components:** PageHeader, PillTabs, EmptyState, Breadcrumb, SearchInput, StatCard, SkeletonCard, SidebarCollapsible, MobileFAB, PWAHead
- **Design Tokens:** 25+ (colors, spacing, typography, shadows)
- **AI Agent Modules:** 8 (channel-memory-builder, brief-personalization, content-analyzer, tiktok-oembed, telegram-bot-handler, trend-intelligence, win-predictor, nightly-learning)
- **Advisory System:** 5 roles (ANALYST, CMO, CFO, CTO, CEO) with company hierarchy decision pipeline

## Trạng Thái Phát Triển

- **Phase 1:** DONE — Upload, AI scoring, dashboard, insights, feedback
- **Phase 2:** DONE — Personal layer, campaigns, shop management
- **Phase 3:** DONE — Content Factory, briefs, production, calendar
- **Phase 4:** DONE — Result logging, learning engine, playbook
- **Phase 5:** DONE — Business layer, commission, goals
- **Phase 6:** DONE — Channel-centric refactor, channel profiles
- **Phase 7:** DONE — Character-driven content (Character Bible, Format Bank, Idea Matrix, QC)
- **Phase 8:** DONE — Video Production System (Video Bible, Shot Library, Series Planner, Export Pack)
- **Phase 9:** DONE — Production Deployment to Netlify (CI/CD, env config, auto-deploy)
- **Phase 10:** DONE — Niche Intelligence wizard + Dashboard bento redesign
- **Phase 11:** DONE — AI Agent System (6 phases: memory, personalization, analyzer, Telegram, win predictor, PWA)
- **Phase 12:** DONE — Guide Page redesign (fixed TOC, 15 sections, AI config expansion)
- **Phase 13:** DONE — Interactive Onboarding Checklist (7-step progress tracker)
- **Phase 14:** PLANNED — Scoring System Redesign

## Cấu Trúc Thư Mục

```
affiliate-scorer/
├── app/                        # Pages + API routes (Next.js App Router)
│   ├── page.tsx                # Dashboard — Morning Brief, Inbox Stats, Quick Paste
│   ├── inbox/                  # Unified inbox — paste links, product table
│   ├── production/             # Batch brief generation, export packs
│   ├── channels/               # Channel management + detail
│   ├── library/                # All video assets + performance
│   ├── insights/               # Analytics, financial, calendar
│   ├── log/                    # Quick/batch result logging
│   ├── playbook/               # Winning patterns + strategies
│   ├── sync/                   # TikTok Studio import
│   ├── settings/               # API keys, AI models
│   ├── guide/                  # User documentation + onboarding checklist
│   ├── api/                    # 138 API route handlers
│   │   ├── advisor/            # Advisory Agent System: analyze, followup, handle-request
│   │   ├── inbox/              # Paste, list, score, retry
│   │   ├── briefs/             # Generate, batch, regenerate
│   │   ├── production/         # Batches, export, export-pack
│   │   ├── channels/           # CRUD, character-bible, video-bible, series, format-templates, idea-matrix
│   │   ├── learning/           # Trigger, history, weights
│   │   ├── ai/                 # Intelligence, anomalies, confidence, agents, predict-win
│   │   ├── cron/               # Nightly-learning, trend-analysis, retry-scoring
│   │   ├── internal/           # import-chunk, score-batch, relay endpoints
│   │   ├── telegram/           # Telegram webhook, bot setup
│   │   └── ...                 # tracking, settings, calendar, etc.
│   └── layout.tsx              # Root layout + metadata + ThemeProvider
│
├── components/                 # 100+ React components
│   ├── layout/                 # Header, nav, sidebar, PageHeader, mobile-fab, pwa-head
│   ├── advisor/                # Advisory page client with CEO decision display + C-level expandable panels
│   ├── channels/               # Channel detail, bible editors, format bank, idea matrix, video bible, series planner
│   ├── production/             # Product selector, brief preview, export, production stepper
│   ├── inbox/                  # Paste box, inbox table, filters, pagination, detail panel (modularized)
│   ├── insights/               # Charts, calendar, financial, overview tab (consolidated)
│   ├── dashboard/              # Bento layout cards, widgets, stat cards
│   ├── guide/                 # Sections: quick-start, terminology, upload, scoring, etc. + onboarding-checklist
│   ├── shared/                 # Design system: PageHeader, PillTabs, EmptyState, Breadcrumb, SearchInput, StatCard, SkeletonCard, SidebarCollapsible, Sparkline, QC badge
│   ├── ai/                     # Intelligence components
│   └── ui/                     # Radix primitives, shadcn components
│
├── lib/                        # Business logic + utilities
│   ├── advisor/                # Advisory Agent System (Company Hierarchy)
│   │   ├── c-level-roles.ts                   # 5 role definitions (ANALYST, CMO, CFO, CTO, CEO)
│   │   ├── analyze-pipeline.ts                # Pipeline: ANALYST → [CMO,CFO,CTO] → CEO
│   │   ├── gather-advisor-data.ts             # DB queries for ANALYST data gathering
│   │   ├── analyze.ts                         # Legacy (kept for backward compatibility)
│   │   └── personas.ts                        # Legacy personas (not used in new system)
│   ├── agents/                # AI Agent System (6 phases)
│   │   ├── channel-memory-builder.ts          # Phase 1: ChannelMemory context enrichment
│   │   ├── brief-personalization.ts           # Phase 2: Auto-inject memory into briefs
│   │   ├── content-analyzer.ts                # Phase 3: TikTok oembed + AI classification
│   │   ├── tiktok-oembed.ts                   # TikTok metadata extraction
│   │   ├── telegram-bot-handler.ts            # Phase 4: Telegram bot + competitor capture
│   │   ├── trend-intelligence.ts              # Phase 4: Batch trend analysis
│   │   ├── win-predictor.ts                   # Phase 5: Formula-based win probability
│   │   └── nightly-learning.ts                # Cron job: Daily AI tasks + memory updates
│   ├── ai/                     # AI scoring engine
│   ├── content/                # Brief generation, character bible, video bible, format templates, idea matrix, episodes, export packs
│   ├── parsers/                # FastMoss, KaloData, TikTok Studio
│   ├── scoring/                # Scoring formula, learning weights
│   ├── import/                 # Chunked import utilities, fire-relay
│   ├── utils/                  # Helpers, rate limiting, encryption
│   ├── types/                  # TypeScript type definitions
│   └── validations/            # Zod schemas (content, character, video-bible, series)
│
├── prisma/                     # Database
│   └── schema.prisma           # 51 models
│
├── public/                     # PWA assets
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker
│   └── icons/                  # App icons
│
├── docs/                       # Documentation
└── prompt/                     # Task specifications
```

## Database Models (51)

Key model groups:

**Core:** Product, ProductIdentity, ProductUrl, ProductSnapshot, Shop, InboxItem, ImportBatch, DataImport
**Content:** ContentBrief, ContentAsset, ProductionBatch, ContentSlot, ProductGalleryImage
**Channel:** TikTokChannel, ChannelModelImage, ChannelMemory, CharacterBible, FormatTemplate, VideoBible, ShotCode, SceneTemplate, Series, Episode, VideoTracking, IdeaMatrixItem
**Analytics:** AccountDailyStat, FollowerActivity, AccountInsight, TacticalRefreshLog
**Intelligence:** CompetitorCapture, TelegramChat, NicheProfile
**Tracking:** AssetMetric, VideoTracking, ContentPost, Campaign
**Learning:** Feedback, LearningLog, LearningWeightP4, UserPattern, WinPattern, ScoringGlobalStats
**Intelligence:** WeeklyReport, DailyBrief
**Business:** Commission, FinancialRecord, Campaign, GoalP5, CalendarEvent, UserGoal
**Settings:** AiModelConfig, ApiProvider, BackgroundTask

### Data Integrity & Cascading Rules

10 critical relations enforce referential integrity via cascading deletes/setNull:

| Relation | Rule | Purpose |
|----------|------|---------|
| Feedback → Product | Cascade | Auto-remove feedback when product deleted |
| ProductSnapshot → Product | Cascade | Auto-remove snapshots when product removed |
| ProductSnapshot → ImportBatch | Cascade | Cleanup snapshots on batch deletion |
| ContentBrief → ProductIdentity | Cascade | Remove briefs when product deleted |
| ContentBrief → TikTokChannel | SetNull | Preserve brief when channel deleted |
| ContentAsset → ProductIdentity | Cascade | Remove assets when product deleted |
| ContentAsset → ContentBrief | SetNull | Preserve asset when brief deleted |
| ContentSlot → ProductIdentity | SetNull | Preserve slot when product deleted |
| ContentSlot → ContentAsset | SetNull | Preserve slot when asset deleted |
| NicheProfile → TikTokChannel | SetNull | Preserve profile when channel deleted |

**Philosophy:** Cascade for transactional data (feedback, snapshots), SetNull for derived content (briefs, assets).

## Advisory Agent System (Company Hierarchy)

**Architecture:** ANALYST (data) → [CMO, CFO, CTO parallel] → CEO (decision)

- **ANALYST role** — Gathers real data from DB (top products, patterns, channels, metrics); prepares briefing
- **CMO role** — Content strategy, audience insights, positioning, growth recommendations
- **CFO role** — ROI analysis, opportunity cost, financial risk, efficiency metrics
- **CTO role** — Execution feasibility, workflow optimization, technical risks
- **CEO role** — Final decision synthesis; provides clear action steps for today

**Key Modules:**
- `lib/advisor/c-level-roles.ts` — 5 role definitions with system prompts
- `lib/advisor/analyze-pipeline.ts` — Pipeline orchestration logic
- `lib/advisor/gather-advisor-data.ts` — DB queries for ANALYST role
- `app/api/advisor/analyze` — Main analysis endpoint
- `app/api/advisor/followup` — Follow-up question endpoint
- `components/advisor/advisor-page-client.tsx` — Full UI with collapsible C-level details

**Cost:** ~2-5 AI calls per analysis (1 per role + CEO synthesis)

## Key Features

- **Advisory Agent System:** Company hierarchy model with ANALYST → C-levels → CEO decision pipeline
  - Data-driven analysis: real DB queries for products, patterns, channels
  - Multi-perspective synthesis: CMO (marketing), CFO (financial), CTO (execution)
  - CEO decisions: clear action steps for today, not theoretical suggestions
  - Morning Brief integration: lightweight CEO review function for brief generation
- **Niche Intelligence Module:** 4-step wizard for niche discovery → AI analysis → auto-channel creation
  - Step 1: Explore 10+ niches (gia dụng, mỹ phẩm, v.v.)
  - Step 2: AI analyzes market potential, competition, profit margin per niche
  - Step 3: Automatically creates TikTok channel for selected niche
  - Step 4: Success page, ready to import products
- **Inbox Pipeline:** Paste links → auto-enrich → AI score → brief → publish
  - Mobile card layout: Responsive cards on < md breakpoint showing score badge, full product name, delta, price, sales 7d, KOL
  - Desktop table: Full feature table with sorting, filtering, pagination
  - Smart badge counting: Shows new + enriched + scored items (items needing briefing)
- **AI Scoring:** Dual scoring (market + content potential), multi-provider AI
- **Content Factory:** Batch brief generation with angles, hooks, scripts, video prompts
- **Character Bible:** 7-layer character framework for brand consistency
- **Video Bible:** 12 production locks (visual/audio/narrative) for style consistency
- **Format Bank:** 10 content format templates with structure rules
- **Series Planner:** Episode planning with AI generation
- **Shot Library:** Standardized shot codes for production teams
- **Export Packs:** ZIP with scripts, shotlists, captions, B-roll lists, checklists
- **Version Locking:** Lock bible versions for production stability
- **Learning Engine:** RL-style weight updates from performance feedback
- **Playbook:** Accumulated winning patterns and strategies
- **Design System:** Shared components, design tokens, consistent styling across all 15 pages
- **Dashboard Bento Grid:** 3-column flexible layout with error boundaries on 8+ widgets (Morning Brief, Inbox Stats, Quick Paste, charts)
- **Sidebar Navigation:** 4 groups (Sản xuất, Theo dõi, Công cụ, Cài đặt) with dynamic badge counting
- **Mobile Navigation:** Bottom tab bar for mobile view, consistent with desktop nav structure
- **Command Palette:** Quick navigation with ⌘K keyboard shortcut
- **Onboarding Checklist:** Interactive 7-step progress tracker with localStorage persistence, localStorage-based state, tips, time estimates, direct navigation links
- **Responsive Layouts:** Mobile-first design with bento layouts, card layout for inbox (<md), collapsible navigation
- **Accessibility:** ARIA attributes, keyboard navigation, screen reader support
- **PWA Support:** Progressive Web App with manifest.json, service worker, mobile FAB, installable
- **AI Agent System (6 phases + Advisory):**
  - **Phase 1:** ChannelMemory + nightly learning (22:00 UTC daily)
  - **Phase 2:** Brief personalization via memory context injection
  - **Phase 3:** Content analyzer with TikTok oembed + AI classification
  - **Phase 4:** Telegram bot integration + competitor trend analysis (22:30 UTC daily)
  - **Phase 5:** Win predictor with 6-feature formula scoring
  - **Phase 6:** Mobile quick-log FAB + PWA installability
  - **Advisory System:** Company hierarchy (ANALYST → C-levels → CEO) for strategic decision-making

## Deployment

- **Platform:** Netlify with @netlify/plugin-nextjs
- **Live URL:** https://pastr-app.netlify.app
- **Build Command:** `pnpm build` with Next.js optimization
- **Publish Directory:** `.next`
- **CI/CD:** GitHub webhook — auto-deploy on push to master
- **Environment Variables:** See `docs/deployment-guide.md` for canonical list (DATABASE_URL, DIRECT_URL, ENCRYPTION_KEY, AUTH_SECRET, TELEGRAM_BOT_TOKEN)
- **Build Metrics:** 74 routes, 0 TypeScript errors, 67 second deploy time
- **Fallback:** Vercel configuration retained for multi-platform flexibility

## Key API Endpoints (138 route handlers across 37 groups)

### Advisory Agent System

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/advisor/analyze` | POST | Run full pipeline: ANALYST → [CMO,CFO,CTO] → CEO |
| `/api/advisor/followup` | POST | Follow-up question with same pipeline |
| `/api/advisor/handle-advisor-request` | POST | Handle structured advisor requests |

### Content & Briefs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/briefs/generate` | POST | Generate single brief with AI |
| `/api/briefs/batch` | POST | Generate multiple briefs in batch |
| `/api/briefs/today` | GET | Get today's brief |
| `/api/briefs/regenerate` | POST | Regenerate brief for product |
| `/api/production/export-pack` | POST | Create ZIP export with all production files |

### Channel Management (29 routes)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/channels/crud` | GET, POST, PATCH, DELETE | Channel CRUD operations |
| `/api/channels/[id]/character-bible` | GET, PUT, DELETE, POST | Character bible CRUD & AI generation |
| `/api/channels/[id]/video-bible` | GET, PUT, DELETE, POST | Video bible CRUD, lock, seed, shot-codes, scene-templates |
| `/api/channels/[id]/format-templates` | GET, POST, PUT, DELETE | Format bank CRUD & defaults |
| `/api/channels/[id]/idea-matrix` | GET, POST, PUT | Idea matrix CRUD & AI generation |
| `/api/channels/[id]/series` | GET, POST, PUT, DELETE | Series CRUD + episode operations |

### Import & Scoring

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/upload` | POST | Parse file, normalize, deduplicate, fire initial batch |
| `/api/internal/import-chunk` | POST | Process 300-product chunk, fire next relay |
| `/api/internal/score-batch` | POST | Score all products in batch |
| `/api/cron/retry-scoring` | GET | Detect & retry failed/stuck batches (daily midnight UTC) |
| `/api/settings/ai-models` | GET, POST | AI model configuration for 7 task types |

### Cron Jobs (6 total)

| Endpoint | Method | Schedule | Purpose |
|----------|--------|----------|---------|
| `/api/cron/morning-brief` | GET | Daily | Generate morning brief |
| `/api/cron/nightly-learning` | GET | 22:00 UTC daily | Aggregate feedback, update ChannelMemory |
| `/api/cron/trend-analysis` | GET | 22:30 UTC daily | Analyze competitor captures, generate insights |
| `/api/cron/weekly-learning` | GET | Weekly | Weekly learning cycle |
| `/api/cron/decay` | GET | Daily | Apply decay to learning weights |
| `/api/cron/retry-scoring` | GET | Daily midnight UTC | Safety net for failed imports |

### AI Agents & Telegram

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/agents/predict-win` | POST | Formula-based win probability scoring |
| `/api/log/quick` | POST | Quick-log asset result, trigger content analyzer |
| `/api/telegram/setup` | POST | Initialize Telegram webhook |
| `/api/telegram/webhook` | POST | Receive messages from Telegram bot |
| `/api/settings/telegram-info` | GET | Retrieve telegram bot configuration info |

### Other Namespaces
- `/api/inbox/*` (8 routes) — Paste, list, score, retry
- `/api/products/*` (10 routes) — Gallery, notes, seasonal
- `/api/dashboard/*` (4 routes) — Suggestions, orphan stats, yesterday stats
- `/api/ai/*` (4 routes) — Anomalies, confidence, intelligence, weekly-report
- `/api/learning/*` (3 routes) — History, trigger, weights
- `/api/calendar/*`, `/api/commissions/*`, `/api/financial/*`, `/api/sync/*`, and more
