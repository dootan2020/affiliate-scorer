# Audit: Dashboard Widget, Production Page & Score Consistency

**Ngày:** 2026-03-05
**Phạm vi:** Widget "Nên tạo nội dung", Production page, hiển thị score, workflow dashboard→production→brief

---

## 1. Widget "Nên tạo nội dung" — Channel Name vs Persona

### 1.1 API response trả gì?

- **API:** `app/api/dashboard/suggestions/route.ts` gọi `computeSmartSuggestions()`
- **Field channelName:** lấy từ `ch.personaName` (`lib/suggestions/compute-smart-suggestions.ts:~456`)
- **DB thực tế:**
  - Kênh 1: `name='Skincare Hệ Lười'`, `persona='lazyskingirl'`, `personaName='Zin Thích Glow'`, `niche='beauty_skincare'`
  - Kênh 2: `name='Gia Dụng Thông Minh'`, `persona='giadungthongminh'`, `personaName='Chị Gia Dụng'`, `niche='Home & Living'`
- **Widget tab label:** render từ `channelName` = `personaName` → hiện "Zin Thích Glow", "Chị Gia Dụng"
- **Kết luận:** Đúng. `personaName` là tên nhân vật kênh, phù hợp làm tab label hơn `name` (tên kênh nội bộ) hay `persona` (handle).

### 1.2 SP đề xuất — score phân tích

**Kênh Beauty (Zin Thích Glow):**
- Top SP trong widget: smartScore max ~64
- Top combinedScore beauty trong inbox: 89 (Tinh Chất AHC)
- **Tại sao smartScore thấp hơn nhiều?**
  - SmartScore formula (`compute-smart-suggestions.ts`): `combinedScore × 0.45 + urgency × 0.25 + channelFit × 0.20 + diversity × 0.10`
  - Nếu combinedScore = 89 → base = 89 × 0.45 = 40.05
  - Max lý thuyết khi tất cả bonus = 100: 40.05 + 25 + 20 + 10 = 95.05
  - Thực tế urgency/channelFit/diversity không bao giờ max → smartScore ~60-64 cho SP tốt nhất
- **Vấn đề:** SmartScore KHÔNG phải "AI score" nhưng widget label hiện "Điểm AI" → gây nhầm lẫn

**Kênh Gia Dụng (Chị Gia Dụng):**
- Top SP: smartScore ~58-62
- Nhiều SP category "Phụ kiện thời trang" lọt vào tab Gia Dụng → **niche mismatch** (xem 1.3)

### 1.3 SP đề xuất có đúng niche không?

**Cơ chế matching:** `lib/suggestions/niche-category-map.ts`
- Map key `home_living` → substrings: `["gia dụng", "nội thất", "nhà cửa", "đồ dùng nhà"]`
- Fallback: nếu niche không có trong map → bidirectional `includes()` giữa niche và category

**Bug phát hiện — Kênh Gia Dụng:**
- DB niche = `"Home & Living"` (tiếng Anh, có spaces & ký tự đặc biệt)
- Map key = `"home_living"` (lowercase, underscore)
- Lookup: `NICHE_CATEGORY_MAP["Home & Living"]` → `undefined` → fallback
- Fallback: `"Home & Living".includes("Phụ kiện thời trang")` = false, `"Phụ kiện thời trang".includes("Home & Living")` = false → **KHÔNG match**
- **Nhưng** SP "Phụ kiện thời trang" vẫn hiện trong tab → vì khi không có SP nào match niche, thuật toán lấy SP có score cao nhất bất kể category → **SP thời trang lọt vào tab Gia Dụng**

**Bug root cause:** Niche key trong DB (`"Home & Living"`) không khớp map key (`"home_living"`). Cần normalize niche trước khi lookup: lowercase + replace spaces/special chars → underscore.

**Kênh Beauty:** Hoạt động đúng. DB niche = `"beauty_skincare"` khớp map key → SP beauty match chính xác.

---

## 2. Production Page — Product Selector

### 2.1 Khi chọn kênh, SP list thay đổi không?

- **Component:** `components/production/product-selector.tsx`
- **Query:** 3 parallel fetches tới `/api/inbox?state=scored`, `state=briefed`, `state=published` (pageSize=100)
- **Filter theo channel/niche:** **KHÔNG CÓ**. Selector hiện TẤT CẢ SP bất kể kênh nào được chọn.
- **Hệ quả:** User chọn kênh Beauty → SP list vẫn hiện SP Gia Dụng, Thời Trang, v.v. → phải tự lọc bằng mắt.

### 2.2 SP list sort thế nào?

- Client-side sort: `combinedScore DESC` (`product-selector.tsx`)
- SP archived: **có bị filter** — query chỉ lấy state `scored/briefed/published`, không lấy `archived`
- SP đã briefed: **CÓ hiện lại** (state `briefed` vẫn trong query) — không đánh dấu "Đã brief"
- **Vấn đề:** Không phân biệt visual giữa SP chưa brief vs đã brief → user có thể brief lại cùng SP

### 2.3 SP "ảo" vẫn top

- "Thẻ Voucher/Quà Tặng" — combinedScore: 94, inboxState: `scored` (CHƯA archived)
- "Thư Cảm Ơn" — combinedScore: 93, inboxState: `scored` (CHƯA archived)
- **Nguyên nhân:** Chưa ai archive các SP này. Chức năng archive mới được thêm (session này).
- **Giải pháp:** Archive các SP ảo → tự động biến mất khỏi selector và suggestions.

