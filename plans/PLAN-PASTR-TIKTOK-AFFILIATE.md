# PLAN: PASTR — Hệ Thống Sản Xuất Video Affiliate TikTok Shop

**Ngày tạo:** 27/02/2026
**Nguồn dữ liệu:** Nghiên cứu 2 agent parallel (TikTok affiliate VN + channel matrix + mass production)
**Phạm vi:** 3 giai đoạn phát triển PASTR từ tool scoring → hệ thống sản xuất video hoàn chỉnh

---

## PHẦN 1: TÓM TẮT NGHIÊN CỨU

### 1.1 Thị Trường TikTok Shop VN

- **GMV H1 2025:** $3.57 tỷ USD (+148% YoY) — vượt Shopee lần đầu (42% e-commerce VN)
- **Shops:** 431K sellers, hàng ngàn micro-creators affiliate
- **Micro-influencers (10K-50K followers):** chiếm 50%+ traffic, conversion 2.3x vs brand content, engagement 30.1%

### 1.2 Kênh Thành Công Làm Gì

| Yếu tố | Benchmark |
|---------|-----------|
| Content mix | 40-50% giải trí, 15-25% giáo dục, 15-20% review nhẹ, 10-15% bán hàng trực tiếp |
| Posting frequency | 3-5 video/ngày (20-35/tuần) — consistency > volume |
| Persona | Micro-niche rõ, visual identity đồng nhất, catchphrase/voice riêng |
| Timeline → first order | Tháng 2-3 (best case tuần 8-9) |
| Timeline → $500/tháng | Tháng 4-6 |
| Timeline → $1000/tháng | Tháng 8-12 (chỉ 1/4 affiliates đạt) |

### 1.3 Hot Niches VN 2025-2026

| Niche | Commission | Growth | Ưu tiên |
|-------|-----------|--------|---------|
| Beauty & Skincare | 10-20% | High | ⭐⭐⭐ Top pick — volume + commission cao nhất |
| Home & Lifestyle | 8-15% | Very High (+571%) | ⭐⭐⭐ Less saturated, AOV cao |
| Fashion & Accessories | 10-15% | Stable | ⭐⭐ Volume lớn, seasonal |
| Food & Beverages | 5-12% | Growing | ⭐⭐ Impulse buy, seasonal Tet |
| Tech & Gadgets | 2-8% | Moderate | ⭐ Commission thấp, AOV cao bù lại |

### 1.4 Video Types Hiệu Quả Nhất

**Top conversion:**
1. **Before-After** (1.5-2.5% CR) — best converter, 20-45s
2. **POV** (1.2-1.8% CR) — 1.6x algorithm boost, 20-40s
3. **Review/Demo** (1.0-1.5% CR) — trust builder, 30-60s
4. **Comparison** (1.0-1.4% CR) — decision stage, 45-60s

**Top reach:**
1. **Trending Sound** — 2-3x reach bình thường
2. **POV** — 1.6x algorithm recommendations
3. **Before-After** — visual pattern interrupt

**Script pattern chuẩn:** Hook (0-3s) → Body (features/demo) → CTA ("Link trong bình luận")

### 1.5 Ma Trận Kênh

- 3-5 kênh/người là feasible, mỗi kênh khác ≥3-4 yếu tố (persona, voice, edit style, fonts, camera angle, timing)
- TikTok dùng deep learning + perceptual hashing phát hiện duplicate → cần unique content, không repost
- Post schedule stagger 4-6 tiếng giữa các kênh
- Rủi ro: shadowban, account ban nếu spam/duplicate

### 1.6 Mass Production Workflow

- **50-100 video/tháng** = batch production: prep (2h) → quay/tạo (3h) → edit (5h) → upload (2h) → review (1h) = **10-15h/tuần**
- **1 SP → 20-30 variations** qua đổi hook × angle × music × text
- **AI tools stack:** CapCut (edit) + Kling/Runway (AI video) + ElevenLabs (voiceover) ≈ $100-150/tháng
- **Winning product criteria:** ≥500 views 24h, ≥1.5% CTR sau 3-5 ngày, ≥3-5 sales từ 1K clicks sau 7 ngày

---

## PHẦN 2: KIẾN TRÚC TỔNG THỂ PASTR MỚI

### 2.1 Module Map

