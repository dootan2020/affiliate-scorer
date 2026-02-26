2 việc cần làm:

---

## VIỆC 1: Fix divider thiếu ở một số card

Một số card headers vẫn THIẾU đường kẻ divider (border-b) dưới title. Rà soát lại TẤT CẢ card/widget trong toàn app, đảm bảo MỌI card header đều có:

```
pb-3 mb-4 border-b border-gray-100 dark:border-slate-800
```

Đặc biệt kiểm tra các trang: Inbox, Sync, Insights (stat cards, Sự kiện sắp tới, Dữ liệu AI), Production, Log, Library.

Dùng grep: `grep -rn "<h3" --include="*.tsx" components/ app/` → với mỗi h3, kiểm tra parent div có border-b không.

---

## VIỆC 2: Settings — Quản lý API key đa provider

### Thiết kế mới cho trang /settings:

```
┌─────────────────────────────────────────────┐
│ 🔑 API Keys                                 │
│─────────────────────────────────────────────│
│                                              │
│ Chọn nhà cung cấp AI                        │
│ [Anthropic (Claude)  ▼]  ← dropdown 3 nhà   │
│                                              │
│ API Key                                      │
│ [sk-ant-••••••••gwAA_________] [Kiểm tra]   │
│ ✅ Đã kết nối · Lấy key: console.anthropic   │
│                                              │
│ Khi chuyển sang OpenAI (chưa kết nối):       │
│ [Nhập OpenAI API key_________] [Kiểm tra]   │
│ ⚠️ Chưa kết nối · Lấy key: platform.openai  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ ⚙️ AI Model theo tác vụ                      │
│─────────────────────────────────────────────│
│                                              │
│ Chấm điểm SP      [Claude Haiku 4.5    ▼]  │
│ Tạo Content Brief  [Claude Sonnet 4.5   ▼]  │
│ Morning Brief      [Claude Haiku 4.5    ▼]  │
│ Báo cáo tuần       [Claude Haiku 4.5    ▼]  │
│                                              │
│ Dropdown CHỈ hiện models từ providers ĐÃ    │
│ KẾT NỐI                                     │
│                              [Lưu cấu hình] │
└─────────────────────────────────────────────┘
```

Flow UX:
1. User chọn provider từ dropdown (Anthropic/OpenAI/Google)
2. Input key thay đổi theo provider đã chọn:
   - Nếu đã có key (env var hoặc DB): hiện masked key + "✅ Đã kết nối"
   - Nếu chưa: hiện input trống + "⚠️ Chưa kết nối" + link lấy key
3. Nhập key mới → click "Kiểm tra" → test API → nếu OK → save + refresh
4. Chỉ 1 input hiện tại 1 thời điểm — chuyển provider thì input thay đổi

### Database

Thêm model mới (hoặc thêm vào model hiện có):

```prisma
model ApiProvider {
  id          String   @id @default(cuid())
  provider    String   @unique  // "anthropic", "openai", "google"
  encryptedKey String? // API key encrypted bằng AES-256, NULL nếu dùng env var
  isFromEnv   Boolean  @default(false) // true nếu key từ env var
  isConnected Boolean  @default(false) // true nếu test thành công
  lastTestedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Encryption

```typescript
// lib/encryption.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32 bytes hex string
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

Thêm vào `.env`: `ENCRYPTION_KEY=` (generate bằng `openssl rand -hex 32`)

### API Routes

**POST /api/settings/api-keys/test**
```
Input: { provider: "anthropic" | "openai" | "google", apiKey: string }
Logic:
  - anthropic: GET https://api.anthropic.com/v1/models (header: x-api-key)
  - openai: GET https://api.openai.com/v1/models (header: Authorization: Bearer)
  - google: GET https://generativelanguage.googleapis.com/v1beta/models?key=...
Output: { success: boolean, models: [{ id, name }], error?: string }
```

**POST /api/settings/api-keys/save**
```
Input: { provider: string, apiKey: string }
Logic: Encrypt key → save to ApiProvider table
Output: { success: boolean }
```

**GET /api/settings/api-keys/status**
```
Logic: 
  - Check env vars: ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_AI_API_KEY
  - Check DB: ApiProvider records
  - Merge: env var takes priority
Output: {
  providers: [
    { provider: "anthropic", connected: true, fromEnv: true, lastChars: "gwAA" },
    { provider: "openai", connected: false, fromEnv: false },
    { provider: "google", connected: false, fromEnv: false }
  ]
}
```

