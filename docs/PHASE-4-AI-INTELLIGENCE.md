# PHASE 4: AI INTELLIGENCE

> Tham chiếu: ROADMAP-FINAL.md
> Goal: AI đề xuất hành động cụ thể, có thứ tự ưu tiên, dựa trên TẤT CẢ data.
> Phụ thuộc: Phase 2 + Phase 3 (cần data từ campaigns, notes, financial, calendar).
> Nguyên tắc: AI hoạt động từ Level 0 (chỉ FastMoss), thông minh dần khi có thêm data.

---

## THỨ TỰ THỰC HIỆN

```
1. Confidence Level system — đo lượng data hiện có
2. Win Probability Score — thay thế AI Score đơn thuần
3. Product Lifecycle tracking — rising/hot/peak/declining
4. Win/Loss Analysis — auto khi campaign completed
5. Pattern Library (Playbook) — tích lũy từ win/loss
6. Channel + Content recommendation
7. Budget Portfolio allocation
8. Competitive Intelligence (KOL tracker, market trends)
9. Anomaly Detection + Alerts
10. Morning Brief V2 — đầy đủ 5 câu hỏi
11. Weekly Auto-Report
12. Goal tracking nâng cao + Trend prediction
13. Personal Score = Base Score + adjustments
```

---

## 1. CONFIDENCE LEVEL SYSTEM

### Đo lượng data user đã cung cấp:

```typescript
interface ConfidenceMetrics {
  productsCount: number;        // Từ FastMoss/KaloData uploads
  productsWithNotes: number;    // Có ghi chú cá nhân
  campaignsTotal: number;       // Tổng campaigns
  campaignsCompleted: number;   // Đã hoàn thành (có verdict)
  financialRecords: number;     // Thu chi
  contentPosts: number;         // Content đã làm
  shopsRated: number;           // Shop đã đánh giá
  daysActive: number;           // Ngày kể từ lần đầu dùng app
  uploadsCount: number;         // Số lần upload data
}

function calculateConfidence(m: ConfidenceMetrics): ConfidenceLevel {
  const score = 
    Math.min(m.productsCount / 50, 1) * 10 +           // Max 10
    Math.min(m.productsWithNotes / 10, 1) * 10 +       // Max 10
    Math.min(m.campaignsCompleted / 5, 1) * 25 +       // Max 25 — QUAN TRỌNG NHẤT
    Math.min(m.financialRecords / 20, 1) * 15 +        // Max 15
    Math.min(m.contentPosts / 5, 1) * 10 +             // Max 10
    Math.min(m.shopsRated / 5, 1) * 5 +                // Max 5
    Math.min(m.daysActive / 30, 1) * 15 +              // Max 15
    Math.min(m.uploadsCount / 10, 1) * 10;             // Max 10
  // Total max: 100

  if (score < 15) return { level: 0, label: "Cơ bản", percent: score };
  if (score < 30) return { level: 1, label: "Sơ khởi", percent: score };
  if (score < 55) return { level: 2, label: "Trung bình", percent: score };
  if (score < 75) return { level: 3, label: "Cao", percent: score };
  return { level: 4, label: "Chuyên gia", percent: score };
}
```

### Mỗi level AI làm gì:

| Level | Campaigns | AI capabilities |
|---|---|---|
| 0 — Cơ bản | 0 | Score SP theo market data. Gợi ý chung. |
| 1 — Sơ khởi | 1-2 | Bắt đầu thấy category preference. |
| 2 — Trung bình | 3-5 | Win Probability, sweet spot giá, content style. |
| 3 — Cao | 6-10 | Budget allocation, anomaly, prediction. |
| 4 — Chuyên gia | 11+ | Full playbook, auto-report, goal tracking. |

### Hiện trên Insights → tab Learning:

```
🧠 AI Confidence: Level 2 — Trung bình (47/100)

████████████████████░░░░░░░░░░░░ 47%

Để lên Level 3 (Cao), cần thêm:
├── ☑ Products: 367/50 ✅
├── ☑ Ghi chú: 12/10 ✅
├── ☐ Campaigns hoàn thành: 3/5 (cần thêm 2)
├── ☐ Thu chi: 8/20 (cần thêm 12)
├── ☐ Content: 2/5 (cần thêm 3)
└── ☐ Ngày active: 15/30 (cần thêm 15 ngày)
```

