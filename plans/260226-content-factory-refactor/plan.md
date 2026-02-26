# Content Factory Refactor — Implementation Plan

> Source: `docs/TASKS.md` + `docs/ROADMAP-FINAL-V2.md`
> Date: 2026-02-26
> Scope: 6 tasks + 1 report
> Estimated: LARGE project, FULL MODE review

---

## Overview

Transform the app from "Affiliate Scorer" to "AI Content Factory" by:
1. Merging Inbox + Products into a unified /inbox
2. Updating all cross-references post-merge
3. Switching from top nav → left sidebar
4. Renaming Upload → Sync + adding TikTok Studio parsers
5. Redesigning Dashboard
6. Creating /library + deleting dead features (Campaigns, FB/Shopee Ads parsers)
7. Writing full workflow audit report

---

## Phase Dependency Graph

```
Phase 1 (DB + Schema)
    ↓
Phase 2 (Nav Sidebar) ←── independent, do early
    ↓
Phase 3 (Merge Inbox+Products) ←── depends on Phase 1
    ↓
Phase 4 (Update Workflow refs) ←── depends on Phase 3
    ↓
Phase 5 (Sync page) ←── independent of 3-4
    ↓
Phase 6 (Dashboard redesign) ←── depends on Phase 3-4
    ↓
Phase 7 (Library + cleanup) ←── depends on Phase 4
    ↓
Phase 8 (Env + Security + Report) ←── last
```

---

## Phases

| # | Phase | Status | Depends On |
|---|-------|--------|------------|
| 1 | Database schema changes (TikTok Studio models) | ⏳ | — |
| 2 | Left sidebar navigation | ⏳ | — |
| 3 | Merge Inbox + Products → unified /inbox | ⏳ | Phase 1 |
| 4 | Update workflow references post-merge | ⏳ | Phase 3 |
| 5 | Sync page (Upload → Sync + TikTok Studio) | ⏳ | Phase 1 |
| 6 | Dashboard redesign | ⏳ | Phase 3, 4 |
| 7 | Library page + delete dead code | ⏳ | Phase 4 |
| 8 | Env check + security + workflow report | ⏳ | Phase 7 |

---

## Detailed Phase Files

- [Phase 1](./phase-01-database-schema.md) — DB schema changes
- [Phase 2](./phase-02-left-sidebar.md) — Left sidebar nav
- [Phase 3](./phase-03-merge-inbox-products.md) — Merge Inbox + Products
- [Phase 4](./phase-04-workflow-updates.md) — Cross-reference updates
- [Phase 5](./phase-05-sync-page.md) — Upload → Sync
- [Phase 6](./phase-06-dashboard-redesign.md) — Dashboard
- [Phase 7](./phase-07-library-cleanup.md) — Library + dead code removal
- [Phase 8](./phase-08-env-security-report.md) — Final checks + report
