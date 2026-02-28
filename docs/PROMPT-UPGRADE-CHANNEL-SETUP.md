# Nâng cấp trang Kênh TikTok: AI Generate + Expert Fields

## Bối cảnh

Form tạo kênh hiện tại (`/channels`) chỉ có thông tin cơ bản (tên, persona, voice, colors). Cần nâng cấp lên mức chuyên gia xây kênh TikTok với đầy đủ chiến lược, và thêm tính năng AI tự động generate toàn bộ profile kênh.

## 2 chế độ tạo kênh

### Chế độ 1: AI Generate (mặc định, khuyến khích)

User chỉ nhập 3 field:
- **Niche cụ thể** (text) — VD: "Skincare cho da dầu mụn", "Makeup tự nhiên đi làm"
- **Target audience** (text) — VD: "Nữ 18-30, sinh viên/nhân viên văn phòng, budget trung bình"
- **Tone mong muốn** (select) — Vui vẻ Gen Z / Chuyên gia uy tín / Chị gái tâm sự / Honest review thẳng thắn

Bấm **"✨ AI Tạo Profile Kênh"** → AI generate toàn bộ fields bên dưới → hiện preview → user review, edit nếu muốn → Save.

### Chế độ 2: Thủ công

User tự điền tất cả fields. Link "Tôi muốn tự điền" chuyển sang form đầy đủ.

## Schema mới cho TikTokChannel

Giữ nguyên các field cũ, thêm fields mới:

```
TikTokChannel {
  // === CŨ (giữ nguyên) ===
  id, name, handle, niche, personaName, personaDesc, 
  voiceStyle, targetAudience, colorPrimary, colorSecondary,
  fontStyle, editingStyle, isActive, createdAt, updatedAt

  // === MỚI ===
  
  // Sub-niche & Positioning
  subNiche          String?   // "Da dầu mụn", "Makeup công sở", "Mỹ phẩm bình dân"
  usp               String?   // Unique selling point: "Review 100% honest, có data thành phần"
  
  // Content Pillars (3-5 trụ cột nội dung)
  contentPillars    Json?     // ["Review SP", "Routine sáng/tối", "Myth-busting thành phần", "Before/after", "Trending + tip"]
  
  // Hook Bank (10-20 hook templates)
  hookBank          Json?     // ["Đừng mua X nếu chưa biết điều này", "3 ngày dùng [SP] và đây là kết quả", ...]
  
  // Content Mix (%)
  contentMix        Json?     // { entertainment: 40, education: 25, review: 20, selling: 15 }
  
  // Posting Strategy
  postsPerDay       Int?      // 1-5
  postingSchedule   Json?     // { mon: { times: ["10:00","19:00"], focus: "review" }, tue: {...}, ... }
  seriesSchedule    Json?     // [{ name: "Thứ 3 Review", dayOfWeek: 2, contentPillar: "Review SP" }, ...]
  
  // CTA Strategy
  ctaTemplates      Json?     // { entertainment: "Follow để xem thêm!", review: "Save lại nhé!", selling: "Link giỏ hàng 🛒" }
  
  // Competitive References
  competitorChannels Json?    // [{ handle: "@skincarevn", followers: "500K", whyReference: "Hook style tốt" }, ...]
  
  // AI Generation metadata
  generatedByAi     Boolean   @default(false)
  aiGeneratedAt     DateTime?
}
```

## AI Prompt cho Generate Profile

Khi user bấm "AI Tạo Profile Kênh", gọi AI với prompt:

