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

## [Unreleased] — Phase 2: Personal Layer

### Planned

- Personal notes/rating/tags cho từng sản phẩm
- Shop management (theo dõi shops yêu thích)
- Financial tracking (chi phí quảng cáo, lợi nhuận thực tế)
- Calendar events — 18 sự kiện sale lớn năm 2026
- Insights redesign — 5 tabs chuyên sâu

## [Unreleased] — Phase 3: Campaigns & Data Parsers

### Planned

- Campaign tracker (theo dõi chiến dịch quảng cáo)
- Mở rộng data parsers (thêm nguồn dữ liệu mới)
- Export reports (PDF, Excel)

## [Unreleased] — Phase 4: AI Intelligence

### Planned

- AI recommendations nâng cao (predictive scoring)
- Market trend analysis tự động
- Competitor monitoring
- Smart alerts (thông báo khi có sản phẩm tiềm năng)
