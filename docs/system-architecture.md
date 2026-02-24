# System Architecture — AffiliateScorer

> AI-powered affiliate product scoring app cho Vietnamese marketers.
> Tài liệu cập nhật: 2026-02-24

---

## Tổng Quan Hệ Thống

```
                        ┌─────────────────────────────┐
                        │        VERCEL (CDN)          │
                        │   Next.js 16 — App Router    │
                        │   React 19 + TypeScript      │
                        └──────────┬──────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
               ┌────▼────┐  ┌─────▼─────┐  ┌────▼─────┐
               │  Pages  │  │ API Routes│  │  Static  │
               │ (SSR)   │  │ (/api/*)  │  │  Assets  │
               └────┬────┘  └─────┬─────┘  └──────────┘
                    │              │
                    │         ┌────▼──────────────┐
                    │         │   Prisma 7.4 ORM  │
                    │         └────┬──────────────┘
                    │              │
               ┌────▼──────────────▼──────┐
               │    Supabase (PostgreSQL)  │
               │    + Storage + Auth       │
               └──────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Anthropic API     │
                    │  Claude Haiku 4.5  │
                    │  (Scoring + Learn) │
                    └───────────────────┘
```

---

## Tech Stack

| Thành phần       | Công nghệ                          | Phiên bản | Vai trò                              |
|------------------|-------------------------------------|-----------|--------------------------------------|
| Framework        | Next.js (App Router)                | 16        | SSR, API routes, routing             |
| UI Library       | React                               | 19        | Component rendering                  |
| Language         | TypeScript                          | strict    | Type safety                          |
| Database         | PostgreSQL via Supabase             | --        | Persistent storage, RLS              |
| ORM              | Prisma                              | 7.4       | Schema management, queries, migrate  |
| AI Engine        | Claude Haiku 4.5 (Anthropic)        | --        | Product scoring, learning engine     |
| CSS              | Tailwind CSS                        | 4         | Utility-first styling                |
| UI Components    | Shadcn/UI                           | --        | Accessible component primitives      |
| Charts           | Recharts                            | --        | Data visualization                   |
| Icons            | Lucide React                        | --        | Icon system                          |
| Theme            | next-themes                         | --        | Light/dark mode (system pref)        |
| CSV Parsing      | PapaParse                           | --        | CSV file processing                  |
| Excel Parsing    | SheetJS                             | --        | XLSX/XLS file processing             |
| Package Manager  | pnpm                                | --        | Dependency management                |
| Hosting          | Vercel                              | --        | Edge deployment, serverless          |

---

## Kien Truc Hien Tai (Phase 1 — Da Trien Khai)

### Database Schema — 10 Models

```
Product (main)
├── id, name, price, commission, commissionRate
├── monthlySales, revenue, shopName, shopRating
├── kolCount, kolNames, contentCount
├── aiScore, marketScore, profitScore, riskScore
├── personalNotes, personalRating, tags
├── category, platform, status
├── ~80 fields tong cong
│
├── Feedback[]         (1:N — campaign performance)
├── ProductSnapshot[]  (1:N — lich su tracking)
├── Campaign[]         (1:N — content campaigns)
└── FinancialRecord[]  (1:N — thu chi)

Feedback
├── id, productId → Product
├── adsSpend, adsRevenue, adsROAS, adsOrders
├── organicViews, organicOrders, organicRevenue
├── contentType, platform, notes
└── createdAt

LearningLog
├── id, weekNumber, year
├── weightsSnapshot (JSON — trong so AI)
├── accuracy, sampleSize
└── insights, recommendations

ProductSnapshot
├── id, productId → Product, importBatchId → ImportBatch
├── price, commission, monthlySales, kolCount
└── snapshotDate

ImportBatch
├── id, fileName, fileType, rowCount
├── successCount, errorCount, errors (JSON)
└── importedAt

DataImport
├── id, sourceType (13+ loai)
├── fileName, rawData (JSON)
├── processedData (JSON), status
└── importedAt

Campaign
├── id, productId → Product
├── name, status (planning/running/completed)
├── contentType, platform, budget
├── startDate, endDate
└── results (JSON)

Shop
├── id, name, platform, rating
├── totalProducts, avgCommission
└── notes

FinancialRecord
├── id, productId → Product (nullable)
├── type (income/expense), amount
├── category, description
└── recordDate

CalendarEvent
├── id, name, startDate, endDate
├── platform, category
├── priority, description
└── isRecurring
```