---

## 2. WIN PROBABILITY SCORE

### Công thức:

```typescript
interface WinProbability {
  total: number;            // 0-100
  market: number;           // 0-40
  personalFit: number;      // 0-30
  timing: number;           // 0-15
  risk: number;             // 0-15 (giảm trừ)
  confidence: ConfidenceLevel;
  breakdown: WinBreakdown;
}

async function calculateWinProbability(
  product: Product,
  userProfile: UserProfile,
  confidenceLevel: number
): Promise<WinProbability> {
  
  // === MARKET (40 điểm) — luôn có, từ FastMoss data ===
  const market = calculateMarketScore(product);
  // - Commission rate vs average (0-10)
  // - Sales momentum: sales7d so với totalSales ratio (0-10)
  // - Price trong range phổ biến 100-500K (0-10)
  // - KOL competition: ít KOL = tốt hơn (0-10)
  
  // === PERSONAL FIT (30 điểm) — tăng dần theo data ===
  let personalFit = 0;
  
  if (confidenceLevel >= 1) {
    // Category match — user có campaign thành công trong category này?
    const categoryROAS = await getAvgROASByCategory(product.category, userId);
    if (categoryROAS > 2) personalFit += 10;
    else if (categoryROAS > 1) personalFit += 5;
    else if (categoryROAS > 0 && categoryROAS < 1) personalFit -= 5; // Penalty
  }
  
  if (confidenceLevel >= 2) {
    // Price range match — trong sweet spot CỦA USER?
    const sweetSpot = await getUserSweetSpot(userId);
    if (product.price >= sweetSpot.min && product.price <= sweetSpot.max) {
      personalFit += 8;
    }
    
    // Content style match — user có content type phù hợp?
    const bestContentType = await getUserBestContentType(userId);
    // SP có nhiều video = visual, phù hợp review
    // SP có nhiều livestream = cần livestream skill
    personalFit += calculateContentFit(product, bestContentType); // 0-7
  }
  
  if (confidenceLevel >= 3) {
    // Shop trust
    const shopRating = await getShopRating(product.shopName, userId);
    if (shopRating >= 4) personalFit += 5;
    else if (shopRating <= 2) personalFit -= 5;
  }
  
  // Normalize personalFit to 0-30
  personalFit = Math.max(0, Math.min(30, personalFit));
  
  // === TIMING (15 điểm) ===
  const timing = calculateTimingScore(product);
  // - Seasonal: sale sắp tới? (0-5)
  // - Lifecycle: rising > hot > peak > declining (0-5)
  // - Trend: sales tuần này vs tuần trước (0-5)
  
  // === RISK (0-15 điểm, trừ đi) ===
  const risk = calculateRiskScore(product);
  // - KOL spike (tăng đột biến): -5
  // - Shop unreliable: -5
  // - Category đang declining: -5
  
  const total = Math.max(0, Math.min(100, market + personalFit + timing - risk));
  
  return {
    total,
    market,
    personalFit,
    timing,
    risk,
    confidence: getConfidenceLevel(),
    breakdown: { /* chi tiết từng thành phần */ },
  };
}
```

### UI trên trang chi tiết SP:

```
┌─────────────────────────────────────────────────┐
│ 🎯 Win Probability: 78%                         │
│ ████████████████████████████░░░░ 78/100          │
│                                                  │
│ Breakdown:                                       │
│ 📊 Thị trường: 32/40 (commission tốt, ít KOL)  │
│ 👤 Phù hợp bạn: 24/30 (category mạnh, giá OK)  │
│ 📅 Timing: 12/15 (3.3 Sale + rising)            │
│ ⚠️ Rủi ro: -5/15 (shop chưa đánh giá)          │
│                                                  │
│ 💡 "SP phù hợp pattern win #1 của bạn:          │
│     Phụ kiện + 200-300K + TikTok. Nên thử."     │
│                                                  │
│ 🧠 AI Confidence: Level 2 (dựa trên 4 campaigns)│
└─────────────────────────────────────────────────┘
```

### Khi Level 0 (chưa có campaign):

