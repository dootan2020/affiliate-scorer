# Dashboard Audit Report

**Ngày:** 2026-03-02
**Phạm vi:** Trang Dashboard (`/`) — toàn bộ widgets, API routes, data sources

---

## 1. Hiện trạng

### Layout tổng quan

**File:** `app/page.tsx:13-43`

Dashboard gồm 5 hàng widgets theo thứ tự từ trên xuống:

| # | Widget | Component | File |
|---|--------|-----------|------|
| 1 | Cảnh báo dữ liệu mồ côi | `OrphanAlertWidget` | `components/dashboard/orphan-alert-widget.tsx` |
| 2 | Kênh hôm nay | `ChannelTaskBoard` | `components/dashboard/channel-task-board.tsx` |
| 3a | Bản tin sáng (2/3 width) | `MorningBriefWidget` | `components/dashboard/morning-brief-widget.tsx` |
| 3b | Thêm sản phẩm nhanh (1/3 width) | `QuickPasteWidget` | `components/dashboard/quick-paste-widget.tsx` |
| 4 | Nên tạo nội dung | `ContentSuggestionsWidget` | `components/dashboard/content-suggestions-widget.tsx` |
| 5 | Winning Patterns | `WinningPatternsWidget` | `components/dashboard/winning-patterns-widget.tsx` |

### Chi tiết từng widget

---

#### 1.1 OrphanAlertWidget — Cảnh báo dữ liệu mồ côi

**Component:** `components/dashboard/orphan-alert-widget.tsx:15-56`
**API:** `GET /api/dashboard/orphan-stats` → `app/api/dashboard/orphan-stats/route.ts:13-59`

**Hiển thị gì:**
- Banner amber cảnh báo với icon `AlertTriangle`
- Tổng số "dữ liệu mồ côi" ở header
- 4 ô grid, mỗi ô hiển thị con số + label, click vào navigate tới trang liên quan
- Tự ẩn nếu `total === 0` (return null)

**Data sources — 4 queries parallel:**

| Metric | Query | Điều kiện | Link đích |
|--------|-------|-----------|-----------|
| SP chưa brief | `ProductIdentity.count()` | `inboxState IN ("scored","briefed")` AND `briefs: { none: {} }` | `/inbox` |
| Brief chưa asset | `ContentBrief.count()` | `assets: { none: {} }` | `/production` |
| Video chưa tracking | `ContentAsset.count()` | `status = "published"` AND `tracking IS NULL` | `/production` |
| Slot trống | `ContentSlot.count()` | `contentAssetId = NULL` AND `status = "planned"` | `/channels` |

**Logic xử lý:**
- Fetch 1 lần khi mount, không có refresh
- Filter bỏ items có count = 0 trước khi render
- Cộng tổng 4 metrics làm `total`

---

#### 1.2 ChannelTaskBoard — Kênh hôm nay

**Component:** `components/dashboard/channel-task-board.tsx:18-180`
**API:** `GET /api/dashboard/channel-tasks` → `app/api/dashboard/channel-tasks/route.ts:16-105`

**Hiển thị gì:**
- Grid 1-3 columns, mỗi card = 1 kênh TikTok active
- Mỗi card hiển thị: tên kênh, persona, progress bar slots hôm nay, 3 metric badges (Cần brief / Nháp / Sẵn đăng)
- 2 quick action buttons: "Tạo Brief" → `/production?channel=${id}`, "Lịch" → `/channels/${id}`

**Data sources — 5 parallel queries:**
1. Active channels (`TikTokChannel.findMany`, `isActive: true`)
2. Today's slots grouped by status (`ContentSlot.groupBy`)
3. Draft assets per channel (`ContentAsset.groupBy`, `status: "draft"`)
4. Ready assets per channel (`ContentAsset.groupBy`, `status IN ("produced","rendered")`)
5. Published today per channel (`ContentAsset.groupBy`, `publishedAt` today)

