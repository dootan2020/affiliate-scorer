# WORKFLOW REPORT — Content Factory

> Quét tự động từ codebase ngày 2026-02-26. Phản ánh trạng thái code hiện tại.

---

## Section 1: Luồng Workflow Chính

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  1. CAPTURE  │───▶│  2. INBOX    │───▶│ 3. PRODUCTION│───▶│   4. LOG     │───▶│  5. LEARN   │
│  /sync       │    │  /inbox      │    │  /production │    │  /log        │    │  /insights  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Bước 1: Capture (/sync)
- **Input:** File CSV/XLSX từ FastMoss, KaloData, TikTok Studio
- **API:** `POST /api/upload/products/preview` → `POST /api/upload/products`
- **API (TikTok):** `POST /api/sync/tiktok-studio`
- **Output:** Product + ProductSnapshot + ProductIdentity (auto-linked). Auto-trigger scoring.
- **Models thay đổi:** Product, ProductSnapshot, ImportBatch, ProductIdentity, AccountDailyStat, FollowerActivity, AccountInsight, ContentPost (TikTok Studio)

### Bước 2: Inbox (/inbox)
- **Input:** Paste link hoặc dữ liệu từ bước 1
- **API:** `GET /api/inbox` (list + stats), `POST /api/inbox/paste` (paste link), `POST /api/inbox/[id]/score` (score 1), `POST /api/inbox/score-all` (score all)
- **Output:** ProductIdentity với state: new → enriched → scored → briefed → published
- **Models thay đổi:** ProductIdentity, ProductUrl, InboxItem, Product (score sync)

### Bước 3: Production (/production)
- **Input:** Chọn ProductIdentity đã scored
- **API:** `POST /api/briefs/batch` → `GET /api/briefs/[id]` → `POST /api/production/create-batch` → `GET /api/production/[batchId]/export`
- **Output:** ContentBrief + ContentAsset + ProductionBatch, export scripts.md / prompts.json / checklist.csv
- **Models thay đổi:** ContentBrief, ContentAsset, ProductionBatch

### Bước 4: Log (/log)
- **Input:** TikTok URL + metrics (views, likes, comments, shares, saves, orders)
- **API:** `POST /api/log/match` → `POST /api/log/quick` (1 video) hoặc `POST /api/log/batch` (nhiều video)
- **Output:** AssetMetric + reward calculation (win/loss/neutral)
- **Models thay đổi:** ContentAsset (status update), AssetMetric, LearningWeightP4

### Bước 5: Learn (/insights)
- **Input:** Dữ liệu tích lũy từ log + feedback
- **API:** `POST /api/learning/trigger` → `GET /api/patterns` → `GET /api/ai/weekly-report`
- **Output:** Pattern detection, weight updates, weekly reports
- **Models thay đổi:** LearningLog, UserPattern, LearningWeightP4, WeeklyReport

### Storage Map

| Bước | Tables chính |
|------|-------------|
| Capture | Product, ProductSnapshot, ImportBatch, DataImport, ProductIdentity, AccountDailyStat |
| Inbox | ProductIdentity, ProductUrl, InboxItem, Product |
| Production | ContentBrief, ContentAsset, ProductionBatch |
| Log | AssetMetric, ContentAsset, LearningWeightP4 |
| Learn | LearningLog, UserPattern, LearningWeightP4, WeeklyReport |
| Hỗ trợ | Shop, FinancialRecord, CalendarEvent, GoalP5, Commission, DailyBrief |

---

## Section 2: Trang & Chức Năng

### Routes đang active (có page.tsx thật)

