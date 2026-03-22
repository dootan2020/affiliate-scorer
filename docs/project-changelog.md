# Project Changelog

Tất cả thay đổi quan trọng của PASTR (AffiliateScorer) được ghi nhận tại đây.

---

## [1.10.1] — 2026-03-22 — Onboarding Checklist & Final Polish

### Added

- **Interactive Onboarding Checklist** — 7-step progress tracker embedded in guide page
  - Steps: Paste link, Upload file, View dashboard, Create channel, Generate brief, Log results, Track performance
  - localStorage persistence, expandable with time estimates + tips
  - Direct navigation links to app pages for quick onboarding
  - Progress bar + percentage display
- **Vietnamese diacritics fix** — Sync page processing log now displays correctly (é, ơ, ư characters preserved)
- **Type safety improvements** — Extract advisor response types into dedicated export

### Changed

- **Onboarding UX** — Added checklist to quick-start guide section for improved first-time user experience
- **Sync page** — Fixed diacritic rendering in processing log output
- **Type exports** — Reorganized advisor types for better reusability

### Fixed

- Vietnamese text rendering (é, ơ, ư) in sync page processing output
- Onboarding checklist localStorage safety checks
- Guide page quick-start navigation flow

### Production Readiness: 85/100
**Status:** MVP fully featured, ready for user beta testing

---

## [1.10.0] — 2026-03-08 — Guide Page Redesign & Advisory System

### Added

- **Guide Page Redesign** — Professional docs-style UI redesign
  - Fixed sticky TOC sidebar (lg+ breakpoint) with orange active indicator
  - Wider content area (removed max-w container constraint)
  - Larger typography (prose-base, leading-7) for readability
  - Mobile TOC dropdown (select instead of hidden sidebar)
- **Advisory System** — Company hierarchy decision-making engine
  - ANALYST role: Gathers real DB data (products, patterns, channels, metrics)
  - CMO role: Content strategy, audience insights, positioning, growth recommendations
  - CFO role: ROI analysis, opportunity cost, financial risk, efficiency metrics
  - CTO role: Execution feasibility, workflow optimization, technical risks
  - CEO role: Final decision synthesis, clear action steps
  - Collapsible C-level detail panels in UI, follow-up question support
- **Guide Sections 10–12:**
  - Section 10: Kênh TikTok (channel creation, Character Bible customization, Video Bible basics)
  - Section 11: Cố vấn AI (ANALYST→CMO/CFO/CTO→CEO hierarchy, interactive workflow)
  - Section 12: Telegram Bot (setup, competitor capture, trend integration)
- **AI Config Expansion** — Task types 4→7
  - Original: Content Brief, Channel Profile, Character Bible, Video Bible
  - New: Niche Analysis, Trend Intelligence, Win Prediction
  - Consolidated preset comparison table (single unified table vs separate charts)
  - Cost & token usage guidance per task type

### Changed

- **Guide TOC** — Now fixed sidebar on desktop, collapsed dropdown on mobile
- **Content Area** — Wider prose for better readability (removed max-w-6xl constraint)
- **Typography** — Larger default font size, improved line height
- **Settings UI** — Task type selection expanded from 4 to 7 types
- **API advisor endpoints** — `analyze`, `followup`, `handle-advisor-request`
- **Database** — Added ChannelMemory, CompetitorCapture, TelegramChat models

### Fixed

- Guide TOC accessibility (keyboard navigation, screen reader support)
- TOC scroll-spy accuracy (fixed with independent scroll contexts)
- Guide page image proxy (direct serve for 500fd.com images)
- Calendar event deduplication in upcoming widget
- Past events exclusion from upcoming widget
- Settings page load state reliability

### Production Readiness: 85/100
**Strengths:** All 16 pages complete, guide fully redesigned, advisory system operational
**Known Issues:** Settings skeleton loading occasional delay, library images gray placeholders (low priority)

---

## [1.9.0] — 2026-03-08 — AI Agent System & Telegram Bot Integration

### Added

