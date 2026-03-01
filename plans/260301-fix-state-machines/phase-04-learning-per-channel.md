# Phase 4: Learning Loop Per-Channel

**Priority:** CRITICAL
**Depends on:** None (independent — can parallel with Phase 2/3)
**Issue:** #1
**Status:** Pending

---

## Problem

`updateLearningWeights()` trong `lib/learning/update-weights.ts` tính reward GLOBAL — không phân biệt kênh. Khi user có nhiều kênh (khác persona, format style, niche) → weight trung bình vô nghĩa.

**Current scope values:** `hook_type`, `format`, `angle`, `category`
**Missing:** `channelId` dimension

**Example:** Kênh A (beauty, calm) thích "review_short". Kênh B (tech, energetic) thích "demo". Global weight sẽ average cả hai → không kênh nào tối ưu.

---

## Solution: Add channelId to LearningWeightP4

### Schema Migration

```prisma
model LearningWeightP4 {
  id String @id @default(cuid())

  scope     String   // "hook_type" | "format" | "angle" | "category" | "price_range"
  key       String   // "result", "review_short", "Mỹ phẩm"
  channelId String?  // ← NEW: nullable for backward compat (null = global)

  weight      Decimal @default(0) @db.Decimal(10, 4)
  sampleCount Int     @default(0)
  avgReward   Decimal @default(0) @db.Decimal(8, 4)

  decayHalfLifeDays Int       @default(14)
  lastRewardAt      DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([scope, key, channelId])  // ← CHANGED: add channelId to unique
  @@index([scope])
  @@index([channelId])               // ← NEW index
}
```

**Migration strategy:**
- Add `channelId String?` (nullable — existing records become global)
- Drop old `@@unique([scope, key])`, add `@@unique([scope, key, channelId])`
- Existing data preserved: `channelId = null` = global fallback

### Update `updateLearningWeights()`

**File:** `lib/learning/update-weights.ts`

```typescript
interface AssetContext {
  hookType: string | null;
  format: string | null;
  angle: string | null;
  category: string | null;
  channelId: string | null;  // ← NEW
}

export async function updateLearningWeights(
  asset: AssetContext,
  reward: number,
): Promise<void> {
  const updates = [
    { scope: "hook_type", key: asset.hookType },
    { scope: "format", key: asset.format },
    { scope: "angle", key: asset.angle },
    { scope: "category", key: asset.category },
  ].filter((u) => u.key != null);

  // Update BOTH channel-specific AND global weights
  for (const { scope, key } of updates) {
    // Channel-specific weight
    if (asset.channelId) {
      await upsertWeight(scope, key!, reward, asset.channelId);
    }
    // Global weight (fallback, always update)
    await upsertWeight(scope, key!, reward, null);
  }
}
```

### Update `upsertWeight()`

```typescript
async function upsertWeight(
  scope: string,
  key: string,
  reward: number,
  channelId: string | null,
): Promise<void> {
  const existing = await prisma.learningWeightP4.findUnique({
    where: { scope_key_channelId: { scope, key, channelId: channelId ?? "" } },
    // Note: need to handle null channelId in unique constraint
  });

  // ... rest of logic unchanged, just add channelId to create/update
}
```

**Alternative for null in unique constraint:** PostgreSQL treats `NULL != NULL` in unique constraints, so `@@unique([scope, key, channelId])` allows multiple nulls. But Prisma's `findUnique` doesn't support null in composite keys. Solution options:

**Option A (Recommended):** Use empty string `""` instead of null for global weights.
```typescript
channelId String @default("") // "" = global, "cuid" = per-channel
```

**Option B:** Use `findFirst` with WHERE clause instead of `findUnique`.

→ Recommend **Option A** for simplicity. `""` = global, `"clxxxx"` = per-channel.

### Update Weight Consumers

Files that READ weights and need channel-aware queries:

1. **`lib/learning/explore-exploit.ts`** (lines 27-31, 62-66)
   - Query with channelId first, fallback to global if no channel-specific data
   ```typescript
   const weights = await prisma.learningWeightP4.findMany({
     where: {
       scope,
       channelId: { in: [channelId, ""] }, // channel + global
     },
     orderBy: { weight: "desc" },
   });
   // Prefer channel-specific, fallback to global
   ```

2. **`lib/ai/win-probability.ts`** (lines 56-64, 87-95)
   - Pass channelId to weight queries

3. **`lib/learning/win-loss-analysis.ts`** (line 98-103)
   - Filter by channelId when analyzing

4. **`lib/brief/generate-morning-brief.ts`**
   - Pass channelId context

5. **`lib/reports/generate-weekly-report.ts`**
   - Aggregate per-channel data in reports

6. **`app/api/learning/route.ts`** (GET handler)
   - Accept `?channelId=` query param, return channel-specific or global

### Update Weight Producers (callers of updateLearningWeights)

Files that WRITE weights and need to pass channelId:

1. **`app/api/log/quick/route.ts`** (line 79-87)
   - Asset already has `channelId` → pass to updateLearningWeights
   ```typescript
   await updateLearningWeights({
     hookType: asset.hookType,
     format: asset.format,
     angle: asset.angle,
     category: asset.productIdentity?.category || null,
     channelId: asset.channelId || null,  // ← ADD
   }, reward);
   ```

2. **`app/api/log/batch/route.ts`** (line 72-80)
   - Same pattern

3. **`app/api/metrics/capture/route.ts`** (line 75-83)
   - Same pattern

### Update Decay

**File:** `lib/learning/decay.ts`

No structural change needed — decay applies to ALL weights regardless of channelId. Just ensure it iterates all records including channel-specific ones.

---

## Implementation Steps

- [ ] Schema migration: add `channelId` to `LearningWeightP4` with `@default("")`
- [ ] Update `@@unique` constraint to `[scope, key, channelId]`
- [ ] Add `@@index([channelId])`
- [ ] Run `npx prisma migrate dev --name add-channel-to-learning-weights`
- [ ] Update `updateLearningWeights()`: accept channelId, write both channel + global
- [ ] Update `upsertWeight()`: include channelId in findUnique/create/update
- [ ] Update `explore-exploit.ts`: query channel-first, fallback global
- [ ] Update `win-probability.ts`: pass channelId
- [ ] Update `win-loss-analysis.ts`: filter by channelId
- [ ] Update log/quick, log/batch, metrics/capture: pass channelId from asset
- [ ] Update `GET /api/learning`: accept channelId query param
- [ ] Compile check
- [ ] Test: verify channel-specific weights saved separately from global

---

## Files to Modify
- `prisma/schema.prisma` (LearningWeightP4 model)
- `lib/learning/update-weights.ts`
- `lib/learning/explore-exploit.ts`
- `lib/learning/decay.ts` (minor)
- `lib/learning/win-loss-analysis.ts`
- `lib/ai/win-probability.ts`
- `app/api/log/quick/route.ts`
- `app/api/log/batch/route.ts`
- `app/api/metrics/capture/route.ts`
- `app/api/learning/route.ts`

---

## Migration Risk
- **Data loss:** NONE — existing records get `channelId: ""` (global)
- **Breaking change:** NONE — null/empty channelId = global = same behavior as before
- **Performance:** Additional writes (2x per metric logged), mitigated by simple index

---

## Success Criteria
- [ ] Each logged asset creates BOTH channel-specific AND global weight entries
- [ ] Brief generation uses channel-specific weights when available
- [ ] Fallback to global weights when no channel-specific data
- [ ] API returns weights filtered by channelId
- [ ] Existing global weights preserved after migration