| Route | File | Loại | Components chính | APIs gọi | Links đến |
|-------|------|------|------------------|----------|-----------|
| `/` | `app/page.tsx` | Server | MorningBriefWidget, QuickPasteWidget, InboxStatsWidget, UpcomingEventsWidget, ContentSuggestionsWidget | `/api/brief/today`, `/api/inbox?limit=1`, `/api/inbox?sort=score&limit=20`, `/api/calendar/upcoming` | /sync, /production, /inbox, /insights?tab=calendar |
| `/inbox` | `app/inbox/page.tsx` | Client | PasteLinkBox, QuickEnrichModal, InboxTable | `/api/inbox?state=&page=&limit=20` | /inbox/[id] |
| `/inbox/[id]` | `app/inbox/[id]/page.tsx` | Server | ScoreBreakdown, SeasonalTagForm, ProductImage, ProfitEstimator, PersonalNotesSection, AffiliateLinkSection, WinProbabilityCard, LifecycleBadge, ChannelRecommendations | Prisma direct, `/api/products/[id]/notes`, `/api/products/[id]/seasonal` | /inbox, /shops/[id], /production?productId=[id] |
| `/sync` | `app/sync/page.tsx` | Client | FileDropzone, ColumnMapping, UploadProgress, ImportHistoryTable, TikTokStudioDropzone | `/api/upload/products/preview`, `/api/upload/products`, `/api/upload/import/history`, `/api/sync/tiktok-studio` | — |
| `/production` | `app/production/page.tsx` | Server+Client | ProductionPageClient → ProductSelector, BriefPreviewCard | `/api/briefs/batch`, `/api/briefs/[id]`, `/api/production/create-batch`, `/api/production/[batchId]/export` | — |
| `/log` | `app/log/page.tsx` | Server+Client | LogPageClient | `/api/log/match`, `/api/log/quick`, `/api/log/batch` | /sync |
| `/library` | `app/library/page.tsx` | Server+Client | LibraryPageClient | `/api/library` | — |
| `/insights` | `app/insights/page.tsx` | Server | InsightsPageClient (tabs: Overview, Financial, Calendar, AI), TriggerLearningButton, ConfidenceWidget, WeeklyReportCard, PlaybookSection | Prisma direct, `/api/learning/trigger`, `/api/patterns`, `/api/ai/confidence`, `/api/ai/weekly-report` | /sync, /inbox |
| `/shops` | `app/shops/page.tsx` | Server | — (inline table) | Prisma direct | /shops/[id], /inbox |
| `/shops/[id]` | `app/shops/[id]/page.tsx` | Server | ShopEditForm | Prisma direct, `/api/shops/[id]` | /shops, /inbox/[id] |

### Redirects đang active

| URL gốc | Redirect đến | File |
|----------|-------------|------|
| `/products` | `/inbox` | `app/products/page.tsx` |
| `/products/[id]` | `/inbox/[id]` | `app/products/[id]/page.tsx` |
| `/upload` | `/sync` | `app/upload/page.tsx` |
| `/playbook` | `/insights?tab=playbook` | `app/playbook/page.tsx` |

### Navigation

**Sidebar (desktop, 7 items):** Dashboard `/`, Inbox `/inbox`, Sync `/sync`, Sản xuất `/production`, Log `/log`, Thư viện `/library`, Insights `/insights`

**Mobile bottom tabs (5 items):** `/`, `/inbox`, `/production`, `/log`, `/library`

**Note:** `/shops` không có nav item — chỉ truy cập qua link trong product detail hoặc shop pages.

---

## Section 3: Database

**Datasource:** PostgreSQL (via Prisma + @prisma/adapter-pg)

### Models ĐANG DÙNG (25 models)