```
Bạn là chuyên gia xây kênh TikTok triệu followers tại Việt Nam, chuyên niche {niche}.

Target audience: {targetAudience}
Tone mong muốn: {tone}

Hãy tạo profile kênh TikTok hoàn chỉnh, trả về JSON:

{
  "name": "Tên kênh gợi ý (tiếng Việt, dễ nhớ, liên quan niche)",
  "handle": "handle gợi ý (không dấu, lowercase)",
  "personaName": "Tên nhân vật (VD: Chi Lan, Skin Guru, Beauty Mẹ Bỉm)",
  "personaDesc": "Mô tả persona 2-3 câu: tính cách, background, cách nói chuyện",
  "subNiche": "Sub-niche cụ thể nhất",
  "usp": "Điểm khác biệt duy nhất của kênh này so với hàng nghìn kênh cùng niche",
  
  "contentPillars": [
    "Trụ cột 1 — mô tả ngắn",
    "Trụ cột 2 — mô tả ngắn",
    "Trụ cột 3 — mô tả ngắn",
    "Trụ cột 4 — mô tả ngắn",
    "Trụ cột 5 — mô tả ngắn"
  ],
  
  "hookBank": [
    "Hook template 1 — dùng cho [loại content]",
    "Hook template 2 — dùng cho [loại content]",
    // ... 15-20 hooks
  ],
  
  "contentMix": {
    "entertainment": 40,
    "education": 25,
    "review": 20,
    "selling": 15
  },
  "contentMixReason": "Giải thích tại sao tỷ lệ này phù hợp với niche và audience",
  
  "postsPerDay": 2,
  "postingSchedule": {
    "mon": { "times": ["10:00", "19:30"], "focus": "education" },
    "tue": { "times": ["10:00", "19:30"], "focus": "review" },
    "wed": { "times": ["10:00", "19:30"], "focus": "entertainment" },
    "thu": { "times": ["10:00", "19:30"], "focus": "selling" },
    "fri": { "times": ["10:00", "19:30"], "focus": "entertainment" },
    "sat": { "times": ["10:00", "14:00", "20:00"], "focus": "entertainment" },
    "sun": { "times": ["10:00", "14:00", "20:00"], "focus": "review" }
  },
  
  "seriesSchedule": [
    { "name": "Tên series 1", "dayOfWeek": "Thứ mấy", "contentPillar": "Pillar nào" },
    { "name": "Tên series 2", "dayOfWeek": "Thứ mấy", "contentPillar": "Pillar nào" }
  ],
  
  "ctaTemplates": {
    "entertainment": "CTA cho video giải trí",
    "education": "CTA cho video giáo dục", 
    "review": "CTA cho video review",
    "selling": "CTA cho video bán hàng"
  },
  
  "competitorChannels": [
    { "handle": "@handle1", "followers": "số followers ước tính", "whyReference": "Lý do tham khảo kênh này" },
    { "handle": "@handle2", "followers": "số followers ước tính", "whyReference": "Lý do tham khảo kênh này" },
    { "handle": "@handle3", "followers": "số followers ước tính", "whyReference": "Lý do tham khảo kênh này" }
  ],
  
  "voiceStyle": "casual | professional | energetic | calm",
  "editingStyle": "fast_cut | smooth | cinematic | minimal",
  "fontStyle": "modern | elegant | playful | minimal",
  "colorPrimary": "#hex",
  "colorSecondary": "#hex"
}

Yêu cầu:
- Tất cả bằng tiếng Việt (trừ handle)
- Hook bank phải thực tế, đã proven trên TikTok VN
- Competitive channels phải là kênh thật đang hoạt động tại VN
- Content mix phải có lý do rõ ràng
- Posting schedule tối ưu cho audience VN (giờ cao điểm: 7-8h, 12-13h, 19-21h)
- USP phải rõ ràng, không chung chung
```

## UI Layout

### Trang `/channels` — Khi tạo kênh mới

