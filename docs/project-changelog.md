# Project Changelog

Tất cả thay đổi quan trọng của PASTR (AffiliateScorer) được ghi nhận tại đây.

---

## [1.8.2] — 2026-03-05 to 2026-03-07 — Niche Intelligence & Dashboard Redesign + Production Readiness Audit

### Added

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

## [1.8.0] — 2026-03-07 — Inbox UI & Sidebar Badge Refinements

### Added

- **Mobile inbox card layout** — Responsive card view on mobile (< md breakpoint) with score badge, full product name, delta, price, sales 7d, KOL count
- **Sidebar badge verification** — Both desktop and mobile nav display 4 consistent groups (Sản xuất, Theo dõi, Công cụ, Cài đặt) with "Tìm ngách" in Công cụ group

### Changed

- **Inbox table responsiveness** — Desktop table unchanged, mobile now uses card layout instead of horizontal scrolling
- **Sidebar badge counting** — Inbox badge now counts items needing briefing (new + enriched + scored) instead of just scored + enriched
- **Navigation consistency** — Both desktop sidebar and mobile nav use identical group structure and item placement

### Fixed

- Mobile inbox usability — Cards now display complete product information without truncation
- Badge calculation — More accurate reflection of items requiring action in the briefing workflow

---

## [1.0.0] — 2026-02-24 — Phase 1 Complete

### Added

- **FastMoss XLSX parser** với Vietnamese column mapping (tên cột tiếng Việt)
- **KaloData CSV parser** hỗ trợ đọc dữ liệu từ KaloData
- **AI Scoring Engine V1** — tích hợp Claude Haiku 4.5, công thức 6 tiêu chí:
  - Revenue potential, Growth trend, Competition level
  - Commission rate, Market trend, Seasonality
- **Dashboard** — Top 10 sản phẩm + badges (trending, new, seasonal) + stat cards
- **Product detail page** — Score breakdown radar, profit estimator, similar products
- **Upload page** — Drag-drop file, auto-detect format (FastMoss vs KaloData), column mapping
- **Feedback system** — Import kết quả thực tế từ FB Ads, TikTok Ads, Shopee
- **Learning engine** — Phân tích pattern hàng tuần từ feedback data
- **Insights page** — Accuracy chart, discovered patterns, weekly report
- **Dark mode** — Tự động theo OS preference, toggle thủ công (next-themes)
- **Responsive design** — Mobile-first, hoạt động tốt trên mọi thiết bị
- **Error pages** — Custom 404 (not-found.tsx), error boundary (error.tsx), loading skeleton
- **SEO** — Metadata cho mọi page, Open Graph tags

### Changed

- Migrated từ **SQLite sang Supabase PostgreSQL** để hỗ trợ deploy production
- Consolidated navigation xuống **4 tabs** chính: Dashboard, Upload, Products, Insights

### Fixed

- 5 rounds bug fixes bao gồm:
  - Score all products — xử lý batch scoring cho toàn bộ sản phẩm
  - Similar products — thuật toán tìm sản phẩm tương tự
  - Product detail — hiển thị đầy đủ thông tin chi tiết
  - UI polish — truncate tên dài, sửa pagination, image proxy
  - Dark mode — consistent styling across all components

---

## [1.1.0] — 2026-02-24 to 2026-02-27 — Phase 2: Personal Layer

### Added

- **Personal layer** — Ghi chú, rating, tags cho từng sản phẩm
- **Shop management** — Theo dõi shops yêu thích, edit thông tin shop
- **Financial tracking** — Chi phí quảng cáo, lợi nhuận thực tế, ROI tracking
- **Calendar system** — 18 sự kiện sale lớn năm 2026, hiển thị timeline
- **Campaign Tracker** — Theo dõi chiến dịch quảng cáo, liên kết đến sản phẩm
- **Morning Brief** — Tóm tắt hàng sáng, recommendation sản phẩm tiềm năng

### Changed

- Vietnamese diacritics — chuẩn hóa tiếng Việt trong 19 file UI
- Typography sizing — tăng kích cỡ chữ để đọc dễ hơn
- Font family — đổi từ Geist sang Be Vietnam Pro
- Primary color — thay đổi blue sang Claude Orange
- Card styling — standardize header hierarchy across widgets

### Fixed

- Financial tab diacritics và layout
- Shop edit form diacritics
- Vietnamese support toàn codebase
- Responsive design issues

---

## [1.2.0] — 2026-02-25 to 2026-02-28 — Phase 3: Content Factory

