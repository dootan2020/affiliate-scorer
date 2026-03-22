# Code Standards — AffiliateScorer

## Quy Tắc Đặt Tên

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Files | kebab-case | `score-breakdown.tsx`, `upload-session.ts` |
| Components | PascalCase | `ScoreBreakdown`, `ProductCard` |
| Functions | camelCase | `calculateScore`, `parseUploadData` |
| Constants | UPPER_SNAKE_CASE | `MAX_SCORE`, `API_TIMEOUT` |
| DB fields | camelCase | `createdAt`, `uploadSessionId` |
| CSS classes | Tailwind utilities | `flex items-center gap-2` |

## TypeScript

- **Strict mode** bật trong `tsconfig.json`
- **KHÔNG dùng `any`** — luôn định nghĩa type rõ ràng
- **Explicit return types** cho mọi function
- Type definitions tập trung tại `lib/types/`
- Dùng Zod schemas (`lib/validations/`) cho runtime validation

```typescript
// ĐÚNG
function calculateScore(product: Product): ScoreResult {
  // ...
}

// SAI — không dùng any, không thiếu return type
function calculateScore(product: any) {
  // ...
}
```

## React & Next.js

- **Functional components** only, không class components
- **Named exports** cho mọi component và function
- **Server Components** là mặc định — chỉ thêm `"use client"` khi cần (hooks, event handlers, browser APIs)
- Next.js App Router (không dùng Pages Router)
- Route Handlers cho API (`app/api/.../route.ts`)

```typescript
// ĐÚNG — named export, Server Component mặc định
export function ProductCard({ product }: ProductCardProps): JSX.Element {
  return <div>...</div>;
}

// "use client" chỉ khi thực sự cần
"use client";
export function UploadDropzone(): JSX.Element {
  const [files, setFiles] = useState<File[]>([]);
  // ...
}
```

## Styling

- **Tailwind CSS only** — KHÔNG inline styles, KHÔNG CSS modules
- **Mobile-first** — viết class cho mobile trước, dùng `sm:` / `md:` / `lg:` override
- **Apple-inspired design** — xem `docs/design-guidelines.md` cho chi tiết
- Dark mode qua Tailwind `darkMode: "class"` + `next-themes`

## Common UI Component Patterns

### Textarea
```tsx
<textarea className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-sans focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none placeholder-gray-400" rows={4} placeholder="Nhập dữ liệu..." />
```

### Select/Dropdown
```tsx
<select className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-sans focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none bg-white">
  <option>Chọn tùy chọn</option>
</select>
```

### DatePicker (Input type="date")
```tsx
<input type="date" className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" />
```

### Responsive Layout Grid
```tsx
// 1 column mobile, 2 columns tablet, 3+ columns desktop
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>
```

### Responsive Table (Mobile-first)
```tsx
// Desktop: full table, Mobile: card list
<div className="hidden md:block overflow-x-auto">
  {/* Full table for md+ */}
</div>
<div className="md:hidden space-y-4">
  {/* Card list for mobile */}
</div>
```

## Error Handling

- **Try-catch** cho mọi async operation
- API routes trả error response chuẩn với status code phù hợp
- UI hiển thị error states thân thiện (không stack trace)
- Graceful fallback khi thiếu env vars (banner hướng dẫn, không crash)

```typescript
// API route pattern
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validated = schema.parse(body); // Zod validation
    const result = await prisma.product.create({ data: validated });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
    }
    console.error("API error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
```

## Validation

- **Zod** cho mọi API input validation
- Schemas định nghĩa tại `lib/validations/`
- Validate ở server-side (route handler), không chỉ client

## UI States

Mọi page và component tương tác đều phải có đủ 3 states:

- **Loading state:** Skeleton animation (`animate-pulse`)
- **Empty state:** Icon + message + CTA button
- **Error state:** Thông báo lỗi thân thiện + nút thử lại

## Ngôn Ngữ UI

- Mọi text hiển thị cho user viết bằng **tiếng Việt**
- Technical terms giữ nguyên tiếng Anh (API, upload, dashboard...)
- Error messages bằng tiếng Việt, dễ hiểu

## File Size

- Giữ mỗi file dưới **200 lines**
- Nếu vượt quá, tách thành modules nhỏ hơn
- Components lớn tách thành sub-components

## AI Agent Module Patterns

**Location:** `lib/agents/`

All agent modules export a main handler function that:
1. Validates input via Zod schema
2. Queries database for context
3. Calls AI provider
4. Returns typed result

```typescript
// Pattern
export async function agentName(input: InputType): Promise<OutputType> {
  const validated = InputSchema.parse(input);
  const context = await db.query(/* ... */);
  const aiResponse = await ai.call(/* ... */);
  return OutputSchema.parse(aiResponse);
}
```

**Module naming:** kebab-case, descriptive (e.g., `telegram-bot-handler.ts`, `channel-memory-builder.ts`)

## Advisory System Patterns

**Location:** `lib/advisor/`

