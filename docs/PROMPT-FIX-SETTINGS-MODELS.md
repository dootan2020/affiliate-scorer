Sửa 2 vấn đề trên trang Cài đặt (/settings):

---

## VẤN ĐỀ 1: Dropdown provider luôn reset về Anthropic

### Hiện tại
- Mở trang Cài đặt → dropdown "Chọn nhà cung cấp AI" luôn hiện Anthropic (Claude)
- Dù đã chọn Google (Gemini) và lưu model config → reload trang → dropdown quay về Anthropic

### Yêu cầu
Dropdown provider phải mặc định hiện provider đang THỰC SỰ được dùng:
- Nếu 4 tác vụ đều set model Gemini → dropdown mặc định = Google (Gemini)
- Nếu 4 tác vụ mix (2 Anthropic + 2 Google) → dropdown mặc định = provider có nhiều tác vụ nhất
- Nếu chỉ có 1 provider kết nối → dropdown mặc định = provider đó
- Nếu chưa có provider nào → dropdown mặc định = option đầu tiên

### Cách sửa
Trong `settings-page-client.tsx` (hoặc file tương đương):

```tsx
// Khi load trang, xác định provider mặc định từ model config đã lưu
useEffect(() => {
  // Lấy model config hiện tại (4 tác vụ)
  const models = [scoringModel, briefModel, morningModel, weeklyModel]
  
  // Đếm provider nào được dùng nhiều nhất
  const providerCount = { anthropic: 0, openai: 0, google: 0 }
  models.forEach(modelId => {
    if (modelId?.startsWith('claude-')) providerCount.anthropic++
    else if (modelId?.startsWith('gpt-') || modelId?.startsWith('o1-') || modelId?.startsWith('o3-')) providerCount.openai++
    else if (modelId?.startsWith('gemini-')) providerCount.google++
  })
  
  // Provider dùng nhiều nhất → mặc định
  const defaultProvider = Object.entries(providerCount)
    .sort((a, b) => b[1] - a[1])[0][0]
  
  setSelectedProvider(defaultProvider)
}, [modelConfigs])
```

---

## VẤN ĐỀ 2: Models hardcode cũ — cần fetch mới nhất qua API

### Hiện tại
Models được hardcode trong code:
```tsx
// Đang hardcode kiểu này (ví dụ)
const ANTHROPIC_MODELS = [
  { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', tier: 'Nhanh' },
  { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', tier: 'Cân bằng' },
  { id: 'claude-opus-4-5', name: 'Claude Opus 4.5', tier: 'Mạnh' },
]
```

Gemini đã ra 3.1 nhưng app vẫn hiện 2.5 → lỗi thời.

### Yêu cầu
Fetch danh sách models mới nhất từ API của mỗi provider, lọc lấy 3 tier:
- **Nhanh** (nhỏ nhất, rẻ nhất, nhanh nhất)
- **Cân bằng** (trung bình, phù hợp hàng ngày)
- **Mạnh** (lớn nhất, chất lượng cao nhất)

### Cách sửa

#### Bước 1: Tạo API route fetch models

```tsx
// app/api/settings/models/route.ts
// GET /api/settings/models?provider=anthropic

import { NextRequest, NextResponse } from 'next/server'

// Hàm fetch models từ Anthropic
async function fetchAnthropicModels(apiKey: string) {
  const res = await fetch('https://api.anthropic.com/v1/models', {
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
  })
  const data = await res.json()
  // data.data = array of models
  return data.data || []
}

// Hàm fetch models từ OpenAI
async function fetchOpenAIModels(apiKey: string) {
  const res = await fetch('https://api.openai.com/v1/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  })
  const data = await res.json()
  return data.data || []
}

// Hàm fetch models từ Google
async function fetchGoogleModels(apiKey: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  )
  const data = await res.json()
  return data.models || []
}
```

#### Bước 2: Lọc và phân loại 3 tier cho mỗi provider

