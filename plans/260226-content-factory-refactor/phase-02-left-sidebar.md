# Phase 2 — Left Sidebar Navigation

**Priority:** High (independent, visual foundation for all other changes)
**Status:** ⏳ Pending
**TASKS.md ref:** Task 3

---

## Overview

Replace top pill nav + mobile bottom tab → persistent left sidebar with 7 items. Collapse on mobile.

---

## Navigation Items

| # | Label | Route | Icon (lucide-react) |
|---|-------|-------|---------------------|
| 1 | Dashboard | `/` | LayoutDashboard |
| 2 | Inbox | `/inbox` | Inbox |
| 3 | Sync | `/sync` | RefreshCw |
| 4 | Sản xuất | `/production` | Film |
| 5 | Log | `/log` | ClipboardList |
| 6 | Thư viện | `/library` | BookOpen |
| 7 | Insights | `/insights` | Sparkles |

---

## Related Code Files

### Modify
- `components/layout/nav-header.tsx` → Replace with `components/layout/sidebar.tsx`
- `app/layout.tsx` → Update layout structure (sidebar + main content area)

### Create
- `components/layout/sidebar.tsx` — New sidebar component
- `components/layout/mobile-sidebar.tsx` — Mobile sheet/drawer version (or use same component with responsive behavior)

### Delete
- Old nav-header.tsx (after sidebar is working)

---

## Implementation Steps

1. [ ] Create `components/layout/sidebar.tsx`:
   - Fixed left sidebar, `w-64` desktop, collapsible
   - Logo/app name at top
   - 7 nav items with icons + labels
   - Active state highlighting (bg-blue-50, text-blue-600)
   - Dark mode support
   - Theme toggle at bottom
   - User can collapse to icon-only mode (`w-16`)

2. [ ] Create mobile behavior:
   - `< md`: Sidebar hidden, hamburger button in top bar
   - Sheet/drawer slides in from left on tap
   - Or: bottom tab bar with 5 main items (Dashboard, Inbox, Sản xuất, Log, Thư viện) + "More" for Sync/Insights

3. [ ] Update `app/layout.tsx`:
   - Wrap children in flex layout: `<Sidebar /> + <main className="flex-1 overflow-auto">`
   - Remove old NavHeader import
   - Keep ThemeProvider, metadata, fonts

4. [ ] Update all page containers:
   - Remove duplicate max-width containers that conflict with sidebar layout
   - Ensure `main` area has proper padding (`p-6 lg:p-8`)

5. [ ] Test responsive at all breakpoints (mobile, tablet, desktop)

---

## Design Specs

```
Desktop (≥768px):
┌──────────┬────────────────────────────────────┐
│ Sidebar  │ Main Content                        │
│ w-64     │ flex-1, overflow-auto               │
│          │ max-w-6xl mx-auto px-6 py-8         │
│ Logo     │                                     │
│ ──────── │                                     │
│ Dashboard│                                     │
│ Inbox    │                                     │
│ Sync     │                                     │
│ Sản xuất │                                     │
│ Log      │                                     │
│ Thư viện │                                     │
│ Insights │                                     │
│          │                                     │
│ ──────── │                                     │
│ 🌙 Theme │                                     │
└──────────┴────────────────────────────────────┘

Mobile (<768px):
┌────────────────────────────────────────────────┐
│ ☰ App Name                              🌙     │
├────────────────────────────────────────────────┤
│ Main Content (full width, px-4 py-6)           │
│                                                │
│                                                │
├────────────────────────────────────────────────┤
│ Dashboard | Inbox | Sản xuất | Log | More      │
└────────────────────────────────────────────────┘
```

---

## Success Criteria

- [ ] 7 nav items visible on desktop sidebar
- [ ] Active page highlighted correctly
- [ ] Mobile: hamburger or bottom tab
- [ ] Dark mode works
- [ ] No layout shift on page transitions
- [ ] All existing pages still accessible

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Layout break on existing pages | Test each page after sidebar integration |
| Mobile UX regression | Keep bottom tab bar for key items |