Advisory pipeline follows company hierarchy:

1. **c-level-roles.ts** — Define 5 roles with system prompts (ANALYST, CMO, CFO, CTO, CEO)
2. **gather-advisor-data.ts** — ANALYST role: DB queries for briefing data
3. **analyze-pipeline.ts** — Orchestrate pipeline: ANALYST → [parallel CMO/CFO/CTO] → CEO
4. **analyze.ts** — Main public API for analysis requests

```typescript
// Pattern
export async function analyzePipeline(question: string): Promise<PipelineResult> {
  // 1. Gather analyst briefing
  const analystBriefing = await gatherAdvisorData(/* ... */);

  // 2. Parallel C-level analysis
  const [cmoAnalysis, cfoAnalysis, ctoAnalysis] = await Promise.all([
    analyzeWithRole('CMO', analystBriefing, question),
    analyzeWithRole('CFO', analystBriefing, question),
    analyzeWithRole('CTO', analystBriefing, question),
  ]);

  // 3. CEO synthesis
  const ceoDecision = await analyzeWithRole('CEO',
    { cmoAnalysis, cfoAnalysis, ctoAnalysis, analystBriefing },
    question
  );

  return { ceoDecision, cLevelResponses: [...], analystBriefing };
}
```

## Cron Job Conventions

**Location:** `app/api/cron/`

Cron jobs are GET endpoints that:
1. Check authorization (secret header or Vercel cron signature)
2. Query database for pending work
3. Process in batches (to avoid timeout)
4. Return JSON status summary

```typescript
// Pattern
export async function GET(request: Request): Promise<NextResponse> {
  // Verify cron authorization
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Do work
    const count = await processPendingItems();

    return NextResponse.json({
      status: 'success',
      processed: count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Always return JSON, never throw (Vercel needs to log)
    return NextResponse.json({
      status: 'error',
      message: String(error)
    }, { status: 500 });
  }
}
```

**Schedule via Vercel `vercel.json` or Netlify cron environment**

## API Patterns

- Next.js Route Handlers (`app/api/.../route.ts`)
- Prisma cho database queries
- Proper HTTP status codes (200, 201, 400, 404, 500)
- JSON response format thống nhất

```typescript
// Success: { data: ... }
// Error:   { error: "message" }
```

## Git & Version Control

- **Conventional commits:** `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- **KHÔNG commit secrets** — `.env` luôn trong `.gitignore`
- `.env.example` chứa template với comment hướng dẫn
- Commit sau mỗi phase hoàn thành

## Package Manager

- **pnpm ONLY** — không dùng npm hoặc yarn
- Lock file: `pnpm-lock.yaml`
- Scripts chạy qua `pnpm dev`, `pnpm build`, `pnpm test`

## Cấu Trúc Import

Thứ tự: (1) External packages, (2) Internal modules (`@/lib/...`), (3) Types (`import type`).

## Database Patterns

### Idempotency & Race Conditions

**Use `upsert` for concurrent operations:**

```typescript
// BAD — create may fail if race condition creates duplicate
const item = await prisma.item.create({
  data: { uniqueField: value, ... }
});

// GOOD — handles concurrent creates atomically
const item = await prisma.item.upsert({
  where: { uniqueField: value },
  create: { uniqueField: value, ... },
  update: { ... } // update if already exists
});
```

**Applied to:** ProductIdentity, InboxItem, ContentBrief uniqueness checks.

### Cascading Deletes & Data Integrity

**Always specify `onDelete` for foreign key relations:**

```typescript
// Database enforces referential integrity
model Feedback {
  productId String
  product   Product @relation(
    fields: [productId],
    references: [id],
    onDelete: Cascade  // Required: remove feedback when product deleted
  )
}

model ContentBrief {
  channelId String?
  channel   TikTokChannel? @relation(
    fields: [channelId],
    references: [id],
    onDelete: SetNull  // Preserve brief when channel deleted
  )
}
```

**Cascade Rules (Applied in PASTR):**

| Strategy | Use Case | Examples |
|----------|----------|----------|
| **Cascade** | Transactional data with clear ownership | Feedback→Product, ProductSnapshot→Product, ContentBrief→Product, ContentAsset→Product |
| **SetNull** | Derived/shared content, preserve production assets | ContentBrief→Channel, ContentAsset→Brief, ContentSlot→Product/Asset, NicheProfile→Channel |
| **Restrict** | Prevent accidental deletion (rarely used, causes UX friction) | Only use if data integrity is critical and user must manually handle dependents |

**Applied to 10 Critical Relations in PASTR:**
1. Feedback → Product (Cascade)
2. ProductSnapshot → Product (Cascade)
3. ProductSnapshot → ImportBatch (Cascade)
4. ContentBrief → ProductIdentity (Cascade)
5. ContentBrief → TikTokChannel (SetNull)
6. ContentAsset → ProductIdentity (Cascade)
7. ContentAsset → ContentBrief (SetNull)
8. ContentSlot → ProductIdentity (SetNull)
9. ContentSlot → ContentAsset (SetNull)
10. NicheProfile → TikTokChannel (SetNull)

### Transaction Safety for Multi-Step Operations

**Use `$transaction()` for atomic batch operations only:**

```typescript
// BAD — steps can fail independently; batch left in inconsistent state
await prisma.importBatch.create({ ... });
for (const product of products) {
  await prisma.productAsset.create({ ... });
}

