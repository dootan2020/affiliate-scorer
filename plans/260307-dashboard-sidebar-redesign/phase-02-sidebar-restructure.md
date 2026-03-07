# Phase 02 — Sidebar Restructure

## Context Links
- [Current State Analysis](./reports/current-state-analysis.md)
- [Plan Overview](./plan.md)
- Sidebar: `components/layout/sidebar.tsx`
- Mobile nav: `components/layout/mobile-nav.tsx`

## Overview
- **Priority:** P2
- **Status:** Complete
- **Description:** Re-group and re-order sidebar menu items to match actual daily workflow priority. Sync mobile nav accordingly.

## Key Insights
- User is solo Vietnamese TikTok affiliate marketer — daily workflow: check dashboard > inbox > produce briefs > publish > log results
- "Tim ngach" (Niche Finder) is onboarding/occasional feature, not daily — demote
- "Nhat ky" (Log) is a daily action but lives under "Du lieu" — promote
- "Phan tich" has 1 item — merge with another group
- "Playbook" page exists but is NOT in sidebar at all — add it
- Need clear separation: "what I do daily" vs "reference/config"

## Current vs Proposed Sidebar Structure

### CURRENT
```
Cong viec hang ngay        Du lieu              Phan tich        Ho tro
  Tong quan                  Nhat ky              Phan tich        Huong dan
  Hop san pham               Dong bo du lieu                       Cai dat
  San xuat                   Thu vien
  Kenh TikTok
  Tim ngach
```

### PROPOSED
```
San xuat                   Theo doi             Cong cu           Cai dat
  Tong quan (Dashboard)      Nhat ky (Log)        Dong bo (Sync)    Cai dat (Settings)
  Hop SP (Inbox)             Phan tich            Thu vien           Huong dan
  San xuat (Production)      Playbook [NEW]       Tim ngach
  Kenh (Channels)
```

### Rationale per group

**San xuat (Production)** — core daily flow, top of sidebar
- Tong quan: starting point, morning brief
- Hop SP: product inbox, scoring
- San xuat: brief generation, export packs
- Kenh: channel management, character bible

**Theo doi (Tracking)** — analyzing what happened
- Nhat ky: log results daily after publishing
- Phan tich: deeper analytics, financial, calendar
- Playbook: accumulated winning patterns (currently missing from nav!)

**Cong cu (Tools)** — setup and import actions
- Dong bo: data import/sync (not daily)
- Thu vien: all assets reference
- Tim ngach: niche finder (occasional)

**Cai dat (Config)** — bottom, least frequent
- Cai dat: API keys, model config
- Huong dan: user guide

### Icon Assignments

| Item | Icon | Current | Change? |
|------|------|---------|---------|
| Tong quan | LayoutDashboard | Same | No |
| Hop SP | Inbox | Same | No |
| San xuat | Clapperboard | Same | No |
| Kenh | Tv | Same | No |
| Nhat ky | FileText | Same | No |
| Phan tich | TrendingUp | Same | No |
| Playbook | BookMarked | N/A (new) | Add — use `BookMarked` from lucide |
| Dong bo | RefreshCw | Same | No |
| Thu vien | BookOpen | Same | No |
| Tim ngach | Compass | Same | No |
| Cai dat | Settings | Same | No |
| Huong dan | HelpCircle | Same | No |

## ASCII Wireframe — Sidebar (Expanded)

```
+------------------------+
| [P] PASTR              |
+------------------------+
| SAN XUAT               |
| |> Tong quan           |
| |> Hop san pham   [12] |
| |> San xuat        [3] |
| |> Kenh TikTok         |
+------------------------+
| THEO DOI               |
| |  Nhat ky             |
| |  Phan tich           |
| |  Playbook            |
+------------------------+
| CONG CU                |
| |  Dong bo du lieu      |
| |  Thu vien            |
| |  Tim ngach           |
+------------------------+
| CAI DAT                |
| |  Cai dat             |
| |  Huong dan           |
+-- footer -------- -----+
| [Giao dien] [sun] [<<] |
+-------------------------+
```

## ASCII Wireframe — Sidebar (Collapsed)