| Model | Phase | Quan hệ chính | Nơi dùng |
|-------|-------|---------------|----------|
| Product | P1 | belongsTo ProductIdentity (identityId), hasMany ProductSnapshot, belongsTo ImportBatch | upload, scoring, inbox detail, shops, export |
| ProductSnapshot | P1 | belongsTo Product | upload (auto-create), scoring, anomaly detection, lifecycle |
| ImportBatch | P1 | hasMany Product | upload, confidence |
| Feedback | P1 | standalone | learning trigger, insights, personalize |
| LearningLog | P1 | standalone | learning trigger/history, insights, weights |
| Shop | P3A | referenced by Product.shopName | shops CRUD, inbox detail |
| FinancialRecord | P3A | optional Campaign ref | financial CRUD, morning brief, commissions summary |
| CalendarEvent | P3A | standalone | calendar CRUD, morning brief, insights |
| ContentPost | P3A | belongsTo Campaign, belongsTo Product | content-posts CRUD |
| Campaign | P3A | hasMany ContentPost, hasMany FinancialRecord | anomaly detection, confidence, patterns, recommendations, weekly report |
| DataImport | Sync | standalone | import history, general import |
| ProductIdentity | P2 | hasMany ProductUrl, hasOne Product, hasMany ContentBrief, hasMany ContentAsset | inbox pipeline, briefs, morning brief, scoring |
| ProductUrl | P2 | belongsTo ProductIdentity | inbox paste processing, sync identity |
| InboxItem | P2 | belongsTo ProductIdentity | inbox paste processing |
| ContentBrief | P3 | belongsTo ProductIdentity, hasMany ContentAsset | brief generation, batch briefs |
| ContentAsset | P3 | belongsTo ContentBrief, belongsTo ProductIdentity, belongsTo ProductionBatch, hasMany AssetMetric | library, log, metrics, production, commissions |
| ProductionBatch | P3 | hasMany ContentAsset | production create/export |
| AssetMetric | P4 | belongsTo ContentAsset | log quick/batch, metrics capture, goals progress, patterns |
| LearningWeightP4 | P4 | standalone | patterns, decay, explore-exploit, update-weights, win-loss |
| UserPattern | P4 | standalone | patterns API, pattern detection, weekly report |
| WeeklyReport | P4 | standalone | weekly report API |
| Commission | P5 | belongsTo ProductIdentity, belongsTo ContentAsset | commissions CRUD, goals progress, weekly report |
| GoalP5 | P5 | standalone | goals-p5 CRUD, morning brief, weekly report |
| DailyBrief | P5 | standalone | brief/today, reports/weekly, generate-morning-brief |
| AccountDailyStat | TikTok | standalone | morning brief, TikTok Studio parser |
| FollowerActivity | TikTok | standalone | TikTok Studio follower activity parser |
| AccountInsight | TikTok | standalone | TikTok Studio insights parser |

### Models DEPRECATED

| Model | Lý do giữ | Chi tiết |
|-------|----------|----------|
| UserGoal | Có data cũ trong DB | Hoàn toàn thay thế bởi GoalP5. Không có code nào query. Thư mục `/api/goals/` chỉ có CLAUDE.md, không có route.ts. |
| WinPattern | Có relation trong schema | Write-only: `lib/ai/patterns.ts` ghi vào qua `refreshPatterns()`, nhưng hàm đó không được gọi từ route nào. Route `/api/patterns` dùng `regeneratePatterns()` → ghi UserPattern, không phải WinPattern. Data ghi vào nhưng không bao giờ đọc. |

---

## Section 4: API Endpoints

**Tổng: 59 route.ts files**

### Inbox (5 endpoints)

| Method | Path | Mục đích | Model chính |
|--------|------|---------|-------------|
| GET | `/api/inbox` | List identities + stats theo state/page | ProductIdentity |
| GET, PUT | `/api/inbox/[id]` | Detail + update metadata/state/notes | ProductIdentity |
| POST | `/api/inbox/[id]/score` | Score 1 identity | ProductIdentity (via service) |
| POST | `/api/inbox/paste` | Parse pasted links, dedupe, tạo identity | ProductIdentity, ProductUrl, InboxItem |
| POST | `/api/inbox/score-all` | Batch score all identities | ProductIdentity (via service) |

### Upload / Sync (6 endpoints)

| Method | Path | Mục đích | Model chính |
|--------|------|---------|-------------|
| POST | `/api/upload/products` | Import CSV/XLSX → products + auto-score | Product, ImportBatch, ProductIdentity |
| POST | `/api/upload/products/preview` | Preview column mapping trước import | Stateless |
| POST | `/api/upload/import` | General import handler | DataImport |
| POST | `/api/upload/import/detect` | Detect file format + confidence | Stateless |
| GET | `/api/upload/import/history` | Last 20 import records | DataImport |
| POST | `/api/sync/tiktok-studio` | Import TikTok Studio analytics (multi-file) | AccountDailyStat, FollowerActivity, AccountInsight, ContentPost |

### Briefs / Production (7 endpoints)