```tsx
// Mapping model ID → tier
// Mỗi provider có naming convention riêng để phân biệt tier

function classifyModels(provider: string, rawModels: any[]): ClassifiedModel[] {
  if (provider === 'anthropic') {
    return classifyAnthropicModels(rawModels)
  } else if (provider === 'openai') {
    return classifyOpenAIModels(rawModels)
  } else if (provider === 'google') {
    return classifyGoogleModels(rawModels)
  }
  return []
}

interface ClassifiedModel {
  id: string          // model ID để gọi API (ví dụ: "claude-haiku-4-5-20250929")
  name: string        // tên hiển thị (ví dụ: "Claude Haiku 4.5")
  tier: 'fast' | 'balanced' | 'powerful'
  tierLabel: string   // "Nhanh" | "Cân bằng" | "Mạnh"
  provider: string
}

function classifyAnthropicModels(models: any[]): ClassifiedModel[] {
  // Anthropic models có pattern: claude-{tier}-{version}
  // Tier: haiku = nhanh, sonnet = cân bằng, opus = mạnh
  
  const tierMap: Record<string, { tier: 'fast' | 'balanced' | 'powerful', tierLabel: string }> = {
    'haiku': { tier: 'fast', tierLabel: 'Nhanh' },
    'sonnet': { tier: 'balanced', tierLabel: 'Cân bằng' },
    'opus': { tier: 'powerful', tierLabel: 'Mạnh' },
  }
  
  const result: ClassifiedModel[] = []
  
  // Lọc và nhóm theo tier, lấy version mới nhất mỗi tier
  for (const [tierKey, tierInfo] of Object.entries(tierMap)) {
    // Tìm models chứa tier key (ví dụ: "haiku")
    const tierModels = models
      .filter(m => m.id.includes(tierKey))
      .sort((a, b) => {
        // Sort theo ngày tạo hoặc version mới nhất
        const dateA = a.created_at || a.created || 0
        const dateB = b.created_at || b.created || 0
        return dateB - dateA  // Mới nhất trước
      })
    
    if (tierModels.length > 0) {
      const latest = tierModels[0]
      result.push({
        id: latest.id,
        name: formatModelName(latest.id, 'anthropic'),
        tier: tierInfo.tier,
        tierLabel: tierInfo.tierLabel,
        provider: 'anthropic',
      })
    }
  }
  
  return result
}

function classifyOpenAIModels(models: any[]): ClassifiedModel[] {
  // OpenAI tiers:
  // Nhanh: gpt-4o-mini, gpt-4.1-mini, gpt-4.1-nano
  // Cân bằng: gpt-4o, gpt-4.1
  // Mạnh: o1, o3, gpt-4.5
  
  // Lọc chỉ lấy models chat/completion (bỏ embedding, tts, whisper, dall-e)
  const chatModels = models.filter(m => 
    m.id.startsWith('gpt-4') || 
    m.id.startsWith('o1') || 
    m.id.startsWith('o3') ||
    m.id.startsWith('o4')
  )
  
  // Phân tier dựa trên naming
  const fast = chatModels
    .filter(m => m.id.includes('mini') || m.id.includes('nano'))
    .sort((a, b) => (b.created || 0) - (a.created || 0))
  
  const powerful = chatModels
    .filter(m => m.id.startsWith('o1') || m.id.startsWith('o3') || m.id.startsWith('o4') || m.id.includes('4.5'))
    .filter(m => !m.id.includes('mini'))
    .sort((a, b) => (b.created || 0) - (a.created || 0))
  
  const balanced = chatModels
    .filter(m => !m.id.includes('mini') && !m.id.includes('nano'))
    .filter(m => !m.id.startsWith('o1') && !m.id.startsWith('o3') && !m.id.startsWith('o4'))
    .filter(m => !m.id.includes('4.5'))
    .sort((a, b) => (b.created || 0) - (a.created || 0))
  
  const result: ClassifiedModel[] = []
  if (fast[0]) result.push({ id: fast[0].id, name: formatModelName(fast[0].id, 'openai'), tier: 'fast', tierLabel: 'Nhanh', provider: 'openai' })
  if (balanced[0]) result.push({ id: balanced[0].id, name: formatModelName(balanced[0].id, 'openai'), tier: 'balanced', tierLabel: 'Cân bằng', provider: 'openai' })
  if (powerful[0]) result.push({ id: powerful[0].id, name: formatModelName(powerful[0].id, 'openai'), tier: 'powerful', tierLabel: 'Mạnh', provider: 'openai' })
  
  return result
}

function classifyGoogleModels(models: any[]): ClassifiedModel[] {
  // Google tiers:
  // Nhanh: gemini-*-flash, gemini-*-flash-lite
  // Cân bằng: gemini-*-flash (phiên bản mới nhất)
  // Mạnh: gemini-*-pro
  
  // Lọc chỉ lấy gemini models (bỏ embedding, text-bison, etc.)
  const geminiModels = models.filter(m => 
    m.name?.includes('gemini') || m.model_id?.includes('gemini')
  )
  
  // Lấy model ID (Google trả về "models/gemini-2.5-pro" → cần bỏ prefix "models/")
  const normalized = geminiModels.map(m => ({
    ...m,
    id: (m.name || m.model_id || '').replace('models/', ''),
  }))
  
  // Flash lite = Nhanh
  const fast = normalized
    .filter(m => m.id.includes('flash-lite') || m.id.includes('flash-8b'))
    .sort((a, b) => versionSort(b.id, a.id))
  
  // Flash (không lite) = Cân bằng
  const balanced = normalized
    .filter(m => m.id.includes('flash') && !m.id.includes('lite') && !m.id.includes('8b'))
    .sort((a, b) => versionSort(b.id, a.id))
  
  // Pro = Mạnh
  const powerful = normalized
    .filter(m => m.id.includes('pro'))
    .sort((a, b) => versionSort(b.id, a.id))
  
  const result: ClassifiedModel[] = []
  if (fast[0]) result.push({ id: fast[0].id, name: formatModelName(fast[0].id, 'google'), tier: 'fast', tierLabel: 'Nhanh', provider: 'google' })
  if (balanced[0]) result.push({ id: balanced[0].id, name: formatModelName(balanced[0].id, 'google'), tier: 'balanced', tierLabel: 'Cân bằng', provider: 'google' })
  if (powerful[0]) result.push({ id: powerful[0].id, name: formatModelName(powerful[0].id, 'google'), tier: 'powerful', tierLabel: 'Mạnh', provider: 'google' })
  
  return result
}

// Helper: format model ID thành tên đẹp
function formatModelName(id: string, provider: string): string {
  // claude-haiku-4-5-20250929 → "Claude Haiku 4.5"
  // gpt-4o-mini → "GPT-4o Mini"
  // gemini-3.1-pro → "Gemini 3.1 Pro"
  // gemini-2.5-flash → "Gemini 2.5 Flash"
  
  if (provider === 'anthropic') {
    const match = id.match(/claude-(\w+)-(\d+)-(\d+)/)
    if (match) {
      const tier = match[1].charAt(0).toUpperCase() + match[1].slice(1)
      return `Claude ${tier} ${match[2]}.${match[3]}`
    }
    return id
  }
  
  if (provider === 'openai') {
    return id
      .replace('gpt-', 'GPT-')
      .replace('-mini', ' Mini')
      .replace('-nano', ' Nano')
  }
  
  if (provider === 'google') {
    return id
      .replace('gemini-', 'Gemini ')
      .replace('-pro', ' Pro')
      .replace('-flash-lite', ' Flash Lite')
      .replace('-flash', ' Flash')
  }
  
  return id
}
```