### API Routes — 13 Endpoints

| Route                        | Method | Chuc nang                                    |
|------------------------------|--------|----------------------------------------------|
| `/api/upload`                | POST   | Upload CSV/XLSX, parse, normalize, dedup     |
| `/api/score`                 | POST   | Goi Claude Haiku — cham diem san pham        |
| `/api/products`              | GET    | List products (filter, sort, paginate)       |
| `/api/products/[id]`         | GET    | Chi tiet 1 san pham                          |
| `/api/products/[id]`         | PATCH  | Cap nhat notes, rating, tags                 |
| `/api/feedback`              | POST   | Upload feedback data                         |
| `/api/feedback`              | GET    | List feedback records                        |
| `/api/insights`              | GET    | Analytics & insights data                    |
| `/api/learning`              | POST   | Trigger weekly AI learning cycle             |
| `/api/learning`              | GET    | Lich su learning logs                        |
| `/api/export`                | GET    | Xuat data ra CSV/XLSX                        |
| `/api/image-proxy`           | GET    | Proxy anh san pham (tranh CORS)              |
| `/api/import`                | POST   | Generic import (13+ source types)            |

### Component Architecture

```
app/
├── layout.tsx              — Root layout, ThemeProvider, metadata
├── page.tsx                — Dashboard (stats, charts, recent products)
├── not-found.tsx           — Custom 404
├── error.tsx               — Global error boundary
├── loading.tsx             — Skeleton loading
│
├── upload/
│   └── page.tsx            — Drag-drop upload, file preview, import
│
├── products/
│   ├── page.tsx            — Product list, filters, sort, search
│   └── [id]/
│       └── page.tsx        — Product detail, scores, notes, history
│
├── feedback/
│   └── page.tsx            — Feedback list, upload, mapping
│
├── insights/
│   └── page.tsx            — Charts, analytics, AI recommendations
│
└── api/
    └── [13 route files]

components/
├── ui/                     — Shadcn primitives (button, card, input, ...)
├── dashboard/              — Stat cards, recent table, score chart
├── products/               — Product card, filter bar, score badge
├── upload/                 — Dropzone, file preview, progress bar
├── feedback/               — Feedback form, mapping table
├── insights/               — Chart components, tab panels
├── layout/                 — Navbar, sidebar, theme toggle
└── shared/                 — Loading skeleton, empty state, error card

lib/
├── prisma.ts               — Prisma client singleton
├── anthropic.ts            — Claude API wrapper
├── parsers/                — CSV/XLSX parse + normalize logic
├── scoring.ts              — Score calculation helpers
├── utils.ts                — Chung (format, date, currency)
└── constants.ts            — Enums, default values
```

### Data Flow — Upload & Scoring

```
1. USER UPLOAD
   File (CSV/XLSX) → Dropzone component → FormData → /api/upload

2. PARSE & NORMALIZE
   /api/upload → detect file type
   ├── CSV  → PapaParse.parse() → raw rows
   └── XLSX → SheetJS.read()   → raw rows
   → Column mapping (auto-detect Vietnamese headers)
   → Normalize: trim, convert types, handle encoding
   → Dedup: match by name + platform + shop

3. STORE
   → Prisma.product.upsert() — tao moi hoac cap nhat
   → Prisma.productSnapshot.create() — luu lich su
   → Prisma.importBatch.create() — metadata upload

4. AI SCORING
   /api/score → lay product data
   → Build prompt (market metrics + commission + KOL + sales)
   → Claude Haiku 4.5 API call
   → Parse response → aiScore, marketScore, profitScore, riskScore
   → Prisma.product.update() — luu diem

5. DISPLAY
   → Products page: sorted by aiScore (desc)
   → Product detail: score breakdown, radar chart
   → Dashboard: top products, score distribution
```

---

## Kien Truc Mo Rong (Phase 2-4)

### Phase 2: Personal Layer

**Models moi/mo rong:**
- Product: them `personalNotes`, `personalRating`, `tags` (da co trong schema)
- Shop: quan ly danh sach shop, rating, notes
- FinancialRecord: theo doi thu chi, loi nhuan thuc te
- CalendarEvent: 18 su kien sale 2026 (seed data)

