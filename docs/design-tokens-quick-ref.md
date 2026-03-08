# Design Tokens Quick Reference

Copy-paste design patterns for common components.

---

## Color Tokens

```
PRIMARY:        #E87B35 (Orange, hover: #C86A2B)
PRIMARY-DARK:   #FF8F47 (Dark mode)
SUCCESS:        #10B981 → dark: #34D399
WARNING:        #F59E0B → dark: #FBBF24
DANGER:         #EF4444 → dark: #F87171
ACCENT:         #3B82F6 → dark: #60A5FA

ORANGE SCALE:   orange-50 | orange-400 | orange-500 | orange-700 | orange-950
                (Used for: Guide TOC active indicator, UI highlights, interactive feedback)

GRAY-50:        #F9FAFB (Light bg)
GRAY-100:       #F3F4F6 (Alt bg)
GRAY-200:       #E5E7EB (Border)
GRAY-500:       #6B7280 (Muted text)
GRAY-600:       #4B5563 (Secondary text)
GRAY-950:       #030712 (Dark text)

SLATE-800:      #1E293B (Dark mode bg-alt)
SLATE-900:      #0F172A (Dark mode surface)
SLATE-950:      #030712 (Dark mode bg)
```

---

## Component Snippets

### Primary Button
```tsx
<button className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm hover:shadow transition-all">
  Button Text
</button>
```

### Secondary Button
```tsx
<button className="bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl px-5 py-2.5 font-medium transition-colors">
  Button Text
</button>
```

### Card
```tsx
<div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6">
  Content
</div>
```

### Input
```tsx
<input className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all" />
```

### Badge (Success)
```tsx
<span className="inline-flex rounded-full bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
  Label
</span>
```

### Empty State
```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
    <IconName className="w-8 h-8 text-gray-400" />
  </div>
  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-1">
    Empty Title
  </h3>
  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
    Empty description
  </p>
  <button className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm">
    CTA
  </button>
</div>
```

### Table
```tsx
<table className="w-full text-sm">
  <thead>
    <tr className="border-b border-gray-200 dark:border-slate-800">
      <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 pb-3 px-4">
        Header
      </th>
    </tr>
  </thead>
  <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50">
    <tr className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
      <td className="py-2.5 px-4 text-sm text-gray-900 dark:text-gray-50">Data</td>
    </tr>
  </tbody>
</table>
```

### Loading Skeleton
```tsx
<div className="space-y-4">
  <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded-lg animate-pulse w-3/4" />
  <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded-lg animate-pulse" />
</div>
```

### Alert Box (Warning)
```tsx
<div className="flex gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 p-4 border border-amber-200 dark:border-amber-900/50">
  <AlertTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
  <div className="flex-1">
    <p className="text-sm font-medium text-amber-900 dark:text-amber-200">Alert title</p>
    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Alert description</p>
  </div>
</div>
```

---

## Spacing Scale

```
p-0: 0px      | p-1: 4px    | p-2: 8px    | p-3: 12px
p-4: 16px     | p-6: 24px   | p-8: 32px   | p-10: 40px

gap-1: 4px    | gap-2: 8px  | gap-3: 12px | gap-4: 16px
gap-6: 24px   | gap-8: 32px

Recommendation: Cards use p-6, sections use gap-6
```

---

## Font Scale

```
text-xs:  12px | font-normal (400) or font-medium (500)
text-sm:  14px | body text, buttons (400)
text-base: 16px | large labels (600)
text-lg:  18px | section headers (600)
text-xl:  20px | page headers (600)
text-2xl: 24px | display/hero (600)
text-3xl: 30px | page title (600)

line height: lh-1.2 (titles), lh-1.3 (headers), lh-1.5 (body), lh-1.6 (relaxed)
```

---

## Radius Scale

```
rounded-lg:   8px   → Buttons, inputs
rounded-xl:   12px  → Cards (default)
rounded-2xl:  16px  → Large cards, modals
rounded-3xl:  24px  → Hero sections (rare)
```

---

## Shadow Scale

```
shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1)          → Subtle cards, inputs
shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1)       → Elevated cards
shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1)     → Modals, dropdowns

Hover: shadow-sm → shadow-md transition-shadow
```

---

## Responsive Pattern

```tsx
<div className="
  grid grid-cols-1 gap-4        // Mobile: 1 col, tight gap
  md:grid-cols-2 md:gap-6       // Tablet: 2 col, normal gap
  lg:grid-cols-3 lg:gap-6       // Desktop: 3 col, normal gap
">
```

---

## Dark Mode Pattern

```tsx
// Always pair light/dark
<div className="
  bg-white dark:bg-slate-900
  text-gray-900 dark:text-gray-50
  border border-gray-200 dark:border-slate-800
">
```

---

## Font Setup (Next.js)

```tsx
import { Be_Vietnam_Pro } from "next/font/google";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-primary",
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
});

// In layout.tsx body
className={`${beVietnam.variable} font-sans`}
```

---

## Tailwind v4 CSS Theme Variables (globals.css)

```css
@theme {
  /* Primary (Orange) */
  --color-primary: #E87B35;
  --color-primary-dark: #C86A2B;
  --color-primary-light: #F4A961;

  /* Neutral */
  --color-gray-50: #F9FAFB;
  --color-gray-100: #F3F4F6;
  --color-gray-200: #E5E7EB;

  /* Semantic */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-danger: #EF4444;

  /* Typography */
  --font-family: "Be Vietnam Pro", sans-serif;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;

  /* Spacing */
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Radius */
  --radius-xl: 12px;
  --radius-2xl: 16px;

  /* Shadows */
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.dark {
  --color-primary: #FF8F47;
  --color-gray-50: #030712;
  --color-text: #F9FAFB;
  --color-surface: #0F172A;
}
```

---

## Checklist Before Launch

- [ ] All cards have `rounded-xl shadow-sm`
- [ ] All buttons use orange-600 with hover orange-700
- [ ] All inputs have focus ring with orange-500
- [ ] Body text is text-sm (14px), not text-base
- [ ] Headings are semibold (600), not bold (700)
- [ ] Cards have p-6, not p-4
- [ ] Grids use gap-6, not gap-4
- [ ] Dark mode: all colors have dark: prefix
- [ ] No pure white (#fff) or pure black (#000) — use gray-50 and gray-950
- [ ] Spacing is consistent: use gap-3, gap-4, gap-6 only
- [ ] Border colors: gray-200 (light) / slate-800 (dark)
- [ ] Table rows: hover:bg-gray-50 dark:hover:bg-slate-800/50

---

## Golden Rules

1. **Warm Orange Primary** — Use #E87B35, never dark blue as primary
2. **Elevated Neutrals** — No pure white/black, use gray-50 and gray-950
3. **Spacious Breathing Room** — Generous padding, generous gaps
4. **Consistent Rounding** — rounded-xl for cards, rounded-lg for inputs
5. **Soft Shadows** — shadow-sm most common, shadow-md on hover
6. **Vietnamese Typography** — Be Vietnam Pro font, not generic sans-serif
7. **Full Dark Mode** — Every color must have light + dark variant
8. **High Contrast Text** — Body text 15:1 ratio, minimum 4.5:1
9. **Mobile-First Responsive** — Start with 1 column, expand on desktop
10. **No Gradients** — Keep it flat and clean, use shadows for depth