#### Bước 3: API route hoàn chỉnh

```tsx
// app/api/settings/models/route.ts

export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get('provider')
  if (!provider) {
    return NextResponse.json({ error: 'Thiếu provider' }, { status: 400 })
  }
  
  // Lấy API key đã lưu (giải mã từ DB)
  const apiKey = await getDecryptedApiKey(userId, provider)
  if (!apiKey) {
    return NextResponse.json({ error: 'Chưa kết nối provider này' }, { status: 400 })
  }
  
  try {
    let rawModels: any[]
    
    if (provider === 'anthropic') {
      rawModels = await fetchAnthropicModels(apiKey)
    } else if (provider === 'openai') {
      rawModels = await fetchOpenAIModels(apiKey)
    } else if (provider === 'google') {
      rawModels = await fetchGoogleModels(apiKey)
    } else {
      return NextResponse.json({ error: 'Provider không hợp lệ' }, { status: 400 })
    }
    
    // Phân loại và lọc 3 tier mới nhất
    const classified = classifyModels(provider, rawModels)
    
    // Cache 24h (models không thay đổi thường xuyên)
    return NextResponse.json(
      { models: classified },
      { headers: { 'Cache-Control': 'public, max-age=86400' } }
    )
  } catch (error) {
    // Nếu fetch API fail → trả fallback hardcode
    const fallback = getFallbackModels(provider)
    return NextResponse.json({ models: fallback, fallback: true })
  }
}

// Fallback khi API không khả dụng
function getFallbackModels(provider: string): ClassifiedModel[] {
  const fallbacks: Record<string, ClassifiedModel[]> = {
    anthropic: [
      { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', tier: 'fast', tierLabel: 'Nhanh', provider: 'anthropic' },
      { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', tier: 'balanced', tierLabel: 'Cân bằng', provider: 'anthropic' },
      { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', tier: 'powerful', tierLabel: 'Mạnh', provider: 'anthropic' },
    ],
    openai: [
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', tier: 'fast', tierLabel: 'Nhanh', provider: 'openai' },
      { id: 'gpt-4.1', name: 'GPT-4.1', tier: 'balanced', tierLabel: 'Cân bằng', provider: 'openai' },
      { id: 'o3', name: 'O3', tier: 'powerful', tierLabel: 'Mạnh', provider: 'openai' },
    ],
    google: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tier: 'fast', tierLabel: 'Nhanh', provider: 'google' },
      { id: 'gemini-3.1-flash', name: 'Gemini 3.1 Flash', tier: 'balanced', tierLabel: 'Cân bằng', provider: 'google' },
      { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro', tier: 'powerful', tierLabel: 'Mạnh', provider: 'google' },
    ],
  }
  return fallbacks[provider] || []
}
```

