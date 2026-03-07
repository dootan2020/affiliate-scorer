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
