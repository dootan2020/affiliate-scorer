# PASTR — Báo Cáo Audit UI/UX & Đề Xuất Redesign Toàn Bộ

**Ngày:** 2026-03-02
**Phạm vi:** Toàn bộ webapp PASTR (13 pages, 95+ components)
**Tech stack:** Next.js 16 + React 19 + Tailwind CSS 4 + Radix UI + Lucide React + Recharts
**Target user:** Marketer affiliate TikTok Việt Nam, 1 người, laptop sáng + phone đôi khi

---

## Phần 1: Tổng Hợp Xu Hướng UI/UX 2025-2026

### 1.1 Nguồn đã research

| # | Nguồn | Trọng tâm |
|---|-------|-----------|
| 1 | UX Studio Team | AI, motion, accessibility, liquid glass |
| 2 | The Frontend Company | SaaS-specific: command palette, customizable dashboards |
| 3 | Index.dev | Minimalism, glassmorphism, ethical personalization |
| 4 | Promodo | Bento grid, strategic UX writing, glassmorphism |

### 1.2 Đánh giá phù hợp / không phù hợp với PASTR

**Context PASTR:** Personal tool cho 1 marketer VN. Mở sáng trên laptop (~30 phút duyệt nhanh), đôi khi phone. Không phải enterprise SaaS, không multi-user, không cần collaboration.

#### ✅ 7 Trends ÁP DỤNG ĐƯỢC

| # | Trend | Lý do phù hợp | Cách áp dụng cụ thể |
|---|-------|---------------|---------------------|
| 1 | **Bento Grid Dashboard** | PASTR quản lý nhiều loại data (products, videos, channels, analytics) → cần layout linh hoạt | Dashboard dùng bento grid 2-3 cột, widgets có size khác nhau. Morning view compact, detail view expanded |
| 2 | **Proactive UX** | Marketer chỉ có 30 phút buổi sáng → AI phải chủ động suggest actions thay vì chờ user khám phá | Morning Brief hiện top 3 actions cần làm. Smart alerts theo impact (revenue, urgency). Trend expiry countdown |
| 3 | **Data Storytelling** | Performance data affiliate dễ confusing khi chỉ dump numbers | Narrative metrics: "1.2K đơn hôm qua — ↑23% vs hôm kia". Sparklines inline. Color-coded trends (xanh/đỏ/xám) |
| 4 | **Microinteractions** | Confirm action + guide focus mà không gây distraction cho morning routine | Checkbox ✓ fade, status badge pulse (<300ms), button hover shadow. KHÔNG bouncing, spinning, particle effects |
| 5 | **Command Palette (⌘K)** | Marketer làm việc với hàng trăm products, cần quick access | Global search: gõ tên SP → instant jump. "edit video 3" → open editor. Recent items. Keyboard shortcuts |
| 6 | **Ethical Personalization** | User (cùng 1 người) có needs khác nhau theo thời gian trong ngày | Time-aware: 6-10h show brief, 10-17h show editors, 17-21h show summary. Smart defaults. Privacy-first (local only) |
| 7 | **Glassmorphism + Soft Depth** | Cần visual hierarchy để quản lý density (products, metrics, actions) | Modal/side panels: semi-transparent + blur. Cards: soft shadow (không border cứng). Sticky header blur on scroll |

#### ❌ 7 Trends KHÔNG PHÙ HỢP

| Trend | Lý do loại |
|-------|-----------|
| Voice UI / Zero UI | Vietnamese voice recognition yếu. Context công sở không nói commands. 30 phút sáng cần visual feedback |
| 3D / Spatial / VR/AR | Performance cost cao, không cải thiện task speed, battery drain trên phone |
| Anti-Design (Chaotic) | Tool business cần tin cậy. Chaos = unprofessional cho data-driven affiliate marketing |
| Motion Posters / Heavy Animation | PASTR là tool, không phải marketing site. Morning routine cần UI nhanh |
| Collaborative Features | PASTR cho 1 người dùng. Collaboration thêm complexity không cần thiết |
| Generative UI (AI tạo layout) | Over-engineered. "Layout thay đổi mỗi lần" phá muscle memory, giảm scan speed |
| UGC (User-Generated Content) | PASTR là internal tool, không public-facing |

---

## Phần 2: Audit Từng Trang

### Trang 1: `/` — Dashboard (Tổng quan)

**File:** `app/page.tsx` (39 dòng)
**Components:** `OrphanAlertWidget`, `YesterdayStatsWidget`, `ChannelTaskBoard`, `ContentSuggestionsWidget`, `MorningBriefWidget`, `WinningPatternsWidget`
**API:** `/api/dashboard/yesterday-stats`, `/api/dashboard/channel-tasks`, `/api/dashboard/orphan-stats`, `/api/inbox?sort=score`, `/api/dashboard/morning-brief`

**Layout hiện tại:** 6 widgets xếp dọc `space-y-6`, full-width, không grid

**Vấn đề UX:**
- P1: Widgets xếp dọc 100% → phải scroll nhiều, không scan nhanh được. Marketer sáng muốn xem tất cả at-a-glance
- P1: Morning Brief default closed → data quan trọng nhất bị ẩn, user có thể quên mở
- P2: Không có personalization — same layout mọi lúc trong ngày
- P2: Thiếu sparklines / trend indicators trên stat cards
- P2: Thiếu quick actions trực tiếp từ dashboard (VD: nút "Tạo video" cho SP hot)

**Vấn đề UI:**
- P2: YesterdayStats dùng grid 2×2 mobile / 4-col desktop — OK nhưng stat cards thiếu trend indicator (↑↓)
- P2: ChannelTaskBoard horizontal scroll — không có scroll indicator/hint trên desktop
- P1: Không có empty state cho dashboard khi mới cài (0 channels, 0 products)
- P2: Widgets không có consistent padding — mix giữa card styles

---

### Trang 2: `/inbox` — Hộp sản phẩm

**File:** `app/inbox/page.tsx` (16 dòng), `components/inbox/inbox-page-content.tsx` (client)
**Components:** `PasteLinkModal`, `InboxTable`, `QuickEnrichModal`, filter dropdowns
**API:** `/api/inbox` (search, filter, sort, pagination), `/api/inbox/categories`, `/api/inbox/bulk-delete`