### Added

- **Content Brief generation** — AI tạo 5 angles, 10 hooks, 3 scripts cho từng sản phẩm
- **Material Pack system** — Format badges, copy-all prompts, sound style settings
- **Content Calendar** — Week list view, slots planning, stats tháng/tuần
- **Video Tracking** — Results table, form input, CSV import, auto-detect winner
- **Winning Patterns dashboard** — Insights từ tracking data, pattern analysis
- **Product Image Gallery** — Upload, download, zip image packs cho briefs
- **TikTok Studio parsers** — Đọc data từ TikTok Studio, sync workflows
- **Unified Inbox** — Merge Products + Inbox vào table view duy nhất
- **Multi-provider API management** — Support Claude, Google, OpenAI với UI config
- **Settings page** — AI model configuration, API key management
- **Guide page** — GitBook-style documentation, 12 workflow diagrams

### Changed

- Sidebar navigation — Nhóm Việt hóa, workflow reference updates
- Production page UX — Persistent briefs, copy buttons, video tracking integration
- Dashboard redesign — Morning Brief prominent, Inbox stats, quick paste
- Library page — Tất cả videos + kết quả + filters
- Scoring function — Refactor scoreProducts + scoreAllProducts thành single function
- Logging page — Modularize log-page-client thành focused sub-components

### Fixed

- Comprehensive codebase review — Security, validation, performance, i18n fixes
- E2E workflow fixes — R1-R6, R8, R11 từ audit
- Brief prompt enrichment + aiModel selection + error handling
- Production page — export packs, broken images, product thumbnails
- Product selector — thêm rating, sales count, combined score badge
- Product images — 48px sizing + hover preview 240x240 crop
- Hover preview portal — escape overflow scroll containers
- Setup banner visibility — không lẩn khi API key connected
- Model name formatting — Clean Google model names, remove preview/date suffixes
- Cache duration — Giảm từ 24h xuống 1h cho model list
- Dashboard widgets — fetchWithRetry cho transient 502 errors
- Calendar infinite spinner, timezone bugs, error handling
- Tab order + defensive .find() null checks
- Hardcoded AI model fallbacks — bắt buộc Settings DB config

---

## [1.3.0] — 2026-02-28 to 2026-03-01 — Channel-Centric Refactor

### Added

- **Channel Profile (M1)** — Schema, API, pages, navigation
- **Brief Đa Dạng (M2)** — Content type, video format, channel context
- **Tactical Refresh** — TikTok channel strategy AI generation
- **Tactical Refresh History** — Log persistence, UI tracking
- **Channel Export** — Downloadable JSON format với Unicode support
- **AI Profile Generation** — Auto-generate channel setup profile, expert fields
- **Video Production Awareness** — Nâng cấp AI profile với production context

### Changed

- **Channel-centric architecture** — Channel = center of all workflows
- Brief generation — Enforce channelId, fix asset code race condition
- Channel isActive toggle — UI feedback + error handling

### Fixed

- HIGH audit issues — Resolve across 18 files
- MEDIUM audit issues — Resolve across 16 files
- LOW audit issues — Resolve across 16 files
- Deferred audit items — Fix all 12 items across 28 files
- Channel export — Safe JSON serializer, error detail logging
- Channel export — Unicode in Content-Disposition header handling

---

## [1.4.0] — 2026-03-01 — Character-Driven Content System

### Added

- **Character Bible (7 layers)** — Niềm tin, nhân vật phụ, luật thế giới, câu chuyện gốc, bối cảnh, story arc, ngôn ngữ & ritual
- **Visual Locks & Voice DNA** — Props, texture, bảng màu, tone giọng, nhịp nói
- **Format Bank (10 formats)** — Review, Myth-bust, A vs B, Checklist, Story, Test, React, Mini Drama, Series Challenge, Deal Breakdown
- **Idea Matrix** — Crosses bible layers × format templates → idea suggestions
- **Character-aware brief generation** — Injects character personality + format structure into AI prompts
- **Consistency QC** — 5 rule-based checks (catchphrase, hook length, proof section, CTA pattern, red lines)
- **AI Character Bible generation** — Generate full 7-layer bible from channel info
- **AI Idea Matrix generation** — Cross-reference bible × formats for content ideas
- **Version locking** — Lock CharacterBible and VideoBible to specific versions
- **QC badges** — Visual pass/warn indicators on generated briefs

---

## [1.5.0] — 2026-03-02 — Video Production System

### Added

