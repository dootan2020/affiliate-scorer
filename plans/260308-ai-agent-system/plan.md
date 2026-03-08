---
title: "PASTR AI Agent System"
description: "5 AI agents for automated learning, personalization, content analysis, prediction, and trend intelligence"
status: complete
priority: P1
effort: 12h
branch: master
tags: [ai-agents, learning-engine, personalization, telegram-bot]
created: 2026-03-08
---

# PASTR AI Agent System

## Overview

5 database-mediated AI agents that close the feedback loop: content analysis, nightly learning, brief personalization, win prediction, and trend intelligence via Telegram bot. Agents communicate through shared DB tables (ChannelMemory as central state). Total added AI cost: ~$0.60/month.

## Architecture

```
ContentAnalyzer --> ContentAsset (actual metadata)
                         |
NightlyLearning --> ChannelMemory + UserPattern (per-channel)
                         |
BriefPersonalization --> generate-brief.ts (prompt enrichment, $0 AI)
                         |
WinPredictor --> formula-based scoring ($0 AI)
                         |
TelegramBot --> CompetitorCapture --> TrendIntelligence (nightly batch)
```

## Phases

| # | Phase | File | Priority | Effort | Status |
|---|-------|------|----------|--------|--------|
| 1 | Schema + Nightly Learning Agent + ChannelMemory | [phase-01](phase-01-schema-nightly-learning.md) | P0 | 3h | Complete |
| 2 | Brief Personalization | [phase-02](phase-02-brief-personalization.md) | P1 | 2h | Complete |
| 3 | Content Analyzer | [phase-03](phase-03-content-analyzer.md) | P1 | 2h | Complete |
| 4 | Telegram Bot + Trend Intelligence | [phase-04](phase-04-telegram-trend-intelligence.md) | P2 | 2.5h | Complete |
| 5 | Win Predictor | [phase-05](phase-05-win-predictor.md) | P3 | 1.5h | Complete |
| 6 | PWA Mobile Quick-Log | [phase-06](phase-06-pwa-mobile-quicklog.md) | P3 | 1h | Complete |

## Key Dependencies

- Phase 1 is foundation — all other phases depend on ChannelMemory model
- Phase 2 reads ChannelMemory (needs Phase 1)
- Phase 3 writes to ContentAsset fields (needs Phase 1 schema)
- Phase 4 writes CompetitorCapture (needs Phase 1 for nightly processing)
- Phase 5 reads LearningWeightP4 + ChannelMemory (needs Phases 1+3 for data)
- Phase 6 is independent (PWA, can run anytime)

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Agent communication | Database-mediated | No new infra, Vercel-compatible |
| Learning frequency | Nightly (was weekly) | 5 videos/day = weekly too slow |
| AI provider for agents | Gemini Flash | Cost: ~$0.001/call |
| Agent file structure | `lib/agents/*.ts` | Called by API routes/crons |
| New AI task type | `content_analysis` | Routes through existing multi-provider |
