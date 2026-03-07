# Architecture Updates — March 2026

Documentation updates reflecting recent schema changes, race condition fixes, and error boundary improvements.

## Changes Made

### 1. Schema Cascading Rules (system-architecture.md)

**Added comprehensive documentation** on 10 critical cascading relations:

- `Feedback → Product`: Cascade (remove feedback when product deleted)
- `ProductSnapshot → Product`: Cascade (remove snapshots on product removal)
- `ProductSnapshot → ImportBatch`: Cascade (cleanup on batch deletion)
- `ContentBrief → ProductIdentity`: Cascade (remove briefs when product deleted)
- `ContentBrief → TikTokChannel`: SetNull (preserve brief when channel deleted)
- `ContentAsset → ProductIdentity`: Cascade (remove assets when product deleted)
- `ContentAsset → ContentBrief`: SetNull (preserve asset when brief deleted)
- `ContentSlot → ProductIdentity`: SetNull (preserve slot when product deleted)
- `ContentSlot → ContentAsset`: SetNull (preserve slot when asset deleted)
- `NicheProfile → TikTokChannel`: SetNull (preserve profile when channel deleted)

**Design Philosophy:**
- Cascade: Used for transactional data (feedback, snapshots) — safe to delete with parent
- SetNull: Used for derived content (briefs, assets) — preserve independently useful data

### 2. Race Condition Fix — ProductIdentity Upsert (system-architecture.md)

**New Section 6: "Idempotency & Race Condition Prevention"**

**Problem Solved:**
Concurrent paste events could create duplicate ProductIdentity records for same URL.

**Solution Implementation:**
`processInboxItem` now uses Prisma `upsert()` instead of `create()`:
```typescript
const identity = await prisma.productIdentity.upsert({
  where: { productUrl: normalizedUrl },
  create: { /* ... */ },
  update: { lastSeenAt: new Date(), inboxState: "pending" },
});
```

**Benefits:**
- Prevents race condition on concurrent pastes
- Idempotent: safe to retry without creating duplicates
- Single source of truth for product identity

### 3. Dashboard Error Boundaries (system-architecture.md)

**New Section 7: "Error Handling & Resilience" → Dashboard Widget Error Boundaries**

**Problem Solved:**
Single widget crash could take down entire dashboard.

**Solution Implementation:**
All dashboard widgets wrapped in ErrorBoundary:
```typescript
<ErrorBoundary fallback={<WidgetError title={title} />}>
  {children}
</ErrorBoundary>
```

**Applied To:**
- Morning Brief widget
- Inbox Stats widget
- Quick Paste widget
- Chart widgets
- Metric cards

**Benefits:**
- Isolated failures: one widget error doesn't cascade
- User can continue with other features
- Fallback UI guides users to retry or report issue

### 4. Transaction Safety for Batch Creation (system-architecture.md)

**Updated Section 2.1: "Import Phase"**

**Pattern Documented:**
Production batch creation now uses `$transaction()` for atomic batch + asset assignment:

```typescript
const batch = await prisma.$transaction(async (tx) => {
  const batch = await tx.importBatch.create({ /* ... */ });
  // Atomic: only create if batch creation succeeds
  for (const product of deduplicatedProducts.slice(0, 10)) {
    await tx.productAsset.create({ batchId: batch.id, /* ... */ });
  }
  return batch;
});
```

**Ensures:**
- Batch creation + initial asset assignments succeed or fail together
- Prevents partial batch creation if asset assignment fails
- No orphaned batch records

### 5. Database Patterns Guide (code-standards.md)

**New Section: "Database Patterns"**

Comprehensive patterns covering:
- **Idempotency & Race Conditions** — when and how to use `upsert()`
- **Cascading Deletes & Data Integrity** — `onDelete` rules (Cascade vs SetNull)
- **Transaction Safety** — when to use `$transaction()` (and when NOT to)
- **Error Boundaries** — UI error isolation patterns

## Updated Files

| File | Changes | Lines |
|------|---------|-------|
| `docs/system-architecture.md` | Added sections 6-7, cascading rules table, transaction safety in import phase | 631 (was 517) |
| `docs/code-standards.md` | Added "Database Patterns" section with 4 subsections | 245 (was 142) |
| `docs/codebase-summary.md` | Added cascading rules table + philosophy note in Database Models section | 160 (was 120) |

## Related Code Files

These changes are implemented in:
- `lib/import/process-inbox-item.ts` — Uses upsert for ProductIdentity
- `app/api/inbox/paste/route.ts` — Batch creation with transaction
- `components/dashboard/dashboard.tsx` — Widget ErrorBoundary wrappers
- `prisma/schema.prisma` — 10 cascading relations defined

## Key Takeaways

1. **Data Integrity First** — Cascading rules prevent orphaned records
2. **Idempotency Matters** — Upsert pattern handles concurrent operations safely
3. **Graceful Degradation** — Error boundaries keep features partially functional
4. **Atomic Operations** — Transactions prevent partial updates on critical flows
5. **Production Ready** — All patterns documented for future maintenance

## Testing Recommendations

- Test concurrent paste of same URL → verify single ProductIdentity created
- Test widget error in dashboard → verify other widgets remain functional
- Test batch creation failure midway → verify no orphaned batch records
- Load test import pipeline → verify transaction performance acceptable