- **Video Bible (12 locks)** — 5 visual (framing, lighting, composition, palette, edit rhythm), 4 audio (voice style, SFX pack, BGM moods, room tone), 3 narrative (opening ritual, proof token rule, closing ritual)
- **AI Video Bible generation** — Tạo Video Bible từ Character Bible + channel info
- **Shot Library** — 10 default shot codes (A1-Hook, A2-Close-up, B1-Test Setup, B2-Test Action, B3-Result, B4-Comparison, C1-Verdict, C2-CTA, D1-Product BRoll, D2-Environment)
- **Scene Templates** — 5 default templates (PASS/FAIL Lab, Myth-bust, A vs B Compare, Mini Drama, Story)
- **Series Planner** — 4 series types (evergreen, signature, arc, community) with status management
- **Episode System** — AI episode generation (5 per batch), episode goals (awareness/lead/sale)
- **Enhanced Export Pack** — ZIP download with 6 files (script.md, shotlist.json, caption.txt, broll-list.md, checklist.md, style-guide.md)
- **Version Locking API** — Lock/unlock for CharacterBible + VideoBible, version bumps on lock
- **Video Bible editor UI** — Accordion groups for 12 locks, shot codes view, scene templates view
- **Series Planner UI** — Create/manage series, episode list, AI generation, status transitions
- **Brief enrichment** — Video Bible context injected into brief generation for production consistency

### Changed

- Channel detail page — Added "Video Bible" and "Series" tabs (6 tabs total)
- Production export — Added "Export Pack.zip" button alongside existing individual exports
- bible-layer-form — Added `disabled` prop support for version locking

---

## [1.6.0] — 2026-02-28 to 2026-03-02 — Comprehensive UI/UX Overhaul

### Added

- **Shared component library (8 components)** — PageHeader, PillTabs, EmptyState, Breadcrumb, SearchInput, StatCard, SkeletonCard, SidebarCollapsible
- **Design tokens** — Semantic colors (success/emerald, warning/amber, info/blue), spacing scale, typography hierarchy
- **Command Palette (⌘K)** — Quick navigation via cmdk, keyboard-driven interface
- **Animated Tab Transitions** — Framer-motion slide/fade effects on Production & Insights tabs
- **Sparkline SVG Component** — Lightweight inline charts for trend visualization
- **Dashboard Bento Layout** — Flexible grid with empty states, scroll indicator dots
- **Inbox Modularization** — Split 524-line monolith into 5 focused components (PasteBox, Table, Filters, Pagination, DetailPanel)
- **Sidebar Restructure** — Collapsible nav groups, dynamic badge counts, improved visual hierarchy
- **Production Stepper** — Multi-step flow with status indicators
- **Insights Tab Consolidation** — Reduced from 6 to 4 focused tabs (Overview, Financial, Calendar, Patterns)
- **Accessibility Improvements** — ARIA roles on tabs/breadcrumb, keyboard navigation support, ESC handler
- **Design System Documentation** — Color tokens, component patterns, responsive guidelines

### Changed

- **New dependencies** — Added framer-motion (4.x), cmdk (0.x)
- **Component Architecture** — Moved from monolithic pages to composable, single-responsibility components
- **Page Headers** — All 13 pages now use consistent PageHeader component with breadcrumb
- **Navigation** — Unified pill-style tabs across product, sidebar, production flows
- **Color Palette** — Enhanced with warm accent colors, semantic status colors
- **Typography** — Standardized text sizes, improved hierarchy across all pages
- **Spacing & Layout** — Consistent whitespace, rounded corners (xl/2xl), shadow depth layering
- **Dark Mode** — Refined dark theme colors for better contrast and visual consistency

### Fixed

- **Code Quality** — Removed ~2000 lines of dead/duplicate code
- **ESC Handler** — Proper escape key handling in modals/popovers
- **ARIA Attributes** — Screen reader support for tabs, breadcrumbs, dropdowns
- **Sparkline Safety** — Defensive checks for empty/invalid data arrays
- **Tab Focus Management** — Keyboard navigation between tab panels
- **Responsive Design** — Fixed mobile breakpoint issues on dashboard/inbox/production

### Technical Debt Resolved

- Consolidated 3 similar badge components into 1
- Reduced component bundle size via dead code removal
- Improved tree-shaking with named exports
- Unified form styling across all pages
- Standardized error/loading/empty states

---

## [1.7.0] — 2026-03-02 — Netlify Production Deployment

### Added

