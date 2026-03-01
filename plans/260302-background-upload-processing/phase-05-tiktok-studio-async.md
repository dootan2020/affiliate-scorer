# Phase 5: TikTok Studio Async

## Priority: P2
## Status: Pending
## Estimated: 1.5h
## Depends on: Phase 1, Phase 3

## Overview

Apply the same async pattern to TikTok Studio import. Current implementation processes all files synchronously with N+1 upserts. Refactor to return immediately and process in background, with optional batch upserts.

## Key Insights

- `app/api/sync/tiktok-studio/route.ts` (121 lines) processes multiple files sequentially
- Each parser (overview, follower_activity, content, insights) does individual upserts — e.g. overview parser does `prisma.accountDailyStat.upsert()` per row (line 79-99 in tiktok-studio-overview.ts)
- TikTok Studio imports don't use ImportBatch currently — they generate a string batchId `tiktok_studio_${Date.now()}`
- The parsers write directly to specific models (AccountDailyStat, FollowerActivity, etc.) — not to Product
- Files are typically small (30-365 rows) but having 4-5 files with N+1 queries adds up

### Two sub-tasks:
1. **Async processing**: return immediately, process files in background
2. **Batch upserts** (optional optimization): replace N+1 upserts with batched operations where possible

### Decision: Create ImportBatch record for TikTok Studio imports?

**Yes** — create one ImportBatch per upload session. This unifies the status tracking model. The batchId string is replaced with a real ImportBatch.id.

## Requirements

### Functional
- POST /api/sync/tiktok-studio returns immediately with batchId
- Background processes each file, updates ImportBatch progress
- Client polls same endpoint (GET /api/imports/[id]/status)
- Errors per file captured in ImportBatch.errorLog

### Non-functional
- Keep existing parser functions unchanged — they accept buffer and return count/errors
- Wrap their calls in background processor
- Batch upserts for overview parser (biggest dataset, 365 rows typical)

## Related Code Files

### Modify
- `app/api/sync/tiktok-studio/route.ts` — use `after()`, return batchId
- `components/sync/tiktok-studio-dropzone.tsx` — poll for progress
- `lib/parsers/tiktok-studio-overview.ts` — optional: batch upsert optimization

### Create
- `lib/import/process-tiktok-studio-batch.ts` — background processor for TikTok files

### Reads (context)
- `lib/parsers/tiktok-studio-content.ts`
- `lib/parsers/tiktok-studio-follower-activity.ts`
- `lib/parsers/tiktok-studio-insights.ts`
- `lib/parsers/detect-tiktok-studio.ts`

## Implementation Steps

### 1. Create `lib/import/process-tiktok-studio-batch.ts`

```typescript
import { detectTikTokStudioFileType, FILE_TYPE_LABELS } from "@/lib/parsers/detect-tiktok-studio";
import { parseTikTokStudioOverview } from "@/lib/parsers/tiktok-studio-overview";
import { parseTikTokStudioFollowerActivity } from "@/lib/parsers/tiktok-studio-follower-activity";
import { parseTikTokStudioContent } from "@/lib/parsers/tiktok-studio-content";
import { parseTikTokStudioInsights } from "@/lib/parsers/tiktok-studio-insights";
import { updateBatchProgress } from "./update-batch-progress";
import type { TikTokStudioFileType } from "@/lib/parsers/detect-tiktok-studio";

interface FileInput {
  buffer: ArrayBuffer;
  fileName: string;
  fileType: TikTokStudioFileType;
}

interface FileResult {
  fileName: string;
  type: TikTokStudioFileType;
  typeLabel: string;
  status: "success" | "partial" | "error" | "skipped";
  count: number;
  errors: string[];
}

export async function processTikTokStudioBatch(
  batchId: string,
  files: FileInput[]
): Promise<void> {
  const results: FileResult[] = [];
  let totalImported = 0;

  try {
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const typeLabel = FILE_TYPE_LABELS[f.fileType];

      if (f.fileType === "unknown") {
        results.push({ fileName: f.fileName, type: f.fileType, typeLabel, status: "skipped", count: 0, errors: ["Không nhận diện được loại file"] });
        continue;
      }

      try {
        let parseResult: { count: number; errors: string[] };
        if (f.fileType === "overview") parseResult = await parseTikTokStudioOverview(f.buffer, batchId);
        else if (f.fileType === "follower_activity") parseResult = await parseTikTokStudioFollowerActivity(f.buffer, batchId);
        else if (f.fileType === "content") parseResult = await parseTikTokStudioContent(f.buffer, batchId);
        else parseResult = await parseTikTokStudioInsights(f.buffer, f.fileType, batchId);

        const status = parseResult.errors.length === 0 ? "success" : parseResult.count > 0 ? "partial" : "error";
        results.push({ fileName: f.fileName, type: f.fileType, typeLabel, status, count: parseResult.count, errors: parseResult.errors });
        totalImported += parseResult.count;
      } catch (err) {
        results.push({ fileName: f.fileName, type: f.fileType, typeLabel, status: "error", count: 0, errors: [err instanceof Error ? err.message : "Lỗi"] });
      }

      // Update progress after each file
      await updateBatchProgress(batchId, {
        rowsProcessed: i + 1,
        productsCreated: totalImported, // reuse field for total records
      });
    }

    const hasErrors = results.some(r => r.status === "error");
    const allOk = results.every(r => r.status === "success" || r.status === "skipped");

    await updateBatchProgress(batchId, {
      status: allOk ? "completed" : hasErrors ? "partial" : "completed",
      scoringStatus: "skipped", // TikTok Studio has no scoring
      errorLog: results.some(r => r.errors.length > 0) ? results.filter(r => r.errors.length > 0) : undefined,
      completedAt: new Date(),
    });
  } catch (err) {
    console.error("processTikTokStudioBatch fatal:", err);
    await updateBatchProgress(batchId, {
      status: "failed",
      scoringStatus: "skipped",
      errorLog: { message: err instanceof Error ? err.message : "Unknown", fileResults: results },
      completedAt: new Date(),
    });
  }
}
```

