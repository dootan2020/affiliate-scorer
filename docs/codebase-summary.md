# Codebase Summary — AffiliateScorer

## Tổng Quan

AffiliateScorer là ứng dụng chấm điểm sản phẩm affiliate bằng AI, dành cho marketer Việt Nam.
Ứng dụng phân tích dữ liệu từ FastMoss/KaloData, chấm điểm bằng Claude Haiku 4.5,
và đưa ra insights giúp marketer chọn sản phẩm tiềm năng.

## Tech Stack

| Thành phần | Công nghệ | Phiên bản |
|-----------|----------|-----------|
| Framework | Next.js | 16 |
| Language | TypeScript | strict mode |
| ORM | Prisma | 7 |
| Database | PostgreSQL (Supabase) | — |
| AI Engine | Claude Haiku | 4.5 |
| UI | Tailwind CSS + lucide-react | — |
| Theme | next-themes (dark mode) | — |
| Package Manager | pnpm | — |

## Thống Kê Dự Án

- **Commits:** 31
- **Database Models:** 10
- **Pages:** 7
- **API Endpoints:** 13
- **Components:** 29

## Trạng Thái Phát Triển

- **Phase 1:** DONE — Upload, AI scoring, dashboard, insights, feedback
- **Phase 2:** PLANNED — Personal layer (notes, tags, shop management)
- **Phase 3:** PLANNED — Campaigns + data parsers mở rộng
- **Phase 4:** PLANNED — AI intelligence nâng cao

## Cấu Trúc Thư Mục

```
affiliate-scorer/
├── app/                        # Pages + API routes (Next.js App Router)
│   ├── (pages)/                # Các trang chính
│   │   ├── dashboard/          # Trang chủ — Top 10, badges, overview
│   │   ├── upload/             # Upload FastMoss/KaloData files
│   │   ├── products/           # Danh sách sản phẩm + chi tiết
│   │   ├── insights/           # Accuracy chart, patterns, weekly report
│   │   └── feedback/           # FB Ads, TikTok Ads, Shopee imports
│   ├── api/                    # 13 API route handlers
│   ├── layout.tsx              # Root layout + metadata + ThemeProvider
│   ├── not-found.tsx           # Custom 404
│   ├── error.tsx               # Custom error page
│   └── loading.tsx             # Skeleton loading
│
├── components/                 # 29 React components
│   ├── layout/                 # Header, nav, sidebar, footer
│   ├── products/               # Product card, score breakdown, estimator
│   ├── upload/                 # Drag-drop, format detector, column mapper
│   ├── feedback/               # Feedback forms, import tools
│   ├── insights/               # Charts, pattern cards, reports
│   └── ui/                     # Badge, button, card, input, skeleton...
│
├── lib/                        # Business logic + utilities
│   ├── ai/                     # scoring.ts — Claude Haiku integration
│   ├── parsers/                # fastmoss.ts, kalodata.ts — file parsers
│   ├── scoring/                # formula.ts — 6-criteria scoring formula
│   ├── utils/                  # Helpers, formatters, constants
│   ├── types/                  # TypeScript type definitions
│   └── validations/            # Zod schemas cho API input
│
├── prisma/                     # Database
│   └── schema.prisma           # 313 lines, 10 models
│
├── docs/                       # Documentation
├── public/                     # Static assets
├── .env.example                # Template biến môi trường
└── package.json                # Dependencies + scripts
```

## Database Models (10)

Schema được định nghĩa trong `prisma/schema.prisma` (313 lines). Các model chính:

1. **Product** — Sản phẩm affiliate (tên, giá, commission, category...)
2. **ScoreResult** — Kết quả chấm điểm AI (6 tiêu chí)
3. **UploadSession** — Phiên upload file (format, status, row count)
4. **DataSource** — Nguồn dữ liệu (FastMoss, KaloData)
5. **Feedback** — Phản hồi hiệu quả thực tế (FB Ads, TikTok, Shopee)
6. **LearningPattern** — Pattern học từ feedback (weekly analysis)
7. **Insight** — Báo cáo insights tổng hợp
8. **Badge** — Badges sản phẩm (trending, new, seasonal)
9. **SimilarProduct** — Sản phẩm tương tự (recommendations)
10. **UserPreference** — Cài đặt người dùng

## Key Files

| File | Chức năng | Ghi chú |
|------|----------|---------|
| `prisma/schema.prisma` | Database schema | 313 lines, 10 models |
| `lib/ai/scoring.ts` | AI scoring engine | Claude Haiku 4.5 integration |
| `lib/parsers/fastmoss.ts` | FastMoss parser | XLSX, Vietnamese column mapping |
| `lib/parsers/kalodata.ts` | KaloData parser | CSV format |
| `lib/scoring/formula.ts` | Scoring formula | 6 tiêu chí chấm điểm |
| `app/layout.tsx` | Root layout | Metadata, ThemeProvider, fonts |
| `app/api/` | API routes | 13 endpoints |

## Tính Năng Chính (Phase 1)

- **Upload:** Drag-drop XLSX/CSV, auto-detect FastMoss vs KaloData, column mapping
- **AI Scoring:** 6 tiêu chí (revenue, growth, competition, commission, trend, seasonality)
- **Dashboard:** Top 10 sản phẩm, badges (trending/new/seasonal), stat cards
- **Product Detail:** Score breakdown, profit estimator, similar products
- **Feedback:** Import kết quả FB Ads, TikTok Ads, Shopee
- **Learning Engine:** Phân tích pattern hàng tuần từ feedback
- **Insights:** Accuracy chart, discovered patterns, weekly report
- **Dark Mode:** Tự động theo OS preference, toggle thủ công
- **Responsive:** Mobile-first, hoạt động tốt trên mọi thiết bị
