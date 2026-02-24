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