| Method | Path | Mục đích | Model chính |
|--------|------|---------|-------------|
| POST | `/api/briefs/generate` | Generate AI brief cho 1 product | ContentBrief, ContentAsset |
| POST | `/api/briefs/batch` | Batch generate briefs | ContentBrief, ContentAsset |
| GET | `/api/briefs/[id]` | Brief detail + assets | ContentBrief |
| POST | `/api/brief/generate` | Generate morning brief | DailyBrief |
| GET | `/api/brief/today` | Get/generate today's morning brief | DailyBrief |
| POST | `/api/production/create-batch` | Tạo batch từ assets | ProductionBatch |
| GET | `/api/production/[batchId]` | Batch detail | ProductionBatch |
| GET | `/api/production/[batchId]/export` | Export scripts/prompts/checklist | ContentAsset |

### Log / Metrics (4 endpoints)

| Method | Path | Mục đích | Model chính |
|--------|------|---------|-------------|
| POST | `/api/log/match` | Match TikTok URLs → assets | ContentAsset |
| POST | `/api/log/quick` | Log metrics 1 video + reward | AssetMetric, LearningWeightP4 |
| POST | `/api/log/batch` | Log metrics nhiều video | AssetMetric, LearningWeightP4 |
| POST | `/api/metrics/capture` | Chrome extension capture | AssetMetric |

### Learning / AI (8 endpoints)

| Method | Path | Mục đích | Model chính |
|--------|------|---------|-------------|
| GET, POST | `/api/learning` | Weights + temporal decay | LearningWeightP4 |
| GET | `/api/learning/history` | Learning cycle history | LearningLog |
| POST | `/api/learning/trigger` | Trigger learning cycle | Feedback, LearningLog |
| GET, POST | `/api/patterns` | Playbook patterns + insights | UserPattern, LearningWeightP4 |
| GET | `/api/insights` | Learning summary (accuracy, feedback count) | LearningLog, Feedback |
| GET | `/api/ai/confidence` | AI confidence tier (0–3) | LearningLog, Feedback, Product |
| GET | `/api/ai/intelligence` | Per-product intelligence | Product |
| GET | `/api/ai/anomalies` | Product anomaly detection | Product, ProductSnapshot |
| GET, POST | `/api/ai/weekly-report` | Weekly AI report | WeeklyReport |

### Products (4 endpoints)

| Method | Path | Mục đích | Model chính |
|--------|------|---------|-------------|
| GET | `/api/products` | Paginated product list | Product |
| GET | `/api/products/[id]` | Product detail | Product |
| PATCH | `/api/products/[id]/notes` | Update notes/rating/tags/affiliate | Product |
| PATCH | `/api/products/[id]/seasonal` | Set seasonal tag + sell window | Product |

### Shops (2 endpoints)

| Method | Path | Mục đích | Model chính |
|--------|------|---------|-------------|
| GET, POST | `/api/shops` | List/create shops | Shop |
| GET, PATCH, DELETE | `/api/shops/[id]` | Shop detail/update/delete | Shop |

### Financial / Calendar (6 endpoints)

| Method | Path | Mục đích | Model chính |
|--------|------|---------|-------------|
| GET, POST | `/api/financial` | List/create financial records | FinancialRecord |
| PATCH, DELETE | `/api/financial/[id]` | Update/delete record | FinancialRecord |
| GET | `/api/financial/summary` | Monthly income/expense/profit | FinancialRecord |
| GET, POST | `/api/calendar` | List/create events | CalendarEvent |
| PATCH, DELETE | `/api/calendar/[id]` | Update/delete event | CalendarEvent |
| GET | `/api/calendar/upcoming` | Events next 30 days | CalendarEvent |

### Goals / Commissions / Reports (7 endpoints)

| Method | Path | Mục đích | Model chính |
|--------|------|---------|-------------|
| GET, POST | `/api/goals-p5` | Upsert/list goals | GoalP5 |
| GET | `/api/goals-p5/current` | Active weekly + monthly goals | GoalP5 |
| GET | `/api/goals-p5/progress` | Auto-calculate progress | GoalP5, ContentAsset, Commission |
| GET, POST | `/api/commissions` | Commission records | Commission |
| GET | `/api/commissions/summary` | P&L summary + ROI | Commission, FinancialRecord |
| GET, POST | `/api/reports/weekly` | Weekly reports | DailyBrief |
| GET | `/api/morning-brief` | Dashboard morning brief data | ProductIdentity, CalendarEvent, GoalP5 |

### Library / Assets / Content (4 endpoints)