```
┌─────────────────────────────────────────────────────────────────┐
│                        PASTR SYSTEM                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ╔══════════════╗   ╔══════════════╗   ╔══════════════╗        │
│  ║  INBOX       ║   ║  SCORING     ║   ║  BRIEF GEN   ║        │
│  ║  (đã có)     ║──>║  (đã có)     ║──>║  (đã có)     ║        │
│  ║  Paste links ║   ║  AI scoring  ║   ║  Angles,hooks║        │
│  ║  FastMoss    ║   ║  Combined    ║   ║  Scripts     ║        │
│  ╚══════════════╝   ╚══════════════╝   ╚══════════════╝        │
│         │                                      │                │
│         v                                      v                │
│  ╔══════════════╗   ╔══════════════╗   ╔══════════════╗        │
│  ║  CHANNEL MGR ║   ║  CONTENT     ║   ║  PRODUCTION  ║        │
│  ║  (MỚI)       ║   ║  CALENDAR    ║   ║  (sửa)       ║        │
│  ║  Profile     ║   ║  (MỚI)       ║──>║  Gallery ảnh ║        │
│  ║  Persona     ║   ║  Lịch đăng   ║   ║  Export packs║        │
│  ║  Style guide ║   ║  Content mix ║   ║  Video status║        │
│  ╚══════════════╝   ╚══════════════╝   ╚══════════════╝        │
│         │                  │                   │                │
│         v                  v                   v                │
│  ╔══════════════╗   ╔══════════════╗   ╔══════════════╗        │
│  ║  VARIATION   ║   ║  TRACKING    ║   ║  LEARNING    ║        │
│  ║  ENGINE      ║   ║  (sửa)       ║   ║  (đã có)     ║        │
│  ║  (MỚI)       ║   ║  Video perf  ║   ║  Win patterns║        │
│  ║  1SP→nhiều   ║   ║  SP win/lose ║   ║  Weight adj  ║        │
│  ║  versions    ║   ║  Script win  ║   ║  AI optimize ║        │
│  ╚══════════════╝   ╚══════════════╝   ╚══════════════╝        │
│                                                                 │
│  ╔══════════════╗   ╔══════════════╗                           │
│  ║  MATRIX      ║   ║  DASHBOARD   ║                           │
│  ║  (MỚI-GĐ2)  ║   ║  (sửa)       ║                           │
│  ║  Multi-kênh  ║   ║  Morning     ║                           │
│  ║  Clone+diff  ║   ║  brief       ║                           │
│  ║  Distribute  ║   ║  KPI cards   ║                           │
│  ╚══════════════╝   ╚══════════════╝                           │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow Chính

```
FastMoss XLSX → Inbox (paste link) → AI Scoring → Brief Generation
     ↓                                                    ↓
  Product         Channel Profile + Content Calendar → Production Page
  Gallery              ↓                                   ↓
  (ảnh gốc)     Schedule + Content Type → Brief đa dạng → Export Pack
                         ↓                                   ↓
                  Post lên TikTok ←──── Variation Engine (1→nhiều)
                         ↓
                  TikTok Analytics → Tracking → Learning Loop → Morning Brief
