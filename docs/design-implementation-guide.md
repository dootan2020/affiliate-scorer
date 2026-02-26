# Design System Implementation Guide

Step-by-step guide to apply the 2025 design system to affiliate-scorer.

---

## Phase 1: Typography Setup (15 min)

### Step 1: Install Be Vietnam Pro Font

Update `app/layout.tsx`:

```tsx
import { Be_Vietnam_Pro } from "next/font/google";
import { Geist, Geist_Mono } from "next/font/google";

// Add this
const beVietnam = Be_Vietnam_Pro({
  variable: "--font-primary",
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${beVietnam.variable} ${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-gray-50 dark:bg-slate-950 min-h-screen`}
      >
        {/* ... rest ... */}
      </body>
    </html>
  );
}
```

### Step 2: Add Typography Base Styles

Update `app/globals.css` → add to `@layer base`:

```css
@layer base {
  /* Remove existing h1, h2, p if any */

  h1 {
    @apply text-2xl font-semibold leading-snug text-gray-950 dark:text-gray-50;
  }

  h2 {
    @apply text-xl font-semibold leading-snug text-gray-950 dark:text-gray-50;
  }

  h3 {
    @apply text-lg font-semibold leading-normal text-gray-950 dark:text-gray-50;
  }

  h4 {
    @apply text-base font-semibold leading-normal text-gray-950 dark:text-gray-50;
  }

  p {
    @apply text-sm font-normal leading-relaxed text-gray-600 dark:text-gray-400;
  }

  label {
    @apply text-xs font-medium leading-normal text-gray-700 dark:text-gray-300;
  }

  small {
    @apply text-xs font-normal text-gray-500 dark:text-gray-500;
  }
}
```

---

## Phase 2: Update Color Tokens (20 min)

### Step 1: Update globals.css @theme block

Current setup already uses @theme (good!). **Replace** the @theme section:

```css
@theme inline {
  /* Keep existing shadcn/sidebar tokens, ADD these: */

  /* Primary: Warm Orange */
  --color-primary: #E87B35;
  --color-primary-dark: #C86A2B;
  --color-primary-light: #F4A961;

  /* Neutral */
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

  /* Typography */
  --font-family: "Be Vietnam Pro", sans-serif;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Radius */
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-2xl: 16px;

  /* Shadows */
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}
```

### Step 2: Update .dark mode tokens

Current .dark section uses OkLch. **Add custom color overrides** after existing dark tokens:

```css
.dark {
  /* Keep existing OkLch tokens, ADD: */

  /* Primary: Brighter orange for dark mode */
  --color-primary: #FF8F47;
  --color-primary-dark: #E87B35;
  --color-primary-light: #FFB088;

  /* Neutral: Dark mode text */
  --color-text-primary: #F9FAFB;
  --color-text-secondary: #9CA3AF;
  --color-text-muted: #6B7280;

  /* Semantic: Brighter versions */
  --color-success: #34D399;
  --color-warning: #FBBF24;
  --color-danger: #F87171;
  --color-accent: #60A5FA;

  /* Shadows: Stronger for dark */
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.5);
}
```

---

## Phase 3: Update Component Library (45 min)

### Step 1: Find all button components

```bash
find app -name "*button*" -o -name "*btn*" | grep -E "\.(tsx|jsx)$"
```

### Step 2: Standardize Button Styles

Replace button class patterns:

**OLD:**
```tsx
<button className="bg-blue-600 hover:bg-blue-700 text-white ...">
```

**NEW:**
```tsx
<button className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm hover:shadow transition-all">
```

**Secondary Button (NEW):**
```tsx
<button className="bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-gray-50 rounded-xl px-5 py-2.5 font-medium transition-colors">
```

### Step 3: Standardize Card Styling

Find all cards (look for `bg-white` or `rounded-`):

**OLD:**
```tsx
<div className="bg-white rounded-lg border border-gray-300 p-4">
```

**NEW:**
```tsx
<div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
```

### Step 4: Standardize Input Styling

Find all inputs:

**OLD:**
```tsx
<input className="border-gray-300 rounded-md px-3 py-2" />
```

**NEW:**
```tsx
<input className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all" />
```

---

## Phase 4: Review Specific Files (60 min)

Create a checklist of critical files to review:

```
Components:
- [ ] app/components/layout/sidebar.tsx
- [ ] app/components/ui/button.tsx (or similar)
- [ ] app/components/ui/card.tsx (or similar)
- [ ] app/components/ui/input.tsx (or similar)
- [ ] app/components/ui/badge.tsx (or similar)
- [ ] All page components (campaigns, inbox, insights, shops, etc.)