```
🎯 Win Probability: 65% (ước tính)
Dựa trên: dữ liệu thị trường (FastMoss)
Chưa có dữ liệu cá nhân → độ chính xác trung bình.

💡 "Chạy campaign đầu tiên để AI học pattern của bạn."
```

---

## 3. PRODUCT LIFECYCLE TRACKING

### Tính từ ProductSnapshot (upload FastMoss thường xuyên):

```typescript
type LifecycleStage = "new" | "rising" | "hot" | "peak" | "declining" | "dead" | "unknown";

function getLifecycleStage(snapshots: ProductSnapshot[]): {
  stage: LifecycleStage;
  salesChange: number;
  kolChange: number;
  message: string;
} {
  if (snapshots.length < 2) return { stage: "unknown", salesChange: 0, kolChange: 0, message: "Cần thêm data" };
  
  // So sánh 2 snapshot gần nhất
  const latest = snapshots[0];
  const previous = snapshots[1];
  
  const salesChange = previous.sales7d > 0 
    ? (latest.sales7d - previous.sales7d) / previous.sales7d 
    : 0;
  const kolChange = previous.totalKOL > 0 
    ? (latest.totalKOL - previous.totalKOL) / previous.totalKOL 
    : 0;
  
  // Logic phân loại
  if (latest.totalSales < 1000) {
    return { stage: "new", salesChange, kolChange, message: "SP mới, chưa đủ data" };
  }
  
  if (salesChange > 0.5 && kolChange < 0.3) {
    return { stage: "rising", salesChange, kolChange, 
      message: "📈 Sales tăng mạnh, ít KOL → CỬA SỔ VÀNG" };
  }
  
  if (salesChange > 0.2 && kolChange > 0.5) {
    return { stage: "hot", salesChange, kolChange,
      message: "🔥 Hot nhưng KOL đổ xô → CẠNH TRANH CAO" };
  }
  
  if (salesChange > -0.1 && salesChange < 0.1) {
    return { stage: "peak", salesChange, kolChange,
      message: "⚡ Ổn định → có thể đã BÃO HÒA" };
  }
  
  if (salesChange < -0.2) {
    return { stage: "declining", salesChange, kolChange,
      message: "📉 Sales giảm → NÊN RÚT RA" };
  }
  
  if (salesChange < -0.5) {
    return { stage: "dead", salesChange, kolChange,
      message: "💀 Giảm mạnh → KHÔNG NÊN CHẠY" };
  }
  
  return { stage: "peak", salesChange, kolChange, message: "Ổn định" };
}
```

### UI trên trang chi tiết SP:

```
📈 Vòng đời: RISING ●────●────○────○────○
                     Mới  Rising  Hot  Peak  Giảm

Sales 7d: 4.9K (+312% vs lần upload trước)
KOL: 4 → 4 (không đổi) → ÍT CẠNH TRANH

💡 "SP đang tăng mạnh, ít KOL → nhảy vào trong 3-5 ngày."
```

---

## 4. WIN/LOSS ANALYSIS

### Trigger: Khi user đánh dấu campaign = "completed" + chọn verdict

