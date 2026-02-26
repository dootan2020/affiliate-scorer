# Workflow Report — AffiliateScorer (Content Factory)

> Trạng thái thực tế sau refactor Phase 8. Viết ngày 2026-02-26.

---

## 1. Luồng Workflow Chính

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MAIN WORKFLOW: CONTENT FACTORY                        │
└─────────────────────────────────────────────────────────────────────────┘

  [1] CAPTURE — Nạp dữ liệu sản phẩm
  ┌──────────────────────────────────────────────────┐
  │  A. Paste Links (TikTok Shop URLs)               │
  │     POST /api/inbox/paste                         │
  │     → parseLinks() → processInboxItem()           │
  │     → ProductIdentity (state: "new")              │
  │     → InboxItem (với rawUrl, detectedType)        │
  │                                                   │
  │  B. Upload File (FastMoss / KaloData CSV/XLSX)    │
  │     POST /api/upload/products/preview             │
  │     POST /api/upload/products (với mapping)       │
  │     → parseFile() → detectFormat()                │
  │     → parseFastMoss() / parseKaloData()           │
  │     → Product (upsert) + ProductSnapshot          │
  │     → syncProductIdentity() → ProductIdentity     │
  │     → scoreProducts() (nếu ANTHROPIC_API_KEY có) │
  │                                                   │
  │  C. TikTok Studio Analytics                       │
  │     POST /api/sync/tiktok-studio                  │
  │     → AccountDailyStat / FollowerActivity /       │
  │        AccountInsight                             │
  └──────────────────────────────────────────────────┘
                           │
                           ▼
  [2] INBOX — Xử lý & Chấm điểm
  ┌──────────────────────────────────────────────────┐
  │  Vào: ProductIdentity (state: "new")              │
  │                                                   │
  │  A. Enrich — Bổ sung metadata thủ công           │
  │     PUT /api/inbox/[id]                           │
  │     → Cập nhật title, category, price, v.v.      │
  │     → state: "new" → "enriched"                  │
  │                                                   │
  │  B. Score — Tính điểm tổng hợp                   │
  │     POST /api/inbox/[id]/score                    │
  │     → calculateContentPotentialScore()            │
  │     → combinedScore = marketScore*0.5 +           │
  │                       contentScore*0.5            │
  │     → state: "enriched" → "scored"               │
  │     POST /api/inbox/score-all (batch)             │
  │                                                   │
  │  Ra: ProductIdentity (state: "scored",            │
  │      combinedScore, contentPotentialScore)        │
  └──────────────────────────────────────────────────┘
                           │
                           ▼
  [3] PRODUCTION — Tạo Brief & Assets
  ┌──────────────────────────────────────────────────┐
  │  Vào: ProductIdentity (state: "scored")           │
  │                                                   │
  │  A. Generate Brief (AI)                           │
  │     POST /api/briefs/generate                     │
  │     → generateBrief() gọi Claude API             │
  │     → ContentBrief (angles, hooks, scripts)       │
  │     → ContentAsset[] được tạo từ brief            │
  │     → state: "scored" → "briefed"               │
  │                                                   │
  │  B. Tạo Production Batch                         │
  │     POST /api/production/create-batch             │
  │     → ProductionBatch + liên kết ContentAsset[]  │
  │     GET  /api/production/[batchId]               │
  │     GET  /api/production/[batchId]/export        │
  │                                                   │
  │  Ra: ContentAsset (status: "draft"),              │
  │      ProductionBatch                              │
  └──────────────────────────────────────────────────┘
                           │
                           ▼
  [4] LOG — Ghi nhận kết quả thực tế
  ┌──────────────────────────────────────────────────┐
  │  Vào: ContentAsset (đã đăng, có publishedUrl)    │
  │                                                   │
  │  A. Log thủ công — paste TikTok link             │
  │     POST /api/log/match (match link → assetId)   │
  │     POST /api/log/quick (nhập views/likes/...)   │
  │     → AssetMetric (rewardScore tính từ metrics)  │
  │     → ContentAsset.status → "logged"             │
  │                                                   │
  │  B. Log batch — TikTok Studio import             │
  │     POST /api/log/batch                           │
  │                                                   │
  │  Ra: AssetMetric (rewardScore, views, orders...)  │
  └──────────────────────────────────────────────────┘
                           │
                           ▼
  [5] LEARN — AI cập nhật patterns
  ┌──────────────────────────────────────────────────┐
  │  Vào: AssetMetric (rewardScore)                   │
  │                                                   │
  │  A. Tự động sau mỗi log                          │
  │     updateLearningWeights() (hook_type, format,  │
  │     angle, category, price_range)                │
  │     analyzeAsset() → win/loss verdict            │
  │                                                   │
  │  B. Trigger thủ công                             │
  │     POST /api/learning (apply decay)             │
  │     GET  /api/patterns → xem playbook            │
  │     POST /api/patterns → regenerate patterns     │
  │     GET  /api/learning/history                   │
  │                                                   │
  │  Ra: LearningWeightP4 (weight theo scope/key),   │
  │      UserPattern (winning/losing patterns),       │
  │      LearningLog                                  │
  └──────────────────────────────────────────────────┘

  Storage map:
  ┌──────────────────┬──────────────────────────────────┐
  │ Bước             │ Tables chính                     │
  ├──────────────────┼──────────────────────────────────┤
  │ Capture (link)   │ InboxItem, ProductIdentity       │
  │ Capture (file)   │ Product, ProductSnapshot,        │
  │                  │ ImportBatch, ProductIdentity      │
  │ Capture (studio) │ AccountDailyStat,                │
  │                  │ FollowerActivity, AccountInsight  │
  │ Inbox/Score      │ ProductIdentity (scores)         │
  │ Production       │ ContentBrief, ContentAsset,      │
  │                  │ ProductionBatch                   │
  │ Log              │ AssetMetric                       │
  │ Learn            │ LearningWeightP4, UserPattern,   │
  │                  │ LearningLog                       │
  └──────────────────┴──────────────────────────────────┘
