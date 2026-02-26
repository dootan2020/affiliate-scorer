# Design System 2025 — Affiliate Scorer

Based on 2025-2026 SaaS dashboard trends, warm color palettes, and modern typography standards.

---

## 1. Color Palette — Warm Orange + Elevated Neutrals

**Philosophy:** Clean, warm, spacious. High contrast ratios (15:1+ for body text). No pure white/black.

### Light Mode (Default)

```
BACKGROUND:    bg-gray-50 (#F9FAFB)         → Main container
SURFACE:       bg-white (#FFFFFF)           → Cards, inputs
SURFACE-ALT:   bg-gray-100 (#F3F4F6)        → Alternate backgrounds

BORDER:        border-gray-200 (#E5E7EB)    → Subtle divisions
DIVIDER:       border-gray-100 (#F3F4F6)    → Light separators

TEXT PRIMARY:  text-gray-950 (#030712)      → Headings, body
TEXT SECONDARY: text-gray-600 (#4B5563)     → Labels, captions
TEXT MUTED:    text-gray-500 (#6B7280)      → Disabled, hint text
TEXT SUBTLE:   text-gray-400 (#9CA3AF)      → Very light text

PRIMARY:       #E87B35 (Claude Orange)      → CTAs, primary actions
PRIMARY-DARK:  #C86A2B (darker orange)      → Hover state
PRIMARY-LIGHT: #F4A961 (lighter orange)     → Background/badges

ACCENT:        #3B82F6 (Blue)               → Secondary actions
SUCCESS:       #10B981 (Emerald)            → Positive, completed
WARNING:       #F59E0B (Amber)              → Caution, pending
DANGER:        #EF4444 (Red)                → Destructive, errors
```

### Dark Mode (class: "dark")

```
BACKGROUND:    dark:bg-slate-950 (#030712) → Main container
SURFACE:       dark:bg-slate-900 (#0F172A) → Cards, inputs
SURFACE-ALT:   dark:bg-slate-800 (#1E293B) → Alternate backgrounds

BORDER:        dark:border-slate-800/50    → Subtle divisions
DIVIDER:       dark:border-slate-700/30    → Light separators

TEXT PRIMARY:  dark:text-gray-50 (#F9FAFB) → Headings, body
TEXT SECONDARY: dark:text-gray-400 (#9CA3AF) → Labels, captions
TEXT MUTED:    dark:text-gray-500 (#6B7280) → Disabled, hint text
TEXT SUBTLE:   dark:text-gray-600 (#4B5563) → Very light text

PRIMARY:       #FF8F47 (Warm Orange brighter) → CTAs, primary actions
PRIMARY-DARK:  #E87B35 (standard)              → Hover state
PRIMARY-LIGHT: #FFB088 (lighter)               → Background/badges

ACCENT:        #60A5FA (Brighter Blue)     → Secondary actions
SUCCESS:       #34D399 (Brighter Emerald)  → Positive, completed
WARNING:       #FBBF24 (Brighter Amber)    → Caution, pending
DANGER:        #F87171 (Brighter Red)      → Destructive, errors
```

### Usage in Tailwind v4 CSS (@theme)

```css
@theme {
  /* Primary: Warm Orange */
  --color-primary: #E87B35;
  --color-primary-hover: #C86A2B;
  --color-primary-light: #F4A961;

  /* Neutral: Elevated grays */
  --color-bg: #F9FAFB;
  --color-surface: #FFFFFF;
  --color-text-primary: #030712;
  --color-text-secondary: #4B5563;
  --color-text-muted: #6B7280;

  /* Semantic */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-danger: #EF4444;
  --color-accent: #3B82F6;
}

.dark {
  --color-primary: #FF8F47;
  --color-primary-hover: #E87B35;
  --color-primary-light: #FFB088;
  --color-bg: #030712;
  --color-surface: #0F172A;
  --color-text-primary: #F9FAFB;
  --color-text-secondary: #9CA3AF;
  --color-text-muted: #6B7280;
  --color-success: #34D399;
  --color-warning: #FBBF24;
  --color-danger: #F87171;
  --color-accent: #60A5FA;
}
```

---

## 2. Typography

### Font Stack

**Primary Font:** Be Vietnam Pro (Google Fonts)
- **Why:** Specifically designed for Vietnamese diacritics, modern, tech-friendly
- **Setup:**
  ```tsx
  import { Be_Vietnam_Pro } from "next/font/google";

  const beVietnam = Be_Vietnam_Pro({
    variable: "--font-primary",
    subsets: ["vietnamese", "latin"],
    weight: ["400", "500", "600", "700"],
  });
  ```

