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

- **Database Models:** 40+
- **Pages:** 15 (added /niche-finder, /guide)
- **API Endpoints:** 90+
- **Components:** 100+ (including 8 shared design system components + niche wizard + guide)
- **Shared Components:** PageHeader, PillTabs, EmptyState, Breadcrumb, SearchInput, StatCard, SkeletonCard, SidebarCollapsible
- **Design Tokens:** 25+ (colors, spacing, typography, shadows)

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
├── components/                 # 95+ React components
│   ├── layout/                 # Header, nav, sidebar, PageHeader
│   ├── channels/               # Channel detail, bible editors, format bank, idea matrix, video bible, series planner
│   ├── production/             # Product selector, brief preview, export, production stepper
│   ├── inbox/                  # Paste box, inbox table, filters, pagination, detail panel (modularized)
│   ├── insights/               # Charts, calendar, financial, overview tab (consolidated)
│   ├── dashboard/              # Bento layout cards, widgets, stat cards
│   ├── shared/                 # Design system: PageHeader, PillTabs, EmptyState, Breadcrumb, SearchInput, StatCard, SkeletonCard, SidebarCollapsible, Sparkline, QC badge
│   ├── ai/                     # Intelligence components
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

## Key Features

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
- **Responsive Layouts:** Mobile-first design with bento layouts, card layout for inbox (<md), collapsible navigation
- **Accessibility:** ARIA attributes, keyboard navigation, screen reader support

## Deployment

- **Platform:** Netlify with @netlify/plugin-nextjs
- **Live URL:** https://pastr-app.netlify.app
- **Build Command:** `pnpm build` with Next.js optimization
- **Publish Directory:** `.next`
- **CI/CD:** GitHub webhook — auto-deploy on push to master
- **Environment Variables:** DATABASE_URL, DIRECT_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, ANTHROPIC_API_KEY
- **Build Metrics:** 74 routes, 0 TypeScript errors, 67 second deploy time
- **Fallback:** Vercel configuration retained for multi-platform flexibility
