---
title: "Dashboard Layout + Sidebar Redesign"
description: "Full-width dashboard with optimized widget zones and restructured sidebar for daily workflow"
status: complete
priority: P2
effort: 8h
branch: master
tags: [ui, dashboard, sidebar, layout, redesign]
created: 2026-03-07
---

# Dashboard Layout + Sidebar Redesign

## Goal
Transform dashboard from constrained `max-w-6xl` container into full-viewport daily work screen. Restructure sidebar menu grouping. Fix existing widget bugs.

## Current State
- Dashboard capped at `max-w-6xl` (~1152px) inside `SidebarAwareMain`
- 6 widgets stacked vertically with single 2-col row
- Sidebar: 4 groups, 10 items + mobile nav duplicate
- Known bug: "PATTERN DANG THANG: null" renders when AI returns null
- `InboxStatsWidget` and `UpcomingEventsWidget` exist but NOT used on dashboard page

## Phases

| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | Dashboard Layout Redesign | Complete | [phase-01](./phase-01-dashboard-layout-redesign.md) |
| 2 | Sidebar Restructure | Complete | [phase-02](./phase-02-sidebar-restructure.md) |
| 3 | Widget Improvements | Complete | [phase-03-widget-improvements.md](./phase-03-widget-improvements.md) |
| 4 | Responsive Mobile | Complete | [phase-04-responsive-mobile.md](./phase-04-responsive-mobile.md) |

## Key Dependencies
- `components/layout/sidebar-aware-main.tsx` controls main content margin + max-width
- `app/layout.tsx` wraps everything in `<Sidebar> + <SidebarAwareMain>`
- Dashboard is a Server Component that checks `hasData` before rendering widgets

## Reports
- [Current State Analysis](./reports/current-state-analysis.md)