```typescript
async function generateWinLossAnalysis(campaign: Campaign): Promise<WinLossAnalysis> {
  const product = await getProduct(campaign.productId);
  const userProfile = await getUserProfile(campaign.userId);
  
  const factors: AnalysisFactor[] = [];
  
  // 1. Category analysis
  const categoryROAS = await getAvgROASByCategory(product.category, campaign.userId);
  factors.push({
    factor: "Category",
    value: product.category,
    impact: categoryROAS > 2 ? "positive" : categoryROAS < 1 ? "negative" : "neutral",
    detail: `ROAS TB trong ${product.category}: ${categoryROAS.toFixed(1)}x`,
  });
  
  // 2. Price analysis
  const sweetSpot = await getUserSweetSpot(campaign.userId);
  const inSweetSpot = product.price >= sweetSpot.min && product.price <= sweetSpot.max;
  factors.push({
    factor: "Giá",
    value: formatVND(product.price),
    impact: inSweetSpot ? "positive" : "negative",
    detail: inSweetSpot 
      ? `Nằm trong sweet spot ${formatVND(sweetSpot.min)}-${formatVND(sweetSpot.max)}` 
      : `Ngoài sweet spot của bạn`,
  });
  
  // 3. Content analysis
  const contentPost = await getCampaignContent(campaign.id);
  if (contentPost) {
    const bestType = await getUserBestContentType(campaign.userId);
    factors.push({
      factor: "Content",
      value: `${contentPost.content_type} ${contentPost.duration || ''}`,
      impact: contentPost.content_type === bestType ? "positive" : "neutral",
      detail: `Format ${bestType} tốt nhất của bạn`,
    });
  }
  
  // 4. Platform analysis
  const platformROAS = await getAvgROASByPlatform(campaign.platform, campaign.userId);
  factors.push({
    factor: "Platform",
    value: campaign.platform,
    impact: platformROAS > 1.5 ? "positive" : platformROAS < 1 ? "negative" : "neutral",
    detail: `ROAS TB trên ${campaign.platform}: ${platformROAS.toFixed(1)}x`,
  });
  
  // 5. Competition
  factors.push({
    factor: "Cạnh tranh",
    value: `${product.totalKOL} KOL`,
    impact: product.totalKOL < 20 ? "positive" : product.totalKOL > 100 ? "negative" : "neutral",
    detail: product.totalKOL < 20 ? "Ít cạnh tranh" : "Nhiều cạnh tranh",
  });
  
  // 6. Timing
  const nearSale = await wasNearSaleEvent(campaign.started_at);
  if (nearSale) {
    factors.push({
      factor: "Timing",
      value: nearSale.name,
      impact: "positive",
      detail: `Chạy gần ${nearSale.name} → demand cao`,
    });
  }
  
  // Generate lessons
  const lessons = generateLessons(factors, campaign.verdict);
  
  // Find similar products
  const similarProducts = await findSimilarProducts(factors, campaign.userId);
  
  return {
    campaignId: campaign.id,
    verdict: campaign.verdict,
    roas: campaign.roas,
    profitLoss: campaign.profit_loss,
    factors,
    lessons,
    similarProductsCount: similarProducts.length,
    appliedTo: similarProducts.map(p => p.id),
  };
}
```

### UI khi campaign completed:

```
📊 Phân tích: Vòng tay bạc 925
Kết quả: LÃI +450K (ROAS 3.2x)

TẠI SAO WIN:
✅ Category Phụ kiện — ROAS TB: 2.8x (category mạnh)
✅ Giá 252K — trong sweet spot 150-280K
✅ Content Review 20s — format tốt nhất của bạn
✅ Chỉ 7 KOL → ít cạnh tranh
✅ Gần Valentine → demand cao

AI GHI NHỚ:
• Phụ kiện + 200-300K + Review ngắn = combo win
• TikTok organic cho SP ít KOL = hiệu quả

ÁP DỤNG CHO: 12 SP tương tự trong database
[Xem danh sách →]
```

---

## 5. PATTERN LIBRARY (PLAYBOOK)

### Tích lũy từ Win/Loss Analysis:

```typescript
interface WinPattern {
  id: string;
  label: string;                    // "Phụ kiện + 100-300K + TikTok organic"
  conditions: PatternCondition[];   // category, price range, platform, content type
  campaignIds: string[];            // Campaigns match pattern này
  winRate: number;                  // % campaigns lãi
  avgROAS: number;
  totalProfit: number;
  sampleSize: number;
  lastUpdated: Date;
}

// Auto-generate patterns từ completed campaigns
async function generatePatterns(userId: string): Promise<WinPattern[]> {
  const campaigns = await getCompletedCampaigns(userId);
  if (campaigns.length < 3) return []; // Cần ít nhất 3 campaigns
  
  const patterns: WinPattern[] = [];
  
  // Group by: category + price range + platform
  const groups = groupCampaignsBy(campaigns, ['category', 'priceRange', 'platform']);
  
  for (const [key, group] of groups) {
    if (group.length < 2) continue; // Cần ít nhất 2 campaigns trong 1 pattern
    
    const wins = group.filter(c => c.verdict === 'profitable');
    const winRate = wins.length / group.length;
    const avgROAS = average(group.map(c => c.roas));
    
    patterns.push({
      id: generateId(),
      label: key, // "Phụ kiện + 100-300K + TikTok"
      conditions: extractConditions(group),
      campaignIds: group.map(c => c.id),
      winRate,
      avgROAS,
      totalProfit: sum(group.map(c => c.profit_loss)),
      sampleSize: group.length,
      lastUpdated: new Date(),
    });
  }
  
  // Sort: win rate cao nhất trước
  return patterns.sort((a, b) => b.winRate - a.winRate);
}
```

