# STANDARDS.md — PASTR Design & Code Standards

Nguồn tham chiếu bắt buộc cho mọi feature mới. Mọi PR phải tuân thủ file này.

---

## 1. Design Tokens

### 1.1 Colors

**Primary (Orange)**

| Token | Light | Dark | CSS Var |
|-------|-------|------|---------|
| Primary | `#E87B35` / `bg-orange-600` | `#FF8F47` / `bg-orange-500` | `--primary` |
| Primary hover | `bg-orange-700` | `bg-orange-400` | — |
| Primary bg | `bg-orange-50` | `bg-orange-950/30` | `--accent` |
| Primary text | `text-orange-600` | `text-orange-400` | — |
| Focus ring | `focus:ring-orange-500/20` | same | `--ring` |

**Semantic**

| Role | Light bg | Light text | Dark bg | Dark text |
|------|----------|------------|---------|-----------|
| Success | `bg-emerald-50` | `text-emerald-700` | `bg-emerald-950/30` | `text-emerald-300` |
| Warning | `bg-amber-50` | `text-amber-700` | `bg-amber-950/30` | `text-amber-300` |
| Error | `bg-rose-50` | `text-rose-700` | `bg-rose-950/30` | `text-rose-300` |
| Info | `bg-blue-50` | `text-blue-700` | `bg-blue-950/20` | `text-blue-300` |

**Gray Scale**

| Role | Light | Dark |
|------|-------|------|
| Page bg | `bg-gray-50` | `bg-slate-950` (var `--background`) |
| Card bg | `bg-white` | `bg-slate-900` (var `--card`) |
| Alt bg | `bg-gray-100` | `bg-slate-800` |
| Text primary | `text-gray-900` | `text-gray-50` |
| Text secondary | `text-gray-500` | `text-gray-400` |
| Text muted | `text-gray-400` | `text-gray-500` |
| Border default | `border-gray-200` | `border-slate-700` |
| Border light | `border-gray-100` | `border-slate-800` |
| Divider | `divide-gray-50` | `divide-slate-800` |

**Chart Colors** (cho Recharts)

| Slot | Light | Dark | CSS Var |
|------|-------|------|---------|
| 1 | `#E87B35` | `#FF8F47` | `--chart-1` |
| 2 | `#059669` | `#34D399` | `--chart-2` |
| 3 | `#6366F1` | `#818CF8` | `--chart-3` |
| 4 | `#D97706` | `#FBBF24` | `--chart-4` |
| 5 | `#EC4899` | `#F472B6` | `--chart-5` |

**Rules:**
- KHÔNG dùng pure white `#FFF` hoặc pure black `#000` — dùng gray-50 và gray-950
- Mọi color PHẢI có cặp light/dark
- Primary là orange — KHÔNG BAO GIỜ dùng blue làm primary
- Focus ring luôn dùng `orange-500/20`, KHÔNG dùng `blue-500`

### 1.2 Spacing

| Context | Value | Tailwind |
|---------|-------|----------|
| Card padding | 20px | `p-5` |
| Card padding (responsive) | 16→20px | `p-4 sm:p-5` |
| Section gap | 24px | `gap-6` |
| Item gap (tight) | 8–12px | `gap-2` hoặc `gap-3` |
| Item gap (normal) | 16px | `gap-4` |
| Page vertical | 24–32px | `py-6` hoặc `py-8` |
| Page horizontal | responsive | `px-4 sm:px-6 lg:px-8` |
| Container max | 72rem | `max-w-6xl mx-auto` |
| Form field gap | 20px | `space-y-5` |

**Container chuẩn:**
```
max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6
```

**Rules:**
- Cards dùng `p-5` (không p-4 trừ compact variant)
- Sections dùng `gap-6` (không gap-4 giữa các sections)
- Dùng `gap-*` cho flex/grid, `space-y-*` cho form stacking

### 1.3 Typography

**Font:** Be Vietnam Pro (Vietnamese diacritics optimized)
```
--font-sans: "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
```

**Scale:**

