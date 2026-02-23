# PRODUCT REQUIREMENTS DOCUMENT
## AffiliateScorer — Trợ Lý AI Chọn Sản Phẩm Affiliate

---

### Document Info
- **Version:** 1.0
- **Ngày tạo:** 2026-02-23
- **Status:** Ready for Development
- **Tác giả:** Technical Product Director AI

---

## 1. EXECUTIVE SUMMARY

### 1.1 Vision

AffiliateScorer là công cụ cá nhân sử dụng AI để chấm điểm, xếp hạng và đề xuất sản phẩm affiliate từ data export của FastMoss PRO + KaloData PRO. Điểm khác biệt cốt lõi: **AI học từ kết quả thật** (ads + organic) để ngày càng chọn sản phẩm chính xác hơn, cá nhân hóa cho chính người dùng.

### 1.2 Vấn Đề Cốt Lõi

- FastMoss/KaloData cho **10,000+ sản phẩm trending** nhưng KHÔNG nói "sản phẩm nào phù hợp với BẠN"
- Người dùng bị **information overload** — quá nhiều data, không có framework chọn lọc
- Không có công cụ nào **cross-platform** so sánh Shopee vs TikTok Shop cùng lúc
- Không có công cụ nào **học từ kết quả thật** để cải thiện đề xuất theo thời gian

### 1.3 Giải Pháp

```
Upload CSV từ FastMoss + KaloData
       ↓
AI chấm điểm 0-100 → Top 10-15 picks hàng ngày
       ↓
Người dùng làm content + chạy ads
       ↓
Upload kết quả thật (ads + organic exports)
       ↓
AI học → Scoring chính xác hơn
       ↓
🔄 Lặp lại
```

### 1.4 Success Metrics

| Metric | Tháng 1 | Tháng 3 | Tháng 6 |
|--------|---------|---------|---------|
| Thời gian chọn SP/ngày | < 10 phút | < 5 phút | < 5 phút |
| Tỷ lệ SP chọn → có đơn | 40%+ | 60%+ | 75%+ |
| AI scoring accuracy | 60% | 75% | 85%+ |
| Data points tích lũy | 50+ | 200+ | 500+ |

---

## 2. USER PROFILE

| Thuộc tính | Chi tiết |
|------------|----------|
| Vai trò | Affiliate content creator |
| Nền tảng | Shopee Affiliate + TikTok Shop Affiliate |
| Quảng cáo | Facebook Ads + TikTok Ads + Organic |
| Output | 7+ video/tuần |
| Kênh đăng | TikTok, Shopee Video, Reels, Shorts, Zalo |
| Niche | Chưa cố định, đa ngành |
| Tools hiện tại | FastMoss PRO, KaloData PRO |
| Technical skill | Thấp, dùng AI coding tools |
| Budget | $30-50/tháng cho infrastructure |

**Đặc điểm quan trọng:**
- Volume cao: 7+ video/tuần = cần chọn ít nhất 7+ SP/tuần
- Multi-channel: Content đăng trên 5-6 platform → feedback data phong phú
- Ads + Organic: Có cả paid và organic data → AI có 2 góc nhìn để học
- Data-rich: FastMoss PRO + KaloData PRO = data input chất lượng cao

---

## 3. SYSTEM ARCHITECTURE

### 3.1 Tổng Quan

```
╔══════════════════════════════════════════════════════════╗
║                    AffiliateScorer                       ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  ┌─────────────────────┐  ┌───────────────────────────┐ ║
║  │   DATA INPUT MODULE │  │   FEEDBACK INPUT MODULE   │ ║
║  │                     │  │                           │ ║
║  │ • FastMoss CSV      │  │ • FB Ads export           │ ║
║  │ • KaloData CSV      │  │ • TikTok Ads export       │ ║
║  │ • Auto-detect format│  │ • Shopee Affiliate export  │ ║
║  │ • Normalize + Dedup │  │ • TikTok organic stats    │ ║
║  └──────────┬──────────┘  │ • Reels/Shorts/Zalo stats │ ║
║             │             └─────────────┬─────────────┘ ║
║             ▼                           ▼               ║
║  ┌──────────────────────────────────────────────────┐   ║
║  │              PROCESSING ENGINE                    │   ║
║  │                                                   │   ║
║  │  ┌──────────────┐  ┌───────────────────────────┐ │   ║
║  │  │ AI SCORING   │  │ LEARNING ENGINE           │ │   ║
║  │  │ (Claude API) │←→│ (Pattern Recognition)     │ │   ║
║  │  │              │  │ (Weight Adjustment)        │ │   ║
║  │  │ Score 0-100  │  │ (Personalization)         │ │   ║
║  │  └──────────────┘  └───────────────────────────┘ │   ║
║  └──────────────────────┬───────────────────────────┘   ║
║                         ▼                               ║
║  ┌──────────────────────────────────────────────────┐   ║
║  │              OUTPUT MODULE                        │   ║
║  │  • Web Dashboard (Top Picks + Details)           │   ║
║  │  • Google Sheet Export                           │   ║
║  │  • Weekly AI Insights Report                     │   ║
║  └──────────────────────────────────────────────────┘   ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

### 3.2 Data Flow Chi Tiết

```
DAILY FLOW (5 phút):
FastMoss CSV ──┐
               ├→ Upload → Auto-detect → Normalize → Dedup → AI Score → Top 10