#### Bước 4: Frontend — dropdown model LỌC THEO provider đã chọn ở trên

**QUY TẮC QUAN TRỌNG:** Dropdown model ở phần "Mô hình AI theo tác vụ" CHỈ hiện models của provider đang chọn ở dropdown trên cùng. KHÔNG hiện lẫn models của providers khác.

Ví dụ:
- Chọn "Anthropic (Claude)" ở trên → 4 dropdown dưới CHỈ hiện: Opus 4.6, Sonnet 4.5, Haiku 4.5
- Chọn "Google (Gemini)" ở trên → 4 dropdown dưới CHỈ hiện: Gemini 3.1 Pro, Gemini 3.1 Flash, Gemini 2.5 Flash Lite
- Chọn "OpenAI (ChatGPT)" ở trên → 4 dropdown dưới CHỈ hiện: O3, GPT-4.1, GPT-4.1 Mini

```tsx
// Trong settings-page-client.tsx

// State
const [selectedProvider, setSelectedProvider] = useState('anthropic')
const [allModels, setAllModels] = useState<Record<string, ClassifiedModel[]>>({})

// Fetch models cho TẤT CẢ providers đã kết nối (chạy 1 lần khi load)
useEffect(() => {
  async function loadAllModels() {
    const connectedProviders = providers.filter(p => p.isConnected)
    const modelsByProvider: Record<string, ClassifiedModel[]> = {}
    
    for (const p of connectedProviders) {
      const res = await fetch(`/api/settings/models?provider=${p.provider}`)
      const data = await res.json()
      modelsByProvider[p.provider] = data.models || []
    }
    
    setAllModels(modelsByProvider)
  }
  
  loadAllModels()
}, [providers])

// Lọc models theo provider đang chọn ở trên
const filteredModels = allModels[selectedProvider] || []

// Khi đổi provider ở trên → tự động đổi models ở dưới sang mặc định của provider mới
useEffect(() => {
  const models = allModels[selectedProvider] || []
  if (models.length > 0) {
    // Mặc định: Nhanh cho scoring/morning, Cân bằng cho brief, Mạnh cho weekly
    const fast = models.find(m => m.tier === 'fast')
    const balanced = models.find(m => m.tier === 'balanced')
    const powerful = models.find(m => m.tier === 'powerful')
    
    // CHỈ tự động đổi nếu user vừa chuyển provider (không phải lúc load trang)
    // Nếu user đã lưu config cũ → giữ nguyên
  }
}, [selectedProvider, allModels])

// Dropdown model — CHỈ hiện models của selectedProvider
<select value={selectedModel} onChange={...}>
  {filteredModels
    .sort((a, b) => {
      const tierOrder = { powerful: 0, balanced: 1, fast: 2 }
      return tierOrder[a.tier] - tierOrder[b.tier]
    })
    .map(model => (
      <option key={model.id} value={model.id}>
        {model.name} — {model.tierLabel}
      </option>
    ))
  }
</select>
```

