# Plan: Fix State Machine Issues — Toàn bộ hệ thống

**Created:** 2026-03-01
**Source:** `docs/PROMPT-FIX-STATE-MACHINES.md`
**Status:** Pending Approval

---

## Overview

12 issues across 8 state machines. Organized into 7 phases by dependency + severity.

| Phase | Nội dung | Severity | Issues |
|-------|---------|----------|--------|
| 1 | State transition validation engine | Foundation | — |
| 2 | Missing transitions + ProductionBatch | HIGH | #3, #4 |
| 3 | Race condition brief generation | CRITICAL | #2 |
| 4 | Learning loop per-channel | CRITICAL | #1 |
| 5 | Slot sync bidirectional + rendered | HIGH | #6, #12 |
| 6 | Medium priority fixes | MEDIUM | #5, #7, #8, #9, #10 |
| 7 | Commission pending state | LOW | #11 |

**Estimated files changed:** ~25
**Schema migration:** Yes (Phase 4 + Phase 5 + Phase 7)
**Risk:** Medium — touches core state logic, requires careful testing

---

## Phase Details

- [Phase 1: State Transition Engine](./phase-01-state-transition-engine.md) — Foundation
- [Phase 2: Missing Transitions + ProductionBatch](./phase-02-missing-transitions.md) — HIGH
- [Phase 3: Race Condition Brief Generation](./phase-03-race-condition-brief.md) — CRITICAL
- [Phase 4: Learning Loop Per-Channel](./phase-04-learning-per-channel.md) — CRITICAL
- [Phase 5: Slot Sync Bidirectional + Rendered](./phase-05-slot-sync-rendered.md) — HIGH
- [Phase 6: Medium Priority Fixes](./phase-06-medium-fixes.md) — MEDIUM
- [Phase 7: Commission Pending](./phase-07-commission-pending.md) — LOW

---

## Key Dependencies

```
Phase 1 ──→ Phase 2 ──→ Phase 3
                    ──→ Phase 5
Phase 4 (independent — can parallel with 2/3)
Phase 6 (after Phase 1)
Phase 7 (after Phase 1)
```

Phase 1 must complete first (all others depend on the validation engine).
Phase 4 is independent (schema change + learning logic only).
