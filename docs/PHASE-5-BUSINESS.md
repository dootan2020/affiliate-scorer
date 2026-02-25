# PHASE 5: BUSINESS LAYER

> Tham chiếu: ROADMAP-FINAL-V2.md
> Goal: Commission tracking + Morning Brief (factory version) + Weekly report + Goal tracking.
> Phụ thuộc: Phase 4 (Result + Learning) — cần có metrics + playbook.

---

## THỨ TỰ THỰC HIỆN

```
1. Schema migration — commissions, daily_briefs, goals
2. Commission tracking (optional, không block flow)
3. Morning Brief — "Hôm nay sản xuất gì"
4. Dashboard redesign — Paste Links + Inbox stats + Brief + Stats
5. Weekly auto-report
6. Goal tracking (videos/tuần, commission/tháng)
7. /insights upgrade — thêm P&L summary
```

---

## 1. DATABASE SCHEMA

### Bảng commissions

```sql
CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link về SP/asset (cả hai optional)
  product_identity_id UUID REFERENCES product_identities(id),
  content_asset_id UUID REFERENCES content_assets(id),
  
  -- Tiền
  amount INTEGER NOT NULL,                   -- VND
  platform TEXT,                             -- "tiktokshop" | "shopee" | "lazada" | "other"
  
  -- Thời gian
  earned_date DATE NOT NULL,
  received_date DATE,                        -- Ngày thực nhận (có thể khác)
  
  -- Status
  status TEXT DEFAULT 'pending',             -- "pending" | "confirmed" | "paid" | "rejected"
  
  notes TEXT,
  raw_data JSONB,                            -- Nếu import từ CSV
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_com_product ON commissions(product_identity_id);
CREATE INDEX idx_com_asset ON commissions(content_asset_id);
CREATE INDEX idx_com_date ON commissions(earned_date DESC);
CREATE INDEX idx_com_status ON commissions(status);
```

### Bảng daily_briefs

```sql
CREATE TABLE daily_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  brief_date DATE NOT NULL UNIQUE,
  
  -- Generated content
  content JSONB NOT NULL,
  -- Format: {
  --   "summary": "...",
  --   "produce_today": [{ "product_id": "...", "reason": "...", "priority": 1 }],
  --   "new_products": [{ "product_id": "...", "delta": "NEW", "why_interesting": "..." }],
  --   "yesterday_results": { "videos_published": 3, "total_views": 45000, "top_video": "..." },
  --   "alerts": ["..."],
  --   "weekly_progress": { "videos_target": 50, "videos_done": 23, "commission_target": 5000000, "commission_done": 2100000 }
  -- }
  
  ai_model TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_db_date ON daily_briefs(brief_date DESC);
```

### Bảng goals

```sql
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  period_type TEXT NOT NULL,                 -- "weekly" | "monthly"
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Targets
  target_videos INTEGER,                     -- Số video sản xuất
  target_commission INTEGER,                 -- VND
  target_views INTEGER,                      -- Tổng views
  
  -- Actual (auto-calculated)
  actual_videos INTEGER DEFAULT 0,
  actual_commission INTEGER DEFAULT 0,
  actual_views INTEGER DEFAULT 0,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(period_type, period_start)
);
```

---

## 2. COMMISSION TRACKING

### Nguyên tắc: OPTIONAL, KHÔNG BLOCK

```
Commission = nice-to-have. User KHÔNG BẮT BUỘC nhập.
Không có commission → app vẫn chạy 100%.
Có commission → thêm P&L view, Morning Brief giàu hơn.
```

### Nhập commission:

**Cách 1: Thủ công (nhanh)**
```
┌─────────────────────────────────────────────────┐
│ 💰 Thêm commission                              │
│                                                  │
│ Số tiền:  [150,000] VND                         │
│ Platform: [TikTok Shop ▼]                       │
│ Ngày:     [25/02/2026]                          │
│ SP:       [Serum Vitamin C ▼] (bỏ qua được)    │
│ Video:    [Video 1 — Review ▼] (bỏ qua được)   │
│                                                  │
│ [Lưu]                                           │
└─────────────────────────────────────────────────┘
```

**Cách 2: Bulk từ CSV (sau)**
```
Upload TikTok Affiliate report CSV
→ Parse: date, amount, product name
→ Auto-match product_identity nếu được
→ User confirm matches
```

### P&L summary (khi có data):