**Layout hiện tại:** State tabs → Search bar + Filter row → Table → Pagination footer. Full-width.

**Vấn đề UX:**
- P1: Filter dropdowns (category, delta, price, score) đều custom-built, thiếu clear filter button tổng
- P1: Bulk actions bar sticky nhưng chỉ hiện khi có selected → user có thể không biết tính năng tồn tại
- P2: Tabs ("Mới", "Đã bổ sung", ...) không hiện count → không biết có bao nhiêu SP ở mỗi state
- P2: Thiếu inline product preview (hover/click mở side panel thay vì navigate away)
- P2: Search debounce 300ms OK, nhưng không có search suggestions/autocomplete

**Vấn đề UI:**
- P2: Table trên mobile ẩn columns → OK, nhưng thiếu card-view alternative cho mobile
- P1: Filter row khi mở nhiều filter → UI bị chật, filters chồng nhau
- P2: Pagination controls nhỏ, khó tap trên mobile
- P2: Thiếu loading skeleton riêng cho filter change (chỉ có table skeleton)

---

### Trang 3: `/inbox/[id]` — Chi tiết sản phẩm

**File:** `app/inbox/[id]/page.tsx` (524 dòng — QUÁ DÀI, cần modularize)
**Components:** `ScoreBreakdown` (radar chart), `ProfitEstimator`, `SeasonalTagForm`, `ProductImage`, `AffiliateLinkSection`, `PersonalNotesSection`, `WinProbabilityCard`, `LifecycleBadge`, `ChannelRecommendations`
**Data:** Server-side fetch trực tiếp Prisma, AI calls cho lifecycle/recommendations/confidence

**Layout hiện tại:** Back button → Header (image + title + score badge) → 2-column grid (info + AI) → Notes + Links sections

**Vấn đề UX:**
- P0: File 524 dòng — monolithic server component, khó maintain, render toàn bộ page mỗi lần
- P1: Không có back navigation context — "Quay lại" luôn về /inbox, không nhớ filter/page state
- P1: Quá nhiều sections → overwhelm. User cần prioritize: Score → Suggestions → Action
- P2: AI components (lifecycle, recommendations) gọi LLM mỗi page load → chậm, tốn token
- P2: Thiếu "Tạo brief" CTA trực tiếp → user phải navigate sang /production

**Vấn đề UI:**
- P1: Score badge dùng hardcoded colors (rose-500, emerald-500) — không theo design tokens
- P2: InfoRow layout `flex justify-between` — label bên trái, value bên phải → OK desktop, chật mobile
- P2: Radar chart (ScoreBreakdown) chiếm nhiều space nhưng thông tin density thấp
- P2: Sections thiếu visual separation rõ ràng (chỉ dùng spacing, không có dividers/cards)

---

### Trang 4: `/production` — Sản xuất Content

**File:** `app/production/page.tsx` (24 dòng), `components/production/production-page-client.tsx`
**Components:** 5 tabs: `ProductionCreateTab`, `ProductionInProgressTab`, `ProductionCompletedTab`, `CalendarTab`, `TrackingTab`
**Tabs:** Tạo mới (1) → Đang sản xuất (2) → Đã hoàn thành (3) → Lịch đăng (4) → Kết quả (5)

**Layout hiện tại:** Header + description → Pill nav (numbered steps) → Tab content

**Vấn đề UX:**
- P1: 5 tabs là pipeline workflow nhưng thiếu visual pipeline indicator (progress bar/funnel)
- P1: Pill nav scrollable on mobile → nhưng tên tab dài ("Đã hoàn thành") bị thiếu context khi scroll
- P2: Thiếu count badges trên tabs (VD: "Đang sản xuất (3)")
- P2: Tab "Tạo mới" default active nhưng "Đang sản xuất" thường urgent hơn cho morning check
- P2: Không có drag-drop giữa các stages (phải vào từng item để chuyển)

**Vấn đề UI:**
- P2: Step numbers (1-5) trong circles OK, nhưng thiếu connecting line giữa steps
- P2: Tab content area không có min-height → layout shift khi switch tabs
- P1: Mobile: pill nav bị cắt, user phải scroll ngang → dễ miss tabs cuối

---

### Trang 5: `/library` — Thư viện

**File:** `app/library/page.tsx` (15 dòng), `components/library/library-page-client.tsx`
**Components:** `AssetCard`, filter dropdowns (status, format, sort), search, pagination

**Layout hiện tại:** Filters → Card grid → Pagination

**Vấn đề UX:**
- P1: Dùng `max-w-7xl` trong khi root layout dùng `max-w-6xl` → **inconsistent container width**
- P1: Thiếu page title + description (client component render trực tiếp, không có header)
- P2: Card grid 24 items/page — nhiều, gây scroll dài
- P2: Thiếu list/grid view toggle
- P2: Thiếu loading skeleton (client component không show skeleton khi fetching)

**Vấn đề UI:**
- P2: Filter dropdowns giống inbox nhưng implement riêng (duplicate code)
- P2: Pagination controls giống inbox nhưng cũng implement riêng
- P1: Thiếu empty state khi không có assets

---

### Trang 6: `/channels` — Kênh TikTok

**File:** `app/channels/page.tsx` (22 dòng), `components/channels/channel-list-client.tsx`

**Layout hiện tại:** Header + description → Channel cards grid

**Vấn đề UX:**
- P2: Thiếu quick stats overview (tổng channels, tổng videos, tổng views)
- P2: Channel cards không hiện performance indicators
- P2: "Thêm kênh" flow dùng form inline thay vì modal → push content xuống

**Vấn đề UI:**
- P2: Channel cards layout OK (rounded, shadow)
- P2: Thiếu channel avatar/icon differentiation — tất cả cards nhìn giống nhau

---

### Trang 7: `/channels/[id]` — Chi tiết kênh

