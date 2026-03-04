// Unified progress: import 0-25%, scoring 25-100%.
// Single source of truth — used by both status API and active-batch API.

interface BatchProgress {
  recordCount: number;
  rowsProcessed: number;
  scoredCount: number;
  status: string;
  scoringStatus: string;
}

/** Calculate unified progress 0-100 across import + scoring pipeline. */
export function calcUnifiedProgress(batch: BatchProgress): number {
  const { recordCount, rowsProcessed, scoredCount, status, scoringStatus } = batch;
  if (recordCount === 0) return 0;

  // Import phase: 0% → 25%
  const importRatio = Math.min(rowsProcessed / recordCount, 1);
  const importPct = importRatio * 25;

  // Import failed → stuck at import %
  if (status === "failed") return Math.round(importPct);

  // Scoring phase: 25% → 100%
  // When scoring is "completed", scoredCount should already == recordCount
  // (set by score-batch on completion), so the math naturally gives 100%.
  const effectiveScored = Math.min(scoredCount ?? 0, recordCount);
  const scoredRatio = effectiveScored / recordCount;
  const scoringPct = scoredRatio * 75;

  const progress = Math.round(importPct + scoringPct);

  console.log("[progress]", {
    recordCount, rowsProcessed, scoredCount, status, scoringStatus,
    importPct: Math.round(importPct), scoringPct: Math.round(scoringPct), progress,
  });

  return progress;
}