- **AI Agent System (6 phases):**
  - Phase 1: Channel Memory builder — contextual enrichment per channel
  - Phase 2: Brief personalization — auto-inject memory into generated briefs
  - Phase 3: Content analyzer — TikTok oembed + AI classification
  - Phase 4: Telegram bot integration + competitor trend analysis
  - Phase 5: Win predictor — 6-feature formula-based success probability
  - Phase 6: Mobile quick-log FAB + PWA installability
- **Telegram Bot Integration** — Link parsing, competitor capture, async trend analysis
  - `/api/telegram/setup` — Initialize webhook URL
  - `/api/telegram/webhook` — Receive and process messages
  - Competitor capture for trend analysis cron (22:30 UTC daily)
- **Nightly Learning Cron** — 22:00 UTC daily
  - Aggregate weekly feedback, update ChannelMemory, decay weights
- **Trend Analysis Cron** — 22:30 UTC daily
  - Analyze competitor captures, generate insights, feed into morning brief
- **PWA Support** — Installable mobile app
  - `public/manifest.json` — PWA metadata
  - `public/sw.js` — Service Worker for offline caching
  - Mobile FAB for quick-log function
- **Database Models (3 new, 2 extended):**
  - `ChannelMemory` — Channel-specific context + content patterns
  - `CompetitorCapture` — Competitor links from Telegram
  - `TelegramChat` — Bot user mapping

### Changed

- **Cron architecture** — Vercel-based scheduling (vercel.json) vs Netlify
- **Brief generation** — Now injects ChannelMemory context (Phase 2)
- **Morning brief** — Lightweight CEO review function for efficiency
- **Settings** — New Telegram configuration UI

### Fixed

- TikTok URL regex now includes `vt.tiktok.com` short links
- Calendar event deduplication fixed
- Upcoming widget past-event filtering

### Cost Impact
- ~$5–10/month for 6 cron jobs + AI calls
- Win predictor: 6-feature formula (no AI cost)
- Telegram: serverless webhook only

---

## [1.8.2] — 2026-03-05 to 2026-03-07 — Niche Intelligence, Dashboard Redesign & ContentMix Update

### Added

- **ContentMix Categories Update** — TikTokChannel ContentMix updated from 4 categories (entertainment, education, review, selling) to 5 (review, lifestyle, tutorial, selling, entertainment). Validation ensures total = 100%.
- **Niche Intelligence Module (Wizard)** — 4-step wizard at `/niche-finder`
  - Step 1 (Explore): Select from 10+ niche categories
  - Step 2 (Analyze): AI analyzes market potential, competition, profit margin
  - Step 3 (Create): System auto-creates TikTok channel + Character Bible
  - Step 4 (Success): Confirmation, link to import products
- **Dashboard 3-Column Bento Grid** — Flexible responsive layout with error boundaries
- **Sidebar 4-Group Navigation** — Sản xuất, Theo dõi, Công cụ, Cài đặt with dynamic badge counts
- **Mobile Inbox Card Layout** — Responsive cards on <md breakpoint (score badge, full name, delta, price, sales, KOL)
- **Error Boundaries (8 widgets)** — Dashboard resilience: Morning Brief, Inbox Stats, Quick Paste, charts, metrics, etc.
- **Skeleton Loaders (3+ pages)** — Dashboard, production, settings pages show proper loading states

### Changed

- **Pre-Production Audit Fixes:**
  - 10 cascade/setNull rules enforced for referential integrity
  - Fire-relay with exponential backoff (1s/2s/4s) + throw-on-error
  - $transaction() for atomic batch creation with dependent records
  - ProductIdentity upsert to prevent race condition on concurrent paste
  - In-memory lock for concurrent morning brief generation
- **Mobile Navigation** — Bottom tab bar for mobile, consistent with desktop nav
- **Sidebar Badge Logic** — Now counts items needing briefing (new + enriched + scored), not just (scored + enriched)
- **Guide Content** — Expanded with concrete examples, use cases, scoring explanation

### Fixed

- Settings page skeleton loading reliability investigation initiated
- Library product images showing gray placeholders (noted for v1.9)
- Production page brief cards load time optimization needed
- Badge "99+" count capping (cosmetic)
- Cascade delete strategy finalized (10 critical relations)

### Technical Debt Resolved