**Pages moi:**
- `/shops` — danh sach shop, rating, so san pham
- `/finance` — bang thu chi, bieu do loi nhuan
- `/calendar` — lich su kien sale, nhac nho
- `/insights` — redesign 5 tabs (Overview, Market, Personal, Financial, AI)

**API Routes moi:**
- `/api/shops` — CRUD shop
- `/api/finance` — CRUD financial records
- `/api/calendar` — CRUD events + seed data
- `/api/insights/[tab]` — data cho tung tab

### Phase 3A: Campaign Tracker

**Lifecycle:**
```
Planning → Running → Completed
   │          │          │
   ▼          ▼          ▼
Checklist  Daily Input  Analysis
auto-gen   30s ritual   win/loss
```

**Models moi/mo rong:**
- Campaign: them `dailyResults[]`, `checklist[]`, `goalAmount`
- DailyResult: `campaignId`, `date`, `spend`, `revenue`, `orders`, `notes`
- Goal: `month`, `year`, `targetProfit`, `actualProfit`

**Features chinh:**
- Morning Brief widget — 3 actionable items moi sang
- Daily ritual — nhap ket qua trong 30 giay
- Auto-sync: Campaign.completed → FinancialRecord (income/expense)
- Goal tracking: thanh tien trinh loi nhuan thang

### Phase 3B: Data Parsers

**Auto-detect Engine:**
```
File Upload → Detect Engine
├── Header matching    (column names → source type)
├── Structure analysis (column count, data patterns)
└── Manual fallback    (user chon source type)
```

**7+ Parsers:**

| Parser            | Source         | Key Columns                        |
|-------------------|----------------|------------------------------------|
| FB Ads            | Facebook       | spend, impressions, cpc, ctr, roas |
| TikTok Ads        | TikTok Ads Mgr | cost, clicks, conversions, cpa     |
| Shopee Ads        | Shopee Seller  | budget, clicks, orders, acos       |
| TikTok Affiliate  | TikTok Shop    | commission, sales, items_sold      |
| Shopee Affiliate  | Shopee Partner | commission, clicks, conversions    |
| KaloData          | KaloData.com   | views, engagement, estimated_sales |
| Generic CSV       | Any            | User-defined column mapping        |

**Merge Logic:**
```
Parsed Data → Match Product (name/SKU)
           → Match Campaign (date range + platform)
           → Upsert: create neu moi, merge neu da co
           → Update scores: trigger re-score neu data thay doi >10%
```

### Phase 4: AI Intelligence

**Win Probability Score:**
```
Win Score = Market (40%) + Personal Fit (30%) + Timing (15%) + Risk (15%)

Market (40%):
  - Sales volume trend        (15%)
  - Commission rate vs avg    (10%)
  - Competition (KOL count)   (10%)
  - Platform momentum          (5%)

Personal Fit (30%):
  - Past success same category (15%)
  - Content skill match        (10%)
  - Budget alignment            (5%)

Timing (15%):
  - Seasonal relevance          (5%)
  - Product lifecycle stage     (5%)
  - Calendar events proximity   (5%)

Risk (15%):
  - Price volatility            (5%)
  - Shop reliability            (5%)
  - Market saturation           (5%)
```

**Confidence Level (0-4):**

| Level | Label      | Dieu kien                              |
|-------|------------|----------------------------------------|
| 0     | Khong data | Chua co du lieu                        |
| 1     | Du doan    | Chi co market data                     |
| 2     | Co co so   | Market + 1-2 feedback records          |
| 3     | Dang tin   | Market + 3+ feedbacks + campaign data  |
| 4     | Chinh xac  | Full data + >30 ngay tracking          |

**Product Lifecycle Detection:**
```
Data Points: sales_trend (3 snapshots min) + KOL_trend + market_age

New      → sales tang >50%, KOL < 10, < 30 ngay
Rising   → sales tang 20-50%, KOL tang
Hot      → sales cao nhat segment, KOL > 50
Peak     → sales bat dau giam <10%, KOL cao
Declining→ sales giam >20% lien tiep 2 snapshots
```

**Anomaly Detection:**
- ROAS giam >30% trong 7 ngay → canh bao
- Thua lien tiep 3 campaigns → phan tich nguyen nhan
- Chi vuot budget >20% → canh bao ngay
- KOL dot bien (tang/giam >50%) → co hoi/rui ro

