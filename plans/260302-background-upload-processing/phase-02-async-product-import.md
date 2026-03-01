# Phase 2: Refactor Product Import to Async

## Priority: P1
## Status: Pending
## Estimated: 2h
## Depends on: Phase 1

## Overview

Refactor `POST /api/upload/products` to return immediately after file parsing/validation, then process products in background using Next.js `after()`. Update ImportBatch status/progress as processing proceeds.

## Key Insights

- Current route is 340 lines, does everything synchronously in one request
- File parsing + validation (lines 22-86) is fast (~100ms) — keep sync
- Batch pre-fetch (lines 107-127) is fast (~200ms) — can stay sync or move to background
- The slow part is the per-product loop (lines 129-288): snapshot check, update/create, syncIdentity — each product does 2-5 DB calls
- Scoring (lines 292-320) is already fire-and-forget but has no status tracking
- Next.js 16 `after()` (from `next/server`) runs code after response is sent, extends function lifetime

### `after()` API

```typescript
import { after } from "next/server";

export async function POST(req: Request) {
  // ... fast work ...
  after(async () => {
    // runs after response is sent
    // can be async, has full access to closure variables
  });
  return NextResponse.json({ batchId });
}
```

## Requirements

### Functional
- Upload response returns in <500ms (parse + validate + create batch only)
- Background processes all products, updating ImportBatch progress incrementally
- Scoring runs after all products processed, with its own status tracking
- Errors in background processing don't crash — caught and logged to ImportBatch.errorLog

### Non-functional
- Keep file under 200 lines — extract background processor to separate module
- Maintain identical business logic (dedup, snapshots, identity sync, scoring, lifecycle)
- No data loss — if background fails mid-way, partial progress is saved

## Related Code Files

### Modify
- `app/api/upload/products/route.ts` — slim down to parse + validate + return batchId

### Create
- `lib/import/process-product-batch.ts` — background processing logic extracted from route
- `lib/import/update-batch-progress.ts` — helper to atomically update ImportBatch progress

### Reads (no change)
- `lib/ai/scoring.ts` — scoreProducts()
- `lib/inbox/sync-identity.ts` — syncProductIdentity()
- `lib/services/score-identity.ts` — syncIdentityScores()
- `lib/ai/lifecycle.ts` — getProductLifecycle()

## Architecture

```
POST /api/upload/products
  ├── 1. Parse file (sync, fast)
  ├── 2. Validate & detect format (sync, fast)
  ├── 3. Parse products via parser (sync, fast)
  ├── 4. Deduplicate (sync, fast)
  ├── 5. Create ImportBatch (status="processing", rowsTotal=N)
  ├── 6. Return { batchId } immediately
  └── after() → processProductBatch(batch, products, lookupMaps)
        ├── For each product:
        │   ├── Snapshot + update/create
        │   ├── syncProductIdentity()
        │   └── Update ImportBatch.rowsProcessed++
        ├── Update ImportBatch.status = "completed"
        ├── Update ImportBatch.scoringStatus = "processing"
        ├── scoreProducts({ batchId })
        ├── syncIdentityScores()
        ├── getProductLifecycle() per product
        └── Update ImportBatch.scoringStatus = "completed"
```

## Implementation Steps

### 1. Create `lib/import/update-batch-progress.ts`

Small utility to atomically update ImportBatch progress:

```typescript
import { prisma } from "@/lib/db";

export type BatchStatus = "pending" | "processing" | "completed" | "failed" | "partial";
export type ScoringStatus = "pending" | "processing" | "completed" | "failed" | "skipped";

interface ProgressUpdate {
  rowsProcessed?: number;
  rowsError?: number;
  productsCreated?: number;
  productsUpdated?: number;
  status?: BatchStatus;
  scoringStatus?: ScoringStatus;
  errorLog?: unknown;
  completedAt?: Date;
}

export async function updateBatchProgress(
  batchId: string,
  update: ProgressUpdate
): Promise<void> {
  await prisma.importBatch.update({
    where: { id: batchId },
    data: update,
  });
}
```

### 2. Create `lib/import/process-product-batch.ts`

Extract the product processing loop (current lines 100-320) into a standalone async function:

```typescript
import { prisma } from "@/lib/db";
import { syncProductIdentity } from "@/lib/inbox/sync-identity";
import { syncIdentityScores } from "@/lib/services/score-identity";
import { scoreProducts } from "@/lib/ai/scoring";
import { getProductLifecycle } from "@/lib/ai/lifecycle";
import { createEmptyDeltaSummary } from "@/lib/inbox/delta-classification";
import { updateBatchProgress } from "./update-batch-progress";
import type { NormalizedProduct } from "@/lib/utils/normalize";

interface ProcessOptions {
  batchId: string;
  products: NormalizedProduct[];
}

export async function processProductBatch(options: ProcessOptions): Promise<void> {
  const { batchId, products } = options;

  try {
    // Batch pre-fetch (same logic as current lines 107-127)
    const { urlMap, nameShopMap } = await prefetchExistingProducts(products);

    let created = 0;
    let updated = 0;
    let errored = 0;

    for (let i = 0; i < products.length; i++) {
      try {
        const result = await processOneProduct(products[i], batchId, urlMap, nameShopMap);
        if (result === "created") created++;
        else updated++;
      } catch (err) {
        errored++;
        console.error(`Product ${i} error:`, err);
      }

      // Update progress every product (or batch every 5 for perf)
      if ((i + 1) % 5 === 0 || i === products.length - 1) {
        await updateBatchProgress(batchId, {
          rowsProcessed: i + 1,
          rowsError: errored,
          productsCreated: created,
          productsUpdated: updated,
        });
      }
    }

    // Mark import phase complete
    const importStatus = errored > 0 && created + updated > 0 ? "partial" :
                         errored > 0 ? "failed" : "completed";
    await updateBatchProgress(batchId, {
      status: importStatus,
      scoringStatus: "processing",
    });

    // Scoring phase (same logic as current lines 292-320)
    await runScoring(batchId);

    await updateBatchProgress(batchId, {
      scoringStatus: "completed",
      completedAt: new Date(),
    });
  } catch (err) {
    console.error("processProductBatch fatal:", err);
    await updateBatchProgress(batchId, {
      status: "failed",
      errorLog: { message: err instanceof Error ? err.message : "Unknown" },
      completedAt: new Date(),
    });
  }
}
```

**Important**: `processOneProduct()` contains the exact same logic currently in the for-loop (lines 129-287). Extract it as-is — snapshot check, update/create, identity sync. No behavior changes.

### 3. Refactor `app/api/upload/products/route.ts`

Slim down to ~80 lines:

```typescript
import { after } from "next/server";
import { processProductBatch } from "@/lib/import/process-product-batch";
// ... other imports stay same ...

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // --- SYNC: Parse & validate (same as current lines 22-86) ---
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    // ... validation ...
    const { headers, rows } = await parseFile(file);
    const format = detectFormat(headers);
    // ... parse products based on format ...
    const deduplicated = deduplicateProducts(products);

    // --- SYNC: Create batch with "processing" status ---
    const batch = await prisma.importBatch.create({
      data: {
        source: format === "unknown" ? "custom" : format,
        fileName: file.name,
        recordCount: deduplicated.length,
        status: "processing",
        rowsTotal: deduplicated.length,
      },
    });

    // --- ASYNC: Process in background ---
    after(async () => {
      await processProductBatch({
        batchId: batch.id,
        products: deduplicated,
      });
    });

    // --- Return immediately ---
    return NextResponse.json({
      data: { batchId: batch.id, status: "processing", rowsTotal: deduplicated.length },
      message: `Đang xử lý ${deduplicated.length} sản phẩm...`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

### 4. Handle the batch pre-fetch efficiently

Move the batch pre-fetch (current lines 107-127) into `processProductBatch` as first step. This keeps it in the background — saves ~200ms from the response.

### 5. Verify build compiles

```bash
pnpm build
```

## File Size Management

Current `route.ts` is 340 lines. After refactor:
- `route.ts`: ~80 lines (parse, validate, create batch, return)
- `process-product-batch.ts`: ~150 lines (processing loop, scoring)
- `update-batch-progress.ts`: ~25 lines (utility)

All under 200-line limit.

## Todo

- [ ] Create `lib/import/update-batch-progress.ts`
- [ ] Create `lib/import/process-product-batch.ts` — extract processing loop
- [ ] Refactor `app/api/upload/products/route.ts` — use `after()`, return batchId immediately
- [ ] Move batch pre-fetch into background processor
- [ ] Verify same business logic: snapshots, identity sync, scoring, lifecycle
- [ ] `pnpm build` passes

## Success Criteria

- POST /api/upload/products returns in <500ms with `{ batchId, status: "processing" }`
- Background processing completes all products with same results as before
- ImportBatch.status transitions: processing → completed (or partial/failed)
- ImportBatch.rowsProcessed increments as products are processed
- Scoring runs and ImportBatch.scoringStatus tracks it
- No data loss or behavior change from user's perspective

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| `after()` not available in dev mode | Low | Next 16 supports it; falls back to sync if needed |
| Background process crashes silently | Medium | Wrap in try-catch, update ImportBatch.status="failed" with errorLog |
| Client expects old response format | High | Phase 4 updates client to poll; temporary breakage between Phase 2 and 4 — deploy together |
| Closure captures stale data | Low | `deduplicated` is a new array per request — safe to capture |
| Vercel timeout kills background | Medium | `after()` is designed for this; Vercel extends lifetime for `after()` callbacks |

## Security Considerations

- No new auth concerns — same endpoint, same validation
- errorLog may contain stack traces — filter sensitive info before storing