// GOOD — all-or-nothing atomicity
const result = await prisma.$transaction(async (tx) => {
  const batch = await tx.importBatch.create({ ... });
  for (const product of products) {
    await tx.productAsset.create({ batchId: batch.id, ... });
  }
  return batch;
});
```

**When to use:** Batch creation with dependent records, critical financial operations.
**When NOT to use:** Large chunked imports (use parallel updates instead, with fallback cron).

### Error Boundaries for UI

**Wrap interactive widgets in ErrorBoundary for resilience:**

```typescript
// components/dashboard/widget-wrapper.tsx
import { ErrorBoundary } from "react-error-boundary";

export function WidgetWrapper({ children, title }: Props) {
  return (
    <ErrorBoundary fallback={<WidgetError title={title} />}>
      {children}
    </ErrorBoundary>
  );
}

// Applied to 8 widgets:
// - Morning Brief (main recommendation engine)
// - Inbox Stats (product count widget)
// - Quick Paste (input widget)
// - Chart widgets (recharts)
// - Metric cards (stats display)
// - Skill level indicator
// - Pattern analysis
// - Calendar widget
```

**Benefits:**
- Single widget error won't crash entire dashboard
- Users can continue with other features while one widget is broken
- Graceful degradation vs. complete failure
- Each widget shows "Widget unavailable. Retry" fallback

### Mobile-First Responsive Pattern

**Always write styles for mobile first, then override with breakpoints:**

```typescript
// CORRECT — mobile by default, tablet+ overrides
<div className="p-4 sm:p-6 md:p-8 lg:p-12">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
    {/* Content */}
  </div>
</div>

// WRONG — forces mobile to wait for media query
<div className="p-12 md:p-4">
  <div className="grid grid-cols-3 md:grid-cols-1">
    {/* Content */}
  </div>
</div>
```

**Common patterns:**
- **Cards:** `w-full md:w-1/2 lg:w-1/3`
- **Inbox:** `flex flex-col md:table` (cards on mobile, table on desktop)
- **Sidebar:** `hidden lg:block` (mobile stacks below, desktop is side nav)
- **Buttons:** `w-full md:w-auto` (full width on mobile, auto on desktop)

### Cron Job Pattern

**Auth check** via `verifyCronAuth()` (`lib/utils/verify-cron-auth.ts`):

```typescript
// Every cron route MUST verify auth as first step
export async function GET(request: Request): Promise<NextResponse> {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    // ... batch processing logic
    return NextResponse.json({ checked, retried, skipped });
  } catch (error) {
    console.error("Cron [job-name] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    );
  }
}
```

**Rules:**
- Always `GET` method (Vercel cron sends GET)
- Auth: `Authorization: Bearer <CRON_SECRET>` header; dev mode allows if no secret set
- Response: always JSON with metrics (`{ checked, retried, skipped }`)
- Error: try-catch wrapping entire handler; log with `console.error`
- Middleware whitelists `/api/cron/*` in `PUBLIC_API_PATHS`

### Chunked Import Relay Pattern

**Code:** `lib/import/fire-relay.ts`

```typescript
// Fire-and-forget with exponential backoff
const MAX_RETRIES = 3;
const BACKOFF_MS = [1000, 2000, 4000]; // 1s, 2s, 4s

// Auth: passes x-auth-secret header for middleware
// Retry: only on 5xx; 4xx errors are not retried
// Safety net: /api/cron/retry-scoring catches failures
fireRelay("/api/internal/import-chunk", { batchId, offset }, "chunk-2");
```

**Rules:**
- Relay chain: `/api/upload` → `/api/internal/import-chunk` (repeats) → `/api/internal/score-batch`
- `x-auth-secret` header for server-to-server auth (middleware checks this)
- Only retry on 5xx HTTP errors; 4xx = don't retry (client error)
- Must be awaited (Vercel freezes function after `after()` returns)
- Update `ImportBatch.errorLog` on failure for debugging

### PWA Service Worker Convention

**Code:** `public/sw.js`, `public/manifest.json`

```javascript
// Caching strategy: Network-first for API, cache-first for static
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) return; // API = always fresh
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
```

**Rules:**
- `manifest.json`: `display: "standalone"`, `orientation: "portrait-primary"`
- Service worker: `skipWaiting()` on install, `clients.claim()` on activate
- API routes: never cached (always network)
- Static assets: cache-first (serve from cache, else fetch)
- No precache list — only cache on-demand hits
- PWA meta tags injected via `components/layout/pwa-head.tsx`