**GET /api/settings/available-models**
```
Logic:
  - Chỉ fetch models từ providers đã connected
  - Gọi API thật để lấy danh sách models
  - Map technical ID → friendly name:
    claude-haiku-4-5-20251001 → "Claude Haiku 4.5 — Nhanh, tiết kiệm"
    claude-sonnet-4-5-20250929 → "Claude Sonnet 4.5 — Cân bằng"
    claude-opus-4-6 → "Claude Opus 4.6 — Mạnh nhất"
    gpt-4o → "GPT-4o — Mạnh, đa năng"
    gpt-4o-mini → "GPT-4o-mini — Nhanh, rẻ"
    gemini-2.0-flash → "Gemini 2.0 Flash — Nhanh"
    gemini-2.5-pro → "Gemini 2.5 Pro — Mạnh"
  - Nếu API trả về models không có trong map → dùng ID gốc
Output: {
  models: [
    { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", description: "Nhanh, tiết kiệm", provider: "anthropic" },
    ...
  ]
}
```

### Frontend — Settings page update

1. Card "API Keys":
   - Dropdown chọn provider: Anthropic (Claude) / OpenAI (GPT) / Google (Gemini)
   - Khi chọn provider → hiện trạng thái + input key tương ứng:
     - Đã kết nối qua env var: "✅ Đã kết nối qua biến môi trường" + masked key + disabled input
     - Đã kết nối qua DB: "✅ Đã kết nối" + masked key + nút "Xóa key"
     - Chưa kết nối: input trống + "⚠️ Chưa kết nối" + link lấy key theo provider
   - Nút "Kiểm tra kết nối": gọi /api/settings/api-keys/test → spinner → toast
   - Nếu test OK: auto save → refresh UI → toast "Đã kết nối [provider]"
   - Link lấy key: Anthropic → console.anthropic.com, OpenAI → platform.openai.com/api-keys, Google → aistudio.google.com/apikey

2. Card "AI Model theo tác vụ":
   - Dropdown CHỈ hiển thị models từ providers đã kết nối
   - Nếu chưa kết nối provider nào: hiện "Kết nối ít nhất 1 provider ở phần API Keys"
   - Group by provider trong dropdown, chỉ hiện providers connected

### Cập nhật callClaude / AI callers

Hiện tại `callClaude()` chỉ gọi Anthropic API.

Tạo wrapper `callAI(taskType, messages)`:
```typescript
async function callAI(taskType: string, messages: Message[]) {
  const config = await getModelConfig(taskType); // Lấy model ID từ DB
  const provider = getProviderFromModelId(config.modelId); // "anthropic" | "openai" | "google"
  const apiKey = await getApiKey(provider); // Lấy key (env var hoặc DB decrypt)
  
  switch (provider) {
    case 'anthropic': return callClaude(apiKey, config.modelId, messages);
    case 'openai': return callOpenAI(apiKey, config.modelId, messages);
    case 'google': return callGemini(apiKey, config.modelId, messages);
    default: throw new Error(`Provider không được hỗ trợ: ${provider}`);
  }
}
```

Implement callOpenAI và callGemini:
- OpenAI: POST https://api.openai.com/v1/chat/completions
- Google: POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent

Response format khác nhau giữa 3 provider → normalize về cùng format: `{ content: string }`.

Cập nhật 6 callers (scoring, brief, morning brief, weekly report, learning, ai-detect) dùng `callAI()` thay vì `callClaude()`.

### Env vars cần thêm

```
ENCRYPTION_KEY=           # openssl rand -hex 32
OPENAI_API_KEY=           # Optional, nếu muốn set qua env thay vì UI
GOOGLE_AI_API_KEY=        # Optional, nếu muốn set qua env thay vì UI
```

### Test

- [ ] Nhập key Anthropic sai → toast lỗi "API key không hợp lệ"
- [ ] Nhập key Anthropic đúng → toast thành công, hiện ✅, dropdown có Claude models
- [ ] Không nhập OpenAI key → dropdown không hiện GPT models
- [ ] Nhập OpenAI key đúng → dropdown thêm GPT models
- [ ] Chọn GPT-4o cho "Tạo Content Brief" → Lưu → tạo brief thật bằng GPT-4o
- [ ] Xóa key OpenAI → các task đang dùng GPT tự fallback về Claude (hoặc báo lỗi rõ ràng)

Commit, push, build 0 errors.