**File:** `app/channels/[id]/page.tsx` (19 dòng), `components/channels/channel-detail-client.tsx`
**Sub-components:** `ChannelForm`, `CharacterBibleEditor`, `FormatBankList`, `IdeaMatrixGrid`, `VideoBibleEditor`, `SeriesPlanner`, `TacticalRefreshDialog`

**Layout hiện tại:** Back button → Channel info → Tab navigation (6+ tabs)

**Vấn đề UX:**
- P1: Quá nhiều tabs (Form, Character Bible, Format Bank, Idea Matrix, Video Bible, Series Planner) → cognitive overload
- P1: Các tabs là data-heavy editors → slow tab switching nếu mỗi tab fetch riêng
- P2: Thiếu "AI Generate" flow rõ ràng — user không biết bắt đầu từ đâu
- P2: TacticalRefreshDialog — tên không rõ purpose cho non-technical user

**Vấn đề UI:**
- P2: Tab labels dài → overflow trên mobile
- P2: Editors (CharacterBible, VideoBible) dùng textarea/form khác style với nhau

---

### Trang 8: `/insights` — Phân tích

**File:** `app/insights/page.tsx` (225 dòng server + client), `components/insights/insights-page-client.tsx`
**Tabs:** Overview, Calendar, Financial, Accuracy, Patterns, Playbook
**Components:** `OverviewTab`, `FinancialTab`, `CalendarTab`, `AccuracyChart`, `PatternList`, `WeeklyReport`, `PlaybookPageClient`, `ConfidenceWidget`, `WeeklyReportCard`, `ChannelFilter`, `TriggerLearningButton`

**Layout hiện tại:** Insights tabs → Tab content. Server fetches data → passes as props.

**Vấn đề UX:**
- P1: 6 tabs — quá nhiều cho 1 page. "Playbook" đã có route riêng `/playbook` (redirect) → confusing
- P1: Server-side data fetch → page load chậm nếu nhiều queries
- P2: Thiếu date range picker — không lọc theo thời gian
- P2: Financial tab thiếu charts (chỉ table)
- P2: ChannelFilter chỉ 1 filter — thiếu multi-filter combo

**Vấn đề UI:**
- P2: Charts (Recharts) không responsive tốt trên mobile
- P2: WeeklyReportCard style khác ConfidenceWidget → inconsistent
- P1: Tab navigation giống Production nhưng implement khác (InsightsTabs riêng vs inline buttons)

---

### Trang 9: `/log` — Nhật ký

**File:** `app/log/page.tsx` (38 dòng), `components/log/log-page-client.tsx` (39 dòng)
**Modes:** Quick (1 video), Batch (nhiều video)
**Sub-components:** `LogQuickMode`, `LogBatchMode`

**Layout hiện tại:** Header + description → Sync hint banner → Mode toggle (pill nav) → Mode content

**Vấn đề UX:**
- P2: Sync hint banner tốt nhưng chiếm space permanent — nên dismissible
- P2: Quick mode = paste 1 link, nhập metrics → flow đơn giản, OK
- P2: Batch mode — quy trình khác Quick nhưng user phải đoán
- P2: Thiếu recent logs history trực tiếp trên trang

**Vấn đề UI:**
- P1: Mode toggle pill nav giống Production/Insights nhưng chỉ 2 options → dùng pill nav hơi overkill
- P2: Sync hint dùng orange-50/border-orange-100 — consistent với brand

---

### Trang 10: `/playbook` — Playbook

**File:** `app/playbook/page.tsx` (5 dòng)
**Behavior:** `redirect("/insights?tab=playbook")` — redirect page, không render gì

**Vấn đề UX:**
- P1: Redirect page → sidebar hiện "Playbook" link nhưng KHÔNG có playbook page riêng → confusing navigation. Nếu đã redirect, nên bỏ khỏi sidebar hoặc highlight tab Phân tích
- P0: **Playbook link đã bị xóa khỏi sidebar** (không có trong NAV_GROUPS) → page tồn tại nhưng không accessible từ nav. Dead route.

**Vấn đề UI:**
- N/A (redirect, không có UI)

---

### Trang 11: `/sync` — Đồng bộ dữ liệu

**File:** `app/sync/page.tsx` (11 dòng), `components/sync/sync-page-content.tsx`
**Components:** `FileDropzone`, `UploadProgress`, `ColumnMapping`, `ImportHistoryTable`, `TikTokStudioDropzone`

**Layout hiện tại:** Dropzone → Column mapping → Upload progress → Import history

**Vấn đề UX:**
- P2: Multi-step upload flow (drop file → map columns → import) — tốt nhưng thiếu step indicator
- P2: Import history table ở cuối trang → phải scroll qua dropzone mỗi lần check
- P1: Thiếu page title + description (delegate hoàn toàn cho client component — inconsistent vs other pages)
- P2: TikTok Studio dropzone và generic dropzone — 2 upload areas, user có thể confuse dùng cái nào

**Vấn đề UI:**
- P2: Dropzone styling OK (dashed border, center icon)
- P2: Import history table có thể dài → cần pagination

---

### Trang 12: `/guide` — Hướng dẫn

**File:** `app/guide/page.tsx` (11 dòng), `components/guide/guide-page-client.tsx`
**Components:** `GuideToc` (sidebar TOC), `GuideTocMobile`, `GuideContent`

**Layout hiện tại:** 2-column: TOC sidebar (sticky) + Content area. Mobile: TOC dropdown + content.

**Vấn đề UX:**
- P2: Good UX — TOC with IntersectionObserver for scroll tracking
- P2: 12 sections TOC — comprehensive nhưng dài
- P2: Thiếu search within guide
- P1: Thiếu page title (delegate cho client — inconsistent)

**Vấn đề UI:**
- P2: TOC sidebar indent cho sub-sections — tốt
- P2: Content area uses prose/typography plugin — readable

---

### Trang 13: `/settings` — Cài đặt

**File:** `app/settings/page.tsx` (22 dòng), `components/settings/settings-page-client.tsx`
**Features:** API key management (3 providers), AI model assignment (4 tasks), connection testing

**Layout hiện tại:** Header + description → API keys section → Model assignment section

