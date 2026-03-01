# Phase 4: Client Polling UI

## Priority: P1
## Status: Pending
## Estimated: 1.5h
## Depends on: Phase 2, Phase 3

## Overview

Update client components to poll for import progress after upload, showing real-time progress bar with product counts, scoring status, and error details.

## Key Insights

- `sync-page-content.tsx` (242 lines) calls POST /api/upload/products and waits for full response
- `upload-progress.tsx` (115 lines) shows static result after completion — needs live progress
- `import-history-table.tsx` (165 lines) shows DataImport records, NOT ImportBatch — needs to also show ImportBatch records or be updated to poll active ones
- The upload flow has 2 steps: (1) preview/mapping, (2) confirm import. Only step 2 changes.
- `UploadResult` interface in upload-progress.tsx needs to change: old format had final counts, new format starts with batchId only

### Current client flow
1. User drops file → `handleProductUpload()` → POST /preview (fast) → show mapping
2. User confirms → `handleConfirmImport()` → POST /products (SLOW, blocks) → show result
3. Import history shows DataImport records (separate system)

### New client flow
1. Same preview step (no change)
2. User confirms → POST /products → get `{ batchId }` immediately → start polling
3. Show progress bar: "Đang xử lý 15/50 sản phẩm..."
4. When status=completed → show final results (same as before)
5. Import history shows live status for recent batches

## Requirements

### Functional
- After confirm import, show live progress (processed/total, created/updated counts)
- Progress bar with percentage
- Show scoring status after import completes ("Đang chấm điểm...")
- Show final results when fully complete
- Handle errors gracefully (batch failed → show error message)
- Import history table shows ImportBatch records with live status

### Non-functional
- Poll every 3 seconds
- Stop polling on terminal status or component unmount
- No unnecessary re-renders

## Related Code Files

### Modify
- `components/sync/sync-page-content.tsx` — update `handleConfirmImport()` to start polling
- `components/upload/upload-progress.tsx` — add live progress display mode

### Create
- `lib/hooks/use-import-polling.ts` — reusable polling hook

### Reads (context)
- `app/api/imports/[id]/status/route.ts` — polling endpoint (Phase 3)

## Architecture

```
SyncPageContent
  ├── handleConfirmImport()
  │     ├── POST /api/upload/products → { batchId }
  │     └── Set activeBatchId
  │
  ├── useImportPolling(activeBatchId)
  │     ├── GET /api/imports/{id}/status every 3s
  │     ├── Returns: { status, progress, result }
  │     └── Stops when terminal status
  │
  └── UploadProgress
        ├── mode: "polling" → show progress bar + live counts
        └── mode: "complete" → show final result (same as current)
```

## Implementation Steps

### 1. Create `lib/hooks/use-import-polling.ts`

```typescript
import { useState, useEffect, useRef, useCallback } from "react";

interface BatchProgress {
  id: string;
  status: string;
  rowsProcessed: number;
  rowsTotal: number;
  rowsError: number;
  productsCreated: number;
  productsUpdated: number;
  scoringStatus: string;
  errorLog: unknown;
  completedAt: string | null;
}

interface UseImportPollingResult {
  progress: BatchProgress | null;
  isPolling: boolean;
  error: string | null;
}

const TERMINAL_STATUSES = ["completed", "failed", "partial"];
const POLL_INTERVAL_MS = 3000;

export function useImportPolling(batchId: string | null): UseImportPollingResult {
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  useEffect(() => {
    if (!batchId) { stopPolling(); return; }

    setIsPolling(true);
    setError(null);

    async function poll() {
      try {
        const res = await fetch(`/api/imports/${batchId}/status`);
        if (!res.ok) throw new Error("Không thể lấy trạng thái import");
        const data = await res.json();
        const batch = data.data as BatchProgress;
        setProgress(batch);

        // Stop when both import AND scoring are terminal
        const importDone = TERMINAL_STATUSES.includes(batch.status);
        const scoringDone = TERMINAL_STATUSES.includes(batch.scoringStatus)
                          || batch.scoringStatus === "skipped";
        if (importDone && scoringDone) stopPolling();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi polling");
        stopPolling();
      }
    }

    // Immediate first poll
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => stopPolling();
  }, [batchId, stopPolling]);

  return { progress, isPolling, error };
}
```

### 2. Update `components/upload/upload-progress.tsx`

Add a new "polling" mode alongside the existing "result" mode.

**New prop**: `batchId: string | null` — when set, shows polling progress instead of static result.

Key UI elements for polling mode:
- Progress bar: `rowsProcessed / rowsTotal` with percentage
- Status text: "Đang import 15/50 sản phẩm..." or "Đang chấm điểm..." or "Hoàn thành"
- Created/updated counts live-updating
- Error count if any
- When complete: show same result display as before, plus link to Inbox

**Keep backward compatible**: if `batchId` is null and `result` is set, show current static display.

### 3. Update `components/sync/sync-page-content.tsx`

Modify `handleConfirmImport()`:

```typescript
const [activeBatchId, setActiveBatchId] = useState<string | null>(null);

async function handleConfirmImport(mapping: Record<string, string | null>): Promise<void> {
  if (!file) return;
  setIsImporting(true);
  setError(null);

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mapping", JSON.stringify(mapping));

    const response = await fetch("/api/upload/products", { method: "POST", body: formData });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Lỗi import");

    // NEW: Start polling instead of showing final result
    setActiveBatchId(data.data.batchId);
    setPreview(null);
    toast.success(data.message);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi không xác định";
    setError(message);
    toast.error(message);
  } finally {
    setIsImporting(false);
  }
}
```

Pass `activeBatchId` to UploadProgress:

```tsx
<UploadProgress
  fileName={fileName}
  isUploading={false}
  batchId={activeBatchId}
  result={result}
  error={error}
/>
```

### 4. Update import history to show ImportBatch records

Two options:
- **Option A (simpler)**: Refresh import history when polling completes — just re-fetch
- **Option B**: Add ImportBatch to history endpoint

Go with **Option A**: when `useImportPolling` reaches terminal status, call `fetchImportHistory()`. This avoids modifying the history API which reads DataImport.

Optionally: add a separate section showing recent ImportBatch records. But this is low priority — defer to later if needed.

## Todo

- [ ] Create `lib/hooks/use-import-polling.ts`
- [ ] Update `upload-progress.tsx` — add polling mode with progress bar
- [ ] Update `sync-page-content.tsx` — use activeBatchId + polling hook
- [ ] Ensure polling stops on unmount
- [ ] Handle error states (batch failed, network error)
- [ ] `pnpm build` passes

## Success Criteria

- After upload confirm, UI immediately shows "Đang xử lý..." with progress bar
- Progress bar updates every 3s with real counts
- Scoring status shown after import completes
- Final result shown when everything completes
- User can navigate away and come back — progress continues in background
- No memory leaks from polling on unmount

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Polling continues after unmount | Medium | useEffect cleanup clears interval |
| Breaking UploadResult interface | Medium | Keep old props optional, add new batchId prop |
| Multiple concurrent polls | Low | Only one activeBatchId at a time; new upload replaces old |
| Network errors during polling | Low | Show error toast, stop polling, user can refresh page |

## Security Considerations

- Polling endpoint has no auth (single-user app) — acceptable
- BatchId is CUID — not guessable, but not secret either. Fine for this use case.
