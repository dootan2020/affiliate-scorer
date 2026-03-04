// GET /api/imports/[id]/status — Poll import batch progress
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calcUnifiedProgress } from "@/lib/import/calc-unified-progress";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
        rowsCreated: true,
        rowsUpdated: true,
        rowsError: true,
        scoringStatus: true,
        scoredCount: true,
        errorLog: true,
        completedAt: true,
        importDate: true,
      },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    // Terminal only when BOTH import AND scoring are done (or timed out)
    const importDone = ["completed", "failed", "partial"].includes(batch.status);
    const scoringDone = ["completed", "failed"].includes(batch.scoringStatus);
    let isTerminal = importDone && scoringDone;

    // Stuck detection: auto-fail stuck phases.
    // Timeouts scale with recordCount to support chunked import (300 SP/chunk).
    const age = Date.now() - new Date(batch.importDate).getTime();
    if (!isTerminal) {
      const chunks = Math.max(1, Math.ceil(batch.recordCount / 300));
      const IMPORT_TIMEOUT_MS = 5 * 60_000 + chunks * 30_000;  // 5 min + 30s/chunk
      const SCORING_TIMEOUT_MS = 3 * 60_000 + chunks * 30_000; // 3 min + 30s/chunk
      const needsStatusFix = !importDone && age > IMPORT_TIMEOUT_MS;
      const needsScoringFix = importDone && !scoringDone && age > SCORING_TIMEOUT_MS;

      if (needsStatusFix || needsScoringFix) {
        await prisma.importBatch.update({
          where: { id },
          data: {
            ...(needsStatusFix && { status: "failed" }),
            ...(needsScoringFix && { scoringStatus: "failed" }),
            completedAt: new Date(),
            ...(needsStatusFix && { errorLog: { timeout: "Import processing timed out" } }),
          },
        });
        if (needsStatusFix) batch.status = "failed";
        if (needsScoringFix) batch.scoringStatus = "failed";
        batch.completedAt = new Date();
        isTerminal = true;
      }
    }

    return NextResponse.json({
      data: {
        ...batch,
        isTerminal,
        progress: calcUnifiedProgress(batch),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