| Method | Path | Mục đích | Model chính |
|--------|------|---------|-------------|
| GET | `/api/library` | Paginated asset library | ContentAsset |
| PATCH | `/api/assets/[id]` | Update asset status/URL/script | ContentAsset |
| GET, POST | `/api/content-posts` | List/create content posts | ContentPost |
| PATCH, DELETE | `/api/content-posts/[id]` | Update/delete post | ContentPost |

### Utility (4 endpoints)

| Method | Path | Mục đích | Model chính |
|--------|------|---------|-------------|
| POST | `/api/score` | Trigger AI scoring (batch/all) | Product |
| POST | `/api/compliance` | Check text vs TikTok VN rules | Stateless |
| GET | `/api/export/sheet` | Export top 100 products as CSV | Product |
| GET | `/api/image-proxy` | Server-side image proxy | Stateless |

---

## Section 5: Vấn Đề Phát Hiện

### 5.1 — Campaign model vẫn được query (MEDIUM)
- **File:** `lib/ai/anomaly-detection.ts`, `lib/ai/confidence.ts`, `lib/ai/patterns.ts`, `lib/ai/recommendations.ts`, `lib/ai/weekly-report.ts`, `lib/ai/win-loss-analysis.ts`, `lib/ai/win-probability.ts`, `lib/parsers/merge-import.ts`
- **Mô tả:** Campaign model đã không còn CRUD UI/API nhưng 8 lib files vẫn query `prisma.campaign`. Các hàm này đọc Campaign data cho AI analysis.
- **Đề xuất:** Nếu Campaign data đã migrate sang ContentAsset flow → refactor các lib functions. Nếu data cũ vẫn cần → giữ read-only nhưng đánh dấu deprecated.

### 5.2 — WinPattern model write-only, không bao giờ đọc (LOW)
- **File:** `lib/ai/patterns.ts:129-133`, `prisma/schema.prisma`
- **Mô tả:** `refreshPatterns()` ghi WinPattern nhưng hàm này không được gọi từ route nào. Route `/api/patterns` gọi `regeneratePatterns()` → ghi UserPattern. WinPattern data chết.
- **Đề xuất:** Xóa WinPattern model + `refreshPatterns()` function, hoặc wire nó vào route nào đó.

### 5.3 — UserGoal model hoàn toàn không dùng (LOW)
- **File:** `prisma/schema.prisma`
- **Mô tả:** Thay thế bởi GoalP5. Không code nào query. Thư mục `/api/goals/` chỉ có CLAUDE.md.
- **Đề xuất:** Xóa model khỏi schema sau khi drop table.

### 5.4 — content-posts API dùng Campaign relation (LOW)
- **File:** `app/api/content-posts/route.ts`, `app/api/content-posts/[id]/route.ts`
- **Mô tả:** Content posts API vẫn include `{ campaign: true }` và accept `campaignId`. Không có UI nào gọi API này.
- **Đề xuất:** Nếu ContentPost không dùng → xóa cả model + API. Nếu dùng cho TikTok Studio sync → refactor bỏ Campaign reference.

### 5.5 — Nhiều API không có UI gọi (MEDIUM)
- **Mô tả:** Các API sau không có component nào fetch:
  - `POST /api/inbox/[id]/score` — scoring 1 identity (chỉ score-all được gọi)
  - `POST /api/inbox/score-all` — batch scoring (không có UI button)
  - `POST /api/brief/generate` — morning brief gen (widget dùng `/api/brief/today`)
  - `GET /api/ai/anomalies` — chỉ dùng internal bởi morning-brief route
  - `GET/POST /api/learning` — weights/decay (không UI)
  - `GET /api/learning/history` — không UI
  - `GET /api/insights` — insights page dùng Prisma direct
  - `GET /api/financial/summary` — financial tab dùng `/api/financial`
  - `GET/POST /api/commissions`, `GET /api/commissions/summary` — không UI
  - `GET/POST /api/goals-p5/*` — không UI
  - `GET/POST /api/reports/weekly` — không UI
  - `GET/POST /api/content-posts/*` — không UI
  - `POST /api/upload/import`, `POST /api/upload/import/detect` — sync page dùng `/api/upload/products` trực tiếp
  - `PATCH /api/assets/[id]` — library chỉ read
  - `GET /api/export/sheet` — có thể dùng qua direct URL
  - `POST /api/metrics/capture` — Chrome extension only