**Vấn đề UX:**
- P2: API key input shows last 4 chars for security — tốt
- P2: Model selection dropdown per task — clear
- P2: Thiếu "Test all connections" button (chỉ test từng key riêng)
- P2: Thiếu export/import settings

**Vấn đề UI:**
- P2: Cards cho mỗi provider — consistent
- P2: Connected status dùng green check / red X — clear

---

### Trang 14: 404 Page (`app/not-found.tsx`)

**Layout:** Center icon (Search) + "Không tìm thấy trang" + description + "Về trang chủ" button

**Vấn đề UX:** OK — đủ CTA, clear message
**Vấn đề UI:**
- P2: Button dùng default variant (primary orange) — OK
- P2: `py-16` — ít vertical centering, page nhìn lệch trên viewport lớn

---

### Trang 15: Error Page (`app/error.tsx`)

**Layout:** Center icon (AlertCircle) + "Đã xảy ra lỗi" + error message + "Thử lại" button

**Vấn đề UX:** OK — error message hiển thị, có retry button, dev-only console.error
**Vấn đề UI:**
- P2: Icon dùng rose-50/rose-400 — consistent
- P2: Button dùng hardcoded orange-600 thay vì design token `bg-primary` → inconsistent

---

## Phần 3: Design System Audit

### 3.1 Color Palette

**Tình trạng:** ✅ Tốt — có hệ thống CSS variables rõ ràng

| Token | Light | Dark | Nhận xét |
|-------|-------|------|----------|
| `--primary` | `#E87B35` (warm orange) | `#FF8F47` | ✅ Consistent, brand identity rõ |
| `--background` | `#F9FAFB` | `#030712` | ✅ Proper contrast |
| `--card` | `#FFFFFF` | `#0F172A` | ✅ Good |
| `--destructive` | `#DC2626` | `#F87171` | ✅ Đúng semantic |
| `--accent` | `#FEF3EB` | `rgba(232,123,53,0.1)` | ✅ Subtle orange tint |
| Chart 1-5 | Orange, green, indigo, amber, pink | Brighter variants | ✅ Diverse |

**Vấn đề:**
- P1: Nhiều component dùng **hardcoded colors** thay vì tokens: `bg-blue-600`, `text-violet-600`, `bg-rose-500`, `bg-emerald-500`. Không follow design system.
- P2: Thiếu semantic tokens cho `success`, `warning`, `info` — chỉ có `destructive`
- P2: Dark mode dùng `rgba()` cho một số borders — OK nhưng thiếu fallback cho browsers cũ

### 3.2 Typography

**Font:** Be Vietnam Pro (Vietnamese support) + Geist Mono
**Base size:** 15px (body) — hơi lớn hơn standard 14px, tốt cho readability

| Element | Classes | Nhận xét |
|---------|---------|----------|
| Page title | `text-2xl sm:text-[32px] font-semibold tracking-tight` | ✅ Consistent across pages |
| Section title | `text-lg font-medium` | ✅ |
| Body | `text-sm` (14px) | ✅ |
| Caption | `text-xs text-gray-400` | ✅ |
| Nav group label | `text-[11px] font-semibold uppercase tracking-wider` | ✅ |

**Vấn đề:**
- P2: `text-[32px]` dùng arbitrary value thay vì `text-3xl` (30px) hoặc `text-4xl` (36px) — minor
- P2: Geist Mono font loaded nhưng ít dùng — có thể bỏ để giảm bundle
- P2: Font weights 400/500/600/700 loaded — tốt

### 3.3 Spacing System

**Base:** Tailwind default (4px grid)
**Container:** `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6`

| Pattern | Nhận xét |
|---------|----------|
| Page sections | `space-y-6` (24px) | ✅ Consistent |
| Card padding | Mix `p-4`, `p-5`, `p-6` | ❌ Inconsistent |
| Component gaps | `gap-3`, `gap-4`, `gap-6` | OK, contextual |
| Mobile offset | `pt-14 pb-20 md:pt-0 md:pb-0` | ✅ Accounts for mobile bars |

**Vấn đề:**
- P1: **Library page** dùng `max-w-7xl` vs root layout `max-w-6xl` → content wider hơn các trang khác
- P1: Sync và Guide page delegate hoàn toàn cho client component → client tự set padding → inconsistent
- P2: Card padding không standardized: dashboard widgets dùng `p-6`, một số `p-4`, `p-5`

### 3.4 Reusable Components vs Custom

**Shared UI (components/ui/):**
- ✅ `Button` — CVA-based, 5 variants, 8 sizes — EXCELLENT
- ✅ `Card` — Compound component — tốt nhưng KHÔNG phải mọi trang dùng (nhiều trang tự viết card div)
- ✅ `Input`, `Table`, `Tabs`, `Badge`, `Dialog`, `DropdownMenu`, `Progress` — có
- ✅ `ErrorBoundary` — tốt
- ✅ `Sonner` (toasts) — consistent

**Custom per-page (DUPLICATE code):**
- ❌ Filter dropdowns: Inbox, Library, Insights — mỗi trang implement riêng
- ❌ Pagination: Inbox, Library — implement riêng, không shared
- ❌ Pill nav tabs: Production, Log, Insights — implement inline, không shared
- ❌ Search input: Inbox, Library — implement riêng
- ❌ Loading skeletons: mỗi trang tự viết skeleton riêng

### 3.5 Loading / Empty / Error States

| Page | Loading | Empty | Error |
|------|---------|-------|-------|
| Dashboard | ✅ Widgets có skeleton | ⚠️ Thiếu first-run empty state | ✅ Try-catch per widget |
| Inbox | ✅ TableSkeleton | ✅ Có | ✅ Có |
| Inbox Detail | ❌ Server render, no skeleton | ❌ notFound() only | ❌ Server error |
| Production | ⚠️ Partial | ⚠️ Partial | ✅ ErrorBoundary |
| Library | ❌ Thiếu | ❌ Thiếu | ⚠️ fetchError state |
| Channels | ⚠️ Partial | ✅ Có | ⚠️ Partial |
| Insights | ⚠️ Server render | ⚠️ Partial | ⚠️ Partial |
| Sync | ✅ Upload progress | ✅ Initial dropzone | ✅ Error handling |
| Log | ⚠️ Partial | ⚠️ Partial | ⚠️ Partial |
| Guide | ✅ Static content | N/A | N/A |
| Settings | ✅ Provider cards | N/A | ✅ Connection test |