```
+------+
| [P]  |
+------+
| [Da] |  <- Dashboard
| [In] |  <- Inbox (badge)
| [Cl] |  <- Production (badge)
| [Tv] |  <- Channels
+------+
| [Ft] |  <- Log
| [Tr] |  <- Analytics
| [Bm] |  <- Playbook
+------+
| [Rw] |  <- Sync
| [Bo] |  <- Library
| [Co] |  <- Niche
+------+
| [Se] |  <- Settings
| [Hc] |  <- Guide
+------+
| [Su] |
| [>>] |
+------+
```

## Mobile Bottom Tabs — Updated

```
+-------+-------+-------+-------+-------+
| Tong  | Hop   | San   | Kenh  | Them  |
| quan  | SP    | xuat  | TikTok| ...   |
+-------+-------+-------+-------+-------+
```

Bottom tabs stay the same (4 primary + overflow). Overflow menu gets reordered to match new sidebar groups.

## Architecture

### NAV_GROUPS constant update

```typescript
const NAV_GROUPS: NavGroup[] = [
  {
    title: "San xuat",
    items: [
      { href: "/", label: "Tong quan", icon: LayoutDashboard },
      { href: "/inbox", label: "Hop san pham", icon: Inbox, badgeKey: "inbox" },
      { href: "/production", label: "San xuat", icon: Clapperboard, badgeKey: "production" },
      { href: "/channels", label: "Kenh TikTok", icon: Tv },
    ],
  },
  {
    title: "Theo doi",
    items: [
      { href: "/log", label: "Nhat ky", icon: FileText },
      { href: "/insights", label: "Phan tich", icon: TrendingUp },
      { href: "/playbook", label: "Playbook", icon: BookMarked },
    ],
  },
  {
    title: "Cong cu",
    items: [
      { href: "/sync", label: "Dong bo du lieu", icon: RefreshCw },
      { href: "/library", label: "Thu vien", icon: BookOpen },
      { href: "/niche-finder", label: "Tim ngach", icon: Compass },
    ],
  },
  {
    title: "Cai dat",
    items: [
      { href: "/settings", label: "Cai dat", icon: Settings },
      { href: "/guide", label: "Huong dan", icon: HelpCircle },
    ],
  },
];
```

## Related Code Files

### Modify
- `components/layout/sidebar.tsx` — update NAV_GROUPS, add BookMarked import
- `components/layout/mobile-nav.tsx` — update NAV_GROUPS and OVERFLOW_ITEMS order

### No new files needed

## Implementation Steps

1. Update `NAV_GROUPS` in `sidebar.tsx` with new grouping and order
2. Add `BookMarked` to lucide-react imports
3. Add Playbook nav item: `{ href: "/playbook", label: "Playbook", icon: BookMarked }`
4. Remove "Tim ngach" from first group, move to "Cong cu" group
5. Update `mobile-nav.tsx` NAV_GROUPS to match
6. Update `OVERFLOW_ITEMS` in mobile-nav to new order
7. Test all nav links still work (no href changes, just reordering)
8. Test collapsed sidebar icon layout with new groups
9. Test mobile bottom tabs and overflow menu

## Todo List
- [ ] Update NAV_GROUPS in sidebar.tsx
- [ ] Add BookMarked import
- [ ] Add Playbook to nav
- [ ] Move Tim ngach to Cong cu group
- [ ] Mirror changes in mobile-nav.tsx
- [ ] Test expanded sidebar
- [ ] Test collapsed sidebar
- [ ] Test mobile nav

## Success Criteria
- Sidebar shows 4 groups: San xuat, Theo doi, Cong cu, Cai dat
- Playbook link works and navigates to `/playbook`
- All existing links still function
- Badge counts still work for inbox/production
- Collapsed mode shows proper dividers between groups
- Mobile nav overflow menu matches new order

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Users accustomed to old ordering | Low (single user app) | Grouping is more logical, user adapts quickly |
| Playbook page may not exist at /playbook | Link 404 | Verify route exists before adding; page already exists per codebase-summary |

## Security Considerations
No security implications — nav structure only.

## Next Steps
- Phase 03 depends on layout being done (Phase 01) to test widget fixes in context
