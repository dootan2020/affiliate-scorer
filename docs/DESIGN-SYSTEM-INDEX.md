# Design System Documentation Index

**Research Date:** February 26, 2025
**Based on:** 2025-2026 SaaS Dashboard UI Trends

Quick navigation to all design system documents.

---

## Documents

### 1. **DESIGN-SYSTEM-SUMMARY.md** (Start here!)
Summary of research findings, key recommendations, and why these choices.

- Key trends in 2025 dashboard design
- Color palette rationale (warm orange #E87B35)
- Typography recommendations (Be Vietnam Pro)
- Spacing & layout principles
- Dark mode best practices
- What was applied to affiliate-scorer

**Read time:** 10 minutes
**When to use:** Getting started, understanding the "why"

---

### 2. **design-system-2025.md** (Full Reference)
Comprehensive design specification document with all details.

**Sections:**
- Color palettes (light & dark mode with hex codes)
- Typography scale (12-30px with weights)
- Spacing & layout grid
- Card styling (shadow, radius, borders)
- Button variants (primary, secondary, ghost, danger)
- Input & form styling
- Data-dense components (tables)
- Empty states & loading
- Badge & tag styling
- Responsive design rules
- Dark mode implementation details
- Design tokens summary (copy-paste into Tailwind)
- Trends applied
- Implementation checklist

**Read time:** 30 minutes
**When to use:** Implementing components, design specifications, reference

---

### 3. **design-tokens-quick-ref.md** (Copy-Paste)
Quick reference card with copy-paste snippets for common components.

**Sections:**
- Color tokens (hex values)
- Component snippets (buttons, cards, inputs, badges, tables, etc.)
- Spacing scale
- Font scale
- Radius scale
- Shadow scale
- Responsive pattern
- Dark mode pattern
- Font setup
- Tailwind v4 CSS theme variables
- Pre-launch checklist
- Golden rules

**Read time:** 5 minutes (lookup-oriented)
**When to use:** Implementing components, copy-paste code

---

### 4. **design-implementation-guide.md** (Step-by-Step)
Actionable implementation plan to apply design system to affiliate-scorer.

**Phases:**
1. Typography setup (15 min) — Install Be Vietnam Pro
2. Update color tokens (20 min) — Update globals.css @theme
3. Update component library (45 min) — Buttons, cards, inputs
4. Review specific files (60 min) — File-by-file audit
5. Spacing & layout (30 min) — Standardize gap/padding
6. Dark mode compliance (30 min) — Add dark: prefixes
7. Validate & test (30 min) — Testing checklist
8. Commit & document (15 min) — Git workflow

**Estimated timeline:** 4 hours (245 minutes) total

**When to use:** Implementing design system in codebase

---

## Quick Links

### Start Implementation
1. Read: **DESIGN-SYSTEM-SUMMARY.md** (10 min overview)
2. Follow: **design-implementation-guide.md** (4 hour step-by-step)
3. Reference: **design-tokens-quick-ref.md** (during implementation)
4. Deep dive: **design-system-2025.md** (if needed)

### Design Token Lookup
→ See: **design-tokens-quick-ref.md** → Color Tokens section

### Component Snippets
→ See: **design-tokens-quick-ref.md** → Component Snippets section

### Full Component Details
→ See: **design-system-2025.md** → Sections 5-9

### Typography Rules
→ See: **design-system-2025.md** → Section 2

### Spacing Rules
→ See: **design-system-2025.md** → Section 3

### Dark Mode Details
→ See: **design-system-2025.md** → Section 11

### Testing Checklist
→ See: **design-implementation-guide.md** → Phase 7

---

## Key Design Decisions

| Decision | Value | Rationale |
|----------|-------|-----------|
| **Primary Color** | #E87B35 (Orange) | Warm, accessible, 2025 trend, Claude-branded |
| **Primary Font** | Be Vietnam Pro | Vietnamese diacritics, modern, tech-friendly |
| **Card Padding** | p-6 (24px) | Spacious, readable, professional |
| **Card Radius** | rounded-xl (12px) | Modern, not too rounded |
| **Card Shadow** | shadow-sm, hover:shadow-md | Subtle, responsive to interaction |
| **Spacing Scale** | gap-6, gap-4, gap-3 | Consistent, spacious, mobile-first |
| **Text Contrast** | 15:1+ body text | WCAG AAA, eye-comfortable, accessible |
| **Background** | Gray-50 (light), Slate-950 (dark) | Elevated neutrals, not pure white/black |
| **Body Text Size** | text-sm (14px) | Standard for dashboards, readable |
| **Heading Weights** | 600 (semibold) | Modern, not bold, clear hierarchy |

---

## Color Palette Quick Reference

### Light Mode
```
PRIMARY:       #E87B35 (Warm Orange)
PRIMARY-HOVER: #C86A2B
SUCCESS:       #10B981 (Emerald)
WARNING:       #F59E0B (Amber)
DANGER:        #EF4444 (Red)
ACCENT:        #3B82F6 (Blue)
BACKGROUND:    #F9FAFB (Light Gray)
TEXT-PRIMARY:  #030712 (Near Black)
TEXT-SECONDARY: #4B5563 (Gray)
TEXT-MUTED:    #6B7280 (Lighter Gray)
```

### Dark Mode
```
PRIMARY:       #FF8F47 (Brighter Orange)
PRIMARY-HOVER: #E87B35
SUCCESS:       #34D399 (Brighter Emerald)
WARNING:       #FBBF24 (Brighter Amber)
DANGER:        #F87171 (Brighter Red)
ACCENT:        #60A5FA (Brighter Blue)
BACKGROUND:    #030712 (Very Dark)
TEXT-PRIMARY:  #F9FAFB (Off White)
TEXT-SECONDARY: #9CA3AF (Light Gray)
TEXT-MUTED:    #6B7280 (Gray)
```

---

## Typography Scale

```
Display:  text-3xl (30px) | 600 weight | lh-1.2
H1:       text-2xl (24px) | 600 weight | lh-1.2
H2:       text-xl (20px)  | 600 weight | lh-1.3
H3:       text-lg (18px)  | 600 weight | lh-1.3
H4:       text-base (16px)| 600 weight | lh-1.4
Body:     text-sm (14px)  | 400 weight | lh-1.6    ← STANDARD
Label:    text-xs (12px)  | 500 weight | lh-1.4
```

---

## Common Class Patterns

### Button
```
Primary:   bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-5 py-2.5
Secondary: bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl px-5 py-2.5
```

### Card
```
bg-white dark:bg-slate-900 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6
```

### Input
```
rounded-xl border border-gray-200 dark:border-slate-700 px-4 py-2.5
focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none
```

### Dark Mode Pair
```
bg-white dark:bg-slate-900
text-gray-900 dark:text-gray-50
border-gray-200 dark:border-slate-800
```

---

## Implementation Checklist

**Phase 1: Typography**
- [ ] Install Be Vietnam Pro in layout.tsx
- [ ] Add typography base styles to globals.css

**Phase 2: Colors**
- [ ] Update @theme colors in globals.css (orange, neutrals, semantic)
- [ ] Update .dark colors in globals.css (dark mode variants)

**Phase 3: Components**
- [ ] Update all buttons to orange primary
- [ ] Update all cards to rounded-xl shadow-sm p-6
- [ ] Update all inputs with focus ring
- [ ] Update all badges with new colors

**Phase 4: Spacing**
- [ ] Change gap-4 → gap-6 (sections)
- [ ] Change p-4 → p-6 (cards)
- [ ] Verify spacing consistency

**Phase 5: Dark Mode**
- [ ] Add dark: prefix to all colors
- [ ] Test dark mode toggle
- [ ] Verify contrast ratios

**Phase 6: Testing**
- [ ] Test responsive (mobile, tablet, desktop)
- [ ] Test contrast (WCAG AA minimum 4.5:1)
- [ ] Test dark mode on all pages
- [ ] Lighthouse accessibility audit
- [ ] Browser testing

**Phase 7: Finalization**
- [ ] Git commit with proper message
- [ ] Update CHANGELOG
- [ ] Team review

---

## Success Criteria

✅ All primary buttons use orange (#E87B35)
✅ All cards use rounded-xl shadow-sm p-6
✅ Be Vietnam Pro font loads and renders correctly
✅ Dark mode works smoothly
✅ Body text contrast is 15:1+
✅ All inputs have orange focus ring
✅ Spacing is consistent (gap-6, p-6)
✅ No pure white (#FFF) or pure black (#000) used
✅ Lighthouse accessibility score ≥ 90
✅ Responsive design works (1 col → 2 → 3)

---

## File Sizes

```
DESIGN-SYSTEM-SUMMARY.md        11 KB (264 lines)
design-system-2025.md           19 KB (656 lines)
design-tokens-quick-ref.md      7.6 KB (294 lines)
design-implementation-guide.md  12 KB (481 lines)
DESIGN-SYSTEM-INDEX.md          (this file)
─────────────────────────────────────────
Total:                          ~50 KB (1,695 lines)
```

---

## Contact & Questions

- **Design System Owner:** Your Team
- **Last Updated:** February 26, 2025
- **Version:** 1.0 (Ready for implementation)

Questions? Refer to the specific document section or check the golden rules in **design-tokens-quick-ref.md**.

---

**Ready to implement?**

1. Start with **DESIGN-SYSTEM-SUMMARY.md** (5 min read)
2. Follow **design-implementation-guide.md** (4 hours)
3. Use **design-tokens-quick-ref.md** for lookups

Good luck! 🎨