```
💰 Tháng 2/2026

Thu:
├── Commission TikTok Shop: ₫2,100,000
├── Commission Shopee: ₫350,000
└── Tổng: ₫2,450,000

Chi:
├── Kling AI credits: ₫500,000
├── Veo3 credits: ₫300,000
└── Tổng: ₫800,000

Lãi ròng: ₫1,650,000
ROI: 206%
```

---

## 3. MORNING BRIEF — FACTORY VERSION

### Prompt gửi Claude API:

```typescript
function buildMorningBriefPrompt(data: BriefData): string {
  return `
Bạn là AI thư ký cho affiliate marketer TikTok Việt Nam.
Tạo Morning Brief cho ngày ${data.today}.

DỮ LIỆU:

SẢN PHẨM MỚI TRONG INBOX (chưa tạo content):
${data.newProducts.map(p => `- ${p.title} | ${p.delta_type} | Market: ${p.market_score} | Content: ${p.content_potential_score}`).join('\n')}

SẢN PHẨM ĐÃ CÓ BRIEF (chưa sản xuất):
${data.briefedProducts.map(p => `- ${p.title} | ${p.briefCount} briefs`).join('\n')}

KẾT QUẢ HÔM QUA:
- Videos đăng: ${data.yesterday.videosPublished}
- Tổng views: ${data.yesterday.totalViews}
- Video tốt nhất: ${data.yesterday.topVideo || 'chưa có'}
- Reward trung bình: ${data.yesterday.avgReward}

LEARNING INSIGHTS:
- Hook tốt nhất tuần này: ${data.topHook}
- Format tốt nhất: ${data.topFormat}
- Category mạnh: ${data.topCategories.join(', ')}

MỤC TIÊU TUẦN:
- Target: ${data.weeklyGoal.targetVideos} videos
- Đã làm: ${data.weeklyGoal.actualVideos} videos
- Còn lại: ${data.weeklyGoal.targetVideos - data.weeklyGoal.actualVideos} videos

${data.upcomingEvents ? `SỰ KIỆN SẮP TỚI: ${data.upcomingEvents}` : ''}

YÊU CẦU:
Output JSON:
{
  "greeting": "Chào buổi sáng ngắn gọn",
  "produce_today": [
    { "product": "Tên SP", "reason": "Tại sao hôm nay", "videos": 3, "priority": 1 }
  ],
  "new_products_alert": [
    { "product": "Tên SP", "why": "Tại sao đáng chú ý" }
  ],
  "yesterday_recap": "1-2 câu tóm tắt kết quả hôm qua",
  "tip": "1 gợi ý content dựa trên learning data",
  "weekly_progress": "X/Y videos, còn Z ngày"
}

QUY TẮC:
- Ngắn gọn, actionable
- Ưu tiên SP có score cao + chưa tạo content
- Gợi ý số video cụ thể (tổng = target còn lại / ngày còn lại)
- Nếu chưa có data → gợi ý upload FastMoss hoặc paste links
  `.trim();
}
```

### UI Morning Brief:

```
┌─────────────────────────────────────────────────────────────────┐
│ ☀️ Morning Brief — 25/2/2026                                    │
│                                                                  │
│ Chào! Tuần này cần 50 video, đã làm 23. Còn 27 video, 3 ngày. │
│ Hôm nay nên sản xuất 9 video.                                   │
│                                                                  │
│ ═══ HÔM NAY SẢN XUẤT ═══                                       │
│ 🔴 1. Serum Vitamin C — 3 video                                 │
│    → SURGE tuần này, hook "result" đang win                      │
│    [Tạo Briefs →]                                                │
│                                                                  │
│ 🟢 2. Vòng tay bạc 925 — 3 video                                │
│    → Content score 85, phù hợp style "lifestyle"                │
│    [Tạo Briefs →]                                                │
│                                                                  │
│ 🟡 3. Ốp iPhone 16 — 3 video                                    │
│    → NEW hôm nay, giá sốc 39K                                   │
│    [Tạo Briefs →]                                                │
│                                                                  │
│ ═══ SẢN PHẨM MỚI ═══                                           │
│ 🆕 5 SP mới trong Inbox — 2 có score > 80                       │
│ [Xem Inbox →]                                                    │
│                                                                  │
│ ═══ HÔM QUA ═══                                                 │
│ 3 video đăng, 45K views tổng. Video "Serum review" 25K views 🎉│
│                                                                  │
│ 💡 Tip: Hook "kết quả sau X ngày" đang win 80%. Thử dùng thêm. │
│                                                                  │
│ ═══ TIẾN ĐỘ TUẦN ═══                                           │
│ ████████████░░░░░░░░ 23/50 videos (46%)                         │
│ 💰 Commission: ₫2,100,000 / ₫5,000,000 target                  │
└─────────────────────────────────────────────────────────────────┘
```

