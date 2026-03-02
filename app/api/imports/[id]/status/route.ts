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

    let isTerminal = ["completed", "failed", "partial"].includes(batch.status)
      && ["completed", "failed"].includes(batch.scoringStatus);

    // Stuck detection: if processing for over 5 minutes, auto-fail
    const STUCK_TIMEOUT_MS = 5 * 60 * 1000;
    if (!isTerminal) {
      const age = Date.now() - new Date(batch.importDate).getTime();
      if (age > STUCK_TIMEOUT_MS) {
        const needsStatusFix = batch.status === "processing" || batch.status === "pending";
        const needsScoringFix = batch.scoringStatus === "processing" || batch.scoringStatus === "pending";
        if (needsStatusFix || needsScoringFix) {
          await prisma.importBatch.update({
            where: { id },
            data: {
              ...(needsStatusFix && { status: "failed" }),
              ...(needsScoringFix && { scoringStatus: "failed" }),
              completedAt: new Date(),
              errorLog: { timeout: "Background processing timed out" },
            },
          });
          batch.status = needsStatusFix ? "failed" : batch.status;
          batch.scoringStatus = needsScoringFix ? "failed" : batch.scoringStatus;
          batch.completedAt = new Date();
          isTerminal = true;
        }
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