KaloData CSV ──┘

WEEKLY FLOW (5 phút):
FB Ads CSV ────────┐
TikTok Ads CSV ────┤
Shopee Export ─────┤→ Upload → Auto-detect → Map to SP → Save → Trigger Learning
TikTok Stats ──────┤
Reels/Shorts ──────┘

WEEKLY AUTO:
All Feedback Data → AI Analyze → Find Patterns → Update Weights → Generate Insights
```

---

## 4. AI SCORING ENGINE

### 4.1 Scoring Formula V1 (Khởi Điểm)

```
TOTAL SCORE (0-100) = 
    Commission Score     × 0.20  (20 điểm tối đa)
  + Trending Score       × 0.20  (20 điểm tối đa)
  + Competition Score    × 0.20  (20 điểm tối đa)
  + Content Fit Score    × 0.15  (15 điểm tối đa)
  + Price Score          × 0.15  (15 điểm tối đa)
  + Platform Score       × 0.10  (10 điểm tối đa)
```

#### Tiêu chí 1: Commission Score (20%)

| Commission Rate | Điểm | Lý do |
|----------------|-------|-------|
| >= 15% | 100 | Xuất sắc |
| 10 - 14.9% | 80 | Rất tốt |
| 7 - 9.9% | 60 | Tốt |
| 4 - 6.9% | 40 | Trung bình |
| 1 - 3.9% | 20 | Thấp |
| < 1% | 0 | Quá thấp |

**Bonus:** Commission VND (= rate × giá) nằm trong 30K-80K → +10 điểm

#### Tiêu chí 2: Trending Score (20%)

| Growth Rate (7 ngày) | Điểm | Lý do |
|----------------------|-------|-------|
| > 500% | 80 | Quá mới, rủi ro spike |
| 200 - 500% | 100 | Sweet spot — đang bùng |
| 100 - 199% | 80 | Tốt, đang lên |
| 50 - 99% | 60 | Ổn định tăng |
| 10 - 49% | 40 | Tăng chậm |
| 0 - 9% | 20 | Phẳng |
| Âm | 0 | Đang giảm |

#### Tiêu chí 3: Competition Score (20%)

| Số Affiliates Đang Push | Điểm | Lý do |
|-------------------------|-------|-------|
| 0 - 5 | 100 | Blue ocean |
| 6 - 15 | 80 | Ít cạnh tranh |
| 16 - 30 | 60 | Trung bình |
| 31 - 60 | 40 | Đông |
| 61 - 100 | 20 | Rất đông |
| 100+ | 0 | Bão hòa |

#### Tiêu chí 4: Content Fit Score (15%)

AI đánh giá dựa trên product attributes:
- Có thể demo/unbox trên video? (visual appeal)
- Có "before/after" effect? (transformation)
- Có story/angle thú vị để kể?
- Category có đang hot trên social media?

Scoring: AI tự đánh giá 0-100 dựa trên analysis

#### Tiêu chí 5: Price Score (15%)

| Giá (VND) | Điểm | Lý do |
|-----------|-------|-------|
| 150K - 500K | 100 | Sweet spot impulse buy VN |
| 500K - 1 triệu | 70 | Cần cân nhắc |
| 50K - 149K | 60 | Commission tuyệt đối thấp |
| 1 triệu - 2 triệu | 40 | Cần content mạnh |
| < 50K hoặc > 2 triệu | 20 | Khó convert affiliate |

#### Tiêu chí 6: Platform Advantage Score (10%)

- SP có trên cả Shopee + TikTok Shop + chênh lệch commission rõ → 100 điểm
- Có trên 1 platform, commission tốt → 70 điểm
- Không rõ platform advantage → 50 điểm

### 4.2 Personalized Scoring (Sau 30+ data points)

```
PERSONALIZED SCORE = 
    Base Score (V1)            × 0.50  (50%)
  + Historical Match Score     × 0.30  (30%)
  + Content Type Match         × 0.10  (10%)
  + Audience Match             × 0.10  (10%)
