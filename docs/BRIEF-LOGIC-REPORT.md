# Báo cáo logic tạo Brief

## 1. Luồng code (end-to-end trace)

### Bước 1: User chọn sản phẩm
- **File:** `components/production/product-selector.tsx:27-49`
- Fetch 3 request song song: `/api/inbox?state=scored`, `=briefed`, `=published` (limit=50 each)
- Sort theo `contentScore` desc, hiển thị list với checkbox
- Max chọn: **10 sản phẩm**

### Bước 2: User bấm "Tạo Briefs"
- **File:** `components/production/production-page-client.tsx:62-127`
- Handler: `handleGenerate()`
- Gọi: `POST /api/briefs/batch`
- Body: `{ productIdentityIds: string[] }`

### Bước 3: API batch route
- **File:** `app/api/briefs/batch/route.ts:17-86`
- Validate body bằng `batchBriefSchema`
- Query `prisma.productIdentity.findMany({ where: { id: { in: ids } } })`
- Loop tuần tự qua từng identity → gọi `generateBrief()` (tránh rate limit)
- Truyền vào `generateBrief()`:

```typescript
{
  id: identity.id,
  title: identity.title,
  category: identity.category,
  price: identity.price ? Number(identity.price) : null,
  commissionRate: identity.commissionRate ? String(identity.commissionRate) : null,
  description: identity.description,
  imageUrl: identity.imageUrl,  // ← truyền nhưng KHÔNG dùng trong prompt
}
```

### Bước 4: Generate brief (AI call)
- **File:** `lib/content/generate-brief.ts:120-203`
- Build prompt bằng `buildBriefPrompt(product)` (line 59-117)
- Gọi: `callAI(SYSTEM_PROMPT, prompt, 6000, "content_brief")`
- Parse JSON response → lưu `ContentBrief` + tạo `ContentAsset` cho mỗi script

### Bước 5: callAI routing
- **File:** `lib/ai/call-ai.ts:12-38`
- Lấy model ID từ task type `"content_brief"` → detect provider → route tới `callClaude` / `callOpenAI` / `callGemini`

### Bước 6: Lưu DB
- **ContentBrief** (`lib/content/generate-brief.ts:142-152`):
  - `productIdentityId`, `angles` (JSON), `hooks` (JSON), `scripts` (JSON)
  - `aiModel: "claude-haiku-4-5"`, `promptUsed`, `generationTimeMs`
- **ContentAsset** (line 164-194), 1 asset per script (~3):
  - `assetCode` format: `A-YYYYMMDD-NNNN`
  - `hookText`, `hookType`, `format`, `angle`, `scriptText`, `captionText`, `hashtags`, `ctaText`
  - `videoPrompts` (scenes array), `complianceStatus`, `complianceNotes`
  - `status: "draft"`
- Update `ProductIdentity.inboxState → "briefed"` (line 198-200)

### Bước 7: Load brief detail + tạo batch
- Client gọi `GET /api/briefs/{briefId}` cho mỗi brief thành công
- **File:** `app/api/briefs/[id]/route.ts` — returns brief + assets + productIdentity
- Tạo production batch: `POST /api/production/create-batch` với tất cả assetIds

### Bước 8: Hiển thị
- **File:** `components/production/brief-preview-card.tsx`
- BriefPreviewCard → AssetCard cho mỗi asset

---

## 2. Dữ liệu truyền vào prompt

### Bảng so sánh: DB vs Prompt

| Field | Có trong DB | Truyền cho `generateBrief()` | Dùng trong prompt | Ghi chú |
|-------|:-----------:|:----------------------------:|:------------------:|---------|
| title | ✅ | ✅ | ✅ | `${product.title}` |
| description | ✅ | ✅ | ✅ | `${product.description}` |
| price | ✅ (Int, VND) | ✅ (Number) | ✅ | Format VND: "123K", "1.2 triệu" |
| commissionRate | ✅ (Decimal) | ✅ (String) | ✅ | `${commissionRate}%` |
| category | ✅ | ✅ | ✅ | `${product.category}` |
| imageUrl | ✅ | ✅ | ❌ **KHÔNG dùng** | Truyền vào interface nhưng prompt không reference |
| shopName | ✅ | ❌ | ❌ | Không truyền |
| canonicalUrl | ✅ | ❌ | ❌ | Không truyền |
| marketScore | ✅ (Decimal) | ❌ | ❌ | Không truyền |
| contentPotentialScore | ✅ (Decimal) | ❌ | ❌ | Không truyền |
| combinedScore | ✅ (Decimal) | ❌ | ❌ | Không truyền |
| lifecycleStage | ✅ | ❌ | ❌ | "new"/"rising"/"hot"/"peak"/"declining" |
| deltaType | ✅ | ❌ | ❌ | "NEW"/"SURGE"/"COOL"/"STABLE"/"REAPPEAR" |
| personalNotes | ✅ | ❌ | ❌ | User notes |
| personalTags | ✅ (JSON) | ❌ | ❌ | User tags |
| rating (Product) | ✅ (via Product relation) | ❌ | ❌ | |
| soldCount / salesVolume (Product) | ✅ (via Product) | ❌ | ❌ | |
| rawData (via Product) | ✅ (via Product) | ❌ | ❌ | FastMoss/KaloData raw data |

