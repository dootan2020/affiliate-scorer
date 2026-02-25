# PHASE 3: CONTENT FACTORY

> Tham chiếu: ROADMAP-FINAL-V2.md
> Goal: Chọn SP → AI tạo scripts + prompts Kling/Veo3 + captions → Export Packs → sản xuất 10+ video/ngày.
> Phụ thuộc: Phase 2 (Inbox + Product Intelligence) phải xong trước.

---

## THỨ TỰ THỰC HIỆN

```
1. Schema migration — content_assets, content_briefs, compliance_rules
2. Hook library + Format library + Angle library (seed data)
3. Content Brief generation (Claude API) — 5 angles + 10 hooks + 3 scripts
4. Prompt generation cho Kling/Veo3 (scene-by-scene)
5. Caption + hashtag + CTA generation
6. /production page — chọn SP, preview briefs, chỉnh sửa
7. Batch generate (4 SP × 3 video = 12 cùng lúc)
8. Export Packs (scripts.md, prompts.json, checklist.csv)
9. Asset tracking (DRAFT → PRODUCED → RENDERED → PUBLISHED)
10. Compliance check (TikTok VN rules)
11. Navigation: thêm /production vào nav
```

---

## 1. DATABASE SCHEMA

### Bảng content_briefs (1 SP = 1 brief)

```sql
CREATE TABLE content_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_identity_id UUID NOT NULL REFERENCES product_identities(id),
  
  -- Generated content
  angles JSONB NOT NULL DEFAULT '[]',         -- 5 angles
  hooks JSONB NOT NULL DEFAULT '[]',          -- 10 hooks
  scripts JSONB NOT NULL DEFAULT '[]',        -- 3 scripts (different formats)
  
  -- Metadata
  ai_model TEXT DEFAULT 'claude',
  prompt_used TEXT,                            -- Prompt gửi Claude API
  generation_time_ms INTEGER,
  
  status TEXT DEFAULT 'generated',            -- "generated" | "reviewed" | "exported"
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cb_product ON content_briefs(product_identity_id);
```

### Bảng content_assets (1 video = 1 asset)

```sql
CREATE TABLE content_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  asset_code TEXT UNIQUE,                     -- "A-20260225-0001" (auto-generate)
  
  -- Relations
  product_identity_id UUID NOT NULL REFERENCES product_identities(id),
  brief_id UUID REFERENCES content_briefs(id),
  production_batch_id UUID,                    -- Nhóm video cùng lần sản xuất
  
  -- Content detail
  hook_text TEXT,                              -- Hook 3 giây
  hook_type TEXT,                              -- "result" | "price" | "compare" | "myth" | "problem"
  format TEXT,                                 -- "review" | "demo" | "compare" | "unbox" | "lifestyle" | "greenscreen"
  angle TEXT,                                  -- Góc tiếp cận
  
  -- Generated content
  script_text TEXT,                            -- Script đầy đủ
  caption_text TEXT,                           -- Caption cho TikTok
  hashtags JSONB DEFAULT '[]',
  cta_text TEXT,
  
  -- Prompts cho video tools
  video_prompts JSONB DEFAULT '[]',           -- Scene-by-scene prompts cho Kling/Veo3
  -- Format: [{ "scene": 1, "prompt": "...", "duration_s": 3, "tool": "kling" }]
  
  -- Compliance
  compliance_status TEXT DEFAULT 'unchecked', -- "unchecked" | "passed" | "warning" | "blocked"
  compliance_notes TEXT,
  
  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'draft',
    -- "draft" | "produced" | "rendered" | "published" | "logged" | "archived" | "failed"
  
  -- Published info
  published_url TEXT,                         -- Link TikTok sau khi đăng
  post_id TEXT,                               -- TikTok video ID
  published_at TIMESTAMPTZ,
  
  -- Versioning
  version INTEGER DEFAULT 1,
  parent_asset_id UUID REFERENCES content_assets(id),  -- Nếu clone/remix
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ca_product ON content_assets(product_identity_id);
CREATE INDEX idx_ca_status ON content_assets(status);
CREATE INDEX idx_ca_batch ON content_assets(production_batch_id);
CREATE INDEX idx_ca_post_id ON content_assets(post_id);
```

