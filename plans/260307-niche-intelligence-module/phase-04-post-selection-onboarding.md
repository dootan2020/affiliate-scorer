---
title: "Phase 4: Post-Selection Onboarding"
status: pending
priority: P2
effort: 1.5h
---

# Phase 4: Post-Selection Onboarding

## Overview
Dashboard checklist widget for channels created via niche-finder.

## Implementation Steps
1. Create onboarding-checklist.tsx (step cards with completion, links, dismiss)
2. Create GET /api/niche-intelligence/onboarding-status route
3. Integrate checklist into dashboard page conditionally

## Files to Create
- `components/niche-intelligence/onboarding-checklist.tsx`
- `app/api/niche-intelligence/onboarding-status/route.ts`

## Files to Modify
- `app/page.tsx`
