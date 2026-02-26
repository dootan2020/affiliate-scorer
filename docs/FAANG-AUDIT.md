ĐÂY LÀ LẦN RÀ SOÁT UI/UX CUỐI CÙNG. Làm TOÀN BỘ APP, không bỏ sót bất kỳ trang hay component nào. Tôi không muốn phải review từng trang nữa.

---

## MỤC TIÊU

Đưa toàn bộ UI/UX lên chuẩn FAANG (Apple/Google Material 3). Rà soát và fix MỌI inconsistency trong 1 lần duy nhất.

---

## BƯỚC 1: Xây dựng Design Token Reference

Trước khi sửa bất cứ gì, định nghĩa rõ design tokens chuẩn. TẤT CẢ component phải tuân theo bảng này:

### Typography Scale
| Element | Class | Size | Weight | Color light | Color dark |
|---------|-------|------|--------|-------------|------------|
| Page H1 | `text-2xl sm:text-[32px] font-semibold tracking-tight` | 32px | 600 | `text-gray-900` | `dark:text-gray-50` |
| Section H2 | `text-xl font-medium` | 20px | 500 | `text-gray-900` | `dark:text-gray-50` |
| Card title | `text-base font-semibold` | 16px | 600 | `text-gray-900` | `dark:text-gray-50` |
| Body | `text-sm` | 14px | 400 | `text-gray-600` | `dark:text-gray-300` |
| Caption/Label | `text-xs` | 12px | 400-500 | `text-gray-400` | `dark:text-gray-500` |
| Badge | `text-xs font-medium` | 12px | 500 | varies | varies |

### Card Pattern
```tsx
{/* CHUẨN: Mọi card/widget PHẢI theo pattern này */}
<div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-5">
  {/* Header bar — LUÔN có divider */}
  <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 dark:border-slate-800">
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-gray-400" />
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">Title</h3>
    </div>
    {actionLink}
  </div>
  {/* Content */}
</div>
```

### Spacing
| Context | Value |
|---------|-------|
| Card padding | `p-5` hoặc `p-4 sm:p-6` |
| Card header → content gap | `pb-3 mb-4` (với divider) |
| Between cards | `gap-6` |
| Section spacing | `space-y-6` hoặc `mt-8` |
| Table row padding | `py-3.5 px-4` |
| List item spacing | `space-y-2` hoặc `gap-2` |

### Border Radius
| Element | Value |
|---------|-------|
| Card | `rounded-2xl` |
| Button | `rounded-xl` |
| Input | `rounded-xl` |
| Badge | `rounded-full` |
| Avatar/Image nhỏ | `rounded-lg` |
| Table | `rounded-xl` (wrapper) |

### Buttons
| Type | Classes |
|------|---------|
| Primary | `bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-400 text-white rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm` |
| Secondary | `bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700` |
| Ghost | `text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl px-3 py-2 text-sm` |
| Danger | `bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-2.5 text-sm font-medium` |
| Link | `text-orange-600 dark:text-orange-400 hover:text-orange-700 text-xs font-medium` |

### Input Fields
```
rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800
px-4 py-3 text-sm
focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500
placeholder:text-gray-400
```

### Shadow & Borders
| Element | Value |
|---------|-------|
| Card shadow | `shadow-sm dark:shadow-slate-800/50` |
| Card border | KHÔNG dùng border, dùng shadow |
| Divider trong card | `border-b border-gray-100 dark:border-slate-800` |
| Page section divider | KHÔNG cần, dùng spacing |

---

## BƯỚC 2: RÀ SOÁT TỪNG TRANG

Mở từng file page, đọc toàn bộ JSX, so sánh với design tokens ở trên. Fix MỌI chỗ lệch.

### Danh sách trang phải kiểm tra:

1. **`app/page.tsx`** — Dashboard
2. **`app/inbox/page.tsx`** + `components/inbox/inbox-table.tsx` — Inbox list
3. **`app/inbox/[id]/page.tsx`** — Product detail
4. **`app/sync/page.tsx`** — Sync/Upload
5. **`app/production/page.tsx`** + components — Production/Brief
6. **`app/log/page.tsx`** + `components/log/log-page-client.tsx` — Log
7. **`app/library/page.tsx`** + components — Library
8. **`app/insights/page.tsx`** + `components/insights/*` — Insights (overview, calendar, confidence, playbook, weekly report)
9. **`app/settings/page.tsx`** + `components/settings/*` — Settings
10. **`app/shops/page.tsx`** — Shops list
11. **`app/shops/[id]/page.tsx`** — Shop detail
12. **`app/products/[id]/page.tsx`** — Product detail (nếu có)
13. **`app/not-found.tsx`** — 404
14. **`app/error.tsx`** — Error page