### Bảng production_batches (1 lần sản xuất = 1 batch)

```sql
CREATE TABLE production_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  batch_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_video_count INTEGER NOT NULL,
  actual_video_count INTEGER DEFAULT 0,
  
  status TEXT DEFAULT 'active',               -- "active" | "done"
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 2. HOOK / FORMAT / ANGLE LIBRARY

### Seed data — Hook types phổ biến TikTok VN affiliate:

```typescript
const HOOK_LIBRARY = [
  // Result hooks (show kết quả)
  { type: "result", template: "Dùng {product} {duration}, kết quả...", example: "Dùng serum này 7 ngày, da tôi thay đổi thật sự" },
  { type: "result", template: "Trước/sau khi dùng {product}", example: "Da tôi trước vs sau 2 tuần dùng serum này" },
  
  // Price hooks (giá sốc)
  { type: "price", template: "{price} mà chất lượng như {higher_price}", example: "99K mà chất lượng như 500K" },
  { type: "price", template: "Deal {event} chỉ còn {price}", example: "Deal 3.3 chỉ còn 79K" },
  
  // Compare hooks (so sánh)
  { type: "compare", template: "{product_A} vs {product_B} — cái nào đáng?", example: "Serum A 99K vs Serum B 350K — cái nào đáng?" },
  
  // Myth/Test hooks (phá hoại niềm tin)
  { type: "myth", template: "Đừng mua {product} trước khi xem video này", example: "Đừng mua kem chống nắng trước khi xem video này" },
  { type: "myth", template: "{product} có thật sự tốt như quảng cáo?", example: "Serum vitamin C có thật sự làm sáng da?" },
  
  // Problem hooks (giải quyết vấn đề)
  { type: "problem", template: "Nếu bạn đang {problem}, thử cái này", example: "Nếu da bạn đang xỉn màu, thử cái này" },
  
  // Unbox hooks
  { type: "unbox", template: "Unbox hàng TikTok Shop {price}", example: "Unbox hàng TikTok Shop 99K — liệu có hời?" },
  
  // Trend hooks
  { type: "trend", template: "Trend TikTok đang viral — {product}", example: "Trend làm đẹp đang viral — serum vitamin C" },
];

const FORMAT_LIBRARY = [
  { id: "review_short", name: "Review ngắn", duration: "15-30s", description: "Talking head + show SP + kết quả" },
  { id: "demo", name: "Demo sản phẩm", duration: "15-20s", description: "Hands-on, show cách dùng" },
  { id: "compare", name: "So sánh 2 SP", duration: "20-30s", description: "Side by side, bên nào hơn" },
  { id: "unbox", name: "Unbox/Haul", duration: "15-30s", description: "Mở hộp, first impression" },
  { id: "lifestyle", name: "Lifestyle", duration: "15-20s", description: "SP trong đời thường, aesthetic" },
  { id: "greenscreen", name: "Green screen", duration: "15-25s", description: "Green screen + voiceover + ảnh SP" },
  { id: "problem_solution", name: "Problem → Solution", duration: "20-30s", description: "Nêu vấn đề → SP giải quyết" },
];