**Logic xử lý:**
- Map channels → `ChannelTask[]` with aggregated metrics
- `slotsToday` = sum of all slot statuses for today
- `needsBrief` = slots with `status = "planned"`
- Progress bar = `publishedToday / slotsToday * 100%`

**Empty state:** "Chưa có kênh nào" + link "Tạo kênh mới" → `/channels`

---

#### 1.3 MorningBriefWidget — Bản tin sáng

**Component:** `components/dashboard/morning-brief-widget.tsx:93-299`
**API:** `GET /api/brief/today` → `app/api/brief/today/route.ts:6-33`
**Generator:** `lib/brief/generate-morning-brief.ts:18-191`

**Hiển thị gì:**
- Header "Bản tin sáng" + ngày + nút refresh (tạo lại brief)
- Greeting text từ AI
- **Việc cần làm theo kênh** (channel_tasks): sorted by priority, badge kênh + action text
- **Hôm nay sản xuất** (produce_today): tên SP + lý do + số video + priority
- **Sản phẩm mới** (new_products_alert): tên + tại sao đáng chú ý
- **Yesterday recap**: 1-2 câu tóm tắt
- **Tip**: gợi ý content từ learning data
- **Weekly progress**: X/Y videos, còn Z ngày

**Data sources (cho AI prompt):**
1. `ProductIdentity` scored/enriched, top 10 by combinedScore
2. `ProductIdentity` briefed, top 5
3. Yesterday stats: published count, views, avgReward từ `ContentAsset` + `AssetMetric`
4. `LearningWeightP4` top 10 by weight
5. `GoalP5` current weekly goal
6. `TikTokChannel` active + today's slots + draft counts

**Logic xử lý:**
- `GET /api/brief/today` check DB cache (`DailyBrief.findUnique({ briefDate: today })`)
- Nếu chưa có hoặc `?refresh=true` → gọi `generateMorningBrief()` → AI Claude → parse JSON → save DB
- Fallback: nếu JSON parse fails → return empty structure với greeting mặc định
- Widget hiển thị `EmptyState` khi error hoặc no data

---

#### 1.4 QuickPasteWidget — Thêm sản phẩm nhanh

**Component:** `components/dashboard/quick-paste-widget.tsx:6-18`
**Delegate:** `components/inbox/paste-link-box.tsx` (compact mode)
**API:** `POST /api/inbox/paste`

**Hiển thị gì:**
- Card "Thêm sản phẩm nhanh" với textarea 2 hàng
- Nút submit "Paste links"
- Khi thành công → toast notification với stats

**Data flow:**
- User paste links TikTok Shop / FastMoss
- POST body: `{ text: "multi-line links" }`
- Response: `{ total, newProducts, duplicates, videos, shops, failed }`
- Compact mode: chỉ textarea + button, không hiển thị result breakdown

---

#### 1.5 ContentSuggestionsWidget — Nên tạo nội dung

**Component:** `components/dashboard/content-suggestions-widget.tsx:20-120`
**API:** `GET /api/inbox?sort=score&limit=20`

**Hiển thị gì:**
- List tối đa 8 sản phẩm với: thumbnail, tên, category, combinedScore badge, "Tạo Brief →" link
- Header có "Xem tất cả →" link → `/inbox`

**Data flow:**
- Fetch 20 items sorted by score from inbox API
- Client-side filter: loại bỏ `inboxState` = "briefed" hoặc "published"
- Lấy top 8 từ kết quả filtered
- `EXCLUDED_STATES = ["briefed", "published"]` (line 18)

**Navigation:**
- "Tạo Brief →" → `/production?productId=${item.id}`
- "Xem tất cả →" → `/inbox`
- Tên sản phẩm: **KHÔNG click được** (chỉ là text, không có Link)

**Empty state:** "Tất cả sản phẩm đã được brief!" + CheckCircle icon

---

#### 1.6 WinningPatternsWidget — Winning Patterns

