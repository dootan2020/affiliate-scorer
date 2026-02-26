# Phase 1 — Database Schema Changes

**Priority:** Critical (blocks Phase 3, 5)
**Status:** ⏳ Pending

---

## Overview

Add new models for TikTok Studio Analytics data (Task 4) and ensure ProductIdentity has all fields needed for the merged Inbox+Products view (Task 1).

---

## Key Insights

- Current schema already has `ProductIdentity` with `inboxState`, `marketScore`, `contentPotentialScore`, `combinedScore`, `deltaType`
- `AssetMetric` model exists for content performance tracking
- Need new models for TikTok Studio data: account stats, follower activity, audience insights
- Content.xlsx auto-match needs `ContentAsset.videoUrl` or similar field to match TikTok video links

---

## Schema Changes

### New Models

```prisma
model AccountDailyStat {
  id            String   @id @default(cuid())
  date          DateTime
  videoViews    Int      @default(0)
  profileViews  Int      @default(0)
  likes         Int      @default(0)
  comments      Int      @default(0)
  shares        Int      @default(0)
  importBatchId String?
  createdAt     DateTime @default(now())
  @@unique([date])
  @@index([date])
}

model FollowerActivity {
  id            String   @id @default(cuid())
  dayOfWeek     Int        // 0=Mon..6=Sun
  hour          Int        // 0-23
  activeCount   Int      @default(0)
  importBatchId String?
  updatedAt     DateTime @updatedAt
  @@unique([dayOfWeek, hour])
}

model AccountInsight {
  id            String   @id @default(cuid())
  type          String     // "viewers", "follower_history", "follower_gender", "follower_territories"
  date          DateTime?
  data          Json       // flexible JSON for each type
  importBatchId String?
  createdAt     DateTime @default(now())
  @@index([type])
}
```

### Modifications to Existing Models

- `ContentAsset`: Ensure `videoUrl` field exists (check — may already be in `metadata` JSON)
- `ProductIdentity`: No changes needed — already has all inbox state/score fields

---

## Implementation Steps

1. [ ] Read current `prisma/schema.prisma` to confirm existing fields
2. [ ] Add `AccountDailyStat`, `FollowerActivity`, `AccountInsight` models
3. [ ] Verify `ContentAsset` has a way to store/match TikTok video URLs
4. [ ] Create migration: `npx prisma migrate dev --name add-tiktok-studio-models`
5. [ ] Verify migration applies cleanly
6. [ ] Run `npx prisma generate` to update types

---

## Success Criteria

- [ ] Migration applies without errors
- [ ] New models queryable via Prisma client
- [ ] Existing data untouched
- [ ] TypeScript types generated correctly

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Migration conflicts with existing data | Run on dev first, backup prod DB |
| Large schema file (already 779 lines) | Keep models focused, no over-engineering |