const ANGLE_LIBRARY = [
  "Giá rẻ bất ngờ (so với chất lượng)",
  "Chất lượng vượt giá",
  "Giải quyết pain point cụ thể",
  "Trend/viral đang hot",
  "Review thật sau X ngày dùng",
  "So sánh với sản phẩm đắt hơn",
  "Quà tặng/đi date/dịp đặc biệt",
  "Hidden gem ít người biết",
  "Hack tiết kiệm",
  "Dùng thử để bạn khỏi mua hớ",
];
```

---

## 3. CONTENT BRIEF GENERATION (Claude API)

### Prompt template gửi Claude API:

```typescript
function buildBriefPrompt(product: ProductIdentity, learningData?: LearningData): string {
  return `
Bạn là chuyên gia content TikTok affiliate Việt Nam.

SẢN PHẨM:
- Tên: ${product.title}
- Giá: ${product.price ? formatVND(product.price) : 'chưa rõ'}
- Danh mục: ${product.category || 'chưa rõ'}
- Commission: ${product.commission_rate ? product.commission_rate + '%' : 'chưa rõ'}
- Mô tả: ${product.description || 'không có'}

${learningData ? `
DỮ LIỆU HỌC TẬP (từ video trước):
- Hook tốt nhất: ${learningData.topHooks.join(', ')}
- Format tốt nhất: ${learningData.topFormats.join(', ')}
- Thời lượng tối ưu: ${learningData.optimalDuration}
` : ''}

YÊU CẦU:
Tạo content brief cho sản phẩm này. Output JSON:

{
  "angles": [5 góc tiếp cận khác nhau],
  "hooks": [10 câu hook 3 giây, mỗi câu khác style],
  "scripts": [
    {
      "format": "review_short",
      "duration_s": 20,
      "hook": "...",
      "body": "...",
      "cta": "...",
      "full_script": "..."
    },
    {
      "format": "problem_solution",
      "duration_s": 25,
      "hook": "...",
      "body": "...",
      "cta": "...",
      "full_script": "..."
    },
    {
      "format": "compare",
      "duration_s": 20,
      "hook": "...",
      "body": "...",
      "cta": "...",
      "full_script": "..."
    }
  ]
}

QUY TẮC:
- Ngôn ngữ: Tiếng Việt tự nhiên, gen Z, thân thiện
- Hook PHẢI gây tò mò trong 3 giây đầu
- CTA luôn có: "Link ở bio" hoặc "Giỏ hàng màu vàng"
- KHÔNG claim y tế, KHÔNG so sánh tiêu cực với brand cụ thể
- Video 15-30 giây (TikTok sweet spot)
- Mỗi script phải khác angle và hook
  `.trim();
}
```

### API call:

```typescript
async function generateBrief(product: ProductIdentity): Promise<ContentBrief> {
  const prompt = buildBriefPrompt(product, await getLearningData());
  
  const response = await claude.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });
  
  const content = JSON.parse(response.content[0].text);
  
  // Save to DB
  return await saveBrief({
    product_identity_id: product.id,
    angles: content.angles,
    hooks: content.hooks,
    scripts: content.scripts,
    ai_model: "claude-sonnet-4-20250514",
    prompt_used: prompt,
  });
}
```

---

## 4. PROMPT GENERATION CHO KLING/VEO3

### Từ script → scene-by-scene prompts:

```typescript
function buildVideoPromptPrompt(script: Script, product: ProductIdentity): string {
  return `
Dựa trên script video TikTok affiliate sau, tạo prompts scene-by-scene cho AI video tool (Kling AI hoặc Veo3).

SCRIPT:
${script.full_script}

SẢN PHẨM: ${product.title}
THỜI LƯỢNG: ${script.duration_s} giây

YÊU CẦU:
Output JSON array, mỗi scene:
{
  "scenes": [
    {
      "scene": 1,
      "start_s": 0,
      "end_s": 3,
      "description": "Mô tả scene bằng tiếng Việt",
      "prompt_kling": "English prompt for Kling AI - describe visual, camera, lighting, subject",
      "prompt_veo3": "English prompt for Veo3 - describe motion, style, atmosphere",
      "text_overlay": "Text hiện trên video (nếu có)",
      "audio_note": "Voiceover/music note"
    }
  ]
}

QUY TẮC:
- Prompt bằng tiếng Anh (Kling/Veo3 hiểu tốt hơn)
- Mỗi scene 2-5 giây
- Describe rõ: subject, action, camera angle, lighting, background
- Scene đầu phải attention-grabbing (hook)
- Scene cuối phải có CTA visual
- Vietnamese female subject, natural lighting preferred
  `.trim();
}
```

---

## 5. CAPTION + HASHTAG GENERATION

```typescript
function buildCaptionPrompt(script: Script, product: ProductIdentity): string {
  return `
Viết caption TikTok cho video affiliate sản phẩm "${product.title}".

SCRIPT VIDEO: ${script.full_script}
GIÁ: ${product.price ? formatVND(product.price) : ''}

YÊU CẦU:
{
  "caption": "Caption 100-150 ký tự, gây tò mò, có emoji",
  "hashtags": ["#hashtag1", "#hashtag2", ... 8-12 hashtags],
  "cta": "Call to action ngắn"
}

QUY TẮC:
- Caption tiếng Việt, gen Z, thân thiện
- Hashtags mix: niche + trending + product
- Luôn có: #tiktokmademebuyit #reviewsanpham #affiliatevn
- CTA: "Link ở bio" hoặc "Giỏ hàng màu vàng bên dưới"
  `.trim();
}
```

---

## 6. /production PAGE

### Layout:

```
┌─────────────────────────────────────────────────────────────────┐
│ 🎬 Sản xuất — 25/2/2026                                        │
│                                                                  │
│ Bước 1: Chọn SP từ Inbox [đã Scored]                           │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ☑ Serum Vitamin C (Market: 77, Content: 85) — 3 video     │ │
│ │ ☑ Vòng tay bạc 925 (Market: 82, Content: 78) — 3 video   │ │
│ │ ☑ Ốp iPhone 16 (Market: 65, Content: 90) — 3 video       │ │
│ │ ☐ Dây sạc nhanh (Market: 58, Content: 72)                │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Target: [9] video     [Tạo Briefs]                              │
│                                                                  │
│ ═══════════════════════════════════════════════════════════════  │
│                                                                  │
│ Bước 2: Preview + chỉnh sửa                                    │
│                                                                  │
│ ┌── Serum Vitamin C (3 video) ──────────────────────────────┐  │
│ │                                                            │  │
│ │ Video 1: Review 20s                                        │  │
│ │ Hook: "Dùng serum 99K này 7 ngày, da tôi thay đổi"       │  │
│ │ Script: [expandable]                                       │  │
│ │ Prompt Kling: [expandable]                                 │  │
│ │ Caption: [editable]                                        │  │
│ │ [✏️ Sửa] [🔄 Tạo lại] [❌ Bỏ]                            │  │
│ │                                                            │  │
│ │ Video 2: Demo 15s                                          │  │
│ │ ...                                                        │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│ Bước 3: Xuất                                                    │
│ [📄 Tải Scripts.md] [📋 Tải Prompts.json] [✅ Tải Checklist]  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. EXPORT PACKS