**Monospace:** Geist Mono (existing, keep as-is for code blocks)

### Font Scale & Weights

```
Weights:  400 (Regular) | 500 (Medium) | 600 (SemiBold) | 700 (Bold)

Display:   text-3xl (30px) | 600 weight | lh-1.2  → Page titles
H1:        text-2xl (24px) | 600 weight | lh-1.2  → Section headers
H2:        text-xl (20px)  | 600 weight | lh-1.3  → Subsection
H3:        text-lg (18px)  | 600 weight | lh-1.3  → Card titles
H4:        text-base (16px)| 600 weight | lh-1.4  → Form labels

Body:      text-sm (14px)  | 400 weight | lh-1.6  → Main text
Body-sm:   text-xs (12px)  | 400 weight | lh-1.5  → Helper text, captions
Label:     text-xs (12px)  | 500 weight | lh-1.4  → Form labels, badges
Button:    text-sm (14px)  | 600 weight | lh-1.5  → Button text

Data Table: text-xs (12px) | 400 weight | lh-1.5 → Numbers, rows
```

### Tailwind CSS Typography Utilities

```css
/* Update tailwind.config.ts @theme section */
@theme {
  --font-family-primary: "Be Vietnam Pro", sans-serif;
  --line-height-tight: 1.2;
  --line-height-snug: 1.3;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.6;
}

/* Or use @layer base in globals.css */
@layer base {
  h1 {
    @apply text-2xl font-semibold leading-snug;
  }
  h2 {
    @apply text-xl font-semibold leading-snug;
  }
  h3 {
    @apply text-lg font-semibold leading-normal;
  }
  p {
    @apply text-sm font-normal leading-relaxed text-gray-600;
  }
  label {
    @apply text-xs font-medium leading-normal text-gray-700;
  }
}
```

---

## 3. Spacing & Layout

### Spacing Scale (Tailwind defaults, 4px base)

```
p-0, p-1 (4px)   → Tight micro-spacing
p-2 (8px)        → Button padding (horizontal)
p-3 (12px)       → Small component padding
p-4 (16px)       → Standard padding for inputs, small cards
p-6 (24px)       → Main card padding, section spacing
p-8 (32px)       → Large section padding
p-10 (40px)      → Page-level spacing

gap-1 (4px)      → Tight icon + text
gap-2 (8px)      → Button icon + text
gap-3 (12px)     → Form field spacing
gap-4 (16px)     → Component spacing
gap-6 (24px)     → Section spacing
```

### Layout Grid

```css
/* Main container (already in layout.tsx) */
main {
  @apply max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6;
}

/* Card grid — responsive */
.grid-cols {
  /* Mobile: 1 column, p-4 */
  @apply grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6;
}

/* Section spacing */
.space-sections {
  @apply space-y-6 md:space-y-8;
}

/* Dense data table */
.table-compact {
  @apply text-xs p-3 space-y-2;
}
```

---

## 4. Card Styling — Shadow, Radius, Borders

### Card Variants

```tsx
// Standard card (most common)
<div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
  {content}
</div>

// Minimal card (subtle border instead of shadow)
<div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
  {content}
</div>

// Elevated card (stronger shadow, used for modals/popovers)
<div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg dark:shadow-2xl p-8">
  {content}
</div>

// Data-dense card (smaller padding)
<div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-800 p-4">
  {content}
</div>
```

### Shadow Scale

```css
@theme {
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
}

/* Dark mode: Add opacity + slate tint */
.dark {
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.5);
}
```

### Border Radius

```
rounded-lg:  8px   → Buttons, inputs, small components
rounded-xl:  12px  → Cards, moderate components
rounded-2xl: 16px  → Large cards, modals, elevated elements
rounded-3xl: 24px  → Extra-large, hero sections (rare)

Recommendation: Use rounded-xl as default for cards
```

---

## 5. Button Styling

### Button Variants