### UI — Insights → tab Learning:

```
🧠 Playbook của bạn (từ 15 campaigns)

WINNING PATTERNS:
🏆 #1: Phụ kiện + 100-300K + TikTok organic
   Win rate: 4/5 (80%) | ROAS TB: 2.8x | Lãi: +1.2M
   
🏆 #2: Mỹ phẩm + <200K + Review 15s + FB Ads
   Win rate: 3/4 (75%) | ROAS TB: 2.1x | Lãi: +680K

LOSING PATTERNS:
❌ #1: Điện tử + >300K + FB Ads
   Loss rate: 3/3 (100%) | ROAS TB: 0.6x | Lỗ: -890K
   → TRÁNH category này trên FB

❌ #2: Bất kỳ SP + >500 KOL
   Loss rate: 4/5 (80%) | ROAS TB: 0.9x
   → Chỉ chạy SP có <50 KOL

INSIGHTS:
💡 Sweet spot giá: 150-280K
💡 Content tốt nhất: Review 15-30s
💡 Budget test tối ưu: 200K/ngày x 3 ngày
💡 Platform mạnh: TikTok organic > FB Ads
💡 Thời gian đăng: 19:00-21:00
```

### Lưu trữ:

```sql
CREATE TABLE user_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  label TEXT NOT NULL,
  pattern_type TEXT NOT NULL,          -- "winning" | "losing"
  conditions JSONB NOT NULL,           -- { category, priceRange, platform, contentType }
  campaign_ids JSONB DEFAULT '[]',
  
  win_rate DECIMAL(3,2),
  avg_roas DECIMAL(5,2),
  total_profit INTEGER,
  sample_size INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. CHANNEL + CONTENT RECOMMENDATION

### Gợi ý khi user xem SP hoặc tạo campaign:

```typescript
function recommendChannel(product: Product, userProfile: UserProfile): ChannelRec[] {
  const recs: ChannelRec[] = [];
  
  // TikTok Organic — SP visual, ít video, ít KOL
  if (product.totalVideos < 10 && product.totalKOL < 20) {
    recs.push({
      channel: "TikTok Organic",
      reason: `Chỉ ${product.totalVideos} video → bạn là người đầu tiên`,
      contentSuggestion: "Review/Unbox 15-30s",
      confidence: userProfile.tiktokROAS > 0 ? "dựa trên data" : "gợi ý chung",
    });
  }
  
  // FB Ads — giá cao, target rõ
  if (product.price > 200000 && userProfile.fbAdsROAS > 1.5) {
    recs.push({
      channel: "Facebook Ads",
      reason: `FB ROAS TB: ${userProfile.fbAdsROAS}x, giá ${formatVND(product.price)} phù hợp`,
      contentSuggestion: "Video review + landing page",
      budgetSuggestion: userProfile.avgDailyBudget || 200000,
      confidence: "dựa trên data",
    });
  }
  
  // Livestream — SP có nhiều livestream thành công
  if (product.totalLivestreams > 50) {
    recs.push({
      channel: "TikTok Livestream",
      reason: `${product.totalLivestreams} livestream đang bán → market accept format này`,
      confidence: "gợi ý chung",
    });
  }
  
  return recs;
}
```

### Content Performance (khi có data):

```
AI phân tích từ ContentPost:
├── Review 15-30s: TB 50K views, 3% conversion → ✅ BEST
├── Demo 60s: TB 12K views, 0.8% → ❌ WEAK
├── Livestream: TB 200 viewers, 5% conversion → ⚡ HIGH CONVERT

→ "Ưu tiên Review 15-30s. Tránh Demo > 45s."
```

---

## 7. BUDGET PORTFOLIO

### Gợi ý phân bổ budget hàng ngày (Level 3+):

```
💰 Phân bổ gợi ý — Budget: 1M/ngày