```

---

## 2. Trang & Chức Năng

### Trang Đang Hoạt Động

| Route | Tên | Chức năng chính |
|-------|-----|-----------------|
| `/` | Dashboard | Overview: morning brief, quick paste, inbox stats, upcoming events, content suggestions |
| `/inbox` | Inbox | Danh sách ProductIdentity, paste links, filter theo state, phân trang |
| `/inbox/[id]` | Chi tiết SP | Xem Product, AI score breakdown, tạo brief, gợi ý content, notes cá nhân |
| `/sync` | Đồng bộ | Upload FastMoss/KaloData CSV, TikTok Studio analytics, lịch sử import |
| `/production` | Sản xuất | Chọn products → generate briefs AI → xuất packs sản xuất |
| `/log` | Log kết quả | Paste TikTok links → nhập metrics → AI học pattern |
| `/library` | Thư viện | Toàn bộ ContentAsset, filter theo status/format/product |
| `/insights` | AI Insights | Overview stats, learning accuracy, feedback table, AI patterns, playbook |
| `/shops` | Shops | Danh sách shop đã đánh giá (trust metrics) |
| `/shops/[id]` | Chi tiết shop | Xem/sửa thông tin shop |

**Lưu ý:** `/shops` không có trong sidebar navigation — chỉ truy cập được qua link từ trang chi tiết sản phẩm.

### Chi tiết từng trang

#### `/` — Dashboard
- **Components:** `MorningBriefWidget`, `QuickPasteWidget`, `InboxStatsWidget`, `UpcomingEventsWidget`, `ContentSuggestionsWidget`
- **APIs:** `GET /api/morning-brief`, `POST /api/inbox/paste`, stats từ `/api/inbox`
- **Models:** Campaign (morning brief), CalendarEvent, ProductIdentity, FinancialRecord
- **Links đến:** `/inbox`, `/production`, `/sync`

#### `/inbox` — Unified Inbox
- **Components:** `PasteLinkBox`, `InboxTable`, `QuickEnrichModal`
- **APIs:** `GET /api/inbox` (filter/page), `POST /api/inbox/paste`
- **Models:** ProductIdentity (+ Product linked via relation, ProductUrl, InboxItem)
- **Links đến:** `/inbox/[id]`
- **State pipeline:** new → enriched → scored → briefed → published → archived

#### `/inbox/[id]` — Chi tiết sản phẩm
- **Type:** Server Component (data fetch trực tiếp với Prisma)
- **APIs sử dụng trong component:** Direct Prisma, `WinProbabilityCard` → `/api/ai/confidence`, `ChannelRecommendations` → `/api/ai/intelligence`
- **Models:** Product (với snapshots), ProductIdentity, Shop
- **Vấn đề:** Page nhận `id` là ProductIdentity ID, nhưng sau đó lookup Product thông qua `identity.product.id`. Nếu identity không tồn tại, sẽ dùng `id` như Product ID trực tiếp — fallback logic dễ gây confusion.
- **Links đến:** `/inbox`, `/production?productId=...`, `/shops/[shopId]`

#### `/sync` — Đồng bộ (cũ: Upload)
- **Components:** `FileDropzone`, `ColumnMapping`, `UploadProgress`, `ImportHistoryTable`, `TikTokStudioDropzone`
- **APIs:** `POST /api/upload/products/preview`, `POST /api/upload/products`, `POST /api/sync/tiktok-studio`, `GET /api/upload/import/history`
- **Models:** Product, ProductSnapshot, ImportBatch, DataImport, AccountDailyStat, FollowerActivity, AccountInsight

#### `/production` — Sản xuất Content
- **Components:** `ProductionPageClient`
- **APIs:** `POST /api/briefs/generate`, `POST /api/production/create-batch`, `GET /api/production/[batchId]`, `GET /api/production/[batchId]/export`
- **Models:** ProductIdentity, ContentBrief, ContentAsset, ProductionBatch
- **Query param:** `?productId=...` (từ `/inbox/[id]`) để pre-select sản phẩm

#### `/log` — Log kết quả
- **Components:** `LogPageClient`
- **APIs:** `POST /api/log/match`, `POST /api/log/quick`, `POST /api/log/batch`
- **Models:** ContentAsset, AssetMetric, LearningWeightP4, UserPattern

#### `/library` — Thư viện
- **Components:** `LibraryPageClient`
- **APIs:** `GET /api/library`
- **Models:** ContentAsset (với ProductIdentity, AssetMetric)

#### `/insights` — AI Insights (merged Playbook)
- **Components:** `InsightsPageClient`, `TriggerLearningButton`, `ConfidenceWidget`, `WeeklyReportCard`, `PlaybookSection`
- **APIs:** `GET /api/learning`, `GET /api/patterns`, `POST /api/learning/trigger`, `GET /api/ai/anomalies`, `GET /api/reports/weekly`
- **Models:** LearningLog, Feedback, Product, Shop, FinancialRecord, CalendarEvent, LearningWeightP4, UserPattern, WinPattern, WeeklyReport

### Redirects

| Từ | Đến |
|----|-----|
| `/products` | `/inbox` |
| `/products/[id]` | `/inbox/[id]` |
| `/upload` | `/sync` |
| `/playbook` | `/insights?tab=playbook` |

### Trang đã xóa

| Trang | Trạng thái |
|-------|-----------|
| `/campaigns` | Đã xóa hoàn toàn (không có page.tsx) |
| `/feedback` | Đã xóa hoàn toàn (không có page.tsx) |

---

## 3. Database

### Models Đang Active

| Model | Mục đích | Quan hệ chính |
|-------|---------|---------------|
| **ProductIdentity** | Hub trung tâm — đại diện cho 1 sản phẩm thực tế, dedupe | → Product (1:1), ProductUrl[], InboxItem[], ContentBrief[], ContentAsset[], Commission[] |
| **Product** | Dữ liệu thô từ FastMoss/KaloData, AI scores | → ProductIdentity (optional 1:1), ProductSnapshot[], ContentPost[], Feedback[], Campaign[] |
| **ProductUrl** | Các URLs khác nhau trỏ đến cùng 1 sản phẩm | → ProductIdentity |
| **InboxItem** | Mỗi link người dùng paste vào | → ProductIdentity (optional) |
| **ContentBrief** | AI-generated: angles, hooks, scripts | → ProductIdentity, ContentAsset[] |
| **ContentAsset** | Mỗi video/asset cụ thể, lifecycle đầy đủ | → ProductIdentity, ContentBrief, ProductionBatch, AssetMetric[], Commission[] |
| **ProductionBatch** | Nhóm assets cho 1 lần sản xuất | → ContentAsset[] |
| **AssetMetric** | Metrics thực tế (views, likes, orders, rewardScore) | → ContentAsset |
| **LearningWeightP4** | Trọng số học máy theo scope/key | — |
| **UserPattern** | Patterns thắng/thua đã detect | — |
| **LearningLog** | Lịch sử mỗi lần chạy học | — |
| **ProductSnapshot** | Lịch sử data theo thời gian | → Product, ImportBatch |
| **ImportBatch** | Mỗi lần upload file | → ProductSnapshot[] |
| **DataImport** | Import generic đa nguồn (13 source types) | → Feedback[] |
| **Shop** | Thông tin shop, trust metrics | — |
| **Commission** | Theo dõi hoa hồng thực nhận | → ProductIdentity, ContentAsset |
| **FinancialRecord** | Thu/chi tổng quát | → Campaign (optional) |
| **CalendarEvent** | Lịch sự kiện, mega sale | — |
| **UserGoal** | Mục tiêu cá nhân (cũ) | — |
| **GoalP5** | Mục tiêu v2 (weekly/monthly) | — |
| **DailyBrief** | AI morning brief đã cache | — |
| **WeeklyReport** | Báo cáo tuần AI | — |
| **AccountDailyStat** | Stats tài khoản TikTok theo ngày | — |
| **FollowerActivity** | Follower activity heatmap | — |
| **AccountInsight** | Viewer/follower analytics | — |

### Models Deprecated / Ít dùng (giữ lại cho data)

| Model | Trạng thái | Lý do giữ |
|-------|-----------|-----------|
| **Campaign** | Deprecated — UI đã xóa, nhưng vẫn có relation với Product, Feedback, ContentPost, FinancialRecord | Có data cũ, API morning-brief vẫn query Campaign |
| **Feedback** | Deprecated — trang `/feedback` đã xóa | Model vẫn được `/insights` query, API `/api/feedback/manual` vẫn tồn tại, `/api/upload/feedback` vẫn tồn tại |
| **ContentPost** | Ít dùng — không có UI riêng | Quan hệ với Campaign và Product |
| **WinPattern** | Cũ (Phase 3A) — thay bởi UserPattern | API `/api/ai/patterns` vẫn tham chiếu |
| **UserGoal** | Cũ — thay bởi GoalP5 | Cả 2 đều tồn tại song song |

---

## 4. API Endpoints

### Nhóm Inbox (Phase 2)

| Method | Endpoint | Mục đích | Model |
|--------|---------|---------|-------|
| GET | `/api/inbox` | Danh sách ProductIdentity với filter/page | ProductIdentity |
| POST | `/api/inbox/paste` | Nhận text chứa links, parse + dedupe | InboxItem, ProductIdentity |
| GET | `/api/inbox/[id]` | Chi tiết 1 identity | ProductIdentity |
| PUT | `/api/inbox/[id]` | Cập nhật metadata, enrich | ProductIdentity |
| POST | `/api/inbox/[id]/score` | Tính Content Potential Score | ProductIdentity |
| POST | `/api/inbox/score-all` | Chấm điểm tất cả identities | ProductIdentity |
| ~~POST~~ | ~~`/api/inbox/migrate`~~ | ~~One-time migration~~ | ~~Đã xóa~~ |

### Nhóm Products (Phase 1, legacy)

| Method | Endpoint | Mục đích | Model |
|--------|---------|---------|-------|
| GET | `/api/products` | Danh sách products (cũ) | Product |
| GET/PUT | `/api/products/[id]` | Chi tiết product | Product |
| PUT | `/api/products/[id]/notes` | Ghi chú cá nhân | Product |
| PUT | `/api/products/[id]/seasonal` | Seasonal tag | Product |
| POST | `/api/score` | AI scoring (legacy) | Product |

### Nhóm Upload / Sync

| Method | Endpoint | Mục đích | Model |
|--------|---------|---------|-------|
| POST | `/api/upload/products/preview` | Đọc file, detect format, AI mapping | — |
| POST | `/api/upload/products` | Import file → products | Product, ProductSnapshot, ImportBatch |
| GET | `/api/upload/import/history` | Lịch sử import | DataImport |
| POST | `/api/upload/import` | Generic import | DataImport |
| POST | `/api/upload/import/detect` | Detect file type | — |
| ~~POST~~ | ~~`/api/upload/feedback`~~ | ~~Upload feedback CSV~~ | ~~Đã xóa~~ |
| POST | `/api/sync/tiktok-studio` | Import TikTok Studio files | AccountDailyStat, FollowerActivity, AccountInsight |

### Nhóm Production / Briefs (Phase 3)

| Method | Endpoint | Mục đích | Model |
|--------|---------|---------|-------|
| POST | `/api/briefs/generate` | Generate brief AI (Claude) | ContentBrief, ContentAsset |
| GET | `/api/briefs/[id]` | Chi tiết brief | ContentBrief |
| POST | `/api/briefs/batch` | Batch generate | ContentBrief, ContentAsset |
| GET | `/api/brief/today` | Morning brief hôm nay | DailyBrief |
| POST | `/api/brief/generate` | Tạo morning brief | DailyBrief |
| POST | `/api/production/create-batch` | Tạo production batch | ProductionBatch, ContentAsset |
| GET | `/api/production/[batchId]` | Xem batch + assets | ProductionBatch, ContentAsset |
| GET | `/api/production/[batchId]/export` | Export pack | ProductionBatch, ContentAsset |
| GET | `/api/library` | Danh sách content assets | ContentAsset |
| GET/PUT | `/api/assets/[id]` | Chi tiết / cập nhật asset | ContentAsset |
| POST | `/api/compliance` | Kiểm tra compliance | ContentAsset |

### Nhóm Log / Learning (Phase 4)

| Method | Endpoint | Mục đích | Model |
|--------|---------|---------|-------|
| POST | `/api/log/match` | Match TikTok link → assetId | ContentAsset |
| POST | `/api/log/quick` | Log metrics 1 video | AssetMetric, ContentAsset, LearningWeightP4 |
| POST | `/api/log/batch` | Log nhiều metrics | AssetMetric |
| POST | `/api/metrics/capture` | Capture metrics | AssetMetric |
| GET | `/api/learning` | Xem learning weights | LearningWeightP4 |
| POST | `/api/learning` | Apply decay | LearningWeightP4 |
| POST | `/api/learning/trigger` | Trigger learning run | LearningLog |
| GET | `/api/learning/history` | Lịch sử learning | LearningLog |
| GET | `/api/patterns` | Xem playbook patterns | UserPattern, LearningWeightP4 |
| POST | `/api/patterns` | Regenerate patterns | UserPattern |

### Nhóm AI Intelligence

| Method | Endpoint | Mục đích | Model |
|--------|---------|---------|-------|
| GET | `/api/ai/confidence` | AI confidence level | LearningLog, Feedback |
| GET | `/api/ai/anomalies` | Phát hiện anomalies | ProductIdentity |
| GET | `/api/ai/intelligence` | Channel recommendations | Product |
| ~~GET~~ | ~~`/api/ai/patterns`~~ | ~~Win patterns~~ | ~~Đã xóa, dùng /api/patterns~~ |
| GET | `/api/ai/weekly-report` | Báo cáo tuần | WeeklyReport |
| GET | `/api/morning-brief` | Morning brief | ProductIdentity, CalendarEvent, GoalP5, AccountDailyStat |
| GET | `/api/reports/weekly` | Weekly report | WeeklyReport |
| GET | `/api/insights` | Overview insights | Product, LearningLog |

### Nhóm Business (Phase 5)

| Method | Endpoint | Mục đích | Model |
|--------|---------|---------|-------|
| GET/POST | `/api/commissions` | Danh sách / tạo commission | Commission |
| GET | `/api/commissions/summary` | Tổng hợp commission | Commission |
| GET/POST | `/api/financial` | Thu/chi | FinancialRecord |
| GET/PUT | `/api/financial/[id]` | Chi tiết record | FinancialRecord |
| GET | `/api/financial/summary` | Tổng hợp tài chính | FinancialRecord |
| GET/POST | `/api/goals-p5` | Goals v2 | GoalP5 |
| GET | `/api/goals-p5/current` | Goal hiện tại | GoalP5 |
| GET | `/api/goals-p5/progress` | Progress | GoalP5 |
| ~~GET/POST~~ | ~~`/api/goals`~~ | ~~Goals cũ~~ | ~~Đã xóa, dùng /api/goals-p5~~ |
| GET/POST | `/api/shops` | Danh sách / tạo shop | Shop |
| GET/PUT | `/api/shops/[id]` | Chi tiết shop | Shop |
| GET/POST | `/api/calendar` | Sự kiện | CalendarEvent |
| GET/PUT | `/api/calendar/[id]` | Chi tiết sự kiện | CalendarEvent |
| GET | `/api/calendar/upcoming` | Sự kiện sắp tới | CalendarEvent |

### Nhóm khác

| Method | Endpoint | Mục đích | Model |
|--------|---------|---------|-------|
| ~~POST~~ | ~~`/api/feedback/manual`~~ | ~~Thêm feedback thủ công~~ | ~~Đã xóa~~ |
| GET/PUT | `/api/content-posts/[id]` | Content post | ContentPost |
| GET/POST | `/api/content-posts` | Danh sách | ContentPost |
| GET | `/api/export/sheet` | Export Google Sheet | Product |
| GET | `/api/image-proxy` | Proxy ảnh | — |

### Endpoints đã xóa (không còn trong codebase)

- `/api/campaigns` — đã xóa hoàn toàn
- `/api/budget` — đã xóa hoàn toàn

---

## 5. Vấn Đề Phát Hiện

### 5.1. ~~Broken Links trong UI (Stale References)~~ ✅ ĐÃ FIX (2026-02-26)

**Đã sửa:** 3 hardcoded links + 2 links trong morning-brief enricher. Quét toàn bộ codebase xác nhận không còn `/upload`, `/products`, `/feedback`, `/campaigns`, `/playbook` hardcoded trong JSX.

### 5.2. ~~Dual Identity System — Disconnect giữa Product và ProductIdentity~~ ✅ ĐÃ FIX (2026-02-26)

**Đã sửa:**
- Auto-sync score: Upload FastMoss → `scoreProducts()` → tự động cập nhật `ProductIdentity.combinedScore` via shared `lib/services/score-identity.ts`
- `/inbox/[id]` chỉ nhận ProductIdentity.id. Nếu nhận Product.id → redirect sang `/inbox/{identity.id}`. Không còn fallback logic.
- Similar products links dùng `identityId` thay vì `Product.id`
- Tất cả components (product-table, product-card, shops/[id]) dùng `identityId ?? id` cho links

### 5.3. ~~Morning Brief Dùng Campaign (Đã Deprecated)~~ ✅ ĐÃ FIX (2026-02-26)

**Đã sửa:** Morning brief query ProductIdentity (scored, chưa briefed) thay vì Campaign. UserGoal → GoalP5. Thêm AccountDailyStat summary. Xóa campaign analyzer import.

`/api/morning-brief/route.ts` dòng 30–47: Vẫn query `prisma.campaign.findMany({ where: { status: "running" } })`. Trang `/campaigns` đã bị xóa, không có UI để tạo/quản lý campaigns nữa. Nếu không có campaign nào, code chạy đúng nhưng phần "active campaigns" trong morning brief sẽ luôn trống.

### 5.4. `/api/feedback/manual` và `/api/upload/feedback` — Orphan APIs

**Nghiêm trọng: LOW**

Hai endpoints này vẫn tồn tại và hoạt động nhưng:
- Không có UI nào gọi `/api/feedback/manual` (trang `/feedback` đã bị xóa)
- Feedback model vẫn được query trong `/insights` (overview stats, table)
- Nếu user muốn log feedback mới, không có đường nào vào UI nữa

### 5.5. `/shops` Không Có Trong Navigation

**Nghiêm trọng: LOW**

Sidebar chỉ có 7 items: Dashboard, Inbox, Sync, Sản xuất, Log, Thư viện, Insights. `/shops` không có, chỉ có thể vào qua link từ `/inbox/[id]` khi sản phẩm có `shopName` khớp với Shop trong DB. Nếu không có shop, link không hiện.

### 5.6. ~~Dual Goal System~~ ✅ ĐÃ FIX (2026-02-26)

**Đã sửa:** Xóa `/api/goals/route.ts`. Morning brief + weekly report chuyển sang GoalP5. Không còn code nào reference UserGoal.

### 5.7. ~~`/inbox/[id]` Link Similar Products Dùng Product.id~~ ✅ ĐÃ FIX (2026-02-26)

**Đã sửa:** Similar products query include `identityId`, link dùng `sp.identityId ?? sp.id`. Filter chỉ hiện products có linked identity.

### 5.8. ~~`DataImport.campaignsCreated/Updated` — Stale Fields~~ ✅ ĐÃ FIX (2026-02-26)

**Đã sửa:** Xóa `campaignsCreated` và `campaignsUpdated` khỏi ImportRecord interface trong cả sync page và ImportHistoryTable component. DB fields giữ nguyên.

### 5.9. ~~`/api/inbox/migrate` — One-Time Migration Endpoint~~ ✅ ĐÃ FIX (2026-02-26)

**Đã sửa:** Xóa file `app/api/inbox/migrate/route.ts`.

### 5.10. ~~`WinPattern` vs `UserPattern` — Redundant Models~~ ✅ ĐÃ FIX (2026-02-26)

**Đã sửa:** Xóa `/api/ai/patterns/route.ts` (WinPattern API). PlaybookSection chuyển sang `/api/patterns` (UserPattern). `lib/ai/patterns.ts` vẫn còn nhưng không có consumer — dead code, giữ cho reference. WinPattern model giữ trong schema (có data cũ).

---

## Tóm Tắt Sức Khỏe Hệ Thống

| Khía cạnh | Trạng thái | Ghi chú |
|-----------|-----------|---------|
| Navigation | Tốt | 7 routes trong sidebar, đúng sau refactor |
| Redirects | Hoạt động | `/products`, `/upload`, `/playbook` redirect đúng |
| Core workflow | Hoạt động | Capture → Inbox → Production → Log → Learn |
| Data integrity | ✅ Tốt | Auto-sync score Product→Identity. Routing chuẩn hóa qua ProductIdentity.id |
| Dead APIs | ✅ Đã dọn | Xóa feedback, goals, migrate, ai/patterns, upload/feedback |
| Broken UI links | ✅ Đã fix | Không còn hardcoded `/upload`, `/products`, `/campaigns` trong UI |
| Deprecated pages | Xóa sạch | `/campaigns`, `/feedback` không còn |
| AI integration | Hoạt động | Cần `ANTHROPIC_API_KEY` cho brief generation và scoring |
| Morning Brief | ✅ Updated | Query ProductIdentity thay Campaign, dùng GoalP5, thêm AccountDailyStat |
| Playbook | ✅ Updated | Dùng UserPattern `/api/patterns` thay WinPattern `/api/ai/patterns` |
