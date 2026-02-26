# Phase 4 — Morning Brief: Replace Campaign Query (Task 3A)

## Priority: LOW (but should do)

## Problem
`app/api/morning-brief/route.ts` lines 30-47 query `prisma.campaign.findMany({ where: { status: "running" } })`. Campaigns feature removed from UI. Also uses deprecated `UserGoal` (line 107).

## New Morning Brief Data
Per TASKS-2.md:
- Top 5 SP nên tạo content hôm nay (sort by combinedScore, filter chưa brief)
- Upcoming events (giữ nguyên CalendarEvent query)
- Account stats tóm tắt (từ AccountDailyStat nếu có)
- Bỏ phần "active campaigns"

## Files to Modify
- `app/api/morning-brief/route.ts` — main handler
- `app/api/morning-brief/brief-campaign-analyzer.ts` — DELETE or refactor
- `app/api/morning-brief/brief-intelligence-enricher.ts` — update hrefs

## Implementation Steps
1. Read current morning-brief route + analyzer + enricher
2. Replace campaign query with ProductIdentity query (scored, not briefed, top combinedScore)
3. Replace UserGoal query with GoalP5 query
4. Add AccountDailyStat summary (if data exists)
5. Remove campaign analyzer module or repurpose
6. Update response format
7. TypeScript compile check