```tsx
// Primary (Orange)
<button className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm hover:shadow transition-all duration-200">
  Primary CTA
</button>

// Secondary (Gray)
<button className="bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl px-5 py-2.5 font-medium transition-colors duration-200">
  Secondary
</button>

// Ghost (Outline)
<button className="border border-gray-300 hover:bg-gray-50 text-gray-900 rounded-xl px-5 py-2.5 font-medium transition-colors duration-200">
  Ghost
</button>

// Danger
<button className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm hover:shadow transition-all duration-200">
  Delete
</button>

// Disabled (all variants)
<button disabled className="opacity-50 cursor-not-allowed">
  Disabled
</button>

// With Icon
<button className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm">
  <IconName className="w-4 h-4" />
  Action
</button>

// Full-width (mobile CTA)
<button className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl py-3 font-medium">
  Full Width
</button>
```

### Button Size Scale

```
Small (sm):    py-1.5 px-3 text-xs    → Compact UI
Base (md):     py-2.5 px-5 text-sm    → Standard (most common)
Large (lg):    py-3 px-6 text-base    → Primary CTA
X-Large (xl):  py-4 px-8 text-lg     → Hero CTAs (rare)
```

---

## 6. Input & Form Styling

```tsx
// Text input
<input
  className="w-full rounded-xl border border-gray-200 dark:border-slate-700
    bg-white dark:bg-slate-800 px-4 py-2.5 text-sm
    placeholder-gray-500 dark:placeholder-gray-400
    focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500
    focus:outline-none transition-all duration-200"
  placeholder="Type here..."
/>

// Label + input
<div className="flex flex-col gap-2">
  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
    Label
  </label>
  <input
    className="w-full rounded-xl border border-gray-200 dark:border-slate-700
      bg-white dark:bg-slate-800 px-4 py-2.5 text-sm
      focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500
      focus:outline-none transition-all"
  />
  <p className="text-xs text-gray-500 dark:text-gray-400">
    Helper text
  </p>
</div>

// Error state
<input
  className="border-red-500 focus:ring-red-500/20 focus:border-red-500"
/>
<p className="text-xs text-red-600 dark:text-red-400 mt-1">Error message</p>

// Select / Textarea — same border/focus treatment
```

---

## 7. Data-Dense Components

### Table Typography

```
Header row:   text-xs font-semibold uppercase tracking-wide
Data row:     text-sm font-normal
Values:       Tabular numerals (align vertically)
Row height:   h-10 (40px) for data table
Row padding:  px-4 py-2.5
```

### Table Example

```tsx
<table className="w-full text-sm">
  <thead>
    <tr className="border-b border-gray-200 dark:border-slate-800">
      <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 pb-3 px-4">
        Column
      </th>
    </tr>
  </thead>
  <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50">
    <tr className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
      <td className="py-2.5 px-4 text-sm text-gray-900 dark:text-gray-50">
        Data
      </td>
    </tr>
  </tbody>
</table>
```

---

## 8. Empty States & Loading States

### Empty State

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800
    flex items-center justify-center mb-4 text-gray-400 dark:text-gray-500">
    <IconEmpty className="w-8 h-8" />
  </div>
  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-1">
    No campaigns yet
  </h3>
  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
    Create your first campaign to get started
  </p>
  <button className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm">
    Create Campaign
  </button>
</div>
```

### Skeleton Loading (animate-pulse)

```tsx
<div className="space-y-4">
  <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded-lg animate-pulse w-3/4" />
  <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded-lg animate-pulse w-1/2" />
  <div className="h-12 bg-gray-200 dark:bg-slate-800 rounded-xl animate-pulse" />
</div>
```

### Loading Spinner

```tsx
<div className="inline-flex items-center justify-center">
  <div className="w-5 h-5 border-2 border-orange-600/20 border-t-orange-600
    rounded-full animate-spin" />
</div>
```

---

## 9. Badge & Tag Styling

### Badges

```tsx
// Success
<span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/30
  px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
  Active
</span>

// Warning
<span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-950/30
  px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
  Pending
</span>

// Neutral
<span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-slate-800
  px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">
  Draft
</span>

// With close button
<span className="inline-flex items-center gap-2 rounded-full bg-orange-50 dark:bg-orange-950/30
  px-3 py-1 text-xs font-medium text-orange-700 dark:text-orange-300">
  Tag
  <button className="hover:opacity-70 transition-opacity">
    <X className="w-3 h-3" />
  </button>