| Role | Size | Weight | Extra |
|------|------|--------|-------|
| Page title | `text-2xl sm:text-[32px]` | `font-semibold` | `tracking-tight` |
| Section title | `text-lg` | `font-semibold` | — |
| Card title | `text-base` | `font-semibold` | — |
| Subsection | `text-sm` | `font-medium` | — |
| Body | `text-sm` | normal (400) | `text-gray-600 dark:text-gray-400` |
| Caption | `text-xs` | normal or `font-medium` | `text-gray-400 dark:text-gray-500` |
| Badge text | `text-xs` | `font-medium` | — |
| Stat number | `text-xl` | `font-bold` | — |
| Table header | `text-xs` | `font-medium` | `uppercase tracking-wider` |

**Rules:**
- Body text là `text-sm` (14px), KHÔNG dùng `text-base` cho body
- Headings dùng `font-semibold`, KHÔNG dùng `font-bold` (trừ stat numbers)
- Label forms: `text-xs font-medium text-gray-600 dark:text-gray-400`

### 1.4 Border Radius

| Element | Radius | Tailwind |
|---------|--------|----------|
| Cards, modals | 16px | `rounded-2xl` |
| Buttons, inputs, small containers | 12px | `rounded-xl` |
| Smaller elements | 8px | `rounded-lg` |
| Badges, pills | 9999px | `rounded-full` |
| Skeletons | 12px | `rounded-xl` |
| Icon containers (empty state) | 16px | `rounded-2xl` |

**Rules:**
- KHÔNG dùng `rounded-md` hoặc `rounded-sm` cho UI chính
- Cards LUÔN `rounded-2xl`
- Buttons LUÔN `rounded-xl`

### 1.5 Shadows

| Element | Shadow | Dark variant |
|---------|--------|-------------|
| Cards | `shadow-sm` | `dark:shadow-slate-800/50` |
| Inputs | `shadow-xs` | — |
| Buttons | `shadow-sm` | — |
| Card hover | `hover:shadow-md` | — |
| Modals/dropdowns | `shadow-xl` | — |
| Active tab pill | `shadow-sm` | — |

**Rules:**
- Cards dùng `shadow-sm`, KHÔNG dùng border thay shadow
- Hover effect: `shadow-sm → shadow-md` với `transition-shadow`
- Dark mode cards: thêm `dark:shadow-slate-800/50`

---

## 2. Component Patterns

### 2.1 Card

```tsx
// Standard card
<div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-5">
  {children}
</div>

// Card with header divider
<div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-5">
  <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 dark:border-slate-800">
    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">Title</h3>
    <Link className="text-xs text-orange-600 dark:text-orange-400 hover:underline">Action →</Link>
  </div>
  {content}
</div>

// Card with border (lighter feel)
<div className="border border-gray-100 dark:border-slate-800 rounded-xl p-4 hover:border-gray-200 dark:hover:border-slate-700 transition-colors">
  {children}
</div>
```

### 2.2 Badge / Tag

**Score badge** (numeric, color-coded):
```tsx
// ≥85: bg-rose-500, ≥70: bg-emerald-500, ≥50: bg-amber-500, <50: bg-gray-400
<span className="inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-xs font-bold min-w-[32px] bg-emerald-500 text-white">
  75
</span>
```

**Status badge** (text, pill-shaped):
```tsx
<span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
  Active
</span>
```

**Delta badges** — mapping chuẩn:

| Delta | Light bg | Light text | Dark bg | Dark text |
|-------|----------|------------|---------|-----------|
| NEW | `emerald-50` | `emerald-700` | `emerald-950` | `emerald-300` |
| SURGE | `rose-50` | `rose-700` | `rose-950` | `rose-300` |
| COOL | `blue-50` | `blue-700` | `blue-950` | `blue-300` |
| STABLE | `gray-100` | `gray-600` | `slate-800` | `gray-400` |
| REAPPEAR | `amber-50` | `amber-700` | `amber-950` | `amber-300` |

### 2.3 Button

