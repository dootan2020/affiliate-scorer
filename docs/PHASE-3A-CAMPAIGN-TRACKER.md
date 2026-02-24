# PHASE 3A: CAMPAIGN TRACKER + MORNING BRIEF

> Tham chiếu: ROADMAP-FINAL.md
> Goal: User track campaign từ đầu tới cuối. Morning Brief gợi ý hành động mỗi ngày.
> Phụ thuộc: Phase 2 (ghi chú, shop, lịch, thu chi) phải xong trước.

---

## THỨ TỰ THỰC HIỆN

```
1. Schema migration — bảng Campaign, ContentPost
2. API routes — /api/campaigns CRUD + /api/campaigns/[id]/daily-results
3. "Chạy SP này" button trên trang chi tiết SP
4. Trang /campaigns — danh sách campaigns
5. Trang /campaigns/[id] — chi tiết campaign + daily input
6. Morning Brief widget trên Dashboard
7. Goal setting — target lãi/tháng
8. Tab Campaigns trong Insights
9. Navigation update — thêm Campaigns vào nav
10. Test toàn bộ
```

---

## 1. DATABASE SCHEMA

### Bảng Campaign

```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Liên kết
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  
  -- Thông tin cơ bản
  name TEXT NOT NULL,           -- Tên campaign, default = tên SP
  platform TEXT NOT NULL,       -- "tiktok" | "facebook" | "shopee" | "youtube" | "google" | "organic" | "other"
  status TEXT NOT NULL DEFAULT 'planning',
    -- "planning" | "creating_content" | "running" | "paused" | "completed" | "cancelled"
  
  -- Planning
  planned_budget_daily INTEGER,       -- VND/ngày dự kiến
  planned_duration_days INTEGER,      -- Số ngày dự kiến chạy
  affiliate_link TEXT,                -- Copy từ Product hoặc nhập mới
  
  -- Content
  content_url TEXT,                   -- URL video/post chính
  content_type TEXT,                  -- "review" | "demo" | "unbox" | "lifestyle" | "livestream" | "other"
  content_notes TEXT,                 -- Ghi chú về content
  posted_at TIMESTAMPTZ,             -- Ngày đăng content
  
  -- Daily results — JSONB array
  -- Mỗi ngày user nhập: spend, orders, revenue (optional), clicks (optional), notes
  daily_results JSONB DEFAULT '[]',
  -- Format: [{ "date": "2026-03-01", "spend": 300000, "orders": 5, "revenue": 750000, "clicks": 120, "notes": "ROAS tốt" }]
  
  -- Auto-calculated summary (tính từ daily_results)
  total_spend INTEGER DEFAULT 0,
  total_revenue INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  roas DECIMAL(5,2),                  -- total_revenue / total_spend
  profit_loss INTEGER DEFAULT 0,      -- total_revenue - total_spend (đơn giản)
  
  -- Kết thúc
  verdict TEXT,                       -- "profitable" | "break_even" | "loss" | null
  lessons_learned TEXT,               -- User tự viết bài học rút ra
  
  -- Source tracking
  source_type TEXT DEFAULT 'manual',  -- "manual" | "fb_ads_import" | "tiktok_ads_import" | ...
  data_import_id UUID,                -- FK tới bảng imports nếu từ CSV
  
  -- Timestamps
  started_at TIMESTAMPTZ,             -- Ngày bắt đầu chạy thực tế
  ended_at TIMESTAMPTZ,               -- Ngày kết thúc
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaigns_product_id ON campaigns(product_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_platform ON campaigns(platform);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at DESC);
```

### Bảng ContentPost (content đã làm)

```sql
CREATE TABLE content_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  
  url TEXT NOT NULL,                  -- Link video/post
  platform TEXT NOT NULL,             -- "tiktok" | "youtube" | "facebook" | "shopee" | "instagram" | "other"
  content_type TEXT,                  -- "review" | "demo" | "unbox" | "lifestyle" | "livestream"
  
  -- Performance (nhập tay hoặc import)
  views INTEGER,
  likes INTEGER,
  comments INTEGER,
  shares INTEGER,
  
  notes TEXT,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_posts_campaign_id ON content_posts(campaign_id);
CREATE INDEX idx_content_posts_product_id ON content_posts(product_id);
```

