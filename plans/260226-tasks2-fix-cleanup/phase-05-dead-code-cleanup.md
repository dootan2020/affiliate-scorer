# Phase 5 — Delete Orphan APIs + Cleanup (Tasks 3B-3F)

## Priority: LOW

## 3B: Delete Orphan API Files
- `app/api/feedback/manual/route.ts` ✓
- `app/api/upload/feedback/route.ts` ✓
- `app/api/inbox/migrate/route.ts` ✓
- `app/api/ai/patterns/route.ts` ✓ (uses WinPattern)

## 3C: WinPattern References
Found 2 refs — both in `app/api/ai/patterns/route.ts` (being deleted in 3B).
After deletion, verify no other references exist.
Comment WinPattern model in schema (don't delete — has data).

## 3D: UserGoal Cleanup
Active refs:
- `app/api/goals/route.ts` — DELETE (deprecated endpoint)
- `app/api/morning-brief/route.ts:107` — Will be fixed in Phase 4

GoalP5 is active via:
- `app/api/goals-p5/current/route.ts`
- `app/api/goals-p5/progress/route.ts`
- `app/api/goals-p5/route.ts`

## 3E: DataImport campaignsCreated/campaignsUpdated
Found in `app/sync/page.tsx` (ImportRecord interface lines 33-34).
Remove from UI display. Keep DB field.

## 3F: Double-check /api/upload/feedback (covered in 3B)

## Implementation Steps
1. Delete 4 orphan API files (3B)
2. Delete goals route (3D)
3. Verify no remaining WinPattern/UserGoal imports (3C, 3D)
4. Remove campaignsCreated/Updated from sync page UI (3E)
5. Comment WinPattern model in schema (3C)
6. TypeScript compile check