- Integrated niche intelligence module (250+ LOC, modular components)
- Dashboard widget error boundaries for isolation (8 widgets protected)
- Mobile-first responsive pattern standardized (< md breakpoint fully responsive)
- Fire-and-forget relay improved with better error handling

### Production Readiness: 82/100

**Strengths:** All 15 pages load, navigation correct, data accurate, Vietnamese complete
**Weaknesses:** Settings skeleton, library images, production load time (noted for v1.9)

---

## [1.8.1] — 2026-03-03 — Bug Fixes & Refinements

### Fixed

- **Scoring relay middleware blocked (401)** — Added `/api/internal/` and `/api/cron/` to PUBLIC_API_PATHS whitelist
- **Duplicate "Đồng bộ dữ liệu" header on /sync page** — Removed h1 from client component
- **Upload progress bar UX** — Removed premature jump (0→100%), replaced with process log

---

## [1.8.0] — 2026-03-03 to 2026-03-07 — Chunked Import & Inbox UI Refinements

### Added

- **Chunked Import Architecture** — Process 3000+ products across multiple serverless invocations
  - `IMPORT_CHUNK = 300` products/invocation, relay chain: `/api/upload` → `/api/internal/import-chunk` → `/api/internal/score-batch`
  - Fire-and-forget relay with exponential backoff (1s/2s/4s), 3 retries
- **Auto-Retry Scoring Cron** — Daily midnight UTC (`0 0 * * *`), detects stuck batches, max 3 retries
- **Mobile inbox card layout** — Responsive card view on <md breakpoint (score badge, name, delta, price, sales, KOL)
- **Sidebar badge verification** — 4 consistent groups across desktop/mobile

### Changed

- **Import Processing** — Parallel DB queries (20 concurrent) instead of `$transaction` (avoids PgBouncer timeout)
- **Scoring Flow** — Decoupled from import chain; `score-batch` handles all scoring
- **Inbox table responsiveness** — Mobile cards, desktop table unchanged
- **Sidebar badge counting** — Counts items needing briefing (new + enriched + scored)

### Infrastructure

- **Vercel `vercel.json`** — Cron: `/api/cron/retry-scoring` at `0 0 * * *`
- **4 new internal endpoints** — import-chunk, score-batch, imports/[id]/status

### Fixed

- Mobile inbox usability — Cards display complete product info without truncation
- Badge calculation accuracy

### Known Limitations

- 18 min max for 3600 products (6 × 60s invocations)
- Client-side polling (no webhook/SSE yet)

---

## [1.7.0] — 2026-03-02 — Netlify Production Deployment

### Added

- **Netlify deployment configuration** — netlify.toml with @netlify/plugin-nextjs
- **CI/CD automation** — GitHub webhook for auto-deploy on push to master
- **Environment variable management** — Configured DATABASE_URL, DIRECT_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, ANTHROPIC_API_KEY in Netlify dashboard
- **Deployment documentation** — Complete deployment guide with Netlify + Vercel setup instructions

### Infrastructure

- **Live site:** https://pastr-app.netlify.app
- **Build status:** 74 routes generated, 0 TypeScript errors
- **Deployment time:** 67 seconds

---

## [1.6.0] — 2026-02-28 to 2026-03-02 — Comprehensive UI/UX Overhaul

### Added

- **Shared component library (8 components)** — PageHeader, PillTabs, EmptyState, Breadcrumb, SearchInput, StatCard, SkeletonCard, SidebarCollapsible
- **Design tokens** — Semantic colors, spacing scale, typography hierarchy
- **Command Palette (⌘K)** — Quick navigation via cmdk
- **Animated Tab Transitions** — Framer-motion slide/fade on Production & Insights tabs
- **Sparkline SVG Component** — Inline charts for trend visualization
- **Dashboard Bento Layout** — Flexible grid with empty states
- **Inbox Modularization** — Split 524-line monolith into 5 components
- **Accessibility Improvements** — ARIA roles, keyboard navigation, ESC handler

### Changed

- Component architecture → composable single-responsibility components
- Unified pill-style tabs, color palette, typography, spacing, dark mode

### Fixed

- ~2000 lines dead code removed, ESC handler, ARIA attributes, responsive breakpoints

---