Patterns to check:
- [ ] Buttons: Use orange-600 primary, gray-100 secondary
- [ ] Cards: rounded-xl shadow-sm p-6
- [ ] Inputs: rounded-xl with focus:ring-orange-500/20
- [ ] Text colors: gray-600 secondary, gray-500 muted (light mode)
- [ ] Text colors: gray-400 secondary, gray-500 muted (dark mode)
- [ ] Spacing: gap-6 between sections, p-6 in cards
- [ ] Borders: border-gray-200 (light), border-slate-800 (dark)
```

---

## Phase 5: Spacing & Layout (30 min)

### Step 1: Standardize Gap Sizes

Find all `gap-` utilities:

**Change:**
- `gap-2` → `gap-3` (only for very tight layouts)
- `gap-4` → `gap-6` (standard spacing)
- `gap-2` (form inputs) → keep as-is

**NEW PATTERN:**
```tsx
// Sections have large spacing
<div className="space-y-6">
  {sections}
</div>

// Grids use gap-6
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items}
</div>

// Inline items use gap-3 or gap-4
<div className="flex items-center gap-3">
  {items}
</div>
```

### Step 2: Standardize Padding

Find all `p-` utilities on cards:

**Change:**
- `p-3` → `p-6` (cards)
- `p-4` → `p-6` (cards)
- `p-2` → `p-3` (small components)

---

## Phase 6: Dark Mode Compliance (30 min)

### Step 1: Find all color-specific classes

```bash
grep -r "bg-\|text-\|border-" app/components --include="*.tsx" | \
  grep -v "dark:" | head -30
```

### Step 2: Add dark: prefix to all colors

**Pattern:**
```tsx
// WRONG (missing dark mode)
<div className="bg-white text-gray-900 border-gray-200">

// RIGHT (with dark mode)
<div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-50 border-gray-200 dark:border-slate-800">
```

### Step 3: Common dark mode overrides

```tsx
// Background
bg-white → dark:bg-slate-900
bg-gray-50 → dark:bg-slate-950
bg-gray-100 → dark:bg-slate-800

// Text
text-gray-900 → dark:text-gray-50
text-gray-600 → dark:text-gray-400
text-gray-500 → dark:text-gray-500 (same)

// Border
border-gray-200 → dark:border-slate-800
border-gray-100 → dark:border-slate-700

// Hover
hover:bg-gray-100 → dark:hover:bg-slate-800
hover:bg-gray-200 → dark:hover:bg-slate-700
```

---

## Phase 7: Validate & Test (30 min)

### Test Checklist

- [ ] **Light mode:** All text readable, buttons orange, cards have shadow
- [ ] **Dark mode:** All text readable (no pure white), toggle works, no high glare
- [ ] **Buttons:** Primary orange, secondary gray, hover state visible
- [ ] **Cards:** rounded-xl, shadow-sm, p-6, hover shows shadow-md
- [ ] **Inputs:** Rounded, focus ring is orange, not glowing
- [ ] **Spacing:**
  - [ ] Sections have gap-6
  - [ ] Cards have p-6
  - [ ] Lists have space-y-4
  - [ ] Buttons have px-5 py-2.5
- [ ] **Responsive:**
  - [ ] Mobile: 1 column, p-4
  - [ ] Tablet: 2 columns, p-6
  - [ ] Desktop: 3 columns, p-6
- [ ] **Typography:**
  - [ ] Headings are semibold (600)
  - [ ] Body text is text-sm (14px)
  - [ ] Font is Be Vietnam Pro (check DevTools)
- [ ] **Contrast:**
  - [ ] Body text on white has 15:1 contrast
  - [ ] All focus rings are visible
  - [ ] Disabled states are clear
- [ ] **Empty states:** Have icon box + text + CTA
- [ ] **Tables:** Headers uppercase, rows align left, hover visible

### Manual Testing

```bash
# 1. Start dev server
pnpm dev