**Component:** `components/dashboard/winning-patterns-widget.tsx:60-209`
**API:** `GET /api/tracking/patterns` → `app/api/tracking/patterns/route.ts:38-138`

**Hiển thị gì:**
- 4 insight rows: Format thắng, Content type tốt nhất, SP win, Hook tốt nhất
- Summary footer: Winners count, Revenue, Commission
- Progress bar nếu < 10 videos tracked

**Data flow:**
- API load **TOÀN BỘ** `VideoTracking.findMany()` (không pagination) (line 40)
- Client-side aggregation: format map, content type map, product map, best hook
- Sort by avgViews (formats, types), by revenue (products)
- `hasEnoughData = totalTracked >= 10`

**3 trạng thái UI:**
1. Chưa có data → "Chưa có data tracking"
2. < 10 videos → progress bar + "Cần ít nhất 10 video"
3. ≥ 10 videos → full insights

**Navigation:** **KHÔNG có item nào click được**

---

### User flow

```
User mở Dashboard
  ↓
[1] Thấy banner amber nếu có dữ liệu mồ côi → click vào số → đi /inbox, /production, /channels
  ↓
[2] Thấy grid kênh hôm nay → thấy slots progress, metrics → click "Tạo Brief" hoặc "Lịch"
  ↓
[3] Đọc Bản tin sáng (AI brief) → biết hôm nay nên làm gì
    Bên phải: paste links nhanh
  ↓
[4] Xem danh sách SP nên tạo nội dung → click "Tạo Brief →" cho SP muốn
  ↓
[5] Xem Winning Patterns (nếu có data tracking)
```

---

## 2. Phân tích vấn đề

### 2a. Dữ liệu mồ côi — Orphan Data

**File:** `app/api/dashboard/orphan-stats/route.ts:18-23`

**Vấn đề chính: False positive trong query "SP chưa brief"**

```typescript
// Line 18-23
prisma.productIdentity.count({
  where: {
    inboxState: { in: ["scored", "briefed"] },
    briefs: { none: {} },
  },
})
```

**Phân tích:**
- Query đếm ProductIdentity có `inboxState = "scored"` HOẶC `"briefed"` mà KHÔNG có brief nào
- **Logical contradiction**: trạng thái `"briefed"` nghĩa là ĐÃ tạo brief → nhưng query lại yêu cầu `briefs: { none: {} }` (không có brief) → mâu thuẫn logic
- Trạng thái `"scored"` chưa có brief là **BÌNH THƯỜNG** — đó là SP đã chấm điểm nhưng chưa tạo brief, đây là workflow hợp lệ, KHÔNG phải "mồ côi"
- Con số 298 (hoặc tương tự) nhiều khả năng = tất cả SP đã scored chưa quyết định tạo brief + SP "briefed" nhưng brief bị xóa (edge case rất hiếm)

**Kết luận:** Query tạo ra số lượng cao giả tạo. Phần lớn là SP scored bình thường đang chờ user quyết định, KHÔNG phải orphan data.

**Vấn đề phụ:**
- "Brief chưa asset": brief vừa tạo chưa kịp sản xuất → cũng là workflow bình thường, không phải orphan
- "Slot trống": slots planned chưa assign content → cũng bình thường
- **Chỉ "Video chưa tracking" mới thực sự là orphan** — video đã published nhưng thiếu tracking record

**Đánh giá: Query logic SAI → số liệu gây hoang mang, user thấy 298 "mồ côi" nhưng thực tế chỉ vài item thực sự cần xử lý**

---

### 2b. Bản tin sáng — Morning Brief

**Files:**
- Widget: `components/dashboard/morning-brief-widget.tsx`
- API: `app/api/brief/today/route.ts`
- Generator: `lib/brief/generate-morning-brief.ts`

**Vấn đề 1: Tồn tại 2 API morning brief khác nhau, gây nhầm lẫn**