```

**Historical Match Score (30%):**
- AI so sánh SP mới với SP đã thành công trong quá khứ
- Cùng category? Cùng price range? Cùng commission range?
- Match pattern thành công → score cao
- Match pattern thất bại → score thấp

**Content Type Match (10%):**
- Từ feedback data, AI biết user làm video dạng nào convert tốt
- SP phù hợp content type mạnh nhất của user → score cao

**Audience Match (10%):**
- Từ ads demographic data, AI biết audience của user
- SP phù hợp audience → score cao

### 4.3 Weight Auto-Adjustment

Mỗi 2 tuần (hoặc mỗi 50 feedback data points):

```
1. Phân tích: Tiêu chí nào dự đoán đúng nhất kết quả thật?
2. Tăng trọng số tiêu chí dự đoán đúng
3. Giảm trọng số tiêu chí dự đoán sai
4. Lưu lịch sử thay đổi

Ví dụ:
Ban đầu:     Commission 20% | Trending 20% | Competition 20%
Sau tháng 2: Commission 15% | Trending 25% | Competition 25%
Lý do: Data cho thấy Trending và Competition predict tốt hơn
```

---

## 5. LEARNING ENGINE

### 5.1 Data Thu Thập Từ Feedback

**Từ quảng cáo (FB Ads, TikTok Ads):**

| Data Field | AI Học Được |
|-----------|------------|
| CPC (Cost per Click) | SP nào thu hút click giá rẻ |
| Cost per Conversion | SP nào chuyển đổi hiệu quả |
| ROAS | SP nào chạy ads có lãi |
| CTR | Thumbnail/hook nào hoạt động |
| Audience demographics | Nhóm tuổi/giới tính mua SP gì |
| Placement | Feed vs Reels vs Story cho SP nào |

**Từ organic (TikTok, Shopee Video, Reels, Shorts, Zalo):**

| Data Field | AI Học Được |
|-----------|------------|
| Views | SP nào tạo reach cao |
| Engagement | SP nào audience quan tâm |
| Watch time | SP nào giữ người xem |
| Link clicks | SP nào drive traffic |
| Orders (Shopee) | Chuyển đổi thật |
| Platform comparison | Cùng SP → platform nào tốt hơn |

### 5.2 Quy Trình Học (Hàng Tuần)

```
Bước 1: COLLECT
  Thu thập feedback data → Map với SP đã recommend

Bước 2: ANALYZE (Claude API)
  Input: Toàn bộ {SP attributes} + {actual performance}
  Output: Patterns, correlations, insights

Bước 3: CALIBRATE
  "SP score cao + perform tốt"    → Công thức đúng ✅
  "SP score cao + perform dở"     → Yếu tố nào sai? Điều chỉnh
  "SP score thấp + perform tốt"   → Đang miss yếu tố gì? Bổ sung
  "SP score thấp + perform dở"    → Công thức đúng ✅

Bước 4: UPDATE
  Điều chỉnh weights + patterns + thresholds

Bước 5: REPORT
  Xuất Weekly AI Report: accuracy, patterns mới, strategy suggest
```

### 5.3 Ví Dụ Pattern AI Phát Hiện

Sau 1-2 tháng data:

```
Pattern 1 — Price vs Platform:
"SP giá 200-400K: organic TikTok convert tốt nhất.
 SP giá 500K+: cần FB Ads retargeting."

Pattern 2 — Content Type vs Category:
"SP Beauty: video ngắn < 30s tốt hơn.
 SP Tech/Gadget: video review 2-3 phút convert 3x."

Pattern 3 — Timing:
"SP trending 3-7 ngày → đăng organic.
 SP trending > 14 ngày → chỉ chạy ads mới hiệu quả."

