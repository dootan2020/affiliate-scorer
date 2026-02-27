# Build GĐ1: PASTR — Kênh TikTok Affiliate Beauty & Skincare (100% AI)

## Bối cảnh

PASTR đã có: Inbox (upload FastMoss XLSX), AI Scoring, Brief Generation, Production page (3 tab), Product Gallery.

Cần build thêm cho GĐ1: hỗ trợ đầy đủ workflow xây 1 kênh TikTok affiliate, niche Beauty & Skincare, sản xuất video 100% bằng AI.

Tham khảo plan chi tiết: `plans/PLAN-PASTR-TIKTOK-AFFILIATE.md`

## Quyết định đã chốt

- **Niche:** Beauty & Skincare
- **Sản xuất:** 100% AI (không quay thật, không talking head)
- **Video formats chính:**
  1. Before/After — convert cao nhất (1.5-2.5% CR)
  2. Product Showcase — xoay, zoom, texture close-up
  3. Slideshow + Voiceover — dễ nhất, volume cao
- **Content mix mục tiêu:** 40% giải trí / 25% giáo dục / 20% review / 15% bán hàng
- **Tần suất:** Bắt đầu 1-2 video/ngày, tăng dần

## Build theo thứ tự

### Module 1: Channel Profile (2 ngày)

**Trang mới: `/channels`**

DB Schema:
```
TikTokChannel {
  id              String   @id
  name            String   // Tên kênh
  handle          String?  // @handle TikTok
  niche           String   // "beauty_skincare"
  
  // Persona
  personaName     String   // Tên nhân vật kênh (VD: "Chi Lan Beauty")
  personaDesc     String   // Mô tả ngắn persona
  voiceStyle      String   // "casual" | "professional" | "energetic" | "calm"
  targetAudience  String   // VD: "Nữ 18-35, quan tâm skincare"
  
  // Style Guide
  colorPrimary    String?  // Hex color
  colorSecondary  String?
  fontStyle       String?  // "modern" | "elegant" | "playful" | "minimal"
  editingStyle    String?  // "fast_cut" | "smooth" | "cinematic" | "minimal"
  
  // Content Strategy
  contentMix      Json?    // { entertainment: 40, education: 25, review: 20, selling: 15 }
  postingSchedule Json?    // { mon: ["10:00", "19:00"], tue: [...], ... }
  
  isActive        Boolean  @default(true)
  createdAt       DateTime
  updatedAt       DateTime
}
```

UI trang `/channels`:
- Nếu chưa có kênh → hiện form tạo kênh đầu tiên (onboarding wizard)
- Nếu có kênh → hiện card kênh với thông tin tổng quan
- Click vào kênh → trang chi tiết `/channels/[id]` với form edit
- Style guide editor: color picker, dropdown cho font/edit style, textarea cho persona
- Hiện preview: "Kênh này sẽ tạo content với tone [voiceStyle], style [editingStyle], nhắm đến [targetAudience]"

Sidebar navigation: thêm link "Kênh TikTok" (icon: TV hoặc Radio)

### Module 2: Brief Đa Dạng Theo Content Type & Video Format (2 ngày)

**Sửa brief generation** để nhận thêm context:

Khi tạo brief, user chọn:
1. **Content type** — 4 loại:
   - 🎭 Giải trí (trending, hài, viral hook) — mục tiêu: reach, follower
   - 📚 Giáo dục (skincare tips, ingredients, routine) — mục tiêu: trust, save
   - 📝 Review (trải nghiệm SP, so sánh) — mục tiêu: engagement, soft sell
   - 🛒 Bán hàng (demo SP, before/after, CTA rõ) — mục tiêu: conversion

2. **Video format** — 6 format phù hợp Beauty 100% AI:
   - `before_after` — Before/After transformation (AI transition)
   - `product_showcase` — SP xoay, zoom, texture close-up (Kling animation)
   - `slideshow_voiceover` — 5-7 ảnh + text + giọng AI (CapCut/Picsart)
   - `tutorial_steps` — "3 bước skincare" dạng slideshow + voiceover
   - `comparison` — So sánh 2 SP hoặc có/không dùng SP
   - `trending_hook` — Hook trending + gắn SP vào cuối

3. **Target duration** — 15s / 30s / 45s / 60s

**Sửa AI prompt** cho brief generation — thêm vào system prompt:

```
Channel persona: {personaName} — {personaDesc}
Voice style: {voiceStyle}
Target audience: {targetAudience}
Content type: {contentType} — mục tiêu: {goal}
Video format: {videoFormat}
Target duration: {targetDuration}

Tạo brief phù hợp với:
- Persona và voice style của kênh
- Content type (giải trí khác bán hàng khác review)
- Video format cụ thể (before/after cần 2 phase rõ, showcase cần mô tả góc máy, slideshow cần list ảnh + text overlay mỗi slide)
```