Ưu tiên dùng `<Button>` component từ `components/ui/button.tsx` (CVA-based).

**Variants:** `default` (primary), `secondary`, `destructive`, `outline`, `ghost`, `link`
**Sizes:** `default` (h-9, min-h-44px), `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`

Khi không dùng Button component (inline buttons):

```tsx
// Primary
className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-400 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm hover:shadow transition-all"

// Secondary
className="bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl px-5 py-2.5 font-medium transition-colors"

// Small inline button
className="inline-flex items-center gap-1.5 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded-lg px-3 py-1.5 font-medium shadow-sm transition-all"
```

**Rules:**
- Touch target tối thiểu 44px (`min-h-[44px]`)
- Disabled: `disabled:opacity-50 disabled:pointer-events-none`
- Loading: dùng `<Loader2 className="w-4 h-4 animate-spin" />` trong button

### 2.4 Empty State

```tsx
// Full page empty state
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
    <IconName className="w-8 h-8 text-gray-400 dark:text-gray-500" />
  </div>
  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-1">Title</h3>
  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">Description</p>
  <Button>CTA</Button>
</div>

// Widget empty state (smaller)
<div className="flex flex-col items-center justify-center py-8 text-center">
  <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-3">
    <IconName className="w-6 h-6 text-gray-400" />
  </div>
  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Message</p>
  <Link className="text-sm text-orange-600 hover:underline">Action</Link>
</div>
```

### 2.5 Loading State

**Card skeleton:**
```tsx
<div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-5 space-y-4 animate-pulse">
  <div className="h-5 w-48 bg-gray-200 dark:bg-slate-700 rounded-lg" />
  <div className="h-3 w-full bg-gray-200 dark:bg-slate-700 rounded-full" />
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="h-4 w-full bg-gray-100 dark:bg-slate-800 rounded" />
    ))}
  </div>
</div>
```

**Table row skeleton:**
```tsx
<div className="flex items-center gap-3 px-4 py-3 animate-pulse">
  <div className="w-9 h-9 bg-gray-200 dark:bg-slate-800 rounded-lg shrink-0" />
  <div className="flex-1 space-y-1.5">
    <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-2/3" />
    <div className="h-3 bg-gray-100 dark:bg-slate-800/70 rounded w-1/3" />
  </div>
</div>
```

**Action spinner:**
```tsx
<Loader2 className="w-4 h-4 animate-spin" />
```

**Rules:**
- Page load → skeleton (`animate-pulse`)
- Button/action → spinner (`Loader2 animate-spin`)
- Skeleton colors: `bg-gray-200 dark:bg-slate-700` (prominent), `bg-gray-100 dark:bg-slate-800` (subtle)

### 2.6 Error State

**Inline error:**
```tsx
<div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl px-4 py-3">
  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
  <span className="text-sm text-rose-700 dark:text-rose-300">{error}</span>
</div>
```

**Error with retry:**
```tsx
<div className="flex flex-col items-center py-12 text-center">
  <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mb-3">
    <AlertTriangle className="w-6 h-6 text-amber-500" />
  </div>
  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{error}</p>
  <Button variant="link" onClick={retry}>Thử lại</Button>
</div>
```

**Rules:**
- Luôn có nút "Thử lại" cho fetch errors
- KHÔNG hiện stack trace cho user
- Toast cho transient success/error (sonner): `toast.success("Đã lưu")`, `toast.error("Lỗi")`

### 2.7 Toast (sonner)

```tsx
import { toast } from "sonner";

// Success
toast.success("Đã lưu thành công");

// Error
toast.error("Không thể lưu. Vui lòng thử lại.");

// With description
toast.success("Đã tạo brief", { description: "3 assets được tạo" });
```

**Rules:**
- Dùng toast cho transient feedback (save, delete, copy)
- KHÔNG dùng toast cho persistent errors — dùng inline error thay
- Messages bằng tiếng Việt

### 2.8 Form