Pattern 4 — Cross-platform:
"Category Health: ROAS TikTok Ads 4.2x > FB Ads 2.1x.
 → Ưu tiên budget TikTok Ads cho Health."

Pattern 5 — Audience:
"Nữ 25-34 = 60% conversion.
 → Ưu tiên SP phù hợp nhóm này."
```

### 5.4 Evolution Của AI Output Theo Thời Gian

**Tuần 1 (chưa có feedback):**
> "#1: Neck Massager — 85/100. Commission cao 12%, trending +340%, competition thấp."

**Tháng 2 (50+ data points):**
> "#1: Neck Massager — 92/100. Commission 12%, trending mạnh. **SP category Health giá 300-500K convert 3.2x tốt hơn average trên channel của bạn.** Recommend: video TikTok review 60s, đăng 7-9PM."

**Tháng 6 (300+ data points):**
> "#1: Neck Massager Pro — 96/100. Match 5/5 winning patterns. **SP tương tự bạn đã bán 340 đơn tháng trước.** Suggest: tái sử dụng hook từ video #47 (450K views, conversion 4.8%). Budget: 500K TikTok Ads, expected 120 đơn, ROAS ~3.5x."

---

## 6. DATA SPECIFICATIONS

### 6.1 Normalized Product Schema

```typescript
interface NormalizedProduct {
  // Identity
  id: string;                    // Auto-generated
  name: string;                  // Tên SP
  url: string;                   // Link SP
  category: string;              // Ngành hàng
  
  // Pricing
  price: number;                 // Giá (VND)
  commissionRate: number;        // % hoa hồng
  commissionVND: number;         // = price × rate
  
  // Platform
  platform: 'shopee' | 'tiktok_shop' | 'both';
  shopeeLink?: string;
  tiktokShopLink?: string;
  shopeeCommission?: number;     // % trên Shopee
  tiktokCommission?: number;     // % trên TikTok
  
  // Trending
  salesTotal: number;            // Tổng bán
  salesGrowth7d: number;         // % tăng 7 ngày
  salesGrowth30d: number;        // % tăng 30 ngày
  revenue7d: number;
  revenue30d: number;
  
  // Competition
  affiliateCount: number;        // Số affiliates
  creatorCount: number;          // Số creators
  topVideoViews: number;         // Views video top
  
  // Shop
  shopName: string;
  shopRating: number;
  
  // Source
  source: 'fastmoss' | 'kalodata' | 'both';
  dataDate: string;              // Ngày data
}
```

### 6.2 Feedback Schema

```typescript
interface ProductFeedback {
  // Map to product
  productId: string;
  productName: string;
  aiScoreAtSelection: number;    // Điểm AI lúc chọn
  
  // Ads Performance
  adsData?: {
    platform: 'fb_ads' | 'tiktok_ads';
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    conversions: number;
    costPerConversion: number;
    roas: number;
    spend: number;
  }[];
  
  // Organic Performance
  organicData?: {
    platform: string;            // tiktok, shopee_video, reels, shorts, zalo
    views: number;
    likes: number;
    comments: number;
    shares: number;
    watchTimeAvg: number;
    linkClicks: number;
    videoType: string;           // review, unbox, comparison, short, livestream
    videoDuration: number;       // giây
    postDate: string;
    postTime: string;
  }[];
  
  // Sales
  salesData?: {
    platform: string;
    orders: number;
    revenue: number;
    commissionEarned: number;
    conversionRate: number;
  };
  
  // Overall
  overallSuccess: 'high' | 'medium' | 'low' | 'fail';
  feedbackDate: string;
}
```

### 6.3 Learning Log Schema

```typescript
interface LearningLog {
  weekNumber: number;
  runDate: string;
  
  // Stats
  totalDataPoints: number;
  newDataPoints: number;
  
  // Accuracy
  currentAccuracy: number;       // %
  previousAccuracy: number;      // %
  
  // Changes
  weightsBefore: Record<string, number>;
  weightsAfter: Record<string, number>;
  