| API | File | Loại | Dùng bởi |
|-----|------|------|----------|
| `/api/brief/today` | `app/api/brief/today/route.ts` | AI-generated (Claude) | Dashboard widget |
| `/api/morning-brief` | `app/api/morning-brief/route.ts` | Rule-based | KHÔNG AI NÀO GỌI |

API `/api/morning-brief` có logic khác hoàn toàn (rule-based, 5-min cache, format khác) nhưng **không được gọi ở bất kỳ đâu trong UI**. Đây là dead code.

**Vấn đề 2: AI prompt quality**

Generator (`lib/brief/generate-morning-brief.ts:106-148`) gửi prompt dài cho Claude với:
- Danh sách kênh + classification
- SP mới + SP đã brief
- Metrics hôm qua
- Learning insights
- Weekly goal

**Ưu điểm:**
- Data rich, đa chiều
- Channel-aware (biết kênh nào cần làm gì)
- Có learning context (top hook, format, category)

**Nhược điểm:**
- Không có thông tin về **deadline** (event sắp tới, campaign deadline)
- Không tích hợp **Calendar events** từ InsightsEvent
- Produce_today items **KHÔNG link được** tới sản phẩm cụ thể (chỉ hiển thị tên text)
- Nếu AI parse fails → trả về brief rỗng, user thấy EmptyState → **không biết tại sao**

**Vấn đề 3: Mỗi item trong brief KHÔNG click được**

Toàn bộ nội dung brief (channel_tasks, produce_today, new_products_alert) chỉ render dạng text. User đọc "SP XYZ nên tạo 3 video" nhưng **KHÔNG thể click vào tên SP để xem chi tiết hoặc tạo brief trực tiếp**.

---

### 2c. Thêm sản phẩm nhanh — Quick Paste

**File:** `components/dashboard/quick-paste-widget.tsx:6-18`

**Vấn đề: Duplicate functionality**

- Dashboard QuickPasteWidget = exact same PasteLinkBox component dùng ở `/inbox`
- `/inbox` page đã có PasteLinkBox ở phần header
- User vào Inbox cũng paste được → widget trên dashboard không thêm giá trị mới
- Chiếm 1/3 width Row 2 → đẩy MorningBrief xuống 2/3 width

**Tuy nhiên:**
- Compact mode (2-row textarea) tiện cho quick action mà không cần rời dashboard
- Có thể có giá trị nếu user pattern là: mở app → paste links → xem brief
- Nhưng nếu user đã paste trước đó, widget này trống rỗng, chỉ hiện textarea trắng

---

### 2d. Nên tạo nội dung — Content Suggestions

**File:** `components/dashboard/content-suggestions-widget.tsx:20-120`

**Vấn đề 1: Tên sản phẩm KHÔNG click được**

```tsx
// Line 90-91 — chỉ là <p>, không phải <Link>
<p className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">
  {item.title ?? "Sản phẩm chưa đặt tên"}
</p>
```

User thấy tên SP nhưng không click vào được để xem chi tiết (giá, commission, score breakdown, ảnh lớn, etc.). Chỉ có "Tạo Brief →" link.

**Vấn đề 2: "Tạo Brief →" navigate tới đâu?**

Link: `/production?productId=${item.id}` — trang Production, truyền productId qua query string. Trang Production sẽ pre-select SP đó trong ProductSelector. Nhưng:
- User chưa hiểu SP này tốt ở đâu → muốn xem detail trước → KHÔNG CÓ CÁCH
- Không có trang `/products/${id}` hay `/inbox/${id}` để xem chi tiết ProductIdentity

**Vấn đề 3: "Xem tất cả →" dẫn tới `/inbox`**

Trang `/inbox` có table view với filter/sort/pagination → đây là đích đúng. Tuy nhiên:
- Inbox hiển thị ALL states (Mới, Đã bổ sung, Đã chấm, Đã brief, Đã xuất bản)
- Không có cách filter trực tiếp "chỉ xem SP nên tạo content" (tức scored chưa briefed)
- User phải tự chọn tab "Đã chấm" trên inbox → hiểu rằng đây là SP nên tạo content