### 2. Refactor `app/api/sync/tiktok-studio/route.ts`

```typescript
import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/db";
import { detectTikTokStudioFileType } from "@/lib/parsers/detect-tiktok-studio";
import { processTikTokStudioBatch } from "@/lib/import/process-tiktok-studio-batch";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Vui lòng chọn ít nhất một file" }, { status: 400 });
    }

    // Pre-read all file buffers (must be done before response)
    const fileInputs = [];
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) continue; // skip oversized
      const buffer = await file.arrayBuffer();
      const fileType = detectTikTokStudioFileType(file.name);
      fileInputs.push({ buffer, fileName: file.name, fileType });
    }

    // Create ImportBatch
    const batch = await prisma.importBatch.create({
      data: {
        source: "tiktok_studio",
        fileName: files.map(f => f.name).join(", "),
        recordCount: fileInputs.length,
        status: "processing",
        rowsTotal: fileInputs.length, // rowsTotal = number of files for this type
      },
    });

    // Process in background
    after(async () => {
      await processTikTokStudioBatch(batch.id, fileInputs);
    });

    return NextResponse.json({
      data: { batchId: batch.id, status: "processing", fileCount: fileInputs.length },
      message: `Đang xử lý ${fileInputs.length} file TikTok Studio...`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Critical**: File buffers must be read BEFORE the response is sent. `file.arrayBuffer()` reads from the request stream — once response is sent, the request body may be disposed. Pre-read all buffers into memory.

### 3. Update `components/sync/tiktok-studio-dropzone.tsx`

Add polling after upload:
- After POST returns batchId, start polling using `useImportPolling` hook (from Phase 4)
- Show progress: "Đang xử lý file 2/5..."
- Show per-file results when complete

### 4. Optional: Batch upsert for overview parser

Replace N+1 upserts in `tiktok-studio-overview.ts` with batched approach:

```typescript
// Instead of:
for (const r of rows) {
  await prisma.accountDailyStat.upsert({ where: { date: r.date }, ... });
}

// Use Prisma transaction with createMany + conflict handling:
// Or use raw SQL: INSERT ... ON CONFLICT (date) DO UPDATE
```

This is an optimization, not strictly required. Can be deferred if time is tight. The N+1 pattern works fine for <365 rows, just slower.

## Todo

- [ ] Create `lib/import/process-tiktok-studio-batch.ts`
- [ ] Refactor `app/api/sync/tiktok-studio/route.ts` — use `after()`, pre-read buffers
- [ ] Update `tiktok-studio-dropzone.tsx` — add polling for progress
- [ ] (Optional) Batch upsert in tiktok-studio-overview.ts
- [ ] `pnpm build` passes

## Success Criteria

- POST /api/sync/tiktok-studio returns immediately with batchId
- Background processes all files with correct results
- TikTokStudioDropzone shows live progress
- All file buffers read before response (no stream disposal issues)

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| File buffer disposed after response | High | Pre-read ALL buffers to ArrayBuffer before returning response |
| Large files exhaust memory | Low | Already have 10MB per-file limit; 5 files = 50MB max — fine for serverless |
| TikTok Studio parsers not designed for batch context | Low | They already accept batchId param — no change needed |
| Dropzone expects old response format | Medium | Update dropzone to handle new format; deploy Phase 4+5 together |

## Security Considerations

- Same file validation as before (size limit, type detection)
- No new attack surface
