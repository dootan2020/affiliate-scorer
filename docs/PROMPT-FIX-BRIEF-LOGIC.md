Sửa logic tạo Brief dựa trên báo cáo docs/BRIEF-LOGIC-REPORT.md. 6 việc cần làm.

---

## VIỆC 1: Enrich prompt với đầy đủ dữ liệu sản phẩm (ƯU TIÊN CAO)

### Vấn đề
Prompt hiện tại chỉ truyền 5 fields: title, price, category, commissionRate, description.
DB có thêm: shopName, rating, soldCount, combinedScore, lifecycleStage, deltaType — nhưng KHÔNG truyền.
→ AI thiếu context → brief chung chung, không có social proof, không có FOMO, không biết SP đang trending.

### Cách sửa

#### Bước 1: Cập nhật query trong `app/api/briefs/batch/route.ts`

Thêm relation Product vào query:
```tsx
const identities = await prisma.productIdentity.findMany({
  where: { id: { in: ids } },
  include: {
    products: {
      take: 1,
      orderBy: { updatedAt: 'desc' },
      select: {
        rating: true,
        soldCount: true,
        salesVolume: true,
        shopName: true,
        shopRating: true,
      },
    },
  },
})
```

Truyền thêm data vào `generateBrief()`:
```tsx
generateBrief({
  id: identity.id,
  title: identity.title,
  category: identity.category,
  price: identity.price ? Number(identity.price) : null,
  commissionRate: identity.commissionRate ? String(identity.commissionRate) : null,
  description: identity.description,
  imageUrl: identity.imageUrl,
  // THÊM MỚI:
  shopName: identity.products?.[0]?.shopName || null,
  rating: identity.products?.[0]?.rating || null,
  soldCount: identity.products?.[0]?.soldCount || identity.products?.[0]?.salesVolume || null,
  shopRating: identity.products?.[0]?.shopRating || null,
  combinedScore: identity.combinedScore ? Number(identity.combinedScore) : null,
  lifecycleStage: identity.lifecycleStage || null,
  deltaType: identity.deltaType || null,
})
```

#### Bước 2: Cập nhật interface ProductInput trong `lib/content/generate-brief.ts`

```tsx
interface ProductInput {
  id: string
  title: string | null
  category: string | null
  price: number | null
  commissionRate: string | null
  description: string | null
  imageUrl: string | null
  // THÊM MỚI:
  shopName: string | null
  rating: number | null
  soldCount: number | null
  shopRating: number | null
  combinedScore: number | null
  lifecycleStage: string | null
  deltaType: string | null
}
```

#### Bước 3: Cập nhật `buildBriefPrompt()` trong `lib/content/generate-brief.ts`

Thay thế phần "SẢN PHẨM:" trong prompt:

```
SẢN PHẨM:
- Tên: ${product.title || "Chưa có tên"}
- Giá: ${product.price ? formatVND(product.price) : "chưa rõ"}
- Danh mục: ${product.category || "chưa rõ"}
- Commission: ${product.commissionRate ? product.commissionRate + "%" : "chưa rõ"}
- Mô tả: ${product.description || "không có"}
- Shop: ${product.shopName || "chưa rõ"}${product.shopRating ? " (⭐" + product.shopRating + ")" : ""}
- Đánh giá sản phẩm: ${product.rating ? product.rating + "⭐" : "chưa rõ"}
- Đã bán: ${product.soldCount ? formatSoldCount(product.soldCount) : "chưa rõ"}
- Xu hướng: ${formatTrending(product.deltaType, product.lifecycleStage)}
- Điểm tiềm năng: ${product.combinedScore ? product.combinedScore + "/100" : "chưa rõ"}
```

Helper functions:
```tsx
function formatSoldCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + ' triệu'
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K'
  return count.toString()
}

function formatTrending(deltaType: string | null, lifecycleStage: string | null): string {
  const parts: string[] = []
  
  if (deltaType) {
    const deltaMap: Record<string, string> = {
      'NEW': '🆕 Sản phẩm mới',
      'SURGE': '🔥 Đang tăng mạnh',
      'COOL': '📉 Đang giảm',
      'STABLE': '➡️ Ổn định',
      'REAPPEAR': '🔄 Quay lại trending',
    }
    parts.push(deltaMap[deltaType] || deltaType)
  }
  
  if (lifecycleStage) {
    const stageMap: Record<string, string> = {
      'new': 'giai đoạn mới',
      'rising': 'đang lên',
      'hot': 'đang hot',
      'peak': 'đỉnh cao',
      'declining': 'đang giảm',
    }
    parts.push(stageMap[lifecycleStage] || lifecycleStage)
  }
  
  return parts.length > 0 ? parts.join(' — ') : 'chưa rõ'
}
```