### Với MỖI trang, kiểm tra:

- [ ] H1 page title: đúng `text-2xl sm:text-[32px] font-semibold tracking-tight`?
- [ ] Card/widget headers: đúng `text-base font-semibold` + divider + spacing?
- [ ] Body text: `text-sm text-gray-600 dark:text-gray-300`?
- [ ] Caption/labels: `text-xs text-gray-400 dark:text-gray-500`?
- [ ] Buttons: đúng pattern (primary orange, secondary, ghost)?
- [ ] Inputs: `rounded-xl` + đúng focus ring orange?
- [ ] Cards: `rounded-2xl shadow-sm p-5`?
- [ ] Tables: row padding `py-3.5`, header style consistent?
- [ ] Badges/tags: `rounded-full text-xs font-medium`?
- [ ] Links: `text-orange-600` cho action links?
- [ ] Icons: consistent size (`w-4 h-4` trong text, `w-5 h-5` standalone)?
- [ ] Spacing: `gap-6` between cards, `space-y-6` sections?
- [ ] Empty states: centered, icon + title + description + CTA button?
- [ ] Loading states: skeleton với `animate-pulse rounded-xl`?
- [ ] Dark mode: mọi element có dark variant?

---

## BƯỚC 3: RÀ SOÁT COMPONENTS DÙNG CHUNG

Các component dùng ở nhiều nơi — fix 1 lần, sửa cả app:

- [ ] `components/ui/button.tsx` — variants đúng design tokens?
- [ ] `components/ui/input.tsx` — rounded-xl, focus orange?
- [ ] `components/ui/badge.tsx` — rounded-full?
- [ ] `components/ui/card.tsx` — rounded-2xl shadow-sm?
- [ ] `components/ui/select.tsx` — rounded-xl?
- [ ] `components/ui/textarea.tsx` — rounded-xl?
- [ ] `components/ui/dialog.tsx` — rounded-2xl?
- [ ] `components/ui/table.tsx` — row padding, header style?
- [ ] `components/shared/product-image.tsx` — rounded-lg, fallback placeholder?
- [ ] `components/layout/sidebar.tsx` — đã OK (active state orange)
- [ ] `globals.css` — base styles, CSS variables consistent?

---

## BƯỚC 4: CROSS-CHECK CUỐI

Sau khi fix tất cả:

```bash
# 1. Build check
pnpm build

# 2. Grep inconsistency
# Tìm rounded-md, rounded-lg trên card (phải là rounded-2xl)
grep -rn "rounded-md\|rounded-lg" --include="*.tsx" components/ app/ | grep -i "card\|widget\|panel"

# 3. Tìm text-sm font-medium trên card headers (phải là text-base font-semibold)
grep -rn "text-sm font-medium" --include="*.tsx" components/ app/

# 4. Tìm card headers thiếu divider (có h3 nhưng không có border-b gần đó)
grep -rn "<h3" --include="*.tsx" components/ app/

# 5. Tìm focus ring còn blue
grep -rn "focus.*blue\|ring-blue" --include="*.tsx" --include="*.css" components/ app/

# 6. Tìm button còn blue primary
grep -rn "bg-blue-600\|bg-blue-500" --include="*.tsx" components/ app/
```

---

## OUTPUT

Tạo file `docs/UI-AUDIT-FINAL.md`:

```markdown
# UI/UX Audit Final — [ngày]

## Tổng quan
- Tổng files kiểm tra: X
- Files có thay đổi: X  
- Tổng số fixes: X

## Chi tiết theo trang
### 1. Dashboard
- [X fixes] — [mô tả ngắn]

### 2. Inbox
- [X fixes] — [mô tả ngắn]

... (mọi trang)

## Shared Components
- [component]: [fix]

## Grep Results (sau fix)
- rounded-md/lg trên cards: 0
- text-sm font-medium trên card headers: 0
- focus ring blue: 0
- bg-blue primary buttons: 0

## Build: 0 errors
```

Commit TẤT CẢ changes trong 1 commit duy nhất message: "ui: comprehensive FAANG audit — typography, spacing, borders, colors across all pages"

Push, build phải 0 errors.