```
┌─────────────────────────────────────────────────┐
│  Tạo kênh mới                                   │
│                                                  │
│  ┌─── 2 tabs ─────────────────────────────┐     │
│  │ [✨ AI Tạo tự động]  [📝 Tự điền]     │     │
│  └────────────────────────────────────────┘     │
│                                                  │
│  === Tab AI (mặc định) ===                      │
│                                                  │
│  Niche cụ thể *                                  │
│  [Skincare cho da dầu mụn               ]       │
│                                                  │
│  Đối tượng mục tiêu *                           │
│  [Nữ 18-30, sinh viên, budget trung bình]       │
│                                                  │
│  Tone mong muốn *                               │
│  [▼ Vui vẻ Gen Z                         ]      │
│                                                  │
│  [✨ AI Tạo Profile Kênh]  ← loading khi gen    │
│                                                  │
│  === Sau khi AI generate xong ===               │
│  Hiện full preview có thể edit:                  │
│                                                  │
│  📋 Thông tin cơ bản                            │
│    Tên kênh: [editable]                          │
│    Handle: [editable]                            │
│    Persona: [editable]                           │
│    USP: [editable]                               │
│                                                  │
│  📌 Content Pillars (5)                         │
│    [x] Review SP                                 │
│    [x] Routine sáng/tối                          │
│    [x] Myth-busting                              │
│    [x] Before/after                              │
│    [x] Trending + tip                            │
│    [+ Thêm pillar]                               │
│                                                  │
│  🪝 Hook Bank (15)                              │
│    1. "Đừng mua X nếu..."          [🗑️]       │
│    2. "3 ngày dùng [SP]..."         [🗑️]       │
│    ...                                           │
│    [+ Thêm hook]                                 │
│                                                  │
│  📊 Content Mix                                 │
│    Giải trí: [===40%===]                         │
│    Giáo dục: [==25%==]                           │
│    Review:   [=20%=]                             │
│    Bán hàng: [15%]                               │
│    Lý do: "Kênh mới cần reach trước..."         │
│                                                  │
│  📅 Lịch đăng                                   │
│    Posts/ngày: [2]                                │
│    Thứ 2: 10:00 (education), 19:30 (review)     │
│    Thứ 3: 10:00 (entertainment), 19:30 (selling)│
│    ...                                           │
│                                                  │
│  🎯 CTA Templates                               │
│    Giải trí: [Follow để xem thêm!]              │
│    Review:   [Save lại nhé!]                     │
│    Bán hàng: [Link giỏ hàng 🛒]                │
│                                                  │
│  🔍 Kênh tham khảo                              │
│    @skincarevn (500K) — Hook style tốt           │
│    @beautyvn (200K) — Content mix hay            │
│    @reviewmypham (100K) — Honest review          │
│                                                  │
│  🎨 Style (đã auto-fill)                        │
│    Voice, Edit style, Colors, Font               │
│                                                  │
│  [💾 Lưu kênh]  [🔄 Generate lại]  [Hủy]      │
└─────────────────────────────────────────────────┘
```

### Tab "Tự điền" — Form đầy đủ

Giống form hiện tại nhưng thêm tất cả fields mới:
- Section 1: Thông tin cơ bản (giữ nguyên)
- Section 2: Sub-niche & USP (mới)
- Section 3: Content Pillars — dynamic list, thêm/xóa (mới)
- Section 4: Hook Bank — dynamic list, thêm/xóa (mới)  
- Section 5: Content Mix — 4 sliders tổng = 100% (mới)
- Section 6: Posting Strategy — posts/day + weekly schedule (mới)
- Section 7: CTA Templates — 4 textareas (mới)
- Section 8: Kênh tham khảo — dynamic list (mới)
- Section 9: Style (giữ nguyên)

## API mới

### POST /api/channels/generate

Request:
```json
{
  "niche": "Skincare cho da dầu mụn",
  "targetAudience": "Nữ 18-30, sinh viên",
  "tone": "casual"
}
```

Response: JSON profile kênh đầy đủ (chưa save DB, chỉ preview)

### POST /api/channels (sửa)

Nhận thêm tất cả fields mới. `generatedByAi: true` nếu tạo từ AI.

## Lưu ý

- AI generate cần dùng provider đã config trong Settings (Anthropic/OpenAI/Google)
- Loading state khi generate: skeleton preview hoặc "Đang tạo profile kênh... (~15 giây)"
- Nếu AI trả JSON lỗi → toast error + cho user chuyển sang tab "Tự điền"
- Competitive channels do AI generate có thể không chính xác — thêm note nhỏ: "Kiểm tra lại các kênh tham khảo"
- Content Mix 4 sliders phải luôn tổng = 100%
- Hook bank cho phép thêm/xóa/sửa sau khi generate
- Khi edit kênh đã tạo, hiện nút "🔄 AI Tạo lại" để regenerate specific sections