### scripts.md:

```markdown
# Ca sản xuất — 25/2/2026 — 9 video

## Serum Vitamin C 65g (3 video)

### Video 1: Review 20s
**Hook (0-3s):** "Dùng serum 99K này 7 ngày, da tôi thay đổi thật sự"
**Body (3-15s):** Cầm serum, show texture, thoa lên tay, close-up da
**CTA (15-20s):** "Link ở bio, đang sale 3.3 chỉ còn 79K"
**Caption:** Da xỉn màu thử cái này đi 🫣✨ #reviewsanpham #serumvitaminc
**Hashtags:** #tiktokmademebuyit #skincare #review7ngay

### Video 2: Demo 15s
...
```

### prompts.json:

```json
{
  "batch_date": "2026-02-25",
  "total_videos": 9,
  "assets": [
    {
      "asset_code": "A-20260225-0001",
      "product": "Serum Vitamin C 65g",
      "format": "review_short",
      "duration_s": 20,
      "scenes": [
        {
          "scene": 1,
          "start_s": 0,
          "end_s": 3,
          "prompt_kling": "Close-up of Vietnamese woman holding small serum bottle, soft ring light, talking to camera, surprised expression, clean white background",
          "prompt_veo3": "Young woman reveals skincare product to camera with excited expression, smooth camera push-in, bright airy bathroom setting",
          "text_overlay": "7 NGÀY DA THAY ĐỔI ✨"
        },
        {
          "scene": 2,
          "start_s": 3,
          "end_s": 15,
          "prompt_kling": "Hands applying transparent serum on forearm, macro shot, natural daylight, showing gel texture on skin",
          "prompt_veo3": "Detailed product application on skin, macro lens focus pull, warm natural lighting"
        }
      ],
      "caption": "Da xỉn màu thử cái này đi 🫣✨ #reviewsanpham #serumvitaminc",
      "hashtags": ["#tiktokmademebuyit", "#skincare", "#review7ngay"]
    }
  ]
}
```