Campaign       │ Hiện tại │ ROAS  │ Gợi ý    │ Lý do
───────────────┼──────────┼───────┼──────────┼────────────
Vòng tay       │ 500K     │ 3.2x  │ → 600K   │ ROAS cao, scale
Serum C        │ 300K     │ 1.5x  │ = 300K   │ Giữ, theo dõi
Ốp iPhone      │ 200K     │ 0.7x  │ → 100K   │ Giảm, sắp pause

"Chuyển 100K từ Ốp iPhone → Vòng tay"
```

### Budget Rules (auto hoặc user tùy chỉnh):

```typescript
const DEFAULT_BUDGET_RULES = [
  { rule: "SP mới → test 150-200K/ngày x 3 ngày", auto: false },
  { rule: "ROAS > 2 sau 3 ngày → tăng gấp đôi", auto: true },
  { rule: "ROAS < 1 sau 3 ngày → giảm 50%", auto: false },
  { rule: "ROAS > 3 x 7 ngày → maximize (dồn budget)", auto: false },
  { rule: "Không quá 50% tổng vào 1 SP", auto: true },
];
```

---

## 8. COMPETITIVE INTELLIGENCE

### KOL Competition Tracker (từ FastMoss upload thường xuyên):

```typescript
// So sánh 2 lần upload gần nhất cho SP user đang chạy
async function getCompetitionAlerts(userId: string): Promise<CompAlert[]> {
  const activeCampaigns = await getActiveCampaigns(userId);
  const alerts: CompAlert[] = [];
  
  for (const campaign of activeCampaigns) {
    const snapshots = await getSnapshots(campaign.productId, { limit: 2 });
    if (snapshots.length < 2) continue;
    
    const kolChange = snapshots[0].totalKOL - snapshots[1].totalKOL;
    const kolChangePercent = snapshots[1].totalKOL > 0 
      ? kolChange / snapshots[1].totalKOL 
      : 0;
    
    if (kolChangePercent > 0.5) { // KOL tăng >50%
      alerts.push({
        type: "competition_spike",
        severity: "warning",
        campaign: campaign.name,
        product: campaign.productName,
        message: `KOL tăng từ ${snapshots[1].totalKOL} → ${snapshots[0].totalKOL} (+${(kolChangePercent*100).toFixed(0)}%)`,
        suggestion: "Content phải nổi bật hoặc chuẩn bị SP thay thế",
      });
    }
  }
  
  return alerts;
}
```

### Market Trends (từ nhiều lần upload):

```
Top categories đang tăng:
1. Chăm sóc sắc đẹp: +45% sales
2. Phụ kiện thời trang: +23% sales ← Category bạn giỏi!
3. Điện thoại phụ kiện: -12% sales