**Kết luận:** Loading/empty states coverage ~50%. Cần standardize pattern.

### 3.6 Icons

**Library:** Lucide React — ✅ Consistent
**Sizes:**
- Inline text: `w-4 h-4` — tốt
- Buttons: `w-4 h-4` hoặc `w-5 h-5` — **inconsistent** (nên `w-4 h-4` cho inline, `w-5 h-5` cho standalone)
- Empty state center: `w-8 h-8` — OK
- Mobile bottom tabs: `w-5 h-5` — OK

### 3.7 Design Tokens Chung (Summary)

| Aspect | Status | Priority Fix |
|--------|--------|-------------|
| Color palette | ✅ Good system, ❌ hardcoded colors scattered | P1 |
| Typography | ✅ Good | P2 minor |
| Spacing | ⚠️ Inconsistent padding | P1 |
| Border radius | ✅ `rounded-xl`, `rounded-2xl` consistent | OK |
| Shadows | ✅ `shadow-sm`, `shadow-md` consistent | OK |
| Transitions | ✅ `transition-all duration-200` | OK |
| Dark mode | ✅ Good coverage | P2 minor gaps |

---

## Phần 4: Đề Xuất Redesign Cụ Thể Từng Trang

### 4.1 Dashboard `/` — P0

**Layout mới:**
```
┌─────────────────────────────────────────────┐
│ [OrphanAlert — only if exists]              │
├─────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│ │Videos│ │Views │ │Orders│ │ ₫₫₫  │  Stats  │
│ │  12  │ │45.2K │ │  89  │ │2.1M  │  Row    │
│ │ ↑23% │ │ ↓5%  │ │ ↑12% │ │ ↑8%  │         │
│ └──────┘ └──────┘ └──────┘ └──────┘         │
├──────────────────────┬──────────────────────┤
│ Morning Brief        │ Content Suggestions  │
│ ┌──────────────────┐ │ ┌──────────────────┐ │
│ │ 🔥 Top 3 actions │ │ │ Top 5 SP table   │ │
│ │ with urgency     │ │ │ inline sparkline  │ │
│ │ DEFAULT OPEN     │ │ │ quick action btn  │ │
│ └──────────────────┘ │ └──────────────────┘ │
├──────────────────────┴──────────────────────┤
│ Channel Task Board (horizontal scroll)      │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐                │
│ │Ch1 │ │Ch2 │ │Ch3 │ │Ch4 │                │
│ └────┘ └────┘ └────┘ └────┘                │
├─────────────────────────────────────────────┤
│ Winning Patterns (compact, collapsible)     │
└─────────────────────────────────────────────┘
```

**Thay đổi:**
- Stats row: Thêm trend indicator (↑↓%) + sparkline mini
- Morning Brief: **Default OPEN**, 2-column layout với Content Suggestions
- Content Suggestions: Thêm quick action "Tạo brief" per item
- Channel Task Board: Thêm scroll indicator dots
- Thêm first-run empty state cho new users
- **Mobile:** Stack tất cả thành 1 column, Brief luôn open

**Priority:** P0 — Dashboard là trang chính, dùng mỗi sáng
**Components thêm:** Sparkline component (shared)
**Components sửa:** `YesterdayStatsWidget` (thêm trend %), `MorningBriefWidget` (default open), `ContentSuggestionsWidget` (thêm action buttons)

---

### 4.2 Inbox `/inbox` — P0

**Layout mới:**
```
┌─────────────────────────────────────────────┐
│ Hộp sản phẩm            [+ Dán links]      │
│ SP mới: 12  |  Chưa brief: 8  |  Tổng: 156 │
├─────────────────────────────────────────────┤
│ [Tất cả(156)] [Mới(12)] [Đã bổ sung(34)]...│
├─────────────────────────────────────────────┤
│ 🔍 Search...  [Category▾] [Delta▾] [More▾] │
├─────────────────────────────────────────────┤
│ □ # ▲ | Sản phẩm        | Score | Delta    │
│ □ 1   | Product name...  | 85🔥  | SURGE ↑ │
│ □ 2   | Product name...  | 72 ✅ | STABLE  │
│ ...                                         │
├─────────────────────────────────────────────┤
│ ◀ 1 2 3 ▶    Hiện 20▾ / 156 sản phẩm      │
└─────────────────────────────────────────────┘
```

**Thay đổi:**
- Thêm stats summary row dưới title (count per state)
- Tab counts hiện số lượng
- Filters gộp "More ▾" dropdown cho price/score range (ít dùng hơn)
- Thêm clear all filters button
- Table: thêm inline sparkline cho trend
- Mobile: Switch to card view thay vì table
- Side panel preview khi click row (không navigate away)
- Bulk actions: thêm "Tạo brief hàng loạt"

**Priority:** P0 — Core workflow page
**Components thêm:** `FilterBar` (shared), `Pagination` (shared), `InboxCardView` (mobile)
**Components sửa:** `InboxTable` (sparklines), `inbox-page-content.tsx` (side panel)

---

### 4.3 Inbox Detail `/inbox/[id]` — P1

**Thay đổi:**
- **Modularize** 524-line file thành 5-6 smaller components
- Sticky header với score badge + quick actions (Brief, Publish, Archive)
- Lazy-load AI sections (lifecycle, recommendations) — không gọi LLM mỗi page load
- Cache AI results trong DB, show cached + "Refresh" button
- Thêm breadcrumb: Hộp SP > [Category] > [Product Name]
- Mobile: Collapsible sections, chỉ show Score + Quick Info default

**Priority:** P1
**Components thêm:** `ProductHeader`, `ProductInfoSection`, `ProductAISection`, `ProductActionsBar`
**Components xóa:** N/A (modularize existing)

---

### 4.4 Production `/production` — P1