# 2. Open http://localhost:3000

# 3. Test each page:
# - Campaigns page
# - Inbox page
# - Insights page
# - Shops page
# - Upload page

# 4. Test dark mode toggle (check ThemeProvider)

# 5. DevTools: Check responsive breakpoints
# - sm (640px): check 2-column layout
# - md (768px): check sidebar
# - lg (1024px): check 3-column grid

# 6. Lighthouse: Check accessibility score (target: 90+)
```

---

## Phase 8: Commit & Document (15 min)

### Git Commit

```bash
git add -A
git commit -m "design: implement 2025 design system — warm orange colors, typography, spacing

- Update color tokens: primary orange #E87B35, elevated neutrals
- Add Be Vietnam Pro font with Vietnamese support
- Standardize card styling: rounded-xl shadow-sm p-6
- Standardize button styling: orange-600 primary, gray-100 secondary
- Add dark mode overrides for all colors
- Improve spacing: gap-6 between sections, p-6 in cards
- Add typography base styles: h1-h4 font sizes, weights, line heights
- Ensure 15:1 contrast ratio for body text in both modes"
```

### Update Documentation

- [ ] Add link to design-system-2025.md in README.md
- [ ] Add link to design-tokens-quick-ref.md for developers
- [ ] Update CHANGELOG with design system version

---

## File Changes Summary

| File | Changes |
|------|---------|
| `app/globals.css` | Update @theme colors, add typography base styles |
| `app/layout.tsx` | Add Be Vietnam Pro font import |
| `app/components/**/*.tsx` | Update button, card, input, badge classes |
| All page components | Update colors to orange, spacing to gap-6 |
| Dark mode colors | Add dark: prefix to all color utilities |

---

## Rollback Plan (If Needed)

```bash
# Revert all changes
git revert HEAD

# Or reset to previous commit
git reset --hard HEAD~1
```

---

## Estimated Timeline

| Phase | Time | Priority |
|-------|------|----------|
| 1. Typography | 15 min | HIGH |
| 2. Color Tokens | 20 min | HIGH |
| 3. Components | 45 min | HIGH |
| 4. File Review | 60 min | MEDIUM |
| 5. Spacing | 30 min | MEDIUM |
| 6. Dark Mode | 30 min | HIGH |
| 7. Testing | 30 min | HIGH |
| 8. Commit | 15 min | HIGH |
| **Total** | **245 min (4 hrs)** | — |

---

## Success Criteria

✅ All pages display warm orange primary buttons
✅ All cards use rounded-xl with subtle shadow
✅ Be Vietnam Pro font loads without fallback
✅ Dark mode works smoothly (toggle + CSS variables)
✅ Text contrast meets WCAG AA standard (4.5:1 minimum, 15:1 preferred for body)
✅ All inputs have orange focus ring
✅ Spacing is consistent: gap-6, p-6
✅ No blue primary buttons visible
✅ Lighthouse accessibility score ≥ 90

---

## Questions?

Refer to:
- `docs/design-system-2025.md` — Full design system details
- `docs/design-tokens-quick-ref.md` — Copy-paste component snippets
- Check Tailwind CSS v4 docs: https://tailwindcss.com/docs

