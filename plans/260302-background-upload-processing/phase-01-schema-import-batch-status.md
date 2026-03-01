# Phase 1: Add Status Tracking to ImportBatch

## Priority: P1 (blocks all other phases)
## Status: Pending
## Estimated: 30 min

## Overview

ImportBatch currently has no `status` or progress fields. Add them so the background processor can report progress and the client can poll for it.

## Key Insights

- ImportBatch (line 197-205 in schema.prisma) only has: id, source, fileName, recordCount, importDate, snapshots[]
- DataImport already has status/progress fields — use same pattern for consistency
- ImportBatch is used by product imports (FastMoss/KaloData); DataImport is for financial data
- ProductSnapshot has FK to ImportBatch — no breaking changes needed

## Requirements

### Functional
- ImportBatch tracks processing status (pending/processing/completed/failed/partial)
- Track row-level progress (processed/total/errored)
- Track scoring sub-status separately (scoring happens after import)
- Store error details for debugging

### Non-functional
- Migration must be non-destructive (existing rows get default values)
- No downtime — `prisma db push` is fine for this project

## Related Code Files

### Modify
- `prisma/schema.prisma` — ImportBatch model (~line 197)

### Reads (no change)
- `app/api/upload/products/route.ts` — creates ImportBatch at line 88-94
- `components/upload/import-history-table.tsx` — displays import history

## Implementation Steps

### 1. Add fields to ImportBatch model

```prisma
model ImportBatch {
  id          String   @id @default(cuid())
  source      String
  fileName    String
  recordCount Int
  importDate  DateTime @default(now())

  // NEW: Processing status
  status         String @default("pending")  // "pending" | "processing" | "completed" | "failed" | "partial"
  rowsProcessed  Int    @default(0)
  rowsTotal      Int    @default(0)
  rowsError      Int    @default(0)
  errorLog       Json?

  // NEW: Scoring sub-status (runs after import)
  scoringStatus  String @default("pending")  // "pending" | "processing" | "completed" | "failed" | "skipped"

  // NEW: Result counts
  productsCreated Int @default(0)
  productsUpdated Int @default(0)

  completedAt DateTime?

  snapshots ProductSnapshot[]

  @@index([status])
}
```

### 2. Run migration

```bash
pnpm prisma db push
```

### 3. Verify existing code still compiles

The existing `prisma.importBatch.create()` in route.ts only sets `source, fileName, recordCount` — all new fields have defaults, so no breakage.

## Todo

- [ ] Add status, progress, scoring, and result fields to ImportBatch
- [ ] Add `@@index([status])` for polling query performance
- [ ] Run `prisma db push`
- [ ] Run `pnpm build` to verify no type errors

## Success Criteria

- Schema pushed successfully
- Existing code compiles without changes
- New fields have sensible defaults
- Existing ImportBatch rows unaffected (all new fields nullable or have defaults)

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Existing rows missing new fields | Low | All new fields have `@default()` values |
| Prisma client type changes break build | Low | All new fields optional or defaulted — existing create() calls unaffected |