**Thay đổi:**
- Thay pill nav bằng **pipeline stepper** (horizontal steps với connecting line)
- Thêm count badges: "Đang sản xuất (3)"
- Default tab = "Đang sản xuất" (urgent items first)
- Thêm drag-drop giữa stages (kanban mini)
- Mobile: Pipeline stepper vertical, current step highlighted

**Priority:** P1
**Components thêm:** `PipelineStepper` (shared)
**Components sửa:** `ProductionPageClient` (stepper + default tab)

---

### 4.5 Library `/library` — P1

**Thay đổi:**
- Fix container width: đổi `max-w-7xl` → bỏ (dùng root layout `max-w-6xl`)
- Thêm page title + description (consistency)
- Thêm grid/list view toggle
- Extract `FilterBar` + `Pagination` thành shared components (reuse từ Inbox)
- Thêm loading skeleton
- Thêm empty state
- Mobile: 1-column card list

**Priority:** P1
**Components thêm:** reuse shared `FilterBar`, `Pagination`
**Components sửa:** `library-page-client.tsx`, `app/library/page.tsx`

---

### 4.6 Channels `/channels` — P2

**Thay đổi:**
- Thêm stats overview row (tổng channels, tổng published videos)
- Channel cards: thêm mini metrics (videos count, last posted)
- "Thêm kênh" dùng modal thay vì inline form

**Priority:** P2

---

### 4.7 Channel Detail `/channels/[id]` — P2

**Thay đổi:**
- Gộp 6 tabs thành 3 logical groups:
  - **Hồ sơ:** Channel info + Character Bible
  - **Content:** Format Bank + Idea Matrix + Video Bible
  - **Kế hoạch:** Series Planner
- Thêm "AI Setup Wizard" button cho first-time setup
- Tab labels ngắn gọn hơn

**Priority:** P2

---

### 4.8 Insights `/insights` — P1

**Thay đổi:**
- Gộp 6 tabs thành 4: Overview, Financial, Learning (Accuracy + Patterns), Playbook
- Bỏ redirect `/playbook` → embed trực tiếp
- Thêm date range picker
- Financial: thêm charts (bar chart revenue by week)
- Overview: narrative summary card "Tuần này bạn đã..."
- Mobile: Tabs scrollable, charts simplified

**Priority:** P1

---

### 4.9 Log `/log` — P2

**Thay đổi:**
- Sync hint banner: thêm dismiss button (save preference)
- Thêm "Recent logs" section bên dưới form
- Quick mode: merge với Sync page flow (1 unified import experience)
- Batch mode: step indicator

**Priority:** P2

---

### 4.10 Sync `/sync` — P2

**Thay đổi:**
- Thêm page title + description (consistency)
- Gộp 2 dropzones thành 1 với format auto-detection
- Step indicator: Upload → Map → Import → Done
- Import history: thêm pagination, move lên top (hoặc tab)

**Priority:** P2

---

### 4.11 Guide `/guide` — P2

**Thay đổi:**
- Thêm page title (consistency)
- Thêm search within guide
- Thêm "Getting Started" quick wizard cho new users
- Mobile: collapsible TOC at top

**Priority:** P2

---

### 4.12 Settings `/settings` — P2

**Thay đổi:**
- Thêm "Test all connections" button
- Grouped sections: API Keys → Model Config → Preferences
- Thêm import/export config

**Priority:** P2

---

### 4.13 404 & Error Pages — P2

**Thay đổi:**
- 404: Vertical center trên full viewport (`min-h-[60vh]`)
- Error: Dùng `bg-primary` thay vì hardcoded `bg-orange-600`
- Thêm "Báo lỗi" link cho error page

**Priority:** P2

---

## Phần 5: Sidebar Navigation Audit

### 5.1 Cấu trúc hiện tại

```
Công việc hàng ngày (6 items):
  ├─ Tổng quan       (/)
  ├─ Hộp sản phẩm    (/inbox)
  ├─ Đồng bộ dữ liệu (/sync)
  ├─ Sản xuất        (/production)
  ├─ Kênh TikTok     (/channels)
  └─ Nhật ký         (/log)

Phân tích & Học (2 items):
  ├─ Thư viện        (/library)
  └─ Phân tích       (/insights)

Hỗ trợ (2 items):
  ├─ Hướng dẫn       (/guide)
  └─ Cài đặt         (/settings)
```

### 5.2 Nhận xét

**Tốt:**
- ✅ 3-tier grouping logic hợp lý (daily work → analytics → support)
- ✅ Icons rõ ràng, đúng semantic
- ✅ Active state: left border 3px orange + bg tint — distinguishable
- ✅ Hover state: subtle bg change
- ✅ Theme toggle ở footer sidebar — không chiếm space nav

**Vấn đề:**
- P1: **6 items trong "Công việc hàng ngày"** — nhiều. "Đồng bộ dữ liệu" hiếm dùng daily (import file 1-2 lần/tuần) → nên move xuống
- P1: **Playbook route tồn tại nhưng không có trong sidebar** → dead route, confusing
- P2: Thiếu badge counts (VD: Inbox count SP mới, Production count đang chờ)
- P2: Thiếu quick actions (VD: "+" button cạnh Hộp SP để paste link nhanh)
- P2: Sidebar width 240px (w-60) fixed → chiếm nhiều screen trên laptop 13"
- P2: Không có collapse/expand sidebar option

### 5.3 Đề xuất Navigation mới

```
Công việc hàng ngày (4 items):
  ├─ Tổng quan       (/)
  ├─ Hộp sản phẩm    (/inbox)      [12 badge]
  ├─ Sản xuất        (/production)  [3 badge]
  └─ Kênh TikTok     (/channels)

Dữ liệu (3 items):
  ├─ Nhật ký         (/log)
  ├─ Đồng bộ         (/sync)
  └─ Thư viện        (/library)

Phân tích (1 item):
  └─ Phân tích       (/insights)    [includes Playbook]

Hỗ trợ (2 items):
  ├─ Hướng dẫn       (/guide)
  └─ Cài đặt         (/settings)
```

**Thay đổi:**
- Move Sync + Log vào group "Dữ liệu" (ít dùng daily)
- "Công việc hàng ngày" giảm từ 6 → 4 items
- Thêm badge counts cho Inbox + Production
- Bỏ Playbook route (embed vào Insights)
- Thêm collapsible sidebar option (toggle icon ở footer)