**Vấn đề 4: Tiêu chí chọn SP đề xuất**

```typescript
// Line 25 — sort by score, fetch 20
fetchWithRetry("/api/inbox?sort=score&limit=20")
// Line 29-31 — client-side filter
.filter((p) => !EXCLUDED_STATES.includes(p.inboxState))
.slice(0, 8)
```

- Fetch 20 → filter bỏ briefed/published → top 8
- Tiêu chí: **chỉ dựa trên combinedScore** (điểm tổng hợp), không xét deltaType, contentPotentialScore, hay thời gian sản phẩm
- Không xét channel compatibility (SP có phù hợp với kênh nào không)
- Không xét seasonal/trending (SP có đang hot không)

---

### 2e. Các vấn đề khác phát hiện thêm

#### E1: WinningPatternsWidget — Performance issue

**File:** `app/api/tracking/patterns/route.ts:40-54`

```typescript
const allTracking = await prisma.videoTracking.findMany({
  include: { contentAsset: { select: { ... } } },
});
```

Query load **TOÀN BỘ** VideoTracking records + join ContentAsset. Không có:
- Pagination
- Date range filter
- Limit

Khi data lớn (1000+ videos), query này sẽ chậm và tốn memory. Nên thêm ít nhất date range filter (last 30/90 days) hoặc limit.

#### E2: WinningPatternsWidget — Không clickable

Không có item nào trong Winning Patterns là clickable. User thấy "Format thắng: Product Showcase" nhưng không thể:
- Click để xem list videos dùng format đó
- Click SP win để xem detail
- Click hook tốt nhất để xem video gốc

#### E3: ChannelTaskBoard — Metric "Cần brief" gây nhầm lẫn

**File:** `app/api/dashboard/channel-tasks/route.ts:79-81`

```typescript
const needsBrief = channelSlots
  .filter((s) => s.status === "planned")
  .reduce((sum, s) => sum + s._count, 0);
```

"Cần brief" = slots `planned` hôm nay. Nhưng slot planned chưa chắc cần brief ngay — có thể user đã planned slot cho tuần sau. Label nên rõ hơn: "Slots chưa có nội dung".

#### E4: MorningBriefWidget — Auto-trigger AI call khi load trang

Mỗi lần user mở dashboard, nếu chưa có brief hôm nay → auto trigger `generateMorningBrief()` → gọi Claude API → tốn token + chậm load.
- Không có UI indicator cho user biết đang gọi AI
- Loading skeleton hiển thị nhưng không nói rõ "Đang tạo brief..."
- Nếu API key hết quota → silent fail → EmptyState, user không biết tại sao

#### E5: Không có data freshness indicator

Không widget nào hiển thị "data cập nhật lúc nào" (trừ brief có `generatedAt`). User không biết orphan stats, patterns, channel tasks có phải real-time hay stale data.

---

## 3. Đề xuất nâng cấp

### P0 — Phải fix (logic sai, gây hiểu lầm)

#### P0-1: Fix Orphan Stats query

**File:** `app/api/dashboard/orphan-stats/route.ts:18-23`

**Thay đổi:**
- Bỏ `"briefed"` khỏi filter `scoredWithoutBriefs` — SP briefed mà không có brief là edge case cực hiếm, nên tách riêng
- Đổi tên metric: `scoredWithoutBriefs` → `scoredNotActioned` hoặc rename label thành "SP đã chấm chưa brief" thay vì "mồ côi"
- Xem xét BỎ HOÀN TOÀN metric "SP chưa brief" khỏi orphan alert — vì đây là trạng thái bình thường, không phải orphan
- Chỉ giữ lại 3 metrics thực sự orphan: briefs without assets, published without tracking, empty slots

```typescript
// Đề xuất query mới — chỉ đếm orphan thật
// 1. Bỏ scored → không phải orphan
// 2. Briefed without briefs → edge case, tách riêng nếu cần
// 3. Giữ nguyên 3 metrics còn lại
```