**Output brief phải có thêm:**
- Hook gợi ý (3 giây đầu) — quan trọng nhất, tạo 2-3 options
- Sequence cụ thể: Scene 1 (0-3s) → Scene 2 (3-10s) → ... → CTA (cuối)
- Mỗi scene: mô tả visual + text overlay + prompt AI video
- Suggest nhạc/sound style (không cụ thể bài, chỉ style: upbeat/calm/dramatic/trending)
- CTA gợi ý phù hợp content type

**DB:** Thêm fields vào ContentAsset hoặc bảng mới:
```
contentType     String?  // "entertainment" | "education" | "review" | "selling"
videoFormat     String?  // "before_after" | "product_showcase" | "slideshow_voiceover" | ...
targetDuration  Int?     // seconds
channelId       String?  → TikTokChannel
hookOptions     Json?    // ["Hook 1...", "Hook 2...", "Hook 3..."]
sceneSequence   Json?    // [{ time: "0-3s", visual: "...", text: "...", prompt: "..." }, ...]
soundStyle      String?  // "upbeat" | "calm" | "dramatic" | "trending"
ctaSuggestion   String?
```

### Module 3: Content Calendar (3 ngày)

**Trang mới hoặc tab mới trong `/production`**

DB Schema:
```
ContentSlot {
  id                  String   @id
  channelId           String   → TikTokChannel
  scheduledDate       DateTime // Ngày đăng
  scheduledTime       String?  // "10:00" | "19:00"
  
  contentType         String   // "entertainment" | "education" | "review" | "selling"
  videoFormat         String?  // format gợi ý
  
  productIdentityId   String?  → ProductIdentity  // SP gắn vào slot (nếu có)
  contentAssetId      String?  → ContentAsset      // Brief đã tạo (nếu có)
  
  status              String   @default("planned") // "planned" | "briefed" | "produced" | "published" | "skipped"
  notes               String?
  
  createdAt           DateTime
}
```

UI:
- **Calendar view tuần** — 7 cột (Thứ 2 → Chủ nhật), mỗi cột 3-5 slots
- Mỗi slot hiện: thời gian + badge content type (màu khác nhau) + tên SP (nếu có) + status
- **Drag-drop SP** từ sidebar (danh sách SP đã scored) vào slot
- Khi drop SP vào slot → hiện dialog chọn content type + video format → bấm "Tạo brief" → gọi brief gen
- **Auto-suggest**: nếu user chưa chọn content type, suggest dựa trên content mix target (40/25/20/15)
- **Tuần trước/sau**: navigation giữa các tuần
- **Stats bar trên cùng**: "Tuần này: 8/14 slots filled | Giải trí: 3 | Giáo dục: 2 | Review: 2 | Bán hàng: 1" + progress bar content mix
- Slot đã published → hiện tick xanh
- Slot trống → hiện nút "+ Thêm" nhỏ

Color code content type:
- 🎭 Giải trí: xanh dương
- 📚 Giáo dục: tím
- 📝 Review: cam
- 🛒 Bán hàng: đỏ

### Module 4: Material Pack Tăng Cường (1 ngày)

Sửa brief card trong tab "Đang sản xuất" — Export Pack bây giờ phải có thêm:

**Per video format, prompt templates khác nhau:**

Before/After:
```
Scene 1 (Before): [Prompt Kling] Ảnh da/tóc/... chưa dùng SP, ánh sáng tự nhiên, close-up
Scene 2 (Transition): [Prompt Kling] Smooth morph transition, magic glow effect
Scene 3 (After): [Prompt Kling] Ảnh da/tóc/... sau dùng SP, glowing, healthy
Scene 4 (Product): [Prompt Kling] SP xoay, studio lighting, clean background
```

Product Showcase:
```
Scene 1: [Prompt Kling] SP xoay 360 chậm, studio lighting, white background
Scene 2: [Prompt Kling] Close-up texture/chi tiết SP, macro shot
Scene 3: [Prompt Kling] SP trong bối cảnh lifestyle (bàn trang điểm, phòng tắm)
Scene 4: [Prompt Kling] Tay cầm SP, mở nắp/bôi (nếu phù hợp)
```

Slideshow + Voiceover:
```
Slide 1: Ảnh SP chính + text "Bạn có biết...?" (hook)
Slide 2: Ảnh SP chi tiết + text benefit 1
Slide 3: Ảnh SP chi tiết + text benefit 2
Slide 4: Ảnh lifestyle + text "Kết quả sau X ngày"
Slide 5: Ảnh SP + giá + CTA "Link trong bio"
Voiceover script: [toàn bộ script cho AI TTS]
```

**Copy buttons rõ ràng:** Mỗi scene có [📋 Copy prompt Kling] [📋 Copy prompt Veo3]

### Module 5: Video Tracking (3 ngày)

**Tab mới trong `/production`: "Kết quả"**

Hoặc thêm fields vào brief card ở tab "Đã hoàn thành".