### 5.4 Mobile Navigation

**Hiện tại:**
- Top bar: Hamburger + "PASTR" + Theme toggle
- Bottom tabs: Tổng quan, Hộp SP, Sản xuất, Nhật ký + "Thêm" overflow
- Drawer: Full nav mirror sidebar

**Tốt:**
- ✅ Bottom tabs chọn 4 items đúng priority
- ✅ Overflow menu đầy đủ
- ✅ Drawer backdrop blur — modern
- ✅ Tab icons + labels nhỏ gọn

**Vấn đề:**
- P2: "Thêm" overflow popup mở từ dưới lên — có thể bị tay che trên phone lớn
- P2: Drawer không có search
- P2: Bottom tab "Nhật ký" có thể thay bằng "Channels" (dùng nhiều hơn daily)

---

## Phần 6: Cross-Page Consistency

### 6.1 Header Pattern

| Page | Has Title | Has Description | Title Style |
|------|-----------|-----------------|-------------|
| Dashboard | ✅ | ❌ | `text-2xl sm:text-[32px] font-semibold` |
| Inbox | ❌ (client) | ❌ | N/A (inline trong client) |
| Production | ✅ | ✅ | Same as Dashboard |
| Library | ❌ | ❌ | **MISSING** — no header at all |
| Channels | ✅ | ✅ | `text-2xl` (thiếu `sm:text-[32px]`) |
| Channel Detail | ❌ | ❌ | Client handles |
| Insights | ❌ | ❌ | Client handles |
| Log | ✅ | ✅ | Same as Dashboard |
| Sync | ❌ | ❌ | **MISSING** — no header |
| Guide | ❌ | ❌ | **MISSING** — client handles |
| Settings | ✅ | ✅ | Same as Dashboard |

**Kết luận:** Chỉ 5/13 pages có consistent header. Cần extract `PageHeader` shared component.

### 6.2 Breadcrumb / Back Navigation

- Inbox Detail: "← Quay lại" link → `/inbox` — OK nhưng mất filter state
- Channel Detail: "← Danh sách kênh" link — OK
- Các trang khác: **KHÔNG CÓ breadcrumb** → user phải dùng sidebar navigate

**Đề xuất:** Thêm breadcrumb component cho detail pages, keep filter state trong URL.

### 6.3 Shared Components Nên Extract

| Component | Currently | Pages Using | Priority |
|-----------|-----------|-------------|----------|
| `PageHeader` | Inline per page | All 13 | P0 |
| `FilterBar` | Custom per page | Inbox, Library | P1 |
| `Pagination` | Custom per page | Inbox, Library | P1 |
| `PillTabs` | Custom per page | Production, Log, Insights | P1 |
| `SearchInput` | Custom per page | Inbox, Library | P1 |
| `LoadingSkeleton` | Custom per page | Dashboard, Inbox | P2 |
| `EmptyState` | Inline per page | Multiple | P2 |
| `Sparkline` | N/A (new) | Dashboard, Inbox | P2 |
| `StatCard` | Semi-shared | Dashboard | P2 |
| `Breadcrumb` | N/A (new) | Detail pages | P2 |

### 6.4 Transition Animations

**Hiện tại:**
- `transition-all duration-200` — buttons, cards hover
- `transition-colors` — nav links
- `animate-pulse` — loading skeletons
- MorningBrief: CSS `max-height` + `opacity` transition cho collapse

**Thiếu:**
- Page transitions (route change) — no animation
- Tab content transitions — instant swap, no fade
- List item enter/exit — no animation
- Modal enter/exit — Radix handles, OK

**Đề xuất:**
- Thêm `framer-motion` (đã approved trong constraints) cho:
  - Tab content fade transition (150ms)
  - List item stagger animation (enter)
  - Page route transition (optional, can skip)
- KHÔNG thêm: parallax, particle, heavy animation

---

## Phần 7: Action Plan Tổng Hợp

### 7.1 Priority Matrix

| Priority | Scope | Trang/Component |
|----------|-------|----------------|
| P0 | Dashboard redesign (bento layout, brief default open) | `/`, widgets |
| P0 | Extract `PageHeader` shared component | All pages |
| P0 | Inbox side panel preview + stats | `/inbox` |
| P1 | Extract shared `FilterBar`, `Pagination`, `PillTabs` | Inbox, Library, Production, Insights |
| P1 | Modularize Inbox Detail (524 lines → 5 files) | `/inbox/[id]` |
| P1 | Insights tab consolidation (6→4 tabs) | `/insights` |
| P1 | Production pipeline stepper | `/production` |
| P1 | Library fix container + add header/loading/empty | `/library` |
| P1 | Standardize hardcoded colors → design tokens | Across codebase |
| P1 | Fix page header inconsistency (5 of 13) | Sync, Guide, Library, Inbox, Insights |
| P1 | Sidebar nav restructure + badge counts | Sidebar |
| P2 | Channel detail tab consolidation (6→3) | `/channels/[id]` |
| P2 | Sync page header + unified dropzone | `/sync` |
| P2 | Guide search + page header | `/guide` |
| P2 | Log recent history + dismiss sync hint | `/log` |
| P2 | Settings test-all + grouping | `/settings` |
| P2 | 404/Error page improvements | `not-found.tsx`, `error.tsx` |
| P2 | Add semantic color tokens (success, warning, info) | `globals.css` |
| P2 | Mobile card view for tables | Inbox, Library |
| P2 | Framer Motion tab transitions | Production, Insights |
| P2 | Command Palette (⌘K) | New global component |
| P2 | Breadcrumb component | Detail pages |

### 7.2 Implementation Batches

#### Batch 1: Foundation & Consistency (S-M effort)
**Mục tiêu:** Fix inconsistencies, extract shared components
**Effort:** M (Medium)
**Dependencies:** Không