- **Netlify deployment configuration** — netlify.toml with @netlify/plugin-nextjs
- **CI/CD automation** — GitHub webhook for auto-deploy on push to master
- **Environment variable management** — Configured DATABASE_URL, DIRECT_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, ANTHROPIC_API_KEY in Netlify dashboard
- **Deployment documentation** — Complete deployment guide with Netlify + Vercel setup instructions

### Changed

- **Build configuration** — Added @netlify/plugin-nextjs to devDependencies for optimal Next.js build on Netlify
- **Git ignore** — Added .netlify to ignoring local Netlify folder artifacts

### Infrastructure

- **Live site:** https://pastr-app.netlify.app
- **Build status:** 74 routes generated, 0 TypeScript errors
- **Deployment time:** 67 seconds
- **Deployment method:** GitHub webhook with automatic deploy on master branch push
- **Fallback:** Vercel configuration retained for multi-platform flexibility

---

## [1.8.0] — 2026-03-03 — Chunked Import & Auto-Retry System

### Added

- **Chunked Import Architecture** — Process up to 3000+ products across multiple serverless invocations
  - `IMPORT_CHUNK = 300` products per invocation (fits within 60s Vercel limit)
  - Relay chain: `POST /api/upload` → `/api/internal/import-chunk` (repeats) → `/api/internal/score-batch`
  - Non-blocking fire-and-forget relay with exponential backoff (1s/2s/4s)
- **Fire-and-Forget Relay Utility** (`lib/import/fire-relay.ts`)
  - Shared HTTP relay with 3 automatic retries
  - Auth header support (`x-auth-secret`) for server-to-server validation
  - Background execution; caller returns immediately
- **Auto-Retry Scoring Cron** — Vercel cron every 5 minutes
  - Detects failed/stuck import batches with scaled timeout threshold
  - Base threshold: 3 min + (1 min per 150-product scoring chunk)
  - Max 3 scoring retries per batch (tracked in `errorLog.scoringRetryCount`)
  - Handles up to 5 candidates per cron run (rate-limited)
- **UI Enhancements**
  - Chunk progress display: "Đang import 600/3000..." during processing
  - Per-chunk log entries in process log
  - Retry button for failed/stuck imports

### Changed

- **Import Processing** — Refactored `process-product-batch.ts`
  - Parallel database queries (20 concurrent) instead of `$transaction` (avoids PgBouncer timeout)
  - Atomic progress increments via `incrementBatchProgress()`
  - Chunking logic automatically splits 3000+ products
- **Scoring Flow** — Decoupled from import chain
  - `score-batch` endpoint handles all scoring logic
  - Accepts both initial scoring and cron-triggered retries
  - Timeout scaling: per-batch thresholds in import status endpoint

### Infrastructure

- **Vercel Configuration** — New `vercel.json` with cron schedule
  - Path: `/api/cron/retry-scoring`
  - Schedule: `*/5 * * * *` (every 5 minutes)
- **API Endpoints** — 4 new internal endpoints
  - `/api/internal/import-chunk` — Relay for remaining chunks
  - `/api/internal/score-batch` — Trigger batch scoring
  - `/api/imports/[id]/status` — Poll progress with scaled timeouts

### Technical Debt

- Removed dead offset parameter from import scoring flow
- Consolidated error logging patterns
- Improved relay retry diagnostics

### Known Limitations

- Import must complete within 6 sequential 60s invocations (18 min max for 3600 products)
- If both import-chunk relay and cron fail, batch stays stuck (user can retry manually)
- Client-side polling still used (no webhook/SSE yet)

---

## [1.8.1] — 2026-03-03 — Bug Fixes & Refinements

### Fixed

- **Scoring relay middleware blocked (401)** — Added `/api/internal/` and `/api/cron/` to PUBLIC_API_PATHS whitelist; root cause was server-side fetch from fireRelay lacked Origin/Referer headers
- **Duplicate "Đồng bộ dữ liệu" header on /sync page** — Removed h1 from client component, kept PageHeader in page.tsx
- **Upload progress bar UX** — Removed premature jump (0→100%), replaced with process log output instead

---

## [1.8.2] — 2026-03-05 — ContentMix Categories Update

### Changed

- **ContentMix field on TikTokChannel** — Updated from 4 categories (entertainment, education, review, selling) to 5 categories (review, lifestyle, tutorial, selling, entertainment)
  - Form UI updated: sliders with range+number input, 5 rows vertical stack
  - Default values for manual form: all 0% initially
  - Type definition in `lib/content/channel-profile-types.ts`
  - Validation ensures total = 100%