**Hành vi khi đổi provider:**
1. User chọn provider khác ở dropdown trên
2. 4 dropdown model ở dưới cập nhật ngay → CHỈ hiện models của provider mới
3. Nếu model đang chọn không thuộc provider mới → tự động chuyển sang model cùng tier của provider mới
   - Ví dụ: đang chọn "Claude Sonnet 4.5 — Cân bằng" → đổi sang Google → tự chuyển thành "Gemini 3.1 Flash — Cân bằng"
4. User bấm "Lưu cấu hình" → lưu tất cả vào DB

---

## TÓM TẮT

| Việc | Chi tiết |
|------|----------|
| Fix dropdown provider mặc định | Đọc model config đã lưu → xác định provider dùng nhiều nhất → set làm mặc định |
| Tạo API fetch models | `GET /api/settings/models?provider=xxx` → gọi API provider → lọc 3 tier mới nhất |
| Phân loại 3 tier | Nhanh (Haiku/Mini/Flash) · Cân bằng (Sonnet/GPT-4o/Flash) · Mạnh (Opus/O3/Pro) |
| Fallback | Nếu fetch API fail → dùng danh sách hardcode cập nhật gần nhất |
| Cache | Cache response 24h (models không đổi thường xuyên) |
| Hiển thị | Dropdown: "Tên Model — Tier" (ví dụ: "Gemini 3.1 Pro — Mạnh") |

## LƯU Ý

- Fetch models cần API key đã giải mã → chỉ fetch cho providers đã kết nối
- Mỗi provider TỐI ĐA 3 models (1 nhanh + 1 cân bằng + 1 mạnh) — không liệt kê hết tất cả
- Model ID phải chính xác để gọi API khi tạo brief/scoring (ví dụ: dùng đúng `claude-opus-4-6` không phải `claude-opus-4.6`)
- Kiểm tra lại hàm `callAI()` / `callClaude()` / `callGemini()` có nhận model ID mới không

## TEST SAU KHI SỬA

1. Mở Cài đặt → dropdown provider mặc định = provider đang dùng (Gemini)
2. Chọn Anthropic ở trên → 4 dropdown dưới CHỈ hiện Claude models (Opus, Sonnet, Haiku)
3. Chọn Google ở trên → 4 dropdown dưới CHỈ hiện Gemini models (Pro, Flash, Flash Lite)
4. Chọn OpenAI ở trên (nếu đã kết nối) → CHỈ hiện GPT/O models
5. Dropdown model hiện version mới nhất (Gemini 3.1 nếu có, không phải 2.5 cũ)
6. Đổi provider → model tự chuyển sang cùng tier (Sonnet → Flash khi đổi Claude → Gemini)
7. Lưu → Reload → provider VÀ models vẫn giữ đúng
8. Thử tạo Brief với model mới → hoạt động
9. Provider chưa kết nối → dropdown trên hiện nhưng disable hoặc ghi "(chưa kết nối)"

Build 0 lỗi. Commit: "feat: fetch models mới nhất qua API + fix provider dropdown mặc định"