```

---

## PHẦN 3: GIAI ĐOẠN 1 — XÂY 1 KÊNH MẪU (MVP)

**Mục tiêu:** PASTR hỗ trợ đầy đủ workflow cho 1 kênh TikTok affiliate, từ chọn SP → tạo brief → sản xuất → tracking kết quả.

**Timeline ước tính:** 2-3 tuần

### 3.1 Tính Năng Cần Build (Ưu Tiên)

#### P1: Channel Profile (Quản lý kênh TikTok) — 2 ngày

**DB Schema mới:**
```
TikTokChannel {
  id, name, handle, niche, persona, styleGuide (JSON),
  fontPrimary, fontSecondary, colorPalette (JSON),
  voiceStyle, editingStyle, postingSchedule (JSON),
  isActive, createdAt, updatedAt
}
```

**UI:** Trang `/channels` mới
- Form tạo/sửa kênh: tên, handle, niche, persona description
- Style guide: font chọn, color palette (color picker), editing style (dropdown)
- Voice style: dropdown (casual/professional/energetic/calm)
- Posting schedule: chọn giờ đăng mỗi ngày (grid 7 ngày × slots)

**Tại sao cần:** Persona nhất quán = yếu tố #1 giữ follower. Style guide đảm bảo brief generation ra content đúng "voice" của kênh.

#### P2: Content Calendar (Lịch đăng bài) — 3 ngày

**DB Schema mới:**
```
ContentSlot {
  id, channelId → TikTokChannel,
  scheduledDate, scheduledTime,
  contentType, // "entertainment" | "review" | "selling" | "trending"
  productIdentityId? → ProductIdentity,
  contentAssetId? → ContentAsset,
  status, // "planned" | "briefed" | "produced" | "published"
  notes, createdAt
}
```

**UI:** Tab mới trong `/production` hoặc trang riêng `/calendar`
- Calendar view (tuần): grid 7 ngày, mỗi ngày 3-5 slots
- Mỗi slot hiện: content type (badge màu), SP name, status
- Drag-drop SP vào slot (từ danh sách scored products)
- Auto-suggest content type theo tỷ lệ 40/25/20/15 (giải trí/giáo dục/review/bán)
- "Tạo brief" button trên mỗi slot → gọi brief gen với context content type

**Tại sao cần:** Consistency + đúng content mix = yếu tố quyết định reach. Calendar giúp plan trước cả tuần, batch production hiệu quả.

#### P3: Brief Đa Dạng Theo Content Type — 2 ngày

**Sửa brief generation prompt** để nhận thêm params:
- `contentType`: entertainment / review / selling / trending
- `channelPersona`: từ channel profile
- `videoFormat`: unboxing / before-after / POV / review / tutorial / trending-sound / comparison
- `targetDuration`: 15s / 30s / 45s / 60s / 90s

**Sửa API `/api/briefs/batch`** nhận thêm fields trên.

**Sửa UI BriefPreviewCard:** hiện badge content type + format + target duration.

**Tại sao cần:** Hiện tại brief gen ra cùng 1 kiểu. Cần đa dạng theo video type (before-after cần script khác unboxing, POV cần script khác review).

#### P4: Material Preparation Tăng Cường — 1 ngày

**Đã có:** Product Gallery (upload ảnh SP + download zip) ✅

**Thêm:**
- **Prompt templates** per video format: Mỗi format (unboxing, before-after, POV...) có sẵn prompt template cho Kling/Veo3/Picsart Flow
- Lưu trong `VideoFormatTemplate` table hoặc hardcode JSON
- Brief gen tự chọn template phù hợp khi generate videoPrompts

#### P5: Video Performance Tracking — 3 ngày

**DB Schema (đã có `AssetMetric` — mở rộng):**
- Thêm fields vào AssetMetric: `ctr`, `conversionRate`, `rpm`, `isWinner`
- Thêm table:
```
VideoPerformanceLog {
  id, contentAssetId → ContentAsset,
  day, // 1, 3, 7, 14, 30
  views, likes, comments, shares,
  clicks, orders, commission,
  watchTimeAvg, completionRate,
  source, // "manual" | "import"
  createdAt
}
```

**UI:** Tab mới "Kết quả" trong production page
- Bảng: video name | views | CTR | conversion | commission | status (winner/loser/testing)
- Auto-classify: views ≥500 + CTR ≥1.5% + orders ≥3 sau 7 ngày = "Winner" (badge xanh)
- Manual input hoặc import từ TikTok Studio export (CSV)
- Filter: by product, by format, by content type

**Tại sao cần:** Tracking = feedback loop duy nhất để biết nên scale SP/script nào, bỏ cái nào.

#### P6: Winning Pattern Detection Upgrade — 2 ngày

**Sửa learning loop** để phân tích thêm:
- Win rate by video format (before-after vs unboxing vs POV...)
- Win rate by hook type (curiosity vs authenticity vs urgency...)
- Win rate by content type (entertainment vs review vs selling...)
- Win rate by video duration (15s vs 30s vs 60s)

**UI trong Morning Brief:** Thêm section "Format nào đang thắng?" + "Hook nào convert tốt?"

### 3.2 Thứ Tự Build

```
P1: Channel Profile      → nền tảng cho mọi thứ khác
P3: Brief Đa Dạng        → cần channel profile để generate đúng persona
P2: Content Calendar      → cần brief đa dạng để fill slots
P4: Material Prep         → prompt templates cho production
P5: Tracking              → feedback loop
P6: Winning Patterns      → AI learning từ tracking data
```

### 3.3 Trang UI Mới/Sửa

| Trang | Action | Mô tả |
|-------|--------|-------|
| `/channels` | MỚI | Quản lý kênh TikTok (profile, persona, style guide) |
| `/channels/[id]` | MỚI | Chi tiết 1 kênh + style guide editor |
| `/production` | SỬA | Thêm tab "Lịch" (calendar) + tab "Kết quả" (tracking) |
| `/production` briefs | SỬA | Brief card hiện content type badge, format, duration |
| Dashboard | SỬA | Morning brief thêm "format thắng", "hook thắng" |

---

## PHẦN 4: GIAI ĐOẠN 2 — NHÂN BẢN KÊNH

**Mục tiêu:** Quản lý 3-5 kênh, tạo variations tự động, phân phối content.
**Timeline ước tính:** 2-3 tuần (sau GĐ1 validate được)
**Prerequisite:** GĐ1 chạy thực tế ≥2 tuần, có data tracking

### 4.1 Tính Năng

#### Clone Kênh (Đổi Gì, Giữ Gì)

**Giữ:** Danh sách SP scored, brief angles, script structure, product gallery
**Đổi (bắt buộc ≥3-4 yếu tố):**
- Persona name + description
- Font primary + secondary
- Color palette
- Voice style
- Editing style
- Posting schedule (stagger 4-6h)

**UI:** Button "Clone kênh" → wizard đổi persona/style → tạo kênh mới

#### Variation Engine (1 SP → Nhiều Version)

Từ 1 brief gốc, tự động generate:
- 3-5 hook variations (curiosity, authenticity, urgency, social proof, revelation)
- 2-3 video format alternatives (before-after, POV, review)
- Mỗi combination = 1 ContentAsset mới, tag channel + variation type

**UI:** Button "Tạo variations" trên brief card → chọn số hook × format → generate batch

#### Dashboard Ma Trận

**UI trang `/channels`** nâng cấp:
- Grid cards: mỗi kênh = 1 card (handle, niche, stats tổng)
- Per-channel: videos tuần này, total views, top performer, win rate
- Cross-channel: SP nào đang thắng trên kênh nào, overlap check

#### Phân Phối Content

Content Calendar mở rộng:
- Chọn SP + format → assign cho kênh nào
- Auto-stagger: không post cùng SP trên 2 kênh cùng ngày
- Variation assignment: kênh A dùng hook A + font X, kênh B dùng hook B + font Y

### 4.2 DB Schema Thêm

```
ContentVariation {
  id,
  sourceAssetId → ContentAsset,  // brief gốc
  targetAssetId → ContentAsset,  // variation generated
  channelId → TikTokChannel,
  variationType, // "hook" | "format" | "style"
  variationParams (JSON), // { hookType, format, persona }
  createdAt
}
```

---

## PHẦN 5: GIAI ĐOẠN 3 — TỰ ĐỘNG HÓA (TƯƠNG LAI)

**Mục tiêu:** Giảm thời gian production từ 15h/tuần → 5h/tuần
**Timeline:** Khi GĐ2 stable + ROI positive
**Prerequisite:** ≥50 video data, ≥5 winning products, ≥2 kênh hoạt động

### 5.1 Tính Năng

| Feature | Tool/API | Mô tả |
|---------|----------|-------|
| Auto-generate video | Kling API / Picsart Flow API (Q2-Q3 2026) | Brief → video render tự động |
| Auto voiceover | ElevenLabs API ($5-99/tháng) | Script → voice tự động per persona |
| Auto caption | CapCut API / FFmpeg | Burn captions vào video |
| Auto-post | TikTok Content Publishing API | Schedule → auto post lên TikTok |
| AI auto-optimize | PASTR learning loop | Data → tự adjust weights → suggest SP + format |

### 5.2 Khi Nào Bắt Đầu

**Triggers:**
- Có ≥50 videos đã tracking → đủ data cho learning
- Có ≥3 winning products → biết pattern thắng
- Production bottleneck rõ (>15h/tuần, cần giảm)
- Picsart Flow API ra mắt (dự kiến Q2-Q3 2026)

**Không nên tự động hóa sớm vì:**
- Cần human taste cho persona building giai đoạn đầu
- AI video quality chưa đủ tốt cho mọi format
- Learning loop cần data thật, không data giả

---

## PHẦN 6: CHI PHÍ & ROI

### 6.1 Chi Phí Tool/API

| Giai đoạn | Tools | Chi phí/tháng |
|-----------|-------|--------------|
| GĐ1 (1 kênh) | PASTR (free, self-host) + CapCut ($5) + Kling ($50) + ElevenLabs ($25) | ~$80/tháng |
| GĐ2 (3 kênh) | + Tracking tool ($99) + thêm AI credits | ~$200/tháng |
| GĐ3 (auto) | + API costs (Kling API, ElevenLabs scale) | ~$300-500/tháng |

### 6.2 Output & Revenue Ước Tính

| Giai đoạn | Videos/tháng | Products | Revenue ước tính |
|-----------|-------------|----------|-----------------|
| GĐ1 tháng 1-3 | 60-100 (1 kênh, 3-5/ngày) | 5-10 SP tested | $0-200 |
| GĐ1 tháng 4-6 | 100-150 | 3-5 winning SP | $200-500 |
| GĐ2 tháng 7-9 | 200-300 (3 kênh) | 5-8 winning SP × 3 kênh | $500-1500 |
| GĐ2 tháng 10-12 | 300-400 | Scale winners | $1000-3000 |
| GĐ3 tháng 13+ | 400-600 (auto) | Continuous pipeline | $2000-5000+ |

**Assumptions:** Beauty/home niche, commission 10-15%, conversion 0.8-1.5%, AOV $15-25

### 6.3 Break-Even

- GĐ1: Chi $80/tháng → cần ≥$80 commission = ~6-8 orders/tháng = **tháng 3-4**
- GĐ2: Chi $200/tháng → cần ≥$200 = ~15 orders/tháng = **tháng 7-8**
- GĐ3: Chi $400/tháng → covered nếu revenue >$1000

---

## PHẦN 7: RỦI RO & GIẢI PHÁP

| Rủi ro | Mức độ | Giải pháp |
|--------|--------|-----------|
| TikTok shadowban/ban | Cao | Tuân thủ guidelines, không duplicate, disclosure rõ ràng |
| AI video chất lượng thấp | Trung bình | Fallback quay thật cho format talking head, dùng AI cho slideshow/before-after |
| Không tìm được winning product | Trung bình | Test ≥10 SP trước khi conclude, rotate niches |
| Content fatigue (hết ý tưởng) | Trung bình | AI brief gen + variation engine + trending sound integration |
| Picsart Flow API delay | Thấp | Dùng Kling API trước, Picsart là bonus |
| Tracking manual quá chậm | Trung bình | Ưu tiên build import CSV từ TikTok Studio |
| Chi phí tool vượt revenue | Thấp | Dùng free tier đầu, scale khi có ROI |

---

## PHẦN 8: ĐỀ XUẤT BẮT ĐẦU

### Tuần 1: Channel Profile + Brief Đa Dạng

1. Build trang `/channels` — quản lý 1 kênh TikTok (persona, style guide)
2. Sửa brief gen nhận content type + video format + channel persona
3. Test: tạo kênh → chọn 3 SP → generate brief cho 3 format khác nhau (before-after, POV, review)

### Tuần 2: Content Calendar + Material Prep

4. Build Content Calendar (tuần view, drag-drop SP vào slots)
5. Thêm prompt templates per video format cho Kling/Veo3
6. Test: plan 1 tuần (15-20 slots) → generate briefs → export production packs

### Tuần 3: Tracking + Learning

7. Build tracking tab (manual input + CSV import)
8. Upgrade winning pattern detection (by format, hook, content type)
9. Test: nhập data 10 video giả → xem dashboard + morning brief có insight mới

### Song Song: Đăng Video Thật

- Tuần 1: Setup kênh TikTok thật, đăng 5-10 video test
- Tuần 2-3: 3-5 video/ngày, track kết quả bằng PASTR
- Tuần 4+: Evaluate → quyết định scale lên GĐ2

---

## Unresolved Questions

1. TikTok Content Publishing API có sẵn cho VN market không? (cần verify)
2. Kling API pricing cho batch video generation? (cần test thử)
3. User muốn ưu tiên niche nào trước? (beauty vs home vs fashion)
4. Có budget cho paid promotion (TikTok Ads) song song organic không?
5. Channel persona: user tự quay (talking head) hay 100% AI-generated?

---

**Research files:**
- `plans/research-tiktok-affiliate-channels-vn.md` — Chi tiết kênh VN, video types, conversion data
- `plans/research-tiktok-matrix-and-production.md` — Ma trận kênh, batch production, tracking metrics
- `plans/RESEARCH-PICSART-FLOW.md` — Picsart Flow capabilities + pricing