</span>
```

---

## 10. Responsive Design Rules

### Breakpoints (Tailwind standard)

```
Mobile:    default (< 640px)        → 1 column, p-4, hamburger nav
Tablet:    sm:640px+                → 2 columns, p-6
Desktop:   md:768px+                → 2-3 columns, p-6
Large:     lg:1024px+               → Full layout, p-8
```

### Mobile-First Responsive Pattern

```tsx
// Always write mobile-first, then override
<div className="
  grid grid-cols-1 gap-4        /* Mobile: 1 column */
  md:grid-cols-2 md:gap-6       /* Tablet: 2 columns */
  lg:grid-cols-3 lg:gap-6       /* Desktop: 3 columns */
">
  {items}
</div>
```

### Mobile Navigation

```tsx
// Desktop nav: horizontal pill style
<nav className="hidden md:flex items-center gap-1 bg-gray-100 rounded-xl p-1">
  <a className="px-4 py-2 rounded-lg text-sm font-medium bg-white shadow-sm">Active</a>
  <a className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900">Tab</a>
</nav>

// Mobile nav: bottom tab bar or sidebar (use Sidebar component)
```

---

## 11. Dark Mode Implementation

### Setup

```tsx
// layout.tsx
import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### CSS Variables (Already in globals.css)

```css
:root {
  /* Light mode values */
}

.dark {
  /* Dark mode values */
}
```

### Utilities for Dark Mode

```tsx
// Always use dark: prefix
<div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-50" />

// Use semantic variables when available
<div className="bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark" />
```

---

## 12. Design Tokens Summary (Actionable)

### Copy into Tailwind Config

```css
/* globals.css @theme section */
@theme {
  /* Colors */
  --color-primary: #E87B35;
  --color-primary-hover: #C86A2B;
  --color-primary-light: #F4A961;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-danger: #EF4444;
  --color-accent: #3B82F6;

  /* Spacing: Tailwind defaults (4px base) */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Typography */
  --font-family: "Be Vietnam Pro", sans-serif;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --line-height-tight: 1.2;
  --line-height-snug: 1.3;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.6;

  /* Radius */
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-2xl: 16px;

  /* Shadows */
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

---

## 13. Trends Applied (2025-2026)

✅ **Elevated Neutrals:** Gray-50 background, off-white surfaces (not pure white)
✅ **Dark Mode Evolution:** Full light/dark tokens with proper contrast (15:1 for body text)
✅ **Warm Accent Colors:** Orange primary (#E87B35) with adjusted brightness for dark mode
✅ **Soft Shadows:** Subtle shadows, not harsh (shadow-sm/md most common)
✅ **Spacious Layout:** Consistent gap/padding scale, breathable design
✅ **Accessibility-First:** 4.5:1+ contrast, clear focus states, keyboard navigation support
✅ **Vietnamese Typography:** Be Vietnam Pro font with full diacritical support
✅ **Data-Dense Readability:** Small but readable fonts (text-xs/sm), tabular numerals
✅ **Gradient-Free Smart:** No neon or harsh gradients, focus on clean surfaces
✅ **Responsive Mobile-First:** All components scale 1 column → 2 → 3 columns

---

## 14. Quick Implementation Checklist

- [ ] Update `globals.css` → Add warm orange primary colors to @theme
- [ ] Install Be Vietnam Pro font in `layout.tsx`
- [ ] Verify dark mode toggle in ThemeProvider
- [ ] Check all cards use `rounded-xl shadow-sm hover:shadow-md`
- [ ] Test button hover/focus states with orange-600 → orange-700
- [ ] Verify contrast ratios on body text (text-gray-600 on white, etc.)
- [ ] Test responsive grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- [ ] Ensure inputs have focus ring: `focus:ring-2 focus:ring-orange-500/20`
- [ ] Add empty state cards to all major sections
- [ ] Review table headers: `text-xs font-semibold uppercase`
- [ ] Test dark mode: check all custom colors have `.dark:` equivalents
- [ ] Verify loading/skeleton states use `animate-pulse`

---

## References

- [2026 SaaS Design Trends](https://www.designstudiouiux.com/blog/top-saas-design-trends/)
- [Dark Mode Best Practices 2025](https://www.graphiceagle.com/dark-mode-ui/)
- [Be Vietnam Pro Font](https://fonts.google.com/specimen/Be+Vietnam+Pro)
- [Tailwind CSS v4 Design Tokens](https://tailwindcss.com/blog/tailwindcss-v4)
- [Dashboard Typography 2025](https://datafloq.com/typography-basics-for-data-dashboards/)
- [Card Design Examples 2026](https://bricxlabs.com/blogs/card-ui-design-examples)