#### P0-2: Make Content Suggestions items clickable

**File:** `components/dashboard/content-suggestions-widget.tsx:90`

**Thay đổi:**
- Wrap tên SP trong `<Link href={/inbox/${item.id}}>` hoặc mở modal detail
- Hoặc ít nhất: click vào row → navigate tới production với SP đó

#### P0-3: Make Morning Brief items actionable

**File:** `components/dashboard/morning-brief-widget.tsx:228-243`

**Thay đổi:**
- `produce_today` items: nếu có product id → link tới `/production?productId=${id}`
- `channel_tasks` items: link channel name tới `/channels/${channelId}`
- Cần sửa generator (`generate-morning-brief.ts`) trả về product IDs + channel IDs trong response

---

### P1 — Nên fix (UX improvement)

#### P1-1: Bỏ hoặc redesign QuickPasteWidget

**Đề xuất:** Bỏ QuickPasteWidget → MorningBriefWidget full width

**Lý do:**
- Duplicate với `/inbox` paste
- Chiếm không gian đẩy brief thu hẹp
- Morning brief quan trọng hơn, cần full width để hiển thị đầy đủ

**Alternative:** Giữ nhưng đổi thành "Hành động nhanh" widget gộp: paste links + tạo brief nhanh + import data

#### P1-2: Thêm pagination/date filter cho Patterns API

**File:** `app/api/tracking/patterns/route.ts:40`

**Thay đổi:**
- Thêm query params: `?days=30` (default 30 ngày)
- Filter `VideoTracking` by date range
- Hoặc ít nhất thêm `take: 500` limit

#### P1-3: Xóa dead API `/api/morning-brief`

**Files:**
- `app/api/morning-brief/route.ts`
- `app/api/morning-brief/brief-intelligence-enricher.ts`
- `app/api/morning-brief/brief-campaign-analyzer.ts`

Không được sử dụng bởi bất kỳ component nào. Gây confusion khi maintain code.

#### P1-4: Loading indicator cho AI brief generation

**File:** `components/dashboard/morning-brief-widget.tsx:125-141`

**Thay đổi:**
- Skeleton loading → thêm text "Đang tạo bản tin với AI..." (chỉ lần đầu khi chưa có cache)
- Error state: hiện message rõ hơn thay vì EmptyState chung chung

#### P1-5: Tích hợp Calendar events vào Morning Brief

**File:** `lib/brief/generate-morning-brief.ts`

**Thay đổi:**
- Thêm query `InsightsEvent` sắp tới (3-7 ngày)
- Đưa vào AI prompt → brief sẽ cảnh báo "Ngày mai có event XYZ, chuẩn bị content"

---

### P2 — Nice to have

#### P2-1: Data freshness indicators

Thêm "Cập nhật lúc HH:MM" cho mỗi widget, hoặc ít nhất cho orphan stats + patterns.

#### P2-2: WinningPatternsWidget clickable items

Link format/product/hook tới filtered views trong production hoặc tracking page.

#### P2-3: ChannelTaskBoard — thêm label rõ hơn

Đổi "Cần brief" → "Slot chưa có content" hoặc "Cần sản xuất"

#### P2-4: Content Suggestions — đa tiêu chí

Thay vì sort chỉ bởi combinedScore, xem xét:
- Ưu tiên deltaType = "breakout" (SP đang trending)
- Ưu tiên SP mới (scored gần đây)
- Xét contentPotentialScore riêng

---

## 4. Dashboard lý tưởng

### Nguyên tắc thiết kế

**Use case chính:** Marketer mở app mỗi sáng, cần biết **ngay** hôm nay làm gì.

**Mỗi widget trả lời 1 câu hỏi:**

| Câu hỏi | Widget |
|----------|--------|
| "Hôm nay kênh nào cần làm gì?" | Channel Task Board |
| "Hôm nay nên sản xuất SP nào?" | Morning Brief (AI) |
| "Có SP nào đáng chú ý chưa xử lý?" | Action Queue |
| "Hiệu suất đang thế nào?" | Performance Snapshot |
| "Có gì bất thường không?" | Alerts |