### Bảng UserGoal (target tháng)

```sql
CREATE TABLE user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  type TEXT NOT NULL DEFAULT 'monthly_profit',  -- "monthly_profit" | "monthly_revenue" | "campaigns_count"
  target_amount INTEGER NOT NULL,               -- VND hoặc số lượng
  period_start DATE NOT NULL,                   -- Đầu tháng
  period_end DATE NOT NULL,                     -- Cuối tháng
  
  -- Auto-calculated
  current_amount INTEGER DEFAULT 0,
  progress_percent DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 2. API ROUTES

### Campaigns CRUD

```
GET    /api/campaigns                    — Danh sách (filter: status, platform)
POST   /api/campaigns                    — Tạo mới
GET    /api/campaigns/[id]               — Chi tiết
PATCH  /api/campaigns/[id]               — Cập nhật
DELETE /api/campaigns/[id]               — Xoá

POST   /api/campaigns/[id]/daily-results — Thêm kết quả ngày
PATCH  /api/campaigns/[id]/daily-results — Sửa kết quả ngày (by date)
```

### Khi thêm daily-results → auto recalculate:

```typescript
// Sau khi thêm/sửa daily result:
const results = campaign.daily_results;
const totalSpend = results.reduce((sum, r) => sum + (r.spend || 0), 0);
const totalRevenue = results.reduce((sum, r) => sum + (r.revenue || 0), 0);
const totalOrders = results.reduce((sum, r) => sum + (r.orders || 0), 0);
const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
const profitLoss = totalRevenue - totalSpend;

// Update campaign summary
await updateCampaign(id, { totalSpend, totalRevenue, totalOrders, roas, profitLoss });

// Cũng tạo FinancialRecord tương ứng (sync với Thu chi)
await createFinancialRecord({
  type: 'ads_spend',
  amount: todaySpend,
  source: campaign.platform,
  productId: campaign.productId,
  date: today,
  note: `Campaign: ${campaign.name}`,
});
```

### Content Posts

```
GET    /api/content-posts                — Danh sách (filter: campaignId, productId)
POST   /api/content-posts                — Thêm
PATCH  /api/content-posts/[id]           — Sửa
DELETE /api/content-posts/[id]           — Xoá
```

### Goals

```
GET    /api/goals                        — Goals hiện tại
POST   /api/goals                        — Tạo/update target tháng
```

---

## 3. "CHẠY SP NÀY" — TẠO CAMPAIGN TỪ SP

### Trang chi tiết SP — thêm button:

```
┌─────────────────────────────────────────────────┐
│ [🚀 Chạy SP này]                                │
│                                                  │
│ Hoặc nếu đã có campaign:                        │
│ [📊 Xem campaign đang chạy →]                   │
└─────────────────────────────────────────────────┘
```

### Click "Chạy SP này" → Modal tạo campaign:

```
┌─────────────────────────────────────────────────┐
│ 🚀 Tạo Campaign mới                             │
│                                                  │
│ Sản phẩm: Vòng tay bạc 925 (auto-fill)         │
│ Tên campaign: [Vòng tay bạc 925 - TikTok]      │
│                                                  │
│ Platform: [TikTok ▼]                            │
│ Budget dự kiến/ngày: [300,000] VND              │
│ Số ngày dự kiến: [7]                            │
│                                                  │
│ Link affiliate: [auto-fill từ SP nếu có]        │
│                                                  │
│             [Huỷ]  [Tạo Campaign]               │
└─────────────────────────────────────────────────┘
```

Sau khi tạo → redirect tới /campaigns/[id]

---

## 4. TRANG /campaigns — DANH SÁCH

```
Campaigns

[+ Tạo mới]    Filter: [Tất cả ▼] [Tất cả platform ▼]