"Category Phụ kiện đang tăng → thời điểm tốt để scale."
```

---

## 9. ANOMALY DETECTION

### Chạy mỗi khi có data mới (daily result, upload, etc.):

```typescript
async function detectAnomalies(userId: string): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];
  const campaigns = await getActiveCampaigns(userId);
  
  for (const c of campaigns) {
    const results = c.daily_results;
    if (results.length < 3) continue;
    
    // ROAS giảm 3 ngày liên tiếp
    const last3 = results.slice(-3);
    if (last3.every((r, i) => i === 0 || r.roas < last3[i-1].roas)) {
      anomalies.push({
        type: "roas_declining",
        severity: "warning",
        campaign: c.name,
        message: `ROAS giảm 3 ngày: ${last3.map(r => r.roas.toFixed(1) + 'x').join(' → ')}`,
        suggestion: "Đổi creative hoặc mở rộng audience. Nếu tiếp tục → pause.",
      });
    }
    
    // Lỗ 3 ngày liên tiếp
    if (last3.every(r => r.spend > (r.revenue || 0))) {
      const totalLoss = last3.reduce((s, r) => s + r.spend - (r.revenue || 0), 0);
      anomalies.push({
        type: "consecutive_loss",
        severity: "urgent",
        campaign: c.name,
        message: `Lỗ ${formatVND(totalLoss)} trong 3 ngày liên tiếp`,
        suggestion: "PAUSE NGAY. Xem lại targeting và creative.",
      });
    }
    
    // Spend đột ngột tăng (so với budget dự kiến)
    const latestSpend = results[results.length - 1].spend;
    if (c.planned_budget_daily && latestSpend > c.planned_budget_daily * 1.5) {
      anomalies.push({
        type: "overspend",
        severity: "warning",
        campaign: c.name,
        message: `Chi ${formatVND(latestSpend)} vs budget ${formatVND(c.planned_budget_daily)}`,
        suggestion: "Kiểm tra ads manager, có thể bid quá cao.",
      });
    }
  }
  
  // Sales tụt từ FastMoss
  // (Competition alerts từ section 8)
  const compAlerts = await getCompetitionAlerts(userId);
  anomalies.push(...compAlerts.map(a => ({
    type: "competition",
    severity: a.severity,
    campaign: a.campaign,
    message: a.message,
    suggestion: a.suggestion,
  })));
  
  return anomalies.sort(severityOrder); // urgent → warning → info
}
```

---

## 10. MORNING BRIEF V2

### Nâng cấp Morning Brief (Phase 3A) thành đầy đủ 5 câu hỏi:

```typescript
async function generateMorningBriefV2(userId: string): Promise<MorningBrief> {
  const data = await gatherAllData(userId);
  const items: BriefItem[] = [];
  
  // ===== CÂU 1: SP NÀO NÊN CHẠY? =====
  if (data.newProducts.length > 0) { // Từ upload gần nhất
    const topNew = data.newProducts
      .sort((a, b) => b.winProbability - a.winProbability)
      .slice(0, 3);
    items.push({
      section: "discover",
      icon: "⚪",
      text: `${topNew.length} SP mới match pattern win`,
      detail: topNew.map(p => `${p.name} — Win ${p.winProbability}%`),
      action: { type: "link", href: "/products?sort=winProb&filter=new" },
    });
  }
  
  // ===== CÂU 2: CHẠY Ở ĐÂU? =====
  // (Gợi ý channel nằm trong trang chi tiết SP, không trong brief)
  
  // ===== CÂU 3: BAO NHIÊU TIỀN? =====
  if (data.activeCampaigns.length >= 2 && data.confidenceLevel >= 3) {
    items.push({
      section: "budget",
      icon: "💰",
      text: `Gợi ý phân bổ budget hôm nay`,
      detail: data.budgetSuggestion,
      action: { type: "link", href: "/insights?tab=campaigns" },
    });
  }
  
  // ===== CÂU 4: CẦN CHỈNH GÌ? =====
  // Urgent alerts
  for (const anomaly of data.anomalies.filter(a => a.severity === "urgent")) {
    items.push({
      section: "urgent",
      icon: "🔴",
      text: `${anomaly.campaign}: ${anomaly.message}`,
      suggestion: anomaly.suggestion,
      action: { type: "link", href: `/campaigns/${anomaly.campaignId}` },
    });
  }
  
  // Opportunities
  for (const c of data.activeCampaigns.filter(c => c.roas >= 2.5)) {
    items.push({
      section: "opportunity",
      icon: "🟢",
      text: `Tăng budget "${c.name}" — ROAS ${c.roas.toFixed(1)}x ổn định`,
      action: { type: "link", href: `/campaigns/${c.id}` },
    });
  }
  
  // Warning alerts
  for (const anomaly of data.anomalies.filter(a => a.severity === "warning")) {
    items.push({
      section: "warning",
      icon: "⚠️",
      text: `${anomaly.campaign}: ${anomaly.message}`,
    });
  }
  
  // ===== CÂU 5: ROUTINE =====
  // Nhập kết quả hôm qua
  for (const c of data.campaignsMissingYesterday) {
    items.push({
      section: "routine",
      icon: "🔵",
      text: `Nhập kết quả "${c.name}" hôm qua`,
      action: { type: "link", href: `/campaigns/${c.id}` },
    });
  }
  
  // Checklist due today
  for (const task of data.checklistDueToday) {
    items.push({
      section: "routine",
      icon: "📋",
      text: `"${task.campaignName}": ${task.label}`,
    });
  }
  
  // Sự kiện sắp tới
  for (const event of data.upcomingEvents) {
    items.push({
      section: "prepare",
      icon: "🟡",
      text: `${event.name} còn ${event.daysUntil} ngày`,
    });
  }
  
  // Summary
  const summary = {
    activeCampaigns: data.activeCampaigns.length,
    weekIncome: data.weekFinancial.income,
    weekExpense: data.weekFinancial.expense,
    weekProfit: data.weekFinancial.income - data.weekFinancial.expense,
    roasTrend: data.roasTrend, // "improving" | "stable" | "declining"
    goalProgress: data.goal ? data.goal.progress_percent : null,
  };
  
  return {
    date: new Date(),
    items: sortByPriority(items), // urgent → opportunity → prepare → routine → discover
    summary,
    confidenceLevel: data.confidenceLevel,
  };
}
```

---

## 11. WEEKLY AUTO-REPORT

### Tạo mỗi Chủ nhật (hoặc khi user request):

```
📊 BÁO CÁO TUẦN — 17-23/2/2026

