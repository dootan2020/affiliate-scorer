# AffiliateScorer

Công cụ AI chấm điểm sản phẩm affiliate từ FastMoss/KaloData. Học từ kết quả thật để cải thiện scoring.

## Cài đặt

```bash
pnpm install
cp .env.example .env   # Điền API keys
pnpm dev               # Mở http://localhost:3000
```

## Biến môi trường

| Biến | Bắt buộc | Mô tả |
|------|----------|-------|
| `DATABASE_URL` | - | SQLite local (mặc định `file:./prisma/dev.db`) |
| `ANTHROPIC_API_KEY` | Yes | API key cho AI scoring ([lấy tại đây](https://console.anthropic.com/settings/keys)) |
| `NEXT_PUBLIC_BASE_URL` | - | Chỉ cần khi deploy production |

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Database**: SQLite + Prisma ORM
- **AI**: Claude Haiku 4.5 (Anthropic API)
- **UI**: Tailwind CSS, Radix UI, Recharts, Lucide Icons
- **Theme**: next-themes (light/dark auto)

## Cấu trúc

```
app/
  page.tsx            # Dashboard — top products + AI insights
  upload/page.tsx     # Upload CSV từ FastMoss/KaloData
  feedback/page.tsx   # Feedback loop — kết quả chiến dịch
  insights/page.tsx   # AI learning analytics
  products/[id]/      # Chi tiết sản phẩm + score breakdown
  api/
    upload/products/  # POST — import CSV sản phẩm
    upload/feedback/  # POST — import kết quả ads
    score/            # POST — AI scoring
    learning/trigger/ # POST — chạy learning cycle
    insights/         # GET — analytics data
components/
  layout/             # NavHeader (pill nav + dark toggle)
  products/           # ProductTable, ProductCard, ScoreBreakdown
  upload/             # FileDropzone, UploadProgress
  feedback/           # FeedbackTable, FeedbackUpload
  insights/           # WeeklyReport, AccuracyChart, PatternList
lib/
  ai/                 # Claude API integration, scoring, learning
  parsers/            # FastMoss, KaloData, FB Ads, TikTok, Shopee
  utils/              # Format, normalize, dedup, mapper
prisma/
  schema.prisma       # Product, Feedback, ImportBatch, LearningLog
```
