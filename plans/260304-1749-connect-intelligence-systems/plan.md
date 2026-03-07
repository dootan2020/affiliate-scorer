---
title: "Connect Intelligence Systems"
description: "Wire PASTR's siloed intelligence modules (Morning Brief, Content Brief, Learning, Patterns, Win Probability, Explore/Exploit) into a unified data flow with smart suggestions API, automation crons, and personalization cache."
status: complete
priority: P1
effort: 10.5h
branch: master
tags: [intelligence, integration, cron, suggestions, learning, ux]
created: 2026-03-04
---

# Connect Intelligence Systems

## Overview

PASTR has 95% features built but intelligence systems run in silos. This plan connects them across 6 phases.

## Phases

| # | Phase | Effort | Status | File |
|---|-------|--------|--------|------|
| 1 | Morning Brief + Pattern Injection | 1h | ✅ Complete | [phase-01](./phase-01-morning-brief-pattern-injection.md) |
| 2 | Content Brief Intelligence | 2h | ✅ Complete | [phase-02](./phase-02-content-brief-intelligence.md) |
| 3 | Smart Content Suggestions API | 3h | ✅ Complete | [phase-03](./phase-03-smart-suggestions-api.md) |
| 4 | Content Suggestions Widget UI | 2h | ✅ Complete | [phase-04](./phase-04-suggestions-widget-ui.md) |
| 5 | Automation Cron Jobs | 1.5h | ✅ Complete | [phase-05](./phase-05-automation-cron-jobs.md) |
| 6 | Personalization Cache | 1h | ✅ Complete | [phase-06](./phase-06-personalization-cache.md) |

## Key Dependencies

- Phase 3 depends on Phase 1 + 2 (patterns/learning data must flow before suggestions use them)
- Phase 4 depends on Phase 3 (widget consumes new API)
- Phase 5 independent (cron jobs wrap existing functions)
- Phase 6 independent (cache layer for personalize.ts)

## Architecture Summary

```
Morning Brief ←── UserPattern (Phase 1)
Content Brief ←── CalendarEvent + Explore/Exploit hooks/formats (Phase 2)
Dashboard Widget ←── GET /api/dashboard/suggestions (Phase 3+4)
  └── LearningWeightP4 + Explore/Exploit + Calendar + Lifecycle + WinProbability
Crons (Phase 5): daily decay, weekly learning+patterns, weekly report
Personalization (Phase 6): feedback cache + remove 200 limit
```

## Constraints

- No LLM calls in suggestions API (formula-only, must be fast)
- Backward compatible: graceful fallback if no channels/learning/patterns
- Vercel deployment — native cron support via vercel.json
- All changes must preserve existing flow
- Mobile responsive for widget changes

## Validation Log

### Session 1 — 2026-03-04
**Trigger:** Initial plan creation validation
**Questions asked:** 4

#### Questions & Answers

1. **[Tradeoff]** Suggestions scoring: custom lightweight formula vs existing calculateWinProbability()?
   - **Answer:** New lightweight formula — pure math, no per-product DB queries

2. **[Scope]** CalendarEvent injection window: 7 days vs 14 days?
   - **Answer:** 7 days (task spec) — more focused, less noise

3. **[Architecture]** Personalization cache strategy?
   - **Answer:** Module-level Map with 5min TTL — main win is within-request dedup

4. **[Correction]** Deployment platform: Vercel (NOT Netlify as originally stated)

### Session 2 — 2026-03-04
**Trigger:** User corrections before implementation (task-12.md)
**Changes applied:** 7

#### Corrections Applied
1. Phase 5: Vercel native crons — removed all Netlify references
2. Phase 3: POST → GET (read-only endpoint)
3. Phase 2+3: Calendar window synced to 7 days everywhere
4. Phase 3: Added contentMix factor for channel-product matching
5. Phase 4: Added channelId handling for production page + pending count header
6. Phase 1: Added product cross-reference for patterns in morning brief
7. plan.md: Fixed validation log