CAMPAIGNS:
├── Active: 3 | Paused: 1 | Completed: 1
├── Tốt nhất: Vòng tay (ROAS 3.2x, +450K)
└── Tệ nhất: Ốp iPhone (ROAS 0.7x, -270K)

TÀI CHÍNH:
├── Thu: 4.8M
├── Chi: 3.5M
├── Lãi ròng: +1.3M
└── So với tuần trước: +45% ↑

TOP SP MỚI (từ upload tuần này):
├── Serum X — Win 78%, Rising
├── Vòng tay Y — Win 72%, New
└── Áo phông Z — Win 68%, Hot

GỢI Ý TUẦN TỚI:
1. Scale Vòng tay → 800K/ngày
2. Thử SP Serum X (match pattern win)
3. Chuẩn bị content cho 3.3 Sale

🎯 TARGET: 5M lãi/tháng — đạt 26% (1.3M/5M)
```

Lưu vào bảng:

```sql
CREATE TABLE weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  report_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 12. PERSONAL SCORE

### Thay đổi cách hiện score trên trang chi tiết SP:

```
HIỆN TẠI:
  AI Score: 77/100 (cho mọi người giống nhau)

SAU PHASE 4:
  Market Score: 77/100 (từ FastMoss, giống nhau)
  Win Probability: 82% (CÁ NHÂN, khác nhau mỗi user)
  Lifecycle: Rising 📈

  "SP này match pattern win #1 của bạn (Phụ kiện + 200-300K).
   Bạn đã lãi 1.2M từ 4 SP tương tự. Nên thử."
```

---

## 13. INSIGHTS TAB UPDATE

### Tab "Learning" nâng cấp:

```
AI Insights → Learning

🧠 AI Level: 2 — Trung bình (47/100)
[Progress bar + cách lên level]

📖 PLAYBOOK (khi có đủ data):
[Winning patterns]
[Losing patterns]
[Insights / sweet spots]

📊 WIN/LOSS HISTORY:
[Danh sách campaigns đã phân tích]

📈 TRENDS:
[Category trends từ uploads]
[Personal performance trend]
```

---

## TEST CHECKLIST

- [ ] Confidence Level tính đúng, hiện trên Insights
- [ ] Win Probability hiện trên detail page (thay hoặc bên cạnh AI Score)
- [ ] Win Prob breakdown hiện chi tiết
- [ ] Level 0: chỉ market data, ghi "chưa có data cá nhân"
- [ ] Level 2+: personal fit ảnh hưởng score
- [ ] Product Lifecycle hiện đúng (cần ≥2 snapshots)
- [ ] Win/Loss Analysis tạo khi campaign completed
- [ ] Pattern Library hiện khi có ≥3 campaigns
- [ ] Channel recommendation hiện trên detail page
- [ ] Budget Portfolio hiện khi ≥2 active campaigns
- [ ] Anomaly detection phát hiện: lỗ 3 ngày, ROAS giảm, KOL spike
- [ ] Morning Brief V2 hiện đúng priority
- [ ] Morning Brief thay đổi theo confidence level
- [ ] Weekly report tạo đúng
- [ ] Personal Score = Market + Personal Fit
- [ ] Build pass, không lỗi