  // Discoveries
  patternsFound: string[];
  insights: string;
  scoringVersion: string;
}
```

---

## 7. UI SPECIFICATIONS

### 7.1 Dashboard Chính

```
┌──────────────────────────────────────────────────────────┐
│  🎯 AffiliateScorer                    [Upload] [Kết quả]│
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Hôm nay 23/02/2026        AI Accuracy: 78% (+3% ↑)    │
│                                                          │
│  🏆 TOP PICKS HÔM NAY                                  │
│  ┌────┬───────┬──────────────┬────────┬───────┬────────┐│
│  │ #  │ Score │ Sản phẩm     │  Giá   │ Comm  │Platform││
│  ├────┼───────┼──────────────┼────────┼───────┼────────┤│
│  │ 1  │🔥 94 │Neck Massager │ 389K   │12%/47K│TikTok ▲││
│  │ 2  │🔥 91 │Serum HA Plus │ 245K   │15%/37K│Shopee ▲││
│  │ 3  │🔥 88 │Máy xay mini  │ 299K   │10%/30K│Both    ││
│  │ 4  │   85 │Tai nghe BT   │ 459K   │ 8%/37K│TikTok  ││
│  │ 5  │   83 │Kem chống nắng│ 189K   │14%/26K│Shopee  ││
│  │... │  ... │ ...          │  ...   │  ...  │  ...   ││
│  └────┴───────┴──────────────┴────────┴───────┴────────┘│
│                                                          │
│  💡 AI INSIGHTS TUẦN NÀY                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │ • Health & Beauty: trending mạnh (+45% vs tuần   │   │
│  │   trước). Recommend tăng tỷ trọng.              │   │
│  │ • SP giá 200-400K: convert rate 4.2% (cao nhất  │   │
│  │   trong tất cả price ranges của bạn)             │   │
│  │ • TikTok organic đang outperform FB Ads cho      │   │
│  │   category Beauty (ROAS 4.1x vs 2.3x)           │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  📈 ACCURACY TREND                                      │
│  W1:60% → W4:72% → W8:78%                              │
│  ████████████████████░░░░░ 78%                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 7.2 Chi Tiết Sản Phẩm

```
┌──────────────────────────────────────────────────────────┐
│  ← Back    Neck Massager Pro v2           Score: 94/100  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  📊 SCORE BREAKDOWN                                     │
│  Commission:  ████████████████████ 18/20  (12%)         │
│  Trending:    ████████████████████ 20/20  (+340%)       │
│  Competition: ████████████████░░░░ 16/20  (12 affiliates)│
│  Content Fit: ████████████████████ 15/15                │
│  Price:       ████████████████████ 15/15  (389K)        │
│  Platform:    ████████████████████ 10/10                │
│                                                          │
│  🎯 KHUYẾN NGHỊ                                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Platform tốt nhất: TikTok Shop (12% vs Shopee 8%)│  │
│  │ Dạng video: Review 60-90s                        │   │
│  │ Thời gian đăng: 19:00-21:00                      │   │
│  │ Ads: TikTok Ads, budget 300-500K                 │   │
│  │ Expected ROAS: 3.5x (dựa trên SP tương tự)      │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  📈 SẢN PHẨM TƯƠNG TỰ ĐÃ LÀM                        │
│  • Neck Massager v1: 47 đơn, ROAS 4.2x ✅             │
│  • Eye Massager: 12 đơn, ROAS 1.8x ⚠️                │
│  → Pattern: "Health gadget 300-500K" = strong performer  │
│                                                          │
│  🔗 [Mở TikTok Shop] [Mở Shopee] [FastMoss] [KaloData]│
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 7.3 Upload Page

```
┌──────────────────────────────────────────────────────────┐
│  📤 Upload Data                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─ NGHIÊN CỨU SP ─────────────────────────────────┐   │
│  │                                                   │   │
│  │     ┌─────────────────────────────────┐          │   │
│  │     │                                 │          │   │
│  │     │   Kéo thả file CSV/Excel vào    │          │   │
│  │     │   (FastMoss hoặc KaloData)      │          │   │
│  │     │                                 │          │   │
│  │     └─────────────────────────────────┘          │   │
│  │                                                   │   │
│  │  ✅ fastmoss_export_20260223.csv (127 sản phẩm) │   │
│  │  ✅ kalodata_trending_20260223.xlsx (89 sản phẩm)│   │
│  │                                                   │   │
│  │  [🔍 Phân Tích Ngay]                             │   │
│  └───────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─ KẾT QUẢ THẬT ──────────────────────────────────┐   │
│  │                                                   │   │
│  │     ┌─────────────────────────────────┐          │   │
│  │     │                                 │          │   │
│  │     │   Kéo thả file kết quả vào      │          │   │
│  │     │   (FB Ads, TikTok Ads, Shopee)  │          │   │
│  │     │                                 │          │   │
│  │     └─────────────────────────────────┘          │   │
│  │                                                   │   │
│  │  ✅ fb_ads_report_w8.csv → Auto-detected: FB Ads │   │
│  │  ✅ tiktok_analytics.csv → Auto-detected: TikTok │   │
│  │                                                   │   │
│  │  [💾 Lưu Kết Quả]                                │   │
│  └───────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 8. TECHNICAL SPECIFICATIONS

