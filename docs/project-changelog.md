# Project Changelog

Tất cả thay đổi quan trọng của AffiliateScorer được ghi nhận tại đây.

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

## [Unreleased] — Future

### Planned

- Webhook callbacks for import completion notifications
- Server-sent events (SSE) for real-time progress updates
- Batch prioritization (pause/resume imports)
- Resumable uploads (restart from failed chunk)
- Chrome Extension (MV3) for one-click product capture
- Multi-channel expansion beyond TikTok
- Advanced analytics dashboards
- Mobile PWA optimization