- **AI prompt template** — Template updated in `lib/content/generate-channel-profile.ts` for new category structure
- **Database schema comment** — Updated in `prisma/schema.prisma` to reflect new categories

### Fixed

- DB migration: existing data migrated (education → tutorial for backward compatibility)

---

## [1.9.0] — 2026-03-08 — AI Agent System (6 Phases)

### Added

- **Phase 1: Schema + Nightly Learning**
  - New models: ChannelMemory, CompetitorCapture, TelegramChat
  - Extended ContentAsset with actual_format, actual_style, actual_trend, actual_engagement fields
  - Extended UserPattern with channelId for channel-scoped learning
  - Cron: `/api/cron/nightly-learning` at 22:00 UTC daily
  - Module: `lib/agents/nightly-learning.ts`

- **Phase 2: Brief Personalization ($0 cost)**
  - Auto-inject ChannelMemory context into brief prompts
  - Module: `lib/agents/brief-personalization.ts`
  - Enriches briefs with channel history, winning formats, character traits

- **Phase 3: Content Analyzer**
  - TikTok oembed integration for metadata extraction
  - AI classification of video format, style, engagement
  - Modules: `lib/agents/content-analyzer.ts`, `lib/agents/tiktok-oembed.ts`
  - Triggered on `/api/log/quick` when asset posted
  - Populates actual_* fields on ContentAsset

- **Phase 4: Telegram Bot + Trend Intelligence**
  - Telegram bot webhook setup at `/api/telegram/setup`
  - Receive & analyze competitor TikTok links via bot
  - Store captures in CompetitorCapture model
  - Cron: `/api/cron/trend-analysis` at 22:30 UTC daily
  - Batch analyze competitor trends, feed into morning briefs
  - Modules: `lib/agents/telegram-bot-handler.ts`, `lib/agents/trend-intelligence.ts`

- **Phase 5: Win Predictor ($0 cost)**
  - Formula-based win probability scoring (no AI calls)
  - 6-feature model: engagement, format match, trend alignment, content consistency, audience match, seasonality
  - Route: `POST /api/agents/predict-win`
  - Module: `lib/agents/win-predictor.ts`

- **Phase 6: PWA + Mobile Quick-Log**
  - Progressive Web App manifest + service worker
  - Mobile FAB button for quick-log access
  - Installable on mobile home screen
  - Offline support via service worker
  - Files: `public/manifest.json`, `public/sw.js`, `components/layout/mobile-fab.tsx`, `components/layout/pwa-head.tsx`

### Cost Optimization

- **Total AI calls:** ~3-5 per day
- **Estimated cost:** ~$5-10/month
- **Zero-cost phases:** Phase 2 (memory enrichment), Phase 5 (formula scoring), Phase 6 (PWA)
- **Strategic AI usage:** Phase 1 (nightly batch), Phase 4 (daily trend batch), Phase 3 (on-demand)

### Database Additions

- Added 3 new models (ChannelMemory, CompetitorCapture, TelegramChat)
- Extended 2 existing models (ContentAsset, UserPattern)
- Total models: 45+

### API Additions

- `/api/cron/nightly-learning` — Daily at 22:00 UTC
- `/api/cron/trend-analysis` — Daily at 22:30 UTC
- `/api/agents/predict-win` — Formula-based win prediction
- `/api/telegram/setup` — Telegram bot initialization
- `/api/telegram/webhook` — Telegram message receiver

---

## [1.10.0] — 2026-03-08 — Advisory Agent System Restructure (Company Hierarchy)

### Changed

- **Advisory Agent Architecture Refactor** — Transitioned from 4 independent personas (GROK, SOCRATES, LIBRARIAN, MUNGER) to company hierarchy model:
  - **ANALYST** (runs first) — Data aggregation role; queries DB for products, patterns, channels; prepares briefing for decision-makers
  - **CMO, CFO, CTO** (run in parallel) — Analysis roles; each provides independent perspective:
    - CMO: Content strategy, audience insight, positioning, growth recommendations
    - CFO: ROI analysis, opportunity cost, financial risk assessment, efficiency metrics
    - CTO: Execution feasibility, workflow optimization, technical blockers, risk mitigation
  - **CEO** (runs last) — Decision maker role; synthesizes all perspectives; provides 1 clear decision + action steps

### API Changes

