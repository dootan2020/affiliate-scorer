// GET /api/imports/[id]/status — Poll import batch progress
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

    // Stuck detection: auto-fail stuck phases
    // Import: 5 min timeout. Scoring: 3 min (runs via after())
    const age = Date.now() - new Date(batch.importDate).getTime();
    if (!isTerminal) {
      const IMPORT_TIMEOUT_MS = 5 * 60 * 1000;
      const SCORING_TIMEOUT_MS = 3 * 60 * 1000;
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
        progress: batch.recordCount > 0
          ? Math.round((batch.rowsProcessed / batch.recordCount) * 100)
          : 0,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