### Empty state (ngày đầu):

```
☀️ Chào mừng đến Content Factory!

Chưa có data → 3 bước bắt đầu:
1. [Paste links SP vào Inbox →]
2. [Upload FastMoss XLSX →]
3. [Đặt mục tiêu tuần →]

Sau khi có SP → AI tạo scripts cho bạn!
```

---

## 4. DASHBOARD REDESIGN

### Layout mới:

```
/dashboard
┌──────────────────────────────────────────────────────────────────┐
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ 📋 Paste links nhanh                                       │  │
│ │ [_____________________________________________] [Thêm]     │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│ ┌──── Morning Brief (rút gọn) ──────────────────────────────┐  │
│ │ Hôm nay: 9 video | 3 SP ưu tiên | 27 video còn lại tuần  │  │
│ │ [Xem đầy đủ →]                                            │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│ ┌─── Stats nhanh ──┐ ┌─── Inbox ──────┐ ┌─── Tuần này ────┐  │
│ │ 📦 45 SP         │ │ 🆕 5 New       │ │ 🎬 23/50 videos │  │
│ │ 🎬 89 videos     │ │ ⭐ 12 Scored   │ │ 👁 125K views   │  │
│ │ 💰 ₫2.1M tháng  │ │ 📝 8 Briefed   │ │ 💰 ₫2.1M comm  │  │
│ └──────────────────┘ └────────────────┘ └──────────────────┘  │
│                                                                  │
│ ┌─── Top SP hôm nay (AI gợi ý) ────────────────────────────┐  │
│ │ 1. Serum Vitamin C    | Score 85 | SURGE  | [Tạo video →] │  │
│ │ 2. Vòng tay bạc       | Score 82 | STABLE | [Tạo video →] │  │
│ │ 3. Ốp iPhone 16       | Score 78 | NEW    | [Tạo video →] │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│ ┌─── Video gần đây ─────────────────────────────────────────┐  │
│ │ 📹 Serum review      | 25K views | ⭐ 7.2 reward         │  │
│ │ 📹 Vòng tay lifestyle| 8K views  | ⭐ 4.1 reward         │  │
│ │ 📹 Ốp iPhone unbox   | 3K views  | ⭐ 2.3 reward         │  │
│ └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. WEEKLY AUTO-REPORT

### Trigger: mỗi Chủ nhật 21:00 (hoặc user bấm tạo)

### Prompt:

```typescript
function buildWeeklyReportPrompt(data: WeeklyData): string {
  return `
Tạo báo cáo tuần cho affiliate content creator TikTok VN.

TUẦN ${data.weekNumber} (${data.startDate} — ${data.endDate}):

SẢN XUẤT:
- Videos tạo: ${data.videosCreated}
- Videos đăng: ${data.videosPublished}
- Tổng views: ${data.totalViews}
- Avg views/video: ${data.avgViews}

TOP 3 VIDEO:
${data.topVideos.map((v, i) => `${i+1}. "${v.hook}" | ${v.views} views | ${v.format} | ${v.product}`).join('\n')}

BOTTOM 3 VIDEO:
${data.bottomVideos.map((v, i) => `${i+1}. "${v.hook}" | ${v.views} views | ${v.format} | ${v.product}`).join('\n')}

LEARNING:
- Hook win: ${data.winningHooks.join(', ')}
- Hook lose: ${data.losingHooks.join(', ')}
- Format win: ${data.winningFormats.join(', ')}

COMMISSION:
- Tuần này: ₫${data.weekCommission}
- Tháng này (tích lũy): ₫${data.monthCommission}

Output JSON:
{
  "summary": "2-3 câu tóm tắt tuần",
  "wins": ["Điều tốt 1", "Điều tốt 2"],
  "improvements": ["Cần cải thiện 1", "Cần cải thiện 2"],
  "next_week_focus": "Tuần tới nên tập trung gì",
  "playbook_update": "Pattern mới phát hiện (nếu có)"
}
  `.trim();
}
```

### UI:

```
📊 Báo cáo tuần 8 — 17/2 → 23/2/2026

TÓM TẮT:
Sản xuất 35 video, đăng 30. Tổng 180K views. Commission ₫1,800,000.
Tuần tốt hơn tuần trước 15%.

✅ WINS:
• Hook "kết quả sau X ngày" win rate 80%
• Category Mỹ phẩm chiếm 60% views

