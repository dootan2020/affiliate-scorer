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

## [Unreleased] — Phase 5+: Business Intelligence & Expansion

### Planned

- Commission tracking deep integration
- Weekly business reports + goal tracking
- AI recommendations nâng cao (predictive scoring)
- Market trend analysis tự động
- Competitor monitoring
- Smart alerts (thông báo sản phẩm tiềm năng)
- Mở rộng data parsers (thêm nguồn dữ liệu mới)
- Advanced export (PDF, Excel reports)