### 8.1 Tech Stack

| Layer | Technology | Lý do |
|-------|-----------|-------|
| Frontend | Next.js 15 + TypeScript | SSR, dễ deploy Vercel |
| UI | Tailwind CSS + shadcn/ui | Đẹp, nhanh build |
| Backend | Next.js API Routes | Đủ cho app cá nhân |
| AI | Claude Haiku 4.5 API | $1/$5 per 1M tokens, đủ thông minh |
| Database | SQLite (Prisma ORM) | Đơn giản, miễn phí, local |
| File Parse | Papa Parse + SheetJS | CSV + Excel processing |
| Charts | Recharts | Biểu đồ trong dashboard |
| Export | Google Sheets API | Backup + tracking dài hạn |
| Hosting | Vercel Free | Deploy 1 click |

### 8.2 Claude API Usage

**Model:** Claude Haiku 4.5 (`claude-haiku-4-5-20251001`)

| Task | Frequency | ~Tokens | ~Cost/lần |
|------|-----------|---------|----------|
| Scoring 100 SP | Hàng ngày | 25K | $0.065 |
| Learning analysis | Hàng tuần | 45K | $0.105 |
| Content recommend ×10 | Hàng ngày | 13K | $0.045 |
| **Total/tháng** | | | **$4-6** |

Với Batch API (giảm 50%): **~$2-3/tháng**

### 8.3 Prompt Templates

**Prompt 1 — SCORING:**
```
System: Bạn là AI chuyên phân tích sản phẩm affiliate cho thị trường Việt Nam.

Input: 
- Danh sách [N] sản phẩm (JSON)
- Scoring formula với weights
- Historical patterns (nếu có)

Task: Chấm điểm 0-100 cho mỗi sản phẩm theo formula. 
Cho mỗi SP, trả về:
1. Score tổng + breakdown từng tiêu chí
2. Lý do ngắn gọn (1-2 câu)
3. Content suggestion
4. Platform recommendation

Output format: JSON array
```

**Prompt 2 — LEARNING:**
```
System: Phân tích kết quả affiliate marketing và tìm patterns.

Input:
- Danh sách SP đã recommend + AI score lúc đó
- Kết quả thật: ads metrics + organic metrics + sales
- Current scoring weights

Task:
1. SP nào score cao + perform tốt? (validate formula)
2. SP nào score cao + perform dở? (tìm lỗi formula)
3. SP nào score thấp + perform tốt? (tìm missing factor)
4. Patterns mới phát hiện
5. Đề xuất weight adjustment
6. Insights cho tuần tới

Output format: JSON với sections
```

**Prompt 3 — CONTENT RECOMMEND:**
```
System: Đề xuất chiến lược content cho sản phẩm affiliate.

Input:
- SP details (giá, category, features)
- User's historical performance by content type
- User's audience demographics
- Platform performance data

Task: Đề xuất:
1. Dạng video phù hợp nhất (review, unbox, so sánh...)
2. Độ dài video tối ưu
3. Thời gian đăng tốt nhất
4. Platform ưu tiên
5. Ads budget suggest + expected ROAS
6. Hook/angle gợi ý

Output format: JSON
```

### 8.4 Database Schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Product {
  id                String   @id @default(cuid())
  name              String
  url               String?
  category          String
  price             Float
  commissionRate    Float
  commissionVND     Float
  platform          String
  
  // Trending
  salesTotal        Int?
  salesGrowth7d     Float?
  salesGrowth30d    Float?
  revenue7d         Float?
  revenue30d        Float?
  
  // Competition
  affiliateCount    Int?
  creatorCount      Int?
  topVideoViews     Int?
  
  // Shop
  shopName          String?
  shopRating        Float?
  
  // AI Scoring
  aiScore           Float?
  aiRank            Int?
  scoreBreakdown    String?  // JSON
  scoringVersion    String?
  contentSuggestion String?
  platformAdvice    String?
  
  // Source
  source            String
  importBatchId     String
  dataDate          DateTime
  createdAt         DateTime @default(now())
  
  feedbacks         Feedback[]
  
  @@index([category])
  @@index([aiScore])
  @@index([dataDate])
}