🔧 CẦN CẢI THIỆN:
• Videos Demo chỉ đạt 3K avg views — thử đổi sang Review
• Đăng video trước 12h trưa ít views hơn 19-21h

🎯 TUẦN TỚI:
Tập trung 3 SP SURGE mới. Tăng tỷ lệ Review format.
Target: 50 videos, ₫3M commission.
```

---

## 6. GOAL TRACKING

### Set goal:

```
┌─────────────────────────────────────────────────┐
│ 🎯 Mục tiêu                                     │
│                                                  │
│ Tuần này (17/2 — 23/2):                         │
│   Videos: [50]                                   │
│   Commission: [5,000,000] VND                    │
│   Views: [200,000]                               │
│                                                  │
│ Tháng 2:                                         │
│   Videos: [200]                                  │
│   Commission: [15,000,000] VND                   │
│                                                  │
│ [Lưu]                                           │
└─────────────────────────────────────────────────┘
```

### Progress widget (hiện trên Dashboard + Morning Brief):

```typescript
function calculateGoalProgress(goal: Goal): GoalProgress {
  const daysTotal = daysBetween(goal.period_start, goal.period_end);
  const daysElapsed = daysBetween(goal.period_start, new Date());
  const daysRemaining = Math.max(0, daysTotal - daysElapsed);
  
  return {
    videos: {
      target: goal.target_videos,
      actual: goal.actual_videos,
      percent: goal.target_videos > 0 ? (goal.actual_videos / goal.target_videos) * 100 : 0,
      onTrack: daysRemaining > 0
        ? (goal.actual_videos / daysElapsed) >= (goal.target_videos / daysTotal)
        : goal.actual_videos >= goal.target_videos,
      needed_per_day: daysRemaining > 0
        ? Math.ceil((goal.target_videos - goal.actual_videos) / daysRemaining)
        : 0,
    },
    commission: {
      target: goal.target_commission,
      actual: goal.actual_commission,
      percent: goal.target_commission > 0 ? (goal.actual_commission / goal.target_commission) * 100 : 0,
    },
  };
}
```

---

## 7. NAVIGATION FINAL

```
/dashboard       — Morning Brief (rút gọn) + Quick paste + Stats
/inbox           — Paste Links + Inbox cards (filter by state)
/sync            — FastMoss upload + Delta summary
/production      — Chọn SP → AI generate → Export Packs
/log             — Paste TikTok links + nhập metrics
/library         — Tất cả video + kết quả + filter
/insights        — Playbook + Weekly report + P&L + Goals
/settings        — API keys, preferences
```

---

## API ENDPOINTS

```
POST   /api/commissions              — Thêm commission
GET    /api/commissions              — List commissions (filter by date, platform)
GET    /api/commissions/summary      — P&L summary

POST   /api/brief/generate           — Generate Morning Brief cho hôm nay
GET    /api/brief/today              — Lấy brief hôm nay (cached)
GET    /api/brief/[date]             — Lấy brief theo ngày

POST   /api/goals                    — Set goal
GET    /api/goals/current            — Lấy goals đang active
PATCH  /api/goals/[id]               — Update goal
GET    /api/goals/progress           — Progress hiện tại

POST   /api/reports/weekly           — Generate weekly report
GET    /api/reports/weekly/[week]     — Lấy report theo tuần
```

---

## GUARDRAILS

```
❌ KHÔNG bắt buộc nhập commission để dùng app
❌ KHÔNG block Morning Brief khi chưa có goals
❌ KHÔNG build CSV import commission ở Phase 5 (defer)
✅ Commission = thủ công, 1 form đơn giản
✅ Morning Brief hoạt động từ ngày 1 (empty state có hướng dẫn)
✅ Goals optional — không set goal thì Brief vẫn gợi ý
✅ Weekly report auto-generate nếu có ≥5 videos trong tuần
```

---

## TEST CHECKLIST

- [ ] Thêm commission thủ công → lưu đúng
- [ ] P&L summary tính đúng (thu - chi)
- [ ] Morning Brief generate khi có ≥1 SP trong Inbox
- [ ] Morning Brief empty state khi chưa có data
- [ ] Morning Brief gợi ý SP dựa trên score + learning
- [ ] Dashboard mới hiện: paste box + brief + stats + top SP + recent videos
- [ ] Set goal → progress bar hiện đúng
- [ ] Weekly report generate khi có ≥5 videos
- [ ] Navigation 7 tabs hoạt động
- [ ] Build pass, không lỗi