```tsx
// Label
<label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
  Label *
</label>

// Input
<input className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none" />

// Select
<select className={inputCls}>
  <option value="">Chọn...</option>
</select>

// Validation error
<p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{error}</p>

// Form layout
<div className="space-y-5">
  {fields}
</div>
```

**Tab navigation (for form sections):**
```tsx
<nav className="flex items-center gap-1 bg-gray-100/80 dark:bg-slate-800/80 rounded-xl p-1">
  <button className={tab === "active"
    ? "bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-gray-50"
    : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
  } + " px-4 py-2 rounded-lg text-sm font-medium transition-colors">
    Tab Name
  </button>
</nav>
```

### 2.9 Table

```tsx
<div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full min-w-[700px]">
      <thead>
        <tr className="border-b border-gray-100 dark:border-slate-800">
          <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 pt-4 px-4">
            Header
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
        <tr className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
          <td className="py-3.5 px-4 text-sm text-gray-900 dark:text-gray-50">Data</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

**Responsive table:** Ẩn columns ít quan trọng:
```tsx
<th className="hidden md:table-cell">...</th>
<td className="hidden md:table-cell">...</td>
```

### 2.10 Alert / Callout

```tsx
// Variants: tip (amber), success (emerald), info (orange), warning (rose)
<div className="rounded-xl border p-4 flex gap-3 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
  <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{children}</div>
</div>
```

### 2.11 Progress Bar

```tsx
<div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
  <div
    className="h-full bg-orange-500 rounded-full transition-all duration-500"
    style={{ width: `${pct}%` }}
  />
</div>
```

### 2.12 Pagination

```tsx
<div className="flex items-center gap-2">
  <Button variant="secondary" size="icon" onClick={prev} disabled={page <= 1}>
    <ChevronLeft className="w-4 h-4" />
  </Button>
  <span className="text-sm text-gray-600 dark:text-gray-300 tabular-nums">
    {page} / {totalPages}
  </span>
  <Button variant="secondary" size="icon" onClick={next} disabled={page >= totalPages}>
    <ChevronRight className="w-4 h-4" />
  </Button>
