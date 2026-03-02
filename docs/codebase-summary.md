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
| Validation | Zod | 4.3 |
| Package Manager | pnpm | — |

## Thống Kê Dự Án

- **Database Models:** 40+
- **Pages:** 15
- **API Endpoints:** 90+
- **Components:** 80+

## Trạng Thái Phát Triển

- **Phase 1:** DONE — Upload, AI scoring, dashboard, insights, feedback
- **Phase 2:** DONE — Personal layer, campaigns, shop management
- **Phase 3:** DONE — Content Factory, briefs, production, calendar
- **Phase 4:** DONE — Result logging, learning engine, playbook
- **Phase 5:** DONE — Business layer, commission, goals
- **Phase 6:** DONE — Channel-centric refactor, channel profiles
- **Phase 7:** DONE — Character-driven content (Character Bible, Format Bank, Idea Matrix, QC)
- **Phase 8:** DONE — Video Production System (Video Bible, Shot Library, Series Planner, Export Pack)

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
│   ├── guide/                  # User documentation
│   ├── api/                    # 90+ API route handlers
│   │   ├── inbox/              # Paste, list, score, retry
│   │   ├── briefs/             # Generate, batch, regenerate
│   │   ├── production/         # Batches, export, export-pack
│   │   ├── channels/           # CRUD, character-bible, video-bible, series, format-templates, idea-matrix
│   │   ├── learning/           # Trigger, history, weights
│   │   ├── ai/                 # Intelligence, anomalies, confidence
│   │   └── ...                 # tracking, settings, calendar, etc.
│   └── layout.tsx              # Root layout + metadata + ThemeProvider
│
├── components/                 # 80+ React components
│   ├── layout/                 # Header, nav, sidebar
│   ├── channels/               # Channel detail, bible editors, format bank, idea matrix, video bible, series planner
│   ├── production/             # Product selector, brief preview, export
│   ├── inbox/                  # Inbox table, paste box, filters
│   ├── insights/               # Charts, calendar, financial
│   ├── shared/                 # QC badge, reusable components
│   └── ui/                     # Radix primitives, shadcn components
│
├── lib/                        # Business logic + utilities
│   ├── ai/                     # AI scoring engine
│   ├── content/                # Brief generation, character bible, video bible, format templates, idea matrix, episodes, export packs
│   ├── parsers/                # FastMoss, KaloData, TikTok Studio
│   ├── scoring/                # Scoring formula, learning weights
│   ├── utils/                  # Helpers, rate limiting, encryption
│   ├── types/                  # TypeScript type definitions
│   └── validations/            # Zod schemas (content, character, video-bible, series)
│
├── prisma/                     # Database
│   └── schema.prisma           # 40+ models
│
├── docs/                       # Documentation
└── prompt/                     # Task specifications
```

## Database Models (40+)

Key model groups:

**Core:** Product, ProductIdentity, ProductUrl, InboxItem, ImportBatch, ProductSnapshot
**Content:** ContentBrief, ContentAsset, ProductionBatch, ContentSlot
**Channel:** TikTokChannel, CharacterBible, VideoBible, FormatTemplate, IdeaMatrixItem
**Production:** ShotCode, SceneTemplate, Series, Episode
**Tracking:** AssetMetric, VideoTracking, ContentPost, Campaign
**Learning:** Feedback, LearningLog, LearningWeightP4, UserPattern, WinPattern
**Intelligence:** WeeklyReport, DailyBrief
**Business:** Commission, FinancialRecord, GoalP5, CalendarEvent
**Settings:** AiModelConfig, ApiProvider

## Key Features

- **Inbox Pipeline:** Paste links → auto-enrich → AI score → brief → publish
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
