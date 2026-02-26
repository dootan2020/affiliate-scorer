# Phase 1 — Auto-Sync Score khi Upload FastMoss (Task 1A)

## Priority: HIGH

## Problem
Upload FastMoss → `scoreProducts()` runs → Product gets `aiScore` → BUT `ProductIdentity.combinedScore` NOT updated automatically. User must manually trigger `/api/inbox/score-all` to sync scores.

## Solution
Extract score calculation logic from `/api/inbox/score-all/route.ts` into shared service `lib/services/score-identity.ts`. Call it from both:
1. After `scoreProducts()` in upload flow (auto)
2. From `/api/inbox/score-all` (manual batch)
3. From `/api/inbox/[id]/score` (single manual)

## Files to Create
- `lib/services/score-identity.ts` — shared scoring function

## Files to Modify
- `app/api/upload/products/route.ts` — call score-identity after scoreProducts
- `app/api/inbox/score-all/route.ts` — extract logic, use shared function
- `app/api/inbox/[id]/score/route.ts` — use shared function (if applicable)

## Implementation Steps

### Step 1: Read current score-all logic
- `app/api/inbox/score-all/route.ts` — understand calculateContentPotentialScore usage
- `lib/scoring/content-potential.ts` — understand score formula

### Step 2: Create `lib/services/score-identity.ts`
```typescript
export async function syncIdentityScores(identityIds?: string[]): Promise<number>
```
- If identityIds provided → score only those
- If not → score all non-archived
- Logic: same as current score-all (fetch identities, calc content score, calc combined, update)
- Return count of scored items

### Step 3: Update `/api/inbox/score-all/route.ts`
- Import and call `syncIdentityScores()` (no args = all)
- Remove duplicated logic

### Step 4: Update `/api/upload/products/route.ts`
- After `scoreProducts()` completes and Products have aiScore
- Find all ProductIdentity linked to the uploaded Products
- Call `syncIdentityScores(identityIds)` to update combinedScore
- Note: scoreProducts runs fire-and-forget, so need to await it OR hook into its completion

### Step 5: Verify
- `pnpm exec tsc --noEmit` — no type errors