</div>
```

---

## 3. API Patterns

### 3.1 Response Format

**Success — single item:**
```json
{ "data": { ... } }
```

**Success — list with pagination:**
```json
{
  "data": [...],
  "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 },
  "stats": { "new": 10, "scored": 5 }
}
```

**Error:**
```json
{ "error": "User-friendly message", "code": "ERROR_CODE", "details": [...] }
```

### 3.2 Status Codes

| Code | When |
|------|------|
| 200 | GET success, PUT/PATCH success |
| 201 | POST created new resource |
| 400 | Validation error, invalid input |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Server error |

### 3.3 Error Handling

```tsx
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const validation = await validateBody(request, schema);
    if (validation.error) return validation.error;

    const result = await prisma.model.create({ data: validation.data });
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("[POST /api/resource]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Rules:**
- Luôn dùng `validateBody()` helper cho POST/PUT body validation
- Log error ra console với route context: `[METHOD /api/path]`
- Error messages cho user bằng tiếng Việt
- KHÔNG trả stack trace về client

### 3.4 Validation (Zod)

**Schema location:** `lib/validations/schemas-*.ts`

| File | Covers |
|------|--------|
| `schemas.ts` | Core/product schemas |
| `schemas-content.ts` | Brief, asset, logging |
| `schemas-financial.ts` | Calendar, goal, commission |
| `schemas-shops.ts` | Shop schemas |

**Common patterns:**
```tsx
// Pagination query
const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(500).default(20),
  sortBy: z.enum(["field1", "field2"]).default("field1"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Create body
const createSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().optional(),
  channelId: z.string().min(1),
});

// Validate in route
const validation = await validateBody(request, createSchema);
if (validation.error) return validation.error;
const { name, price, channelId } = validation.data;
```

**Rules:**
- Mọi API input PHẢI được validate bằng Zod
- Query params dùng `z.coerce.number()` cho auto string→number
- Pagination defaults: `page=1, limit=20`
- Luôn đặt `.max()` cho arrays và strings

### 3.5 Cache Strategy

**Hiện tại: KHÔNG cache** — real-time queries mỗi request.

- Phù hợp cho interactive dashboard với data thay đổi thường xuyên
- Rate limiting thay cho cache khi cần throttle: `checkRateLimit(key, maxHits, windowMs)`
- Nếu tương lai cần cache: dùng Next.js `unstable_cache()` + `revalidateTag()`

---

## 4. Data Patterns

### 4.1 Pagination

```tsx
const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
const skip = (page - 1) * limit;

const [items, total] = await Promise.all([
  prisma.model.findMany({ skip, take: limit, orderBy: { createdAt: "desc" } }),
  prisma.model.count({ where }),
]);

return NextResponse.json({
  data: items,
  pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
});
```

### 4.2 Select & Include

```tsx
// List views — select only needed fields
select: {
  id: true,
  title: true,
  imageUrl: true,
  createdAt: true,
}

// Detail views — include relations with nested select
include: {
  productIdentity: {
    select: { id: true, title: true, shopName: true, imageUrl: true },
  },
  assets: { orderBy: { createdAt: "asc" } },
}
```

**Rules:**
- List queries: luôn dùng `select` để giới hạn fields
- Detail queries: dùng `include` với nested `select`
- KHÔNG dùng `findMany()` không có `select` hoặc `take` limit

### 4.3 Dynamic Where Clause

```tsx
const where: Record<string, unknown> = {};
if (category) where.category = { contains: category, mode: "insensitive" };
if (minScore !== undefined) where.aiScore = { gte: minScore };
if (channelId) where.channelId = channelId;
```

### 4.4 Transactions

```tsx
// Khi cần atomic multi-step operations
const [resultA, resultB] = await prisma.$transaction([
  prisma.modelA.create({ data: dataA }),
  prisma.modelB.update({ where: { id }, data: dataB }),
]);
```

**Khi nào dùng transaction:**
- Create + update liên quan (e.g., log + update asset status)
- Atomic state transitions (e.g., count + insert unique)
- Batch operations cần all-or-nothing

### 4.5 Batch Operations

```tsx
const results: { id: string; status: "success" | "error"; error?: string }[] = [];

for (const item of items) {
  try {
    await prisma.model.create({ data: item });
    results.push({ id: item.id, status: "success" });
  } catch (err) {
    results.push({ id: item.id, status: "error", error: (err as Error).message });
  }
}

return NextResponse.json({
  data: results,
  message: `${results.filter(r => r.status === "success").length}/${items.length} thành công`,
});
```

### 4.6 ChannelId Rules

| Context | Required? |
|---------|-----------|
| Brief generation | BẮT BUỘC — validate channel exists + isActive |
| Asset creation | BẮT BUỘC — inherited from brief |
| Content slots | BẮT BUỘC — belongs to channel |
| Inbox operations | KHÔNG — product_identities không thuộc channel |
| Log/metrics | KHÔNG — metrics thuộc asset, không trực tiếp channel |
| Financial records | KHÔNG — global records |

**Channel validation pattern:**
```tsx
const channel = await prisma.tikTokChannel.findUnique({ where: { id: channelId } });
if (!channel) return NextResponse.json({ error: "Không tìm thấy kênh" }, { status: 404 });
if (!channel.isActive) return NextResponse.json({ error: "Kênh đã tạm dừng" }, { status: 400 });
```

### 4.7 Special Type Handling

**JSON fields** (Prisma JSON columns):
```tsx
import { toNullableJson } from "@/lib/utils/typed-json";

// Write
data: { contentPillars: toNullableJson(contentPillars) }

// Read — parse back
const parsed = JSON.parse(JSON.stringify(channel)) as Record<string, unknown>;
```

**Decimal fields**:
```tsx
const score = identity.combinedScore ? Number(identity.combinedScore) : null;
```

**Date fields**:
```tsx
const parsedDate = new Date(body.date);
if (isNaN(parsedDate.getTime())) {
  return NextResponse.json({ error: "date không hợp lệ" }, { status: 400 });
}
```

---

## 5. File / Folder Conventions

### 5.1 Component Files

**Naming:** `kebab-case.tsx`

| Suffix | Purpose | Example |
|--------|---------|---------|
| `-client.tsx` | Client component (hooks, state) | `channel-detail-client.tsx` |
| `-page-client.tsx` | Full page client component | `inbox-page-client.tsx` |
| `-form.tsx` | Form components | `channel-form.tsx` |
| `-dialog.tsx` | Modal/dialog components | `tactical-refresh-dialog.tsx` |
| `-card.tsx` | Display card component | `brief-preview-card.tsx` |
| `-widget.tsx` | Dashboard widget | `inbox-stats-widget.tsx` |
| `-tab.tsx` | Tab content component | `overview-tab.tsx` |
| `-provider.tsx` | Context provider | `theme-provider.tsx` |

**Folder structure:**
```
components/
├── channels/          # Channel-related components
├── dashboard/         # Dashboard widgets
├── inbox/             # Inbox components
├── production/        # Production workflow
├── layout/            # Navigation, sidebar
├── ui/                # Shared UI primitives (Button, Input, etc.)
└── guide/             # Guide/help components
```

### 5.2 API Routes

```
app/api/
├── [resource]/
│   ├── route.ts              # GET list, POST create
│   └── [id]/
│       ├── route.ts          # GET detail, PUT update, DELETE
│       └── [sub-resource]/
│           └── route.ts      # Nested operations
```

**Rules:**
- Mỗi route.ts export named functions: `GET`, `POST`, `PUT`, `DELETE`
- URL params qua `params` argument
- Query params qua `request.nextUrl.searchParams`

### 5.3 Types & Interfaces

| Location | For |
|----------|-----|
| `lib/types/*.ts` | Shared domain types (Product, Production) |
| Inline in component | Component-specific props types |
| In route file | Route-specific request/response types |
| `lib/validations/schemas-*.ts` | Zod schemas (also serve as types via `z.infer`) |

**Rules:**
- Prefer Zod `z.infer<typeof schema>` over manual interface khi schema đã có
- Shared types đặt trong `lib/types/`
- Component props types đặt trong cùng file

### 5.4 Hooks

- **Naming:** `use-*.ts` (kebab-case)
- **Location:** Trong folder của feature sử dụng, hoặc `lib/hooks/` nếu shared
- Export named: `export function useFeatureName()`

### 5.5 Utilities

```
lib/
├── db/                 # Prisma client singleton
├── services/           # Business logic services
├── parsers/            # Data import parsers
├── ai/                 # AI provider integration
├── utils/              # Generic utilities
├── types/              # Type definitions
└── validations/        # Zod schemas
```

### 5.6 Import Order

```tsx
// 1. External packages
import { useState, useEffect } from "react";
import { NextResponse } from "next/server";

// 2. Internal modules
import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validations/validate-body";

// 3. Types (import type)
import type { Product } from "@/lib/types/product";
```

---

## 6. Quick Reference Checklist

Trước khi submit PR, verify:

- [ ] Colors dùng orange primary, không blue
- [ ] Focus rings: `orange-500/20`, không `blue-500`
- [ ] Cards: `rounded-2xl shadow-sm p-5`, có dark mode
- [ ] Buttons: dùng `<Button>` component hoặc orange-600 pattern
- [ ] Empty states có icon + text + CTA
- [ ] Loading states có skeleton animate-pulse
- [ ] Error states có message + retry button
- [ ] Form labels: `text-xs font-medium text-gray-600`
- [ ] API trả `{ data }` success, `{ error, code }` failure
- [ ] Zod validation cho mọi API input
- [ ] ChannelId validated cho content operations
- [ ] File naming kebab-case với suffix phù hợp
- [ ] Mọi text UI bằng tiếng Việt
- [ ] Responsive: mobile-first, test sm/md/lg
- [ ] Dark mode: mọi element có `dark:` variant