**Morning Brief V2 — 5 cau hoi hang ngay:**
1. Hom nay nen lam gi? (top 3 actions)
2. Campaign nao can chu y? (anomalies)
3. San pham nao dang hot? (rising products)
4. Budget con bao nhieu? (finance summary)
5. Tuan nay dat bao nhieu % target? (goal progress)

---

## Data Flow Tong The

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  File Upload │────▶│ Auto-Detect  │────▶│ Parser (7 loai) │
│  CSV / XLSX  │     │ Engine       │     │ Normalize data  │
└─────────────┘     └──────────────┘     └────────┬────────┘
                                                   │
                                          ┌────────▼────────┐
                                          │ Dedup + Merge    │
                                          │ Match Product    │
                                          │ Match Campaign   │
                                          └────────┬────────┘
                                                   │
┌─────────────┐                           ┌────────▼────────┐
│  Daily Input │──────────────────────────▶│   PostgreSQL     │
│  30s ritual  │                           │   (Supabase)     │
└─────────────┘                           └────────┬────────┘
                                                   │
                                          ┌────────▼────────┐
                                          │  Claude Haiku    │
                                          │  AI Scoring      │
                                          │  + Learning      │
                                          └────────┬────────┘
                                                   │
                    ┌──────────────────────────────┼──────────────┐
                    │              │               │              │
             ┌──────▼──────┐ ┌────▼─────┐  ┌─────▼─────┐ ┌─────▼──────┐
             │ Dashboard   │ │ Products │  │ Insights  │ │ Morning    │
             │ Stats/Chart │ │ List/Det │  │ 5 Tabs    │ │ Brief      │
             └─────────────┘ └──────────┘  └───────────┘ └────────────┘
```

---

## Security

| Lop bao mat          | Chi tiet                                              |
|----------------------|-------------------------------------------------------|
| Row Level Security   | Bat cho moi table tren Supabase                       |
| API Key              | `ANTHROPIC_API_KEY` trong `.env` — KHONG expose client|
| Supabase Keys        | `NEXT_PUBLIC_SUPABASE_URL` + `ANON_KEY` trong `.env`  |
| Server-only secrets  | API routes chay server-side, key khong leak ra client  |
| Input validation     | Zod schema cho moi API input                          |
| File upload          | Gioi han size (10MB), chi chap nhan CSV/XLSX          |
| Image proxy          | `/api/image-proxy` tranh CORS, whitelist domain       |
| Error handling       | Khong expose stack trace cho user, log server-side     |
| CORS                 | Mac dinh Next.js — same-origin                        |
| Environment          | `.env.example` co comment, `.env` trong `.gitignore`  |

---

## Deployment

```
┌──────────────────────────────────┐
│            VERCEL                │
│  ┌────────────────────────────┐  │
│  │  Next.js 16 (Serverless)  │  │
│  │  - SSR Pages              │  │
│  │  - API Routes (Lambda)    │  │
│  │  - Static Assets (CDN)    │  │
│  └─────────────┬─────────────┘  │
│                │                 │
│  Environment Variables:          │
│  - ANTHROPIC_API_KEY             │
│  - DATABASE_URL                  │
│  - NEXT_PUBLIC_SUPABASE_URL      │
│  - NEXT_PUBLIC_SUPABASE_ANON_KEY │
└────────────────┬─────────────────┘
                 │
      ┌──────────▼──────────┐
      │     SUPABASE        │
      │  ┌────────────────┐ │
      │  │ PostgreSQL     │ │
      │  │ (500MB free)   │ │
      │  ├────────────────┤ │
      │  │ Storage        │ │
      │  │ (1GB free)     │ │
      │  ├────────────────┤ │
      │  │ Auth           │ │
      │  │ (50K users)    │ │
      │  ├────────────────┤ │
      │  │ Realtime       │ │
      │  │ (Phase 3+)     │ │
      │  └────────────────┘ │
      └─────────────────────┘

Chi phi:
  - Vercel Hobby:   $0/thang
  - Supabase Free:  $0/thang (500MB DB, 1GB storage)
  - Anthropic API:  ~$5-15/thang (tuy usage)
  - TONG:           ~$5-15/thang
```

---

*Tai lieu nay duoc cap nhat theo tien do phat trien. Moi thay doi kien truc lon can cap nhat lai.*