model Feedback {
  id                   String   @id @default(cuid())
  productId            String
  product              Product  @relation(fields: [productId], references: [id])
  aiScoreAtSelection   Float
  
  // Ads
  adPlatform           String?
  adImpressions        Int?
  adClicks             Int?
  adCTR                Float?
  adCPC                Float?
  adConversions        Int?
  adCostPerConv        Float?
  adROAS               Float?
  adSpend              Float?
  
  // Organic
  orgPlatform          String?
  orgViews             Int?
  orgLikes             Int?
  orgComments          Int?
  orgShares            Int?
  orgWatchTimeAvg      Float?
  orgLinkClicks        Int?
  
  // Content
  videoType            String?
  videoDuration        Int?
  postDate             DateTime?
  postTime             String?
  
  // Sales
  salesPlatform        String?
  orders               Int?
  revenue              Float?
  commissionEarned     Float?
  conversionRate       Float?
  
  // Overall
  overallSuccess       String
  feedbackDate         DateTime @default(now())
  notes                String?
  
  @@index([productId])
  @@index([overallSuccess])
  @@index([feedbackDate])
}

model LearningLog {
  id                String   @id @default(cuid())
  weekNumber        Int
  runDate           DateTime @default(now())
  totalDataPoints   Int
  newDataPoints     Int
  currentAccuracy   Float
  previousAccuracy  Float
  weightsBefore     String   // JSON
  weightsAfter      String   // JSON
  patternsFound     String   // JSON
  insights          String
  scoringVersion    String
  
  @@index([weekNumber])
}