| Task | Files | Effort |
|------|-------|--------|
| Extract `PageHeader` component | New: `components/shared/page-header.tsx`, Update: all 13 pages | S |
| Extract `PillTabs` component | New: `components/shared/pill-tabs.tsx`, Update: Production, Log, Insights | S |
| Extract `FilterBar` + `SearchInput` | New: `components/shared/filter-bar.tsx`, Update: Inbox, Library | M |
| Extract `Pagination` | New: `components/shared/pagination.tsx`, Update: Inbox, Library | S |
| Fix Library container width | `app/library/page.tsx` | S |
| Add headers to Sync, Guide pages | `app/sync/page.tsx`, `app/guide/page.tsx` | S |
| Add semantic color tokens | `globals.css` | S |
| Replace hardcoded colors → tokens | Multiple components | M |

#### Batch 2: Dashboard Redesign (M effort)
**Mục tiêu:** Bento layout, better morning experience
**Effort:** M
**Dependencies:** Batch 1 (PageHeader)

| Task | Files | Effort |
|------|-------|--------|
| Dashboard bento 2-column layout | `app/page.tsx` | S |
| Morning Brief default open + 2-col | `morning-brief-widget.tsx` | S |
| Stats cards with trend indicators | `yesterday-stats-widget.tsx` | S |
| Content Suggestions quick actions | `content-suggestions-widget.tsx` | S |
| Channel Task Board scroll indicator | `channel-task-board.tsx` | S |
| Dashboard first-run empty state | New: `dashboard-empty-state.tsx` | S |

#### Batch 3: Inbox Enhancement (M-L effort)
**Mục tiêu:** Side panel, mobile card view, better filters
**Effort:** M-L
**Dependencies:** Batch 1 (FilterBar, Pagination)

| Task | Files | Effort |
|------|-------|--------|
| Tab counts (SP per state) | `inbox-page-content.tsx` | S |
| Side panel product preview | New: `inbox-side-panel.tsx`, Update: `inbox-page-content.tsx` | M |
| Mobile card view | New: `inbox-card-view.tsx` | M |
| Clear all filters button | `inbox-page-content.tsx` | S |
| Modularize Inbox Detail | Split `app/inbox/[id]/page.tsx` → 5 files | M |

#### Batch 4: Navigation & Sidebar (S-M effort)
**Mục tiêu:** Restructure nav, add badges, collapsible
**Effort:** M
**Dependencies:** Batch 1

| Task | Files | Effort |
|------|-------|--------|
| Sidebar nav restructure (groups) | `sidebar.tsx`, `mobile-nav.tsx` | S |
| Badge counts (Inbox, Production) | `sidebar.tsx` + API calls | M |
| Collapsible sidebar toggle | `sidebar.tsx`, `app/layout.tsx` | M |
| Remove `/playbook` dead route | Delete `app/playbook/page.tsx` | S |
| Breadcrumb component | New: `components/shared/breadcrumb.tsx` | S |

#### Batch 5: Page-Specific Improvements (M effort)
**Mục tiêu:** Production stepper, Insights consolidation, Library fixes
**Effort:** M
**Dependencies:** Batch 1 (PillTabs → PipelineStepper)

| Task | Files | Effort |
|------|-------|--------|
| Production pipeline stepper | New: `components/shared/pipeline-stepper.tsx`, Update: `production-page-client.tsx` | M |
| Insights tab consolidation 6→4 | `insights-page-client.tsx` | M |
| Library loading + empty states | `library-page-client.tsx` | S |
| Channel detail tab consolidation | `channel-detail-client.tsx` | M |

#### Batch 6: Polish & Advanced (L effort)
**Mục tiêu:** Command palette, animations, advanced UX
**Effort:** L
**Dependencies:** Batches 1-5

| Task | Files | Effort |
|------|-------|--------|
| Command Palette (⌘K) | New: `components/shared/command-palette.tsx` | L |
| Framer Motion tab transitions | Multiple pages | M |
| Sparkline component | New: `components/shared/sparkline.tsx` | M |
| Mobile card views (tables) | Inbox, Library | M |
| 404/Error page improvements | `not-found.tsx`, `error.tsx` | S |

### 7.3 Effort Legend

| Size | Estimate | Description |
|------|----------|-------------|
| S | ~1-2h | Single file change, straightforward |
| M | ~3-5h | Multiple files, moderate complexity |
| L | ~6-10h | New system/component, significant complexity |
| XL | ~10h+ | Architecture change, many files |

### 7.4 Batch Dependencies

```
Batch 1 (Foundation) ──┬──→ Batch 2 (Dashboard)
                       ├──→ Batch 3 (Inbox)
                       ├──→ Batch 4 (Navigation)
                       └──→ Batch 5 (Page-specific)
                                    │
                                    └──→ Batch 6 (Polish)
```

Batch 1 là prerequisite cho tất cả. Batches 2-5 có thể chạy song song sau Batch 1. Batch 6 chạy cuối.

### 7.5 Quick Wins (implement ngay, < 30 phút mỗi item)

1. Fix Library `max-w-7xl` → remove (dùng root layout) — 5 phút
2. Add page title cho Sync, Guide — 10 phút mỗi trang
3. Error page: `bg-orange-600` → `bg-primary` — 2 phút
4. Morning Brief: đổi `useState(false)` → `useState(true)` (default open) — 2 phút
5. Channels page title: thêm `sm:text-[32px]` — 2 phút
6. Delete `/playbook` dead route — 2 phút

---

## Câu Hỏi Chưa Giải Quyết

1. **Command Palette**: Implement từ scratch hay dùng library (cmdk)? cmdk lightweight, mature, phù hợp.
2. **Sidebar collapse**: Persist preference ở đâu? localStorage vs cookie vs DB?
3. **Badge counts**: Real-time update hay chỉ refresh mỗi page load? Real-time cần WebSocket/polling.
4. **Inbox side panel**: Dùng Radix Sheet (slide from right) hay custom panel? Sheet có sẵn accessibility.
5. **Sparklines**: Dùng Recharts (đã có) hay micro library (react-sparklines)? Recharts heavier nhưng consistent.
6. **Mobile card view**: Render cả table + cards (hidden/shown by breakpoint) hay toggle state? Breakpoint tốt hơn cho SEO.