## [1.5.0] — 2026-03-02 — Video Production System

### Added

- **Video Bible (12 locks)** — 5 visual, 4 audio, 3 narrative locks
- **Shot Library** — 10 default shot codes (A1-Hook through D2-Environment)
- **Scene Templates** — 5 defaults (PASS/FAIL Lab, Myth-bust, A vs B, Mini Drama, Story)
- **Series Planner** — 4 types (evergreen, signature, arc, community) + AI episode generation
- **Enhanced Export Pack** — ZIP with 6 files (script, shotlist, caption, broll-list, checklist, style-guide)
- **Version Locking** — Lock/unlock CharacterBible + VideoBible with version bumps

---

## [1.4.0] — 2026-03-01 — Character-Driven Content System

### Added

- **Character Bible (7 layers)** — Core values, relationships, world rules, origin, living space, story arcs, language & ritual
- **Format Bank (10 formats)** — Review, Myth-bust, A vs B, Checklist, Story, Test, React, Mini Drama, Series Challenge, Deal Breakdown
- **Idea Matrix** — Bible layers × format templates → content ideas
- **Character-aware briefs** — Personality + format structure injected into AI prompts
- **Consistency QC** — 5 rule-based checks (catchphrase, hook, proof, CTA, red lines)
- **Version locking** — Lock CharacterBible and VideoBible to specific versions

---

## [1.3.0] — 2026-02-28 to 2026-03-01 — Channel-Centric Refactor

### Added

- **Channel Profile** — Schema, API, pages, AI profile generation
- **Brief diversity** — Content type, video format, channel context
- **Tactical Refresh** — AI strategy suggestions + history tracking
- **Channel Export** — JSON download with Unicode support

### Fixed

- HIGH/MEDIUM/LOW audit issues across 50+ files
- Channel export Unicode handling

---

## [1.2.0] — 2026-02-25 to 2026-02-28 — Phase 3: Content Factory

### Added

- **Content Brief generation** — AI tạo 5 angles, 10 hooks, 3 scripts
- **Content Calendar** — Week list view, slots planning
- **Video Tracking** — Results table, CSV import, auto-detect winner
- **Product Image Gallery** — Upload, download, zip packs
- **TikTok Studio parsers** — Data sync workflows
- **Unified Inbox** — Merge Products + Inbox into single table
- **Multi-provider AI** — Claude, OpenAI, Google with UI config
- **Guide page** — GitBook-style, 12 workflow diagrams

### Fixed

- Comprehensive codebase review (security, validation, performance, i18n)
- 13+ specific bug fixes across production, dashboard, calendar, models

---

## [1.1.0] — 2026-02-24 to 2026-02-27 — Phase 2: Personal Layer

### Added

- **Personal layer** — Notes, rating, tags per product
- **Shop management** — Track favorite shops
- **Financial tracking** — Ad costs, profit, ROI
- **Calendar system** — 18 sale events 2026
- **Campaign Tracker** — Link campaigns to products
- **Morning Brief** — Daily AI recommendation summary

### Changed

- Vietnamese diacritics across 19 UI files, Be Vietnam Pro font, Claude Orange primary color

---

## [1.0.0] — 2026-02-24 — Phase 1 Complete

### Added

- **FastMoss XLSX parser** với Vietnamese column mapping
- **KaloData CSV parser**
- **AI Scoring Engine V1** — Claude Haiku 4.5, 6 criteria
- **Dashboard** — Top 10, badges, stat cards
- **Product detail** — Score breakdown, profit estimator
- **Upload page** — Drag-drop, auto-detect format
- **Dark mode** + responsive design + custom error pages + SEO

### Changed

- Migrated SQLite → Supabase PostgreSQL

---

## [Unreleased] — Future

### Planned

- Webhook callbacks for import completion notifications
- Server-sent events (SSE) for real-time progress updates
- Batch prioritization (pause/resume imports)
- Resumable uploads (restart from failed chunk)
- Chrome Extension (MV3) for one-click product capture
- Multi-channel expansion beyond TikTok
- Advanced analytics dashboards
- Enhanced mobile PWA offline sync
- Multi-language support for briefs
- A/B testing framework for content variants