model ImportBatch {
  id          String   @id @default(cuid())
  source      String
  fileName    String
  recordCount Int
  importDate  DateTime @default(now())
}
```

### 8.5 API Endpoints

```
POST /api/upload/products       Upload CSV FastMoss/KaloData
POST /api/upload/feedback       Upload CSV kết quả thật
POST /api/score                 Trigger AI scoring
GET  /api/products/top          Top picks hôm nay
GET  /api/products/[id]         Chi tiết SP + breakdown
GET  /api/insights              AI insights + accuracy
POST /api/learning/trigger      Manual trigger learning
GET  /api/learning/history      Lịch sử AI learning
GET  /api/export/sheet          Export Google Sheet
```

### 8.6 Folder Structure

```
affiliate-scorer/
├── app/
│   ├── page.tsx                    # Dashboard
│   ├── layout.tsx
│   ├── upload/page.tsx             # Upload data
│   ├── products/[id]/page.tsx      # Chi tiết SP
│   ├── insights/page.tsx           # AI insights
│   ├── feedback/page.tsx           # Xem feedback
│   └── api/
│       ├── upload/
│       │   ├── products/route.ts
│       │   └── feedback/route.ts
│       ├── score/route.ts
│       ├── products/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── insights/route.ts
│       ├── learning/
│       │   ├── trigger/route.ts
│       │   └── history/route.ts
│       └── export/sheet/route.ts
├── components/
│   ├── ui/                         # shadcn
│   ├── upload/
│   │   ├── FileDropzone.tsx
│   │   └── UploadProgress.tsx
│   ├── products/
│   │   ├── ProductTable.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ScoreBreakdown.tsx
│   │   └── ContentSuggestion.tsx
│   ├── insights/
│   │   ├── AccuracyChart.tsx
│   │   ├── PatternList.tsx
│   │   └── WeeklyReport.tsx
│   └── feedback/
│       ├── FeedbackTable.tsx
│       └── FeedbackUpload.tsx
├── lib/
│   ├── ai/
│   │   ├── scoring.ts
│   │   ├── learning.ts
│   │   ├── prompts.ts
│   │   └── claude.ts
│   ├── parsers/
│   │   ├── fastmoss.ts
│   │   ├── kalodata.ts
│   │   ├── fb-ads.ts
│   │   ├── tiktok-ads.ts
│   │   ├── shopee-affiliate.ts
│   │   └── detect-format.ts
│   ├── scoring/
│   │   ├── formula.ts
│   │   ├── weights.ts
│   │   └── personalize.ts
│   ├── db/index.ts
│   └── utils/
│       ├── normalize.ts
│       ├── dedup.ts
│       └── format.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── .env.example
└── README.md
```

---

## 9. USER FLOWS

### Flow 1: Upload & Score (Hàng ngày, ~5 phút)

```
1. Mở app
2. Click "Upload" → Kéo thả CSV (FastMoss + KaloData)
3. App auto-detect format → "Nhận 127 SP từ FastMoss, 89 SP từ KaloData"
4. Click "Phân Tích" → Loading 15-30s
5. Dashboard hiện Top 10 với scores + lý do
6. Click SP → Chi tiết + content suggestion
7. Chọn SP → Làm content
```

### Flow 2: Upload Feedback (1-2 lần/tuần, ~5 phút)

```
1. Export data từ FB Ads / TikTok Ads / Shopee
2. Click "Upload Kết Quả" → Kéo thả files
3. App auto-detect nguồn (FB? TikTok? Shopee?)
4. App auto-map với SP đã recommend
5. Review mapping → Sửa nếu sai
6. Click "Lưu" → AI bắt đầu phân tích
```

### Flow 3: Xem Insights (Hàng tuần)

```
1. Mở tab "Insights"
2. Xem Accuracy trend
3. Xem Patterns mới
4. Xem AI weight changes + lý do
5. Xem Strategy recommend cho tuần tới
```

---

## 10. COST BREAKDOWN

| Hạng mục | Chi phí/tháng | Ghi chú |
|----------|---------------|---------|
| Claude Haiku 4.5 API | $3-6 | Scoring + Learning |
| Vercel Hosting | $0 | Free tier |
| SQLite Database | $0 | Local file |
| Google Sheets API | $0 | Free tier |
| **TOTAL** | **$3-6/tháng** | ✅ Trong budget |

---

## 11. IMPLEMENTATION ROADMAP

### Phase 1: MVP Core (Tuần 1-2)
- [ ] Project setup (Next.js + Prisma + SQLite)
- [ ] CSV parser (FastMoss + KaloData)
- [ ] Upload UI (drag & drop)
- [ ] AI Scoring Engine V1 (fixed formula)
- [ ] Dashboard Top 10
- [ ] SP detail + score breakdown

### Phase 2: Feedback Loop (Tuần 3-4)
- [ ] Feedback upload (FB Ads, TikTok Ads, Shopee)
- [ ] Auto-detect format
- [ ] Auto-map feedback → SP
- [ ] Feedback database + history
- [ ] Basic AI Learning (weekly)

### Phase 3: Personalization (Tuần 5-6)
- [ ] Personalized scoring
- [ ] Weight auto-adjustment
- [ ] Historical pattern matching
- [ ] Content recommendation
- [ ] Audience match scoring

### Phase 4: Polish (Tuần 7-8)
- [ ] Weekly AI Report
- [ ] Accuracy dashboard
- [ ] Google Sheet export
- [ ] Pattern visualization
- [ ] Mobile responsive
- [ ] Performance optimization

---

## 12. ACCEPTANCE CRITERIA

MVP hoàn thành khi:
- [ ] Upload FastMoss CSV → Parse + hiển thị OK
- [ ] Upload KaloData CSV → Parse + hiển thị OK
- [ ] AI scoring 100 SP < 30 giây
- [ ] Top 10 hiển thị đúng với score + lý do
- [ ] Chi tiết SP có breakdown + content suggest
- [ ] Upload FB Ads CSV → Map với SP OK
- [ ] Upload TikTok Ads CSV → Map với SP OK
- [ ] AI Learning → Output patterns + weights
- [ ] Accuracy tracking hiển thị đúng
- [ ] Google Sheet export OK
- [ ] UI tiếng Việt + mobile responsive

---

## 13. RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|------------|
| FastMoss/KaloData đổi format export | Cao | Parser linh hoạt + auto-detect columns |
| Claude API giá tăng | Trung bình | Dùng Haiku (rẻ nhất), switch model nếu cần |
| Feedback data không đủ | Cao | Commit upload đều đặn, fallback formula cố định |
| SP mapping sai | Trung bình | Fuzzy matching + manual override |
| AI accuracy không tăng | Trung bình | Thử nghiệm prompt, điều chỉnh features |

---

**END OF PRD v1.0**

**Ready for Development**
**Estimated: 6-8 tuần | Cost: $3-6/tháng**