---

## 3. Prompt template

### System prompt (`lib/content/generate-brief.ts:48-50`)
```
Bạn là chuyên gia content TikTok affiliate Việt Nam với 5 năm kinh nghiệm.
Bạn tạo content briefs chuyên nghiệp, sáng tạo, phù hợp với audience TikTok VN (gen Z, 18-35).
Output luôn là JSON hợp lệ, không có markdown code fences, không giải thích thêm.
```

### User prompt (`buildBriefPrompt()`, line 59-117)
```
SẢN PHẨM:
- Tên: ${product.title || "Chưa có tên"}
- Giá: ${product.price ? formatVND(product.price) : "chưa rõ"}
- Danh mục: ${product.category || "chưa rõ"}
- Commission: ${product.commissionRate ? product.commissionRate + "%" : "chưa rõ"}
- Mô tả: ${product.description || "không có"}

YÊU CẦU:
Tạo content brief đầy đủ cho sản phẩm này. Output JSON với cấu trúc:

{
  "angles": ["5 góc tiếp cận khác nhau — mỗi góc 1 câu ngắn"],
  "hooks": [
    {"text": "câu hook 3 giây gây tò mò", "type": "result|price|compare|myth|problem|unbox|trend"},
    ... (10 hooks)
  ],
  "scripts": [
    {
      "format": "review_short",
      "format_name": "Review ngắn",
      "duration_s": 20,
      "hook": "câu hook 3 giây",
      "hook_type": "result",
      "body": "nội dung chính 10-20 giây",
      "cta": "call to action 3 giây",
      "full_script": "toàn bộ script viết liền",
      "scenes": [
        {
          "scene": 1, "start_s": 0, "end_s": 3,
          "description": "mô tả scene bằng tiếng Việt",
          "prompt_kling": "English prompt for Kling AI - visual, camera, lighting",
          "prompt_veo3": "English prompt for Veo3 - motion, style, atmosphere",
          "text_overlay": "text hiện trên video (nếu có)",
          "audio_note": "voiceover/music note"
        }
      ],
      "caption": "caption TikTok 100-150 ký tự, có emoji",
      "hashtags": ["#hashtag1", "#hashtag2"],
      "cta_caption": "Link ở bio"
    },
    ... (3 scripts với 3 format khác nhau)
  ]
}

QUY TẮC:
- Tiếng Việt tự nhiên, gen Z, thân thiện
- Hook PHẢI gây tò mò trong 3 giây đầu
- CTA luôn có: "Link ở bio" hoặc "Giỏ hàng màu vàng"
- KHÔNG claim y tế, KHÔNG so sánh tiêu cực với brand cụ thể
- Video 15-30 giây (TikTok sweet spot)
- Mỗi script khác angle, khác hook type, khác format
- Scene prompts bằng tiếng Anh cho Kling/Veo3
- Mỗi scene 2-5 giây, tổng = duration_s
- Hashtags mix: niche + trending + product (8-12 tags)
- Luôn có: #tiktokmademebuyit #reviewsanpham
- Output CHỈ JSON, không có text khác
```

### Variables được thay thế:
- `product.title` → tên SP (hoặc "Chưa có tên")
- `product.price` → format VND (hoặc "chưa rõ")
- `product.category` → danh mục (hoặc "chưa rõ")
- `product.commissionRate` → commission % (hoặc "chưa rõ")
- `product.description` → mô tả (hoặc "không có")

---

## 4. Output format — Brief hiển thị

### Từ AI response → DB → UI:

| Nội dung | Có | Hiển thị ở | Component |
|----------|:--:|-----------|-----------|
| Angles (5 góc tiếp cận) | ✅ | Expandable list trong BriefPreviewCard | `brief-preview-card.tsx:255-273` |
| Hooks (10 câu hook) | ✅ | Lưu DB nhưng **KHÔNG hiển thị riêng** | Chỉ lưu trong ContentBrief.hooks |
| Script full text | ✅ | Expandable trong AssetCard | `brief-preview-card.tsx:137-155` |
| Hook text (per asset) | ✅ | Orange highlight box | `brief-preview-card.tsx:123-129` |
| Hook type | ✅ | Label uppercase trong hook box | `brief-preview-card.tsx:125` |
| Format | ✅ | Asset header | `brief-preview-card.tsx:115` |
| Angle (per asset) | ✅ | Text line | `brief-preview-card.tsx:132-134` |
| Caption | ✅ | Text section | `brief-preview-card.tsx:204-210` |
| Hashtags | ✅ | Orange pill badges | `brief-preview-card.tsx:213-221` |
| CTA | ✅ | Text line | `brief-preview-card.tsx:224-226` |
| Video prompts (Kling) | ✅ | Expandable scenes, copy button | `brief-preview-card.tsx:179-184` |
| Video prompts (Veo3) | ✅ | Expandable scenes, copy button | `brief-preview-card.tsx:186-191` |
| Scene description | ✅ | Text in scene card | `brief-preview-card.tsx:176-178` |
| Text overlay | ✅ | Small text | `brief-preview-card.tsx:193-195` |
| Compliance status | ✅ | Badge (OK/Cần disclaimer/Vi phạm) | `ComplianceBadge` component |
| Compliance notes | ✅ | Amber warning box | `brief-preview-card.tsx:229-232` |
| Asset code | ✅ | Small gray text | `brief-preview-card.tsx:117` |

---

## 5. Vấn đề phát hiện

### 5.1 Dữ liệu THIẾU trong prompt — brief sẽ chung chung

| Dữ liệu thiếu | Tại sao cần | Ảnh hưởng |
|----------------|-------------|-----------|
| `shopName` | AI không biết shop → không thể mention uy tín shop | Brief thiếu social proof |
| `rating` (Product) | AI không biết đánh giá → không leverage "4.9⭐" | Mất hook mạnh nhất |
| `soldCount` / `salesVolume` (Product) | AI không biết "đã bán 50K+" → thiếu urgency | Brief không có FOMO element |
| `combinedScore` | AI không biết SP được rate cao/thấp | Không adjust tone phù hợp |
| `lifecycleStage` | AI không biết SP đang "rising" hay "declining" | Angle không phù hợp timing |
| `deltaType` | AI không biết "SURGE" → thiếu trending angle | Bỏ lỡ "đang viral" hook |
| `imageUrl` | Truyền vào `ProductInput` nhưng prompt KHÔNG dùng | Nếu dùng multimodal model → có thể describe SP từ ảnh |

### 5.2 `imageUrl` truyền nhưng không dùng
- `ProductInput` interface có `imageUrl` field
- `buildBriefPrompt()` không reference `product.imageUrl`
- Lãng phí data — hoặc nên dùng (multimodal), hoặc nên bỏ khỏi interface

### 5.3 AI model hardcoded trong DB record
- `aiModel: "claude-haiku-4-5"` luôn ghi cứng (line 148)
- Thực tế `callAI()` route tới model khác tùy settings → DB record sai model name

### 5.4 JSON parse silent fail
- Nếu AI trả JSON lỗi → `brief = { angles: [], hooks: [], scripts: [] }` (line 137)
- Vẫn lưu brief rỗng vào DB, tạo 0 assets → user thấy brief trống không biết lý do
- Nên throw error hoặc retry

### 5.5 Compliance check chỉ chạy post-generation
- AI có thể generate content vi phạm → compliance flag "blocked" → user phải tạo lại
- Nên thêm compliance rules vào prompt để AI tránh từ đầu (đã có phần nào: "KHÔNG claim y tế")

### 5.6 Hooks list (10) lưu DB nhưng không hiển thị riêng
- `ContentBrief.hooks` lưu 10 hooks nhưng UI chỉ show hooks gắn vào từng asset (3)
- 7 hooks còn lại "mất" — user không thấy để chọn thay thế

---

## 6. Đề xuất cải thiện

### Ưu tiên cao — Enrich prompt
Thêm data vào `buildBriefPrompt()` để AI có đủ context:

```
SẢN PHẨM:
- Tên: ...
- Giá: ...
- Danh mục: ...
- Commission: ...
- Mô tả: ...
+ - Shop: ${product.shopName || "chưa rõ"}
+ - Đánh giá: ${product.rating ? product.rating + "⭐" : "chưa rõ"}
+ - Đã bán: ${product.soldCount ? product.soldCount.toLocaleString() : "chưa rõ"}
+ - Trending: ${product.deltaType || "chưa rõ"} (${product.lifecycleStage || "chưa rõ"})
+ - Điểm content: ${product.contentScore || "chưa rõ"}/100
```

### Ưu tiên trung bình
1. Fix `aiModel` — lấy actual model ID từ `callAI` thay vì hardcode
2. JSON parse fail → throw error thay vì lưu brief rỗng
3. Hiển thị 10 hooks trong UI (không chỉ 3 gắn vào asset)

### Ưu tiên thấp
4. Multimodal prompt với `imageUrl` (nếu dùng Gemini/GPT-4V)
5. Retry logic khi AI trả JSON lỗi