┌────────────────────────────────────────────────────────────────────┐
│ Tên              │ SP          │ Platform │ Status │ ROAS │ Lãi/Lỗ│
├──────────────────┼─────────────┼──────────┼────────┼──────┼───────┤
│ Vòng tay - TT    │ Vòng tay    │ TikTok   │ 🟢 Run │ 3.2x │ +450K │
│ Serum - FB       │ Serum C     │ Facebook │ 🟢 Run │ 1.5x │ +120K │
│ Ốp iPhone - FB   │ Ốp iPhone  │ Facebook │ 🔴 Pause│ 0.7x │ -270K │
│ Dây sạc - TT     │ Dây sạc    │ TikTok   │ ✅ Done │ 2.1x │ +180K │
└────────────────────────────────────────────────────────────────────┘

Tổng: 4 campaigns | Active: 2 | Lãi ròng: +480K
```

### Status badges:
- 📝 Planning (xám)
- 🎬 Creating Content (vàng)
- 🟢 Running (xanh)
- ⏸️ Paused (cam)
- ✅ Completed (xanh đậm)
- ❌ Cancelled (đỏ)

### Filter: status, platform
### Sort: mới nhất, ROAS cao nhất, lãi nhiều nhất

---

## 5. TRANG /campaigns/[id] — CHI TIẾT

### Layout:

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Campaigns    Vòng tay bạc 925 - TikTok    🟢 Running        │
│ SP: Vòng tay bạc 925 [→]   Platform: TikTok   Ngày 5/7        │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ 💰 Tổng quan                                                 ││
│ │ ┌──────────┬──────────┬──────────┬──────────┬──────────────┐││
│ │ │ Chi      │ Thu      │ Đơn      │ ROAS     │ Lãi/Lỗ       │││
│ │ │ 1.5M     │ 4.8M     │ 32       │ 3.2x     │ +3.3M 🟢    │││
│ │ └──────────┴──────────┴──────────┴──────────┴──────────────┘││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│ [Kết quả hàng ngày] [Checklist] [Content] [Kết luận]           │
│                                                                  │
│ ═══ KẾT QUẢ HÀNG NGÀY ═══                                     │
│                                                                  │
│ [+ Thêm kết quả hôm nay]                                       │
│                                                                  │
│ ┌──────┬─────────┬──────┬─────────┬──────┬─────────────────┐  │
│ │ Ngày │ Chi     │ Đơn  │ Thu     │ ROAS │ Ghi chú         │  │
│ ├──────┼─────────┼──────┼─────────┼──────┼─────────────────┤  │
│ │ 25/2 │ 300K    │ 8    │ 960K    │ 3.2x │ Ngày tốt nhất   │  │
│ │ 24/2 │ 300K    │ 7    │ 840K    │ 2.8x │                 │  │
│ │ 23/2 │ 300K    │ 6    │ 720K    │ 2.4x │ Test audience   │  │
│ │ 22/2 │ 300K    │ 5    │ 600K    │ 2.0x │ Ngày đầu        │  │
│ │ 21/2 │ 300K    │ 6    │ 680K    │ 2.3x │                 │  │
│ └──────┴─────────┴──────┴─────────┴──────┴─────────────────┘  │
│                                                                  │
│ ═══ CHECKLIST ═══                                              │
│ ☑ Lấy link affiliate                                           │
│ ☑ Quay video content                                           │
│ ☑ Đăng video lên TikTok                                       │
│ ☑ Bật quảng cáo                                                │
│ ☐ Review kết quả ngày 3                                        │
│ ☐ Quyết định tăng/giảm budget ngày 5                          │
│ ☐ Kết luận sau 7 ngày                                         │
│                                                                  │
│ ═══ CONTENT ═══                                                │
│ 📹 Review 20s — TikTok — 45K views, 1.2K likes               │
│    https://tiktok.com/... [Cập nhật stats]                     │
│ [+ Thêm content]                                               │
│                                                                  │
│ ═══ KẾT LUẬN (khi completed) ═══                              │
│ Kết quả: [Lãi ▼] / [Hoà ▼] / [Lỗ ▼]                        │
│ Bài học rút ra: [Textarea — "SP phụ kiện giá 200-300K chạy    │
│ TikTok organic rất tốt. Review ngắn 20s convert cao hơn       │
│ demo dài. Nên test budget 300K/ngày trước khi scale."]        │
│ [Lưu kết luận + Đánh dấu Completed]                           │
└─────────────────────────────────────────────────────────────────┘
```