#### Bước 4: Cập nhật QUY TẮC trong prompt

Thêm vào phần QUY TẮC:
```
- Nếu SP đã bán nhiều (>1000) → dùng hook social proof: "đã bán XX.XXX đơn"
- Nếu rating cao (>4.5⭐) → nhắc đánh giá: "4.9⭐ với 2000+ đánh giá"
- Nếu đang SURGE/trending → dùng hook trending: "đang viral trên TikTok"
- Nếu giá rẻ (<100K) → dùng hook giá: "dưới 100K mà chất lượng bất ngờ"
- Nếu commission cao (>15%) → đây là SP đáng push, brief nên hấp dẫn hơn
- Adapt tone theo lifecycleStage: rising/hot → urgent, stable → review dài hơn, declining → skip trending angle
```

---

## VIỆC 2: Fix aiModel hardcoded (ƯU TIÊN CAO)

### Vấn đề
`aiModel: "claude-haiku-4-5"` luôn ghi cứng trong DB (line 148 generate-brief.ts).
Thực tế `callAI()` route tới model khác tùy settings → DB record sai model name.

### Cách sửa

```tsx
// Trong generate-brief.ts, hàm generateBrief():

// TRƯỚC:
// aiModel: "claude-haiku-4-5",

// SAU:
// Lấy actual model ID từ callAI hoặc từ settings

// Option 1: callAI trả về model đã dùng
const aiResult = await callAI(SYSTEM_PROMPT, prompt, 6000, "content_brief")
// callAI cần return { text: string, model: string }

// Option 2: Query settings trước
const modelConfig = await prisma.aiModelConfig.findFirst({
  where: { taskType: "content_brief" },
  orderBy: { updatedAt: 'desc' },
})
const actualModel = modelConfig?.modelId || "unknown"

// Lưu DB:
const brief = await prisma.contentBrief.create({
  data: {
    ...
    aiModel: actualModel,  // Model thực tế đã dùng
  },
})
```

Cách tốt nhất: sửa `callAI()` return thêm `modelUsed`:
```tsx
// lib/ai/call-ai.ts
export async function callAI(
  system: string, 
  prompt: string, 
  maxTokens: number, 
  taskType: string
): Promise<{ text: string; modelUsed: string }> {
  // ... existing logic
  const modelId = getModelForTask(taskType)
  
  // ... call provider
  
  return { text: responseText, modelUsed: modelId }
}
```

Cập nhật tất cả nơi gọi `callAI()` (nếu cần):
- `generate-brief.ts` → dùng `result.text` và `result.modelUsed`
- Các caller khác (morning brief, scoring) → cập nhật tương tự

---

## VIỆC 3: Fix JSON parse fail → throw error thay vì lưu brief rỗng (ƯU TIÊN CAO)

### Vấn đề
Khi AI trả JSON lỗi → brief = `{ angles: [], hooks: [], scripts: [] }` → lưu brief rỗng → user thấy brief trống không biết lý do.

### Cách sửa

```tsx
// Trong generate-brief.ts, sau khi callAI:

const aiResponse = result.text

let brief
try {
  // Thử parse JSON
  const cleaned = aiResponse
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()
  brief = JSON.parse(cleaned)
} catch (parseError) {
  console.error('AI trả JSON lỗi:', aiResponse.substring(0, 500))
  
  // KHÔNG lưu brief rỗng — throw error
  throw new Error(
    `AI trả kết quả không hợp lệ. Vui lòng thử lại. ` +
    `(Model: ${result.modelUsed}, lỗi: ${parseError.message})`
  )
}

// Validate brief có đủ data
if (!brief.scripts || brief.scripts.length === 0) {
  throw new Error('AI tạo brief không có script nào. Vui lòng thử lại.')
}

if (!brief.hooks || brief.hooks.length === 0) {
  throw new Error('AI tạo brief không có hook nào. Vui lòng thử lại.')
}
```

Trong `app/api/briefs/batch/route.ts`, catch error:
```tsx
try {
  const briefResult = await generateBrief(productData)
  results.push({ productId: identity.id, briefId: briefResult.id, success: true })
} catch (error) {
  results.push({ 
    productId: identity.id, 
    success: false, 
    error: error instanceof Error ? error.message : 'Lỗi không xác định'
  })
}
```