- `/api/advisor/analyze` — POST with question + optional context → returns full pipeline result with CEO decision prominent
- `/api/advisor/followup` — POST for follow-up questions using same pipeline
- Response structure now includes:
  - `ceoDecision` — Top-level decision (✅ Decision, 📝 Reason, 👉 Next Steps)
  - `cLevelResponses[]` — Expandable C-level analysis details (CMO, CFO, CTO)
  - `analystBriefing` — Data context and key metrics
  - `question`, `timestamp` — Request metadata

### Data Gathering

- **New module:** `lib/advisor/gather-advisor-data.ts`
  - Queries ProductIdentity (top 10 by score + delta type)
  - Queries UserPattern (winning/losing patterns with win rates)
  - Queries ChannelMemory (channel performance + insights)
  - Gathers metrics: total products, scored, briefed, published videos
  - Formats into compact data briefing for ANALYST role

### UI Updates

- **Advisor page redesign** — CEO decision displayed prominently at top
- Expandable C-level section below with individual role analysis
- Historical context support for multi-turn conversations
- Loading indicators show analysis stage (analyst → c-levels → ceo)
- Visual role badges with semantic colors (CMO: violet, CFO: emerald, CTO: blue, CEO: amber)

### Files Added

- `lib/advisor/c-level-roles.ts` — Role definitions, system prompts for 5 personas
- `lib/advisor/analyze-pipeline.ts` — Orchestration logic: ANALYST → [CMO,CFO,CTO] → CEO
- `lib/advisor/gather-advisor-data.ts` — DB queries and data formatting
- `app/api/advisor/analyze/route.ts` — Main analysis endpoint
- `app/api/advisor/followup/route.ts` — Follow-up question endpoint
- `app/api/advisor/handle-advisor-request.ts` — Shared request validation + error handling
- `components/advisor/advisor-page-client.tsx` — Client component with full UI
- `app/advisor/page.tsx` — Server component wrapper

### Files Modified

- `lib/advisor/personas.ts` — Kept for backward compatibility; new system doesn't use
- `lib/advisor/analyze.ts` — Legacy; superceded by analyze-pipeline.ts

### Morning Brief Integration

- **New function:** `ceoBriefReview()` in analyze-pipeline.ts
- Used by morning brief generation to get CEO quick review instead of MUNGER+SOCRATES critique
- Lighter weight: skip data gathering, just review brief summary → 2-3 sentences actionable
- Maintains single CEO voice for brief decisions

### Cost & Performance

- **Token optimization:** ANALYST gathers data once, passes to all C-levels → no redundant queries
- **Parallel execution:** CMO, CFO, CTO run in Promise.all() → faster analysis
- **Max tokens:** C-levels capped at 1024; CEO at 1200 for final synthesis
- **Data freshness:** Real DB queries every request (no caching) → always current context

---

## [1.10.0] — 2026-03-08 — Guide Page Redesign & Advisory System

### Added

- **Guide Page UI Redesign**
  - Fixed TOC sidebar (sticky, always visible on lg+ breakpoint)
  - Wider content area (removed max-w-6xl constraint for full-width prose)
  - Larger typography (prose-base, leading-7 for better readability)
  - Linear TOC with orange active indicator (left border, colored background)
  - Mobile TOC dropdown select (replaces hidden sidebar on <lg)
  - 3 new sections: Kênh TikTok (10), Cố vấn AI (11), Telegram Bot (12)

- **Guide Section 10: Kênh TikTok** — Channel profile setup, Character Bible, Video Bible, best practices
- **Guide Section 11: Cố vấn AI** — ANALYST → CMO/CFO/CTO → CEO decision hierarchy, workflow
- **Guide Section 12: Telegram Bot** — Bot setup, competitor link capture, trend analysis integration

- **AI Config Section** — Expanded 4→7 task types, consolidated preset comparison table
- **FAQ Section** — 2 new entries on advisor decision logic and Telegram bot automation

### Changed

- **Guide page layout** — TOC fixed + content area wider (no container constraint)
- **Guide navigation** — 15 total sections (was 13), clearer visual hierarchy
- **TOC styling** — Orange active indicator instead of blue, better visual contrast
- **Mobile UX** — Dropdown select instead of collapsible nav for TOC navigation

### Technical Updates

- New component: `guide-toc.tsx` with GuideToc + GuideTocMobile variants
- Updated: `guide-page-client.tsx` with flex layout (sidebar + content)
- Intersection observer for dynamic TOC highlight on scroll
- Orange color tokens: orange-500, orange-700, orange-50, orange-400, orange-950 in Tailwind

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