### checklist.csv:

```
asset_code,product,format,hook,status_produced,status_rendered,status_published,published_url,notes
A-20260225-0001,Serum Vitamin C,review_short,"Dùng serum 99K này 7 ngày...",,,,,
A-20260225-0002,Serum Vitamin C,demo,"99K mà chất lượng vậy...",,,,,
A-20260225-0003,Serum Vitamin C,compare,"Serum 99K vs 500K...",,,,,
```

---

## 8. ASSET TRACKING

### Status flow:

```
DRAFT → PRODUCED → RENDERED → PUBLISHED → LOGGED
  ↓                                          ↓
FAILED                                    (metrics)
  ↓
ARCHIVED
```

- DRAFT: AI tạo script xong
- PRODUCED: User đã paste prompt vào Kling/Veo3
- RENDERED: Video đã render xong
- PUBLISHED: Đã đăng TikTok, có link
- LOGGED: Đã nhập metrics

User update status thủ công (click button) hoặc auto khi paste TikTok link.

---

## 9. COMPLIANCE CHECK

### Rules cho TikTok VN:

```typescript
const COMPLIANCE_RULES = {
  blocklist: [
    // Y tế
    "chữa bệnh", "trị bệnh", "khỏi bệnh", "thuốc",
    "FDA", "bộ y tế chứng nhận",
    // So sánh tiêu cực
    "tốt hơn [brand]", "đừng mua [brand]",
    // Cam kết quá mức
    "100% hiệu quả", "cam kết", "đảm bảo",
  ],
  softlist: [
    // Cần disclaimer
    "giảm cân", "trắng da", "trị mụn", "chống lão hóa",
  ],
  disclaimer: "Kết quả có thể khác nhau tùy cơ địa. Không phải sản phẩm y tế.",
};
```

### Scan script + caption → flag:

```typescript
function checkCompliance(text: string): ComplianceResult {
  const hits = [];
  
  for (const word of COMPLIANCE_RULES.blocklist) {
    if (text.toLowerCase().includes(word.toLowerCase())) {
      hits.push({ word, level: "blocked" });
    }
  }
  
  for (const word of COMPLIANCE_RULES.softlist) {
    if (text.toLowerCase().includes(word.toLowerCase())) {
      hits.push({ word, level: "warning" });
    }
  }
  
  const blocked = hits.some(h => h.level === "blocked");
  const warning = hits.some(h => h.level === "warning");
  
  return {
    status: blocked ? "blocked" : warning ? "warning" : "passed",
    hits,
    requiresDisclaimer: warning,
    disclaimer: warning ? COMPLIANCE_RULES.disclaimer : null,
  };
}
```

---

## API ENDPOINTS

```
POST   /api/briefs/generate           — Generate brief cho 1 SP
POST   /api/briefs/batch              — Generate briefs cho nhiều SP
GET    /api/briefs/[id]               — Xem brief

POST   /api/production/create-batch   — Tạo batch sản xuất
GET    /api/production/[batchId]      — Xem batch
GET    /api/production/[batchId]/export/scripts    — Download scripts.md
GET    /api/production/[batchId]/export/prompts    — Download prompts.json
GET    /api/production/[batchId]/export/checklist  — Download checklist.csv

PATCH  /api/assets/[id]               — Update status, published_url
POST   /api/compliance/check          — Check text
```

---

## TEST CHECKLIST

- [ ] Generate brief cho 1 SP → 5 angles + 10 hooks + 3 scripts
- [ ] Generate video prompts → scene-by-scene cho Kling/Veo3
- [ ] Generate caption + hashtags
- [ ] /production: chọn 3 SP → tạo 9 video briefs
- [ ] Preview scripts, prompts, captions trên /production
- [ ] Edit script inline → lưu
- [ ] Export scripts.md download đúng format
- [ ] Export prompts.json download đúng format
- [ ] Export checklist.csv download đúng format
- [ ] Asset status update hoạt động
- [ ] Compliance check phát hiện blocklist words
- [ ] Compliance warning → thêm disclaimer
- [ ] Batch generate 10+ videos không timeout
- [ ] Build pass, không lỗi