Frontend hiển thị lỗi rõ ràng cho user (toast hoặc inline error).

---

## VIỆC 4: Hiển thị 10 hooks trong UI (ƯU TIÊN TRUNG BÌNH)

### Vấn đề
ContentBrief.hooks lưu 10 hooks nhưng UI chỉ show 3 hooks gắn vào assets. 7 hooks còn lại user không thấy.

### Cách sửa

Trong `components/production/brief-preview-card.tsx`, thêm section hiển thị tất cả hooks:

```tsx
// Sau phần angles, trước phần assets

{brief.hooks && brief.hooks.length > 0 && (
  <div className="mt-4">
    <button 
      onClick={() => setShowAllHooks(!showAllHooks)}
      className="flex items-center gap-2 text-sm font-medium text-gray-700"
    >
      <ChevronRight className={cn("h-4 w-4 transition", showAllHooks && "rotate-90")} />
      Tất cả câu mở đầu ({brief.hooks.length})
    </button>
    
    {showAllHooks && (
      <div className="mt-2 space-y-2">
        {brief.hooks.map((hook: any, i: number) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100">
            <span className="shrink-0 text-xs font-semibold uppercase text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
              {hook.type}
            </span>
            <p className="text-sm text-gray-800">{hook.text}</p>
            <button 
              onClick={() => copyToClipboard(hook.text)}
              className="shrink-0 text-gray-400 hover:text-orange-600"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
)}
```

---

## VIỆC 5: Cập nhật trang Hướng dẫn (/guide) — phần Cấu hình AI

### Vấn đề nhỏ
Trang /guide section "Cấu hình AI khuyến nghị" vẫn hiện model cũ (Gemini 2.5). Cần ghi chú rằng danh sách model tự động cập nhật.

### Cách sửa
Thêm 1 dòng nhỏ trong section Cấu hình AI:
```
💡 Danh sách model tự động cập nhật phiên bản mới nhất khi bạn kết nối API key.
```

---

## VIỆC 6: Retry logic khi AI trả lỗi (ƯU TIÊN THẤP)

### Cách sửa đơn giản

```tsx
// Trong generate-brief.ts

async function callAIWithRetry(
  system: string, 
  prompt: string, 
  maxTokens: number, 
  taskType: string,
  maxRetries: number = 2
): Promise<{ text: string; modelUsed: string }> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await callAI(system, prompt, maxTokens, taskType)
      
      // Validate JSON ngay
      const cleaned = result.text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      JSON.parse(cleaned)  // Throw nếu JSON lỗi
      
      return result  // JSON hợp lệ → return
    } catch (error) {
      lastError = error as Error
      console.warn(`Lần thử ${attempt}/${maxRetries} thất bại:`, error.message)
      
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * attempt))  // Backoff
      }
    }
  }
  
  throw lastError || new Error('Không thể tạo brief sau nhiều lần thử')
}
```

---

## TÓM TẮT

| Việc | Ưu tiên | File chính |
|------|---------|-----------|
| 1. Enrich prompt (+7 fields) | 🔴 Cao | `generate-brief.ts`, `batch/route.ts` |
| 2. Fix aiModel hardcoded | 🔴 Cao | `generate-brief.ts`, `call-ai.ts` |
| 3. Fix JSON parse → throw error | 🔴 Cao | `generate-brief.ts`, `batch/route.ts` |
| 4. Hiển thị 10 hooks | 🟡 Trung bình | `brief-preview-card.tsx` |
| 5. Cập nhật /guide | 🟢 Thấp | Guide page component |
| 6. Retry logic | 🟢 Thấp | `generate-brief.ts` |

## TEST SAU KHI SỬA

1. Chọn 1 SP có đầy đủ data (rating, soldCount, shopName) → Tạo Brief → brief phải mention rating, lượt bán, shop
2. Chọn 1 SP SURGE/trending → brief phải có hook "đang viral" hoặc "đang hot"
3. Chọn 1 SP giá rẻ (<100K) → brief phải dùng hook giá
4. Kiểm tra DB: ContentBrief.aiModel = model thực tế (không phải "claude-haiku-4-5")
5. 10 hooks hiển thị trong UI (có nút copy)
6. Thử tạo brief khi AI trả lỗi → hiện thông báo lỗi rõ ràng, không lưu brief rỗng

Build 0 lỗi. Commit: "fix: enrich brief prompt + fix aiModel + error handling + show all hooks"
