---
title: "Niche Intelligence Module"
description: "AI-powered niche recommendation for new PASTR users via questionnaire + DB analysis"
status: pending
priority: P2
effort: 10h
branch: master
tags: [niche, onboarding, ai, ux]
created: 2026-03-07
---

# Niche Intelligence Module

## Problem
New users asking "where should I start?" get no guidance. Channel creation requires manual niche input with no context.

## Solution
Questionnaire -> AI analysis (DB product stats + market knowledge) -> ranked niche recommendations -> one-click channel setup.

## Architecture

```
[Questionnaire UI] -> POST /api/niche-intelligence/analyze
                        -> gatherNicheStats() (DB aggregation per niche)
                        -> buildNichePrompt() (stats + user answers)
                        -> callAI() (niche_intelligence task type)
                        -> parse & validate JSON response
                        -> save NicheProfile + return recommendations
                      -> [Recommendation Cards UI]
                        -> "Chon ngach nay" -> create channel with niche pre-filled
                        -> [Post-selection checklist on dashboard]
```

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 1 | [Data Layer + API](./phase-01-data-layer-api.md) | Pending | 3h |
| 2 | [Profile Questionnaire UI](./phase-02-questionnaire-ui.md) | Pending | 2h |
| 3 | [Recommendation Display + Selection](./phase-03-recommendation-display.md) | Pending | 2h |
| 4 | [Post-Selection Onboarding](./phase-04-post-selection-onboarding.md) | Pending | 1.5h |
| 5 | [Integration Points](./phase-05-integration-points.md) | Pending | 1.5h |

## Key Dependencies
- Prisma schema migration (Phase 1)
- AiTaskType extension in `lib/ai/claude.ts` (Phase 1)
- AiModelConfig row for "niche_intelligence" task (Phase 1 migration or seed)

## Constraints
- If DB has no product data: AI still recommends based on TikTok Vietnam market knowledge
- Vietnamese UI throughout
- Existing users unaffected (feature is opt-in)
- Follow existing callAI + BackgroundTask patterns
