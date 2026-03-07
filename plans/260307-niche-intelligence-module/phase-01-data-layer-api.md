---
title: "Phase 1: Data Layer + API"
status: pending
priority: P1
effort: 3h
---

# Phase 1: Data Layer + API

## Overview
Create NicheProfile model, extend AiTaskType, build niche stats aggregation, and implement the analyze API endpoint.

## Implementation Steps

1. Add NicheProfile model to Prisma schema
2. Add "niche_intelligence" to AiTaskType union
3. Run prisma generate
4. Create shared types (QuestionnaireAnswers, NicheRecommendation, NicheAnalysisResult)
5. Create gather-niche-stats.ts (DB aggregation per niche)
6. Create build-niche-prompt.ts (system + user prompt builder)
7. Create POST /api/niche-intelligence/analyze route

## Files to Modify
- `prisma/schema.prisma` — add NicheProfile model
- `lib/ai/claude.ts` — add "niche_intelligence" to AiTaskType

## Files to Create
- `lib/niche-intelligence/types.ts`
- `lib/niche-intelligence/gather-niche-stats.ts`
- `lib/niche-intelligence/build-niche-prompt.ts`
- `app/api/niche-intelligence/analyze/route.ts`