DB Schema — thêm fields vào ContentAsset hoặc bảng mới:
```
VideoTracking {
  id                String   @id
  contentAssetId    String   → ContentAsset
  
  // TikTok metrics (manual input)
  tiktokVideoUrl    String?  // Link video đã đăng
  publishedAt       DateTime?
  views24h          Int?     // Lượt xem sau 24h
  views7d           Int?     // Lượt xem sau 7 ngày
  likes             Int?
  comments          Int?
  shares            Int?
  saves             Int?
  
  // Conversion
  clicksToShop      Int?     // Clicks vào giỏ hàng
  orders            Int?     // Số đơn hàng
  revenue           Float?   // Doanh thu (VND)
  commission        Float?   // Hoa hồng nhận được (VND)
  
  // Đánh giá
  isWinner          Boolean  @default(false) // Đánh dấu video thắng
  winReason         String?  // "high_views" | "high_conversion" | "high_engagement"
  
  updatedAt         DateTime
}
```

UI:
- Sau khi video đăng TikTok, user vào tab "Kết quả" → nhập metrics
- Hoặc ở brief card (tab "Đã hoàn thành") có nút "Cập nhật kết quả" → form nhập
- Bảng tổng hợp: Video | Format | Views | Orders | Revenue | Status (🏆 Win / ❌ Lose / ⏳ Đang test)
- **Auto-detect winner**: views 24h ≥ 500 AND (orders ≥ 3 OR CTR ≥ 1.5%) → đánh dấu 🏆
- Filter: theo SP, theo format, theo content type, theo tuần

### Module 6: Winning Patterns (2 ngày)

**Sửa Dashboard / Morning Brief** để hiện thêm insights:

Từ data tracking, phân tích:
- **Format nào thắng:** Before/After có avg views X, Slideshow có avg views Y → recommend
- **Hook nào thắng:** So sánh 2-3 hook options của mỗi brief → hook nào có views cao hơn
- **Content type nào engage:** Giải trí có reach X, Bán hàng có conversion Y
- **SP nào win:** Top 3 SP theo revenue/commission
- **Thời gian đăng nào tốt:** Slot nào có avg views cao hơn

Hiện trong Morning Brief:
```
📊 Tuần này:
- Format thắng: Before/After (avg 2.3K views)
- Hook thắng: Câu hỏi "Bạn có biết...?" (1.8x reach vs hook thường)
- SP win: [Serum XYZ] — 12 đơn, 850K commission
- Giờ đăng tốt nhất: 19:00-20:00

💡 Gợi ý tuần tới:
- Tăng Before/After từ 3 → 5 video/tuần
- Tạo thêm 3 video cho [Serum XYZ] với hook variations
- Thử format Comparison cho [SP mới]
```

Cần có **đủ data** mới hiện phần này (≥10 videos tracked). Nếu chưa đủ → hiện "Cần thêm data. Đăng và track ít nhất 10 video để có insights."

## Thứ tự build

```
Tuần 1:
  Ngày 1-2: Module 1 (Channel Profile)
  Ngày 3-4: Module 2 (Brief Đa Dạng)
  Ngày 5:   Module 4 (Material Pack)

Tuần 2:
  Ngày 1-3: Module 3 (Content Calendar)
  Ngày 4-5: Module 5 (Video Tracking) — phần DB + form nhập

Tuần 3:
  Ngày 1-2: Module 5 (Video Tracking) — phần bảng tổng hợp + auto-detect winner
  Ngày 3-4: Module 6 (Winning Patterns) — dashboard + morning brief
  Ngày 5:   Polish, fix bugs, test end-to-end
```

## Test checklist sau khi build xong

1. Tạo kênh "Chi Lan Beauty" → persona, style guide → save OK
2. Vào tạo brief → chọn content type "Bán hàng" + format "Before/After" + SP từ FastMoss → brief ra đúng format, có hook options, có scene sequence, có prompt Kling per scene
3. Tạo brief format "Slideshow + Voiceover" → brief có list slides + voiceover script
4. Mở Content Calendar → kéo SP vào slot thứ 3, 19:00 → chọn type + format → tạo brief từ calendar
5. Stats bar hiện đúng content mix hiện tại vs target
6. Sản xuất xong → nhập tracking: 1500 views, 5 orders → auto-detect winner
7. Morning Brief hiện "Format thắng: Before/After"
8. Build 0 lỗi

## Lưu ý quan trọng

- **Không phá code cũ**: Inbox, Scoring, Production 3 tab hiện tại vẫn hoạt động bình thường
- **Channel là optional lúc đầu**: Nếu user chưa tạo channel, brief gen vẫn hoạt động như cũ (backward compatible)
- **Sidebar navigation** cần update: thêm "Kênh TikTok" và "Lịch đăng"
- **Mobile responsive**: Calendar view có thể đơn giản hơn trên mobile (list view thay vì grid)