- **Đề xuất:** Giữ các API cần cho: (1) internal use (anomalies, insights), (2) Chrome extension (metrics/capture), (3) future UI (goals, commissions, reports). Xóa API thật sự orphan nếu không có plan.

### 5.6 — Split lucide-react import (LOW)
- **File:** `app/inbox/[id]/page.tsx:4,21`
- **Mô tả:** 2 import statements từ "lucide-react" trong cùng file. Cả 2 đều dùng. Không lỗi runtime nhưng code-style issue.
- **Đề xuất:** Merge thành 1 import.

### 5.7 — JSON.parse không có inner try-catch (LOW)
- **Files:** `lib/brief/generate-morning-brief.ts:109`, `lib/content/generate-brief.ts:132`, `lib/reports/generate-weekly-report.ts:175`, `lib/ai/learning.ts:117,139`, `lib/ai/scoring.ts:82`
- **Mô tả:** Các `JSON.parse()` trên Claude AI response / DB JSON string không có inner try-catch riêng. Outer route-level catch bắt lỗi → trả 500. Không crash nhưng entire operation abort khi 1 parse fail.
- **Đề xuất:** Wrap từng `JSON.parse` trong try-catch riêng với error message cụ thể.

### 5.8 — .env.example chứa Supabase vars không dùng (LOW)
- **File:** `.env.example`
- **Mô tả:** `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` khai báo trong .env.example nhưng không có code nào reference. App dùng raw PostgreSQL via `pg` + Prisma adapter.
- **Đề xuất:** Xóa hoặc comment "reserved for future use".

### 5.9 — Thư mục /api/goals/ rỗng (LOW)
- **File:** `app/api/goals/`
- **Mô tả:** Chỉ chứa CLAUDE.md, không có route.ts. Remnant từ khi xóa UserGoal API.
- **Đề xuất:** Xóa thư mục.

### Hardcoded links sai: **KHÔNG CÒN**
Đã quét toàn bộ JSX cho `href="/upload"`, `href="/products"`, `href="/campaigns"`, `href="/feedback"` → không tìm thấy. Tất cả đã fix ở TASKS-2.

---

## Section 6: Tóm Tắt Sức Khỏe

| Hạng mục | Trạng thái | Ghi chú |
|----------|-----------|---------|
| Navigation | ✅ OK | 7 sidebar items, 5 mobile tabs, 4 redirects active |
| Redirects | ✅ OK | /products→/inbox, /upload→/sync, /playbook→/insights, /products/[id]→/inbox/[id] |
| Core workflow (Capture→Inbox→Production→Log→Learn) | ✅ OK | Tất cả 5 bước có trang + API hoạt động |
| Data integrity | ⚠️ MEDIUM | Campaign model vẫn query ở 8 lib files dù không có CRUD UI |
| Dead code | ⚠️ LOW | WinPattern write-only, UserGoal unused, /api/goals/ empty dir |
| AI integration | ✅ OK | Scoring, brief generation, pattern detection, confidence, weekly report — tất cả hoạt động |
| Identity system | ✅ OK | ProductIdentity là hub chính, auto-sync scores từ upload + inbox scoring |
| Hardcoded links | ✅ OK | Không còn link sai |
| Env vars | ✅ OK | 2 required (DATABASE_URL, ANTHROPIC_API_KEY), 1 optional (AUTH_SECRET) |
| Orphan APIs | ⚠️ MEDIUM | ~17 endpoints không có UI gọi trực tiếp (một số dùng internal/extension/future) |
| TypeScript | ✅ OK | Không có `as any`, `@ts-ignore`, hoặc type suppressions |

---

## Build Check

```
pnpm build — 2026-02-26

✅ PASS
- Next.js 16.1.6 (Turbopack)
- TypeScript: compiled successfully (6.4s)
- Static pages: 61/61 generated (2.2s)
- Routes: 13 static (○) + 48 dynamic (ƒ)
- Warnings: 1 (middleware→proxy deprecation — Next.js 16 cosmetic)
- Errors: 0
```
