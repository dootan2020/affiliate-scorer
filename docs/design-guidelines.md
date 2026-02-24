# Design Guidelines — AffiliateScorer

## Triết Lý Thiết Kế

Apple-inspired: Clean, warm, spacious. Ít element, nhiều whitespace. Mọi thứ phải "thở".

### KHÔNG BAO GIỜ

- Giao diện chỉ đen trắng, thiếu accent color
- Border cứng (`border-gray-300`) cho card chính
- Góc vuông (`rounded-none`, `rounded-sm`)
- Text quá nhỏ hoặc quá chen chúc
- Button đen phẳng không depth
- Inline styles thay vì Tailwind

### LUÔN LUÔN

- Color palette ấm, có accent color rõ ràng
- Card dùng shadow thay vì border
- Rounded lớn (`rounded-xl`, `rounded-2xl`)
- Spacing rộng rãi (`p-6`, `p-8`, `gap-6`)
- Subtle gradient hoặc background texture nhẹ khi phù hợp

---

## Color Palette

### Light Mode (mặc định)

| Vai trò | Class |
|---------|-------|
| Background | `bg-gray-50 min-h-screen` |
| Card | `bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6` |
| Primary | `bg-blue-600 hover:bg-blue-700 text-white` |
| Success | `text-emerald-600`, `bg-emerald-50` |
| Warning | `text-amber-600`, `bg-amber-50` |
| Danger | `text-rose-600`, `bg-rose-50` |
| Text primary | `text-gray-900` |
| Text secondary | `text-gray-500` |
| Text muted | `text-gray-400` |

### Dark Mode (auto theo OS preference)

| Vai trò | Class |
|---------|-------|
| Background | `dark:bg-slate-950` |
| Card | `dark:bg-slate-900 dark:shadow-slate-800/50` |
| Primary | `dark:bg-blue-500 dark:hover:bg-blue-400` |
| Success | `dark:text-emerald-400`, `dark:bg-emerald-950` |
| Warning | `dark:text-amber-400`, `dark:bg-amber-950` |
| Danger | `dark:text-rose-400`, `dark:bg-rose-950` |
| Text primary | `dark:text-gray-50` |
| Text secondary | `dark:text-gray-400` |
| Text muted | `dark:text-gray-500` |
| Border | `dark:border-slate-800` |
| Input bg | `dark:bg-slate-800 dark:border-slate-700` |

### Setup

- `tailwind.config`: `darkMode: "class"`
- `layout.tsx`: `<html className={...} suppressHydrationWarning>`
- Dùng `next-themes`: `<ThemeProvider attribute="class" defaultTheme="system">`
- Toggle button (Sun/Moon icon) trong navigation

---

## Typography

| Vai trò | Class |
|---------|-------|
| Page title | `text-2xl font-semibold tracking-tight text-gray-900` |
| Section title | `text-lg font-medium text-gray-900` |
| Body text | `text-sm text-gray-600 leading-relaxed` |
| Caption | `text-xs text-gray-400` |

---

## Component Patterns

### Card

```html
<div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow
                dark:bg-slate-900 dark:shadow-slate-800/50">
```

### Button Primary

```html
<button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5
                   font-medium shadow-sm hover:shadow transition-all
                   dark:bg-blue-500 dark:hover:bg-blue-400">
```

### Button Secondary

```html
<button className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl px-5 py-2.5
                   font-medium transition-colors
                   dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700">
```

### Input

```html
<input className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm
                  focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all
                  outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-gray-50" />
```

### Badge

```html
<span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1
                 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-400">
```

### Empty State

```html
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
    <Icon className="w-8 h-8 text-gray-400" />
  </div>
  <h3 className="text-lg font-medium text-gray-900 mb-1">Tiêu đề</h3>
  <p className="text-sm text-gray-500 mb-6 max-w-sm">Mô tả</p>
  <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5
                     font-medium shadow-sm">CTA</button>
</div>
```

### Stat Card

```html
<div className="bg-white rounded-2xl shadow-sm p-6 dark:bg-slate-900">
  <p className="text-sm text-gray-500 mb-1">Label</p>
  <p className="text-3xl font-semibold text-gray-900 dark:text-gray-50">1,234</p>
  <p className="text-xs text-emerald-600 mt-2">+12% so với tuần trước</p>
</div>
```

### Navigation (Pill Style)

```html
<nav className="flex items-center gap-1 bg-gray-100/80 rounded-xl p-1 dark:bg-slate-800/80">
  <a className="px-4 py-2 rounded-lg text-sm font-medium bg-white shadow-sm text-gray-900">Active</a>
  <a className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900">Tab</a>
</nav>
```

### Table

Clean style: `border-b border-gray-100` cho thead, `divide-y divide-gray-50` cho tbody, `hover:bg-gray-50/50 transition-colors` cho tr. Text: `text-xs font-medium text-gray-500 uppercase` cho th, `text-sm text-gray-900` cho td.

---

## Layout

| Vai trò | Class |
|---------|-------|
| Page background | `bg-gray-50 dark:bg-slate-950 min-h-screen` |
| Container | `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8` |
| Grid | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6` |
| Sections | `space-y-8` |
| Header | `flex items-center justify-between mb-8` |

---

## Responsive

**Mobile-first** — viết class cho mobile trước, dùng breakpoints override.

| Breakpoint | Kích thước | Hành vi |
|-----------|-----------|---------|
| Default | < 640px | 1 column, padding nhỏ, hamburger nav |
| `sm` | 640px+ | 2 columns, padding tăng |
| `md` | 768px+ | Sidebar hiện, grid 2 cols |
| `lg` | 1024px+ | Grid 3 cols, max-width container |

**Quy tắc:** Nav mobile dùng hamburger/bottom tab, desktop dùng pill nav. Cards mobile 1 col `p-4`, desktop grid `p-6`. Tables mobile ẩn columns phụ hoặc chuyển card list. Buttons mobile `w-full`, desktop `w-auto`. Text mobile `text-xl` title, desktop `text-2xl`.

---

## Transitions & Icons

| Loại | Class |
|------|-------|
| Interactive elements | `transition-all duration-200` |
| Card hover | `hover:shadow-md hover:-translate-y-0.5` |
| Button hover | `hover:shadow transition-all` |
| Focus ring | `focus:ring-2 focus:ring-blue-500/20` |
| Skeleton loading | `animate-pulse bg-gray-200 rounded-xl` |

**Icons:** lucide-react. Sizes: inline `w-4 h-4`, button `w-5 h-5`, empty state `w-8 h-8`. Dùng `className` để set size.
