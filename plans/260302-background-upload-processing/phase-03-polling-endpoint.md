# Phase 3: Polling Endpoint

## Priority: P1
## Status: Pending
## Estimated: 30 min
## Depends on: Phase 1

## Overview

Create `GET /api/imports/[id]/status` so the client can poll ImportBatch progress after upload.

## Key Insights

- Existing `/api/upload/import/history` reads from DataImport, not ImportBatch — separate concern
- Need a simple GET that returns ImportBatch fields by ID
- Client will poll every 3s until terminal status (completed/failed/partial)
- Keep response payload minimal for low latency

## Requirements

### Functional
- GET /api/imports/[id]/status returns ImportBatch progress
- Returns 404 if batch not found
- Response includes: status, rowsProcessed, rowsTotal, rowsError, scoringStatus, productsCreated, productsUpdated

### Non-functional
- Fast — single DB query by primary key
- No auth required (single-user app)

## Related Code Files

### Create
- `app/api/imports/[id]/status/route.ts`

### Reads
- `prisma/schema.prisma` — ImportBatch model (Phase 1 fields)

## Implementation Steps

### 1. Create route file

```
app/api/imports/[id]/status/route.ts
```

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const batch = await prisma.importBatch.findUnique({
      where: { id },
      select: {
        id: true,
        source: true,
        fileName: true,
        recordCount: true,
        status: true,
        rowsProcessed: true,
        rowsTotal: true,
        rowsError: true,
        productsCreated: true,
        productsUpdated: true,
        scoringStatus: true,
        errorLog: true,
        importDate: true,
        completedAt: true,
      },
    });

    if (!batch) {
      return NextResponse.json(
        { error: "Không tìm thấy batch import" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: batch });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

### 2. Verify with curl / browser

```bash
curl http://localhost:3000/api/imports/SOME_BATCH_ID/status
```

## Todo

- [ ] Create `app/api/imports/[id]/status/route.ts`
- [ ] Verify 200 response for valid batch ID
- [ ] Verify 404 for invalid ID
- [ ] `pnpm build` passes

## Success Criteria

- GET /api/imports/{id}/status returns ImportBatch data
- 404 for nonexistent batches
- Response under 50ms (PK lookup)

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Polling creates DB load | Low | PK lookup is <1ms; 3s interval means 20 queries/min max |
| Missing batch ID from client | Low | Return 404 with clear error |