### Layout đề xuất

```
┌─────────────────────────────────────────────────────┐
│  [Alerts Bar] — Chỉ hiện khi có vấn đề thật        │
│  (orphan THẬT, API errors, quota warning)            │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  [Bản tin sáng — FULL WIDTH]                         │
│  AI brief với greeting, channel tasks, produce today │
│  MỌI item đều clickable → navigate tới detail/action │
│  Nút "Tạo lại" + timestamp "Tạo lúc 8:05 AM"       │
└─────────────────────────────────────────────────────┘

┌─────────────────────┬───────────────────────────────┐
│  [Kênh hôm nay]      │  [Action Queue]               │
│  Grid cards per       │  Top 5 SP nên làm content     │
│  channel              │  Mỗi item: ảnh + tên (click   │
│  Slots + metrics      │  → detail) + score + "Tạo     │
│  Quick actions        │  Brief →"                     │
│                       │  "Xem tất cả" → /inbox?state= │
│                       │  scored (filter sẵn)           │
└─────────────────────┴───────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  [Performance Snapshot — nếu có data tracking]       │
│  Row compact: Winners | Revenue | Top format | Trend │
│  Mỗi item clickable → /insights hoặc /tracking      │
└─────────────────────────────────────────────────────┘
```

### Thay đổi so với hiện tại

| Hiện tại | Đề xuất | Lý do |
|----------|---------|-------|
| Orphan alert luôn hiện với số lớn giả | Alert bar chỉ hiện orphan THẬT | Giảm noise, tăng trust |
| Brief 2/3 + Paste 1/3 | Brief full width, bỏ paste | Brief quan trọng nhất, paste đã có ở /inbox |
| Content suggestions dưới brief | Action Queue cạnh channels | Gần action hơn, user scan nhanh hơn |
| Winning Patterns full width | Performance Snapshot compact | Gọn gàng, chỉ highlight, chi tiết ở /insights |
| Items không click được | MỌI item clickable | Dashboard là hub điều hướng, không phải trang đọc |

### Nguyên tắc mọi item phải actionable

1. **Tên sản phẩm** → click → modal detail hoặc `/inbox/${id}`
2. **Tên kênh** → click → `/channels/${id}`
3. **Metric số** → click → filtered list
4. **Format/hook** → click → filtered production view
5. **"Tạo Brief"** → click → `/production?productId=${id}`
6. **Alert items** → click → filtered view với chỉ orphan items, KHÔNG phải toàn bộ page

---

## Phụ lục: Trang chi tiết sản phẩm đã tồn tại

Trang `/inbox/[id]` (`app/inbox/[id]/page.tsx`, 525 dòng) đã tồn tại với đầy đủ thông tin:
- Header: ảnh, tên, category, shop, badges, AI score
- Key metrics: hoa hồng, bán 7D, giá, xếp hạng
- Nút "Tạo Brief AI" → `/production?productId=${id}`
- KOL/Video/Livestream stats
- Content tips + Platform strategy
- AI intelligence: Win probability, Lifecycle, Channel recommendations
- Personal notes, Affiliate link, Profit estimator
- Similar products (cùng category, giá ±50%)
- Score breakdown (6 tiêu chí)
- Snapshot history

**Kết luận:** Content Suggestions widget CÓ THỂ link trực tiếp tới `/inbox/${item.id}` — trang detail đầy đủ đã sẵn sàng. Đây là P0 fix dễ implement nhất.

---

## Unresolved Questions

1. **Con số "298"** được user đề cập trong task-3.md — cần xác nhận bằng cách chạy query thực tế trên production DB để biết chính xác breakdown (bao nhiêu scored, bao nhiêu briefed-without-briefs)
2. **Calendar events integration** — model `InsightsEvent` có đủ data để đưa vào morning brief không?