### Form "Thêm kết quả hôm nay" — QUAN TRỌNG: 30 giây

```
┌─────────────────────────────────────────────────┐
│ 📊 Nhập kết quả — 25/2/2026                     │
│                                                  │
│ Chi ads:    [300,000] VND                        │
│ Số đơn:    [8]                                   │
│ Thu:       [960,000] VND  (optional, tính từ đơn)│
│ Ghi chú:  [Ngày tốt nhất]  (optional)           │
│                                                  │
│                     [Lưu]                        │
└─────────────────────────────────────────────────┘
```

Chỉ 2-3 fields bắt buộc. 30 giây mỗi ngày.

Nếu user không nhập revenue → tính từ: orders × product.price × commission_rate (ước tính).

### Checklist — auto-generate khi tạo campaign:

```javascript
const DEFAULT_CHECKLIST = [
  { label: "Lấy link affiliate", dueDay: 0 },
  { label: "Quay video content", dueDay: 0 },
  { label: "Đăng content lên " + platform, dueDay: 1 },
  { label: "Bật quảng cáo", dueDay: 1 },
  { label: "Review kết quả ngày 3", dueDay: 3 },
  { label: "Quyết định tăng/giảm budget", dueDay: 5 },
  { label: "Kết luận sau " + plannedDuration + " ngày", dueDay: plannedDuration },
];
```

Lưu trong campaign.checklist (JSONB): `[{ label, dueDay, completed, completedAt }]`

---

## 6. MORNING BRIEF — DASHBOARD WIDGET

### Đặt ở ĐẦU Dashboard, TRÊN Top 10:

```
┌─────────────────────────────────────────────────┐
│ ☀️ Morning Brief — 25/2/2026                    │
│                                                  │
│ 📋 Hôm nay:                                     │
│ 1. 🔵 Nhập kết quả "Vòng tay" hôm qua         │
│ 2. 🔵 Nhập kết quả "Serum" hôm qua             │
│ 3. 🟡 3.3 Sale còn 5 ngày — chuẩn bị content   │
│                                                  │
│ 📊 Campaigns: 2 active | 1 paused               │
│ 💰 Tuần này: Chi 1.8M | Thu 3.2M | Lãi +1.4M   │
│ 📅 Sắp tới: 3.3 Sale (1-3/3)                   │
│                                                  │
│ 🎯 Target tháng 3: 5M lãi (chưa đặt?)         │
│    [Đặt target →]                                │
└─────────────────────────────────────────────────┘
```

### Logic tạo Morning Brief:

```typescript
function generateMorningBrief(data: {
  activeCampaigns: Campaign[],
  upcomingEvents: CalendarEvent[],
  financialSummary: { income: number, expense: number },
  goal: UserGoal | null,
}): BriefItem[] {
  const items: BriefItem[] = [];
  
  // 1. 🔴 URGENT — campaigns lỗ
  for (const c of data.activeCampaigns) {
    const last3Days = c.daily_results.slice(-3);
    if (last3Days.length >= 3 && last3Days.every(d => d.spend > d.revenue)) {
      items.push({
        priority: "urgent",
        icon: "🔴",
        text: `Pause "${c.name}" — lỗ ${formatVND(loss)} / 3 ngày liên tiếp`,
        action: { type: "link", href: `/campaigns/${c.id}` },
      });
    }
  }
  
  // 2. 🟢 OPPORTUNITY — campaigns ROAS tốt
  for (const c of data.activeCampaigns) {
    if (c.roas >= 2.5 && c.daily_results.length >= 3) {
      items.push({
        priority: "opportunity",
        icon: "🟢",
        text: `Tăng budget "${c.name}" — ROAS ${c.roas}x ổn định`,
        action: { type: "link", href: `/campaigns/${c.id}` },
      });
    }
  }
  
  // 3. 🔵 ROUTINE — nhập kết quả hôm qua
  for (const c of data.activeCampaigns) {
    const yesterday = getYesterday();
    const hasYesterday = c.daily_results.some(d => d.date === yesterday);
    if (!hasYesterday) {
      items.push({
        priority: "routine",
        icon: "🔵",
        text: `Nhập kết quả "${c.name}" hôm qua`,
        action: { type: "link", href: `/campaigns/${c.id}` },
      });
    }
  }
  
  // 4. 🟡 PREPARE — sự kiện sắp tới
  for (const event of data.upcomingEvents.filter(e => daysUntil(e.start) <= 7)) {
    items.push({
      priority: "prepare",
      icon: "🟡",
      text: `${event.name} còn ${daysUntil(event.start)} ngày — chuẩn bị content`,
      action: { type: "link", href: `/insights?tab=calendar` },
    });
  }
  
  // 5. Checklist tasks due today
  for (const c of data.activeCampaigns) {
    const daysSinceStart = daysBetween(c.started_at, now());
    const dueTasks = c.checklist.filter(t => !t.completed && t.dueDay <= daysSinceStart);
    for (const task of dueTasks) {
      items.push({
        priority: "routine",
        icon: "📋",
        text: `"${c.name}": ${task.label}`,
        action: { type: "link", href: `/campaigns/${c.id}` },
      });
    }
  }
  
  return items.sort(priorityOrder); // urgent → opportunity → prepare → routine
}
```

### Empty state (chưa có campaigns):

```
☀️ Bắt đầu ngày mới!

Chưa có campaigns đang chạy.
→ Xem Top 10 SP bên dưới và "Chạy SP này" cho SP đầu tiên!

📅 3.3 Sale còn 5 ngày — nên chuẩn bị content sớm.

🎯 [Đặt target lãi tháng này →]
```

---

## 7. GOAL TRACKING

### Trong Morning Brief:

```
🎯 Target tháng 3: Lãi 5,000,000₫
Progress: ████████░░░░░░░░ 23% (1.15M / 5M)
Còn: 3.85M trong 22 ngày
```

### Form đặt target:

```
┌─────────────────────────────────────────────────┐
│ 🎯 Đặt target tháng                             │
│                                                  │
│ Loại: [Lãi ròng ▼]                              │
│ Số tiền: [5,000,000] VND                        │
│ Tháng: [3/2026 ▼]                               │
│                                                  │
│                     [Lưu]                        │
└─────────────────────────────────────────────────┘
```

- Auto-calculate progress từ campaigns completed + financial records
- Hiện trên Morning Brief

---

## 8. NAVIGATION UPDATE

```
Nav hiện tại: Bảng xếp hạng | Sản phẩm | Upload | AI Insights

Sau Phase 3A: Bảng xếp hạng | Sản phẩm | Campaigns | Upload | AI Insights
                                           ^^^^^^^^^ MỚI

/campaigns → danh sách campaigns
```

---

## 9. SYNC VỚI THU CHI (Phase 2)

Khi nhập daily result cho campaign → auto tạo FinancialRecord:
- Chi ads: type = "ads_spend"
- Thu (nếu có): type = "commission_received" (hoặc "other_income")
- Link tới productId + campaignId

Khi import CSV (Phase 3B) → cũng tạo FinancialRecord.

Insights → tab Thu chi hiện tất cả, từ cả 2 nguồn.

---

## TEST CHECKLIST

- [ ] Tạo campaign từ trang chi tiết SP
- [ ] /campaigns danh sách filter đúng
- [ ] /campaigns/[id] hiện đúng thông tin
- [ ] Nhập daily result → tự tính ROAS, lãi/lỗ
- [ ] Nhập daily result → auto tạo FinancialRecord
- [ ] Checklist auto-generate, toggle hoạt động
- [ ] Content post CRUD
- [ ] Morning Brief hiện đúng priority
- [ ] Morning Brief empty state khi chưa có campaigns
- [ ] Goal setting + progress tracking
- [ ] Nav mới có "Campaigns"
- [ ] Campaign completed → nhập verdict + lessons
- [ ] Build pass, không lỗ