---

## 3. Hiển thị Score — Nhất quán giữa các trang

### 3.1 Widget "Nên tạo nội dung"

- **File:** `components/dashboard/suggestion-product-row.tsx`
- Badge cam lớn: `product.smartScore` (label "Điểm AI" — **sai tên**)
- Text nhỏ bên dưới: `M:{marketScore} C:{contentPotentialScore}`
- combinedScore: **KHÔNG hiện**
- **User thấy:** "Điểm AI 64/100" → nghĩ SP yếu. Nhưng combinedScore thật = 89.

### 3.2 Inbox table

- **File:** `components/inbox/inbox-table.tsx:151`
- Cột ĐIỂM: `item.combinedScore` (đã fix trước đó)
- AI raw score: **không hiện** riêng
- **User thấy:** Score 89 → khớp DB

### 3.3 Production selector

- **File:** `components/production/product-selector.tsx`
- Score badge: `🔥 {combinedScore}` — hiện combinedScore
- **User thấy:** 94, 93, 89 → khớp DB

### 3.4 Tổng hợp — 3 số khác nhau ở 3 nơi

| Vị trí | Field hiện | SP "Tinh Chất AHC" | Label |
|--------|-----------|-------------------|-------|
| Widget suggestions | smartScore | 64 | "Điểm AI" (sai) |
| Inbox table | combinedScore | 89 | "Điểm" |
| Production selector | combinedScore | 89 | 🔥 badge |

**Vấn đề:** User thấy cùng SP có 64 ở widget nhưng 89 ở inbox → confusing.

**Đề xuất:**
1. Widget: đổi label "Điểm AI" → "Điểm gợi ý" hoặc "Smart Score"
2. Hoặc: hiện combinedScore làm số chính, smartScore làm secondary
3. Giữ combinedScore nhất quán ở inbox + production (đã OK)

---

## 4. Workflow Dashboard → Production → Brief

### 4.1 Flow hiện tại

1. Widget "Nên tạo nội dung" → Click "Brief →" trên SP row
2. Link: `/production?productId=X&channel=Y` (`suggestion-product-row.tsx`)
3. Production page nhận params → auto-select SP + kênh (đã fix trước đó)
4. User tạo brief → export

### 4.2 Vấn đề trong flow

- **Chọn SP khác sau khi vào production:** SP list KHÔNG filter theo kênh đã chọn (mục 2.1)
- **SP đã brief:** Không có visual indicator → user brief lại SP cũ mà không biết
- **SP ảo top list:** "Thẻ Voucher" score 94 luôn đứng đầu → user phải cuộn qua

### 4.3 Flow mong đợi (chưa implement)

1. Chọn kênh → SP list filter theo niche kênh
2. SP archived → ẩn (đã OK sau fix archive)
3. SP đã briefed → hiện nhưng đánh dấu "Đã brief" (badge hoặc opacity thấp)
4. Sort: combinedScore DESC (đã OK)

---

## 5. Vấn đề tiềm ẩn khác

### 5.1 Channel name consistency

| Vị trí | Field dùng | Kết quả |
|--------|-----------|---------|
| Widget tab | personaName | "Zin Thích Glow" |
| Production dropdown | name | "Skincare Hệ Lười" |
| Morning Brief | personaName | "Zin Thích Glow" |

**Vấn đề:** Widget dùng personaName nhưng Production dùng name → user thấy tên khác nhau cho cùng kênh.

### 5.2 Niche matching không dùng chung logic

- **Widget suggestions:** dùng `matchesNiche()` từ `niche-category-map.ts`
- **Production selector:** **KHÔNG dùng niche matching** — hiện tất cả SP
- **Morning Brief:** dùng `matchesNiche()` — cùng logic với widget
- **Hệ quả:** Widget và Brief có thể gợi ý đúng niche, nhưng production không filter → inconsistent UX

### 5.3 pageSize limit

- Production selector query pageSize=100 → nếu có >100 SP scored → mất SP cuối
- Hiện tại ~394 SP total, ~280 scored → **đã vượt 100**, nhiều SP không hiện trong selector

### 5.4 Niche key format không chuẩn hóa

- Kênh 1: niche = `"beauty_skincare"` (snake_case, tiếng Anh) → khớp map
- Kênh 2: niche = `"Home & Living"` (Title Case, có &) → KHÔNG khớp map
- Cần enforce format chuẩn khi lưu niche vào DB hoặc normalize trước lookup

---

## Tổng kết — Mức độ ưu tiên

| # | Vấn đề | Mức độ | Effort |
|---|--------|--------|--------|
| 1 | Niche key "Home & Living" không khớp map | **Critical** — SP sai kênh | Nhỏ: normalize niche key |
| 2 | Production selector không filter theo niche | **High** — UX kém | Trung bình: thêm niche filter |
| 3 | Widget label "Điểm AI" gây nhầm với combinedScore | **High** — confusing | Nhỏ: đổi label |
| 4 | SP ảo chưa archived (Voucher, Thư Cảm Ơn) | **High** — top list sai | Nhỏ: archive thủ công |
| 5 | Production selector pageSize=100 thiếu SP | **Medium** — mất data | Nhỏ: tăng limit hoặc pagination |
| 6 | Channel name inconsistent (personaName vs name) | **Medium** — confusing | Nhỏ: thống nhất dùng personaName |
| 7 | SP đã brief không đánh dấu trong selector | **Low** — tiện ích | Trung bình: thêm badge |
