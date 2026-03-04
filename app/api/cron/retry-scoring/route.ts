// GET /api/cron/retry-scoring — Vercel cron (every 5 min).
// Finds batches with failed or stuck scoring and retries up to 3 times.
export const maxDuration = 30;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fireRelay } from "@/lib/import/fire-relay";

const MAX_SCORING_RETRIES = 3;
const BASE_STUCK_MS = 3 * 60_000; // 3 min base
const PER_CHUNK_STUCK_MS = 60_000; // +1 min per 150-product scoring chunk

export async function GET(): Promise<NextResponse> {
  try {
    const now = new Date();

    // First pass: find potential candidates with a generous cutoff
    const maxCutoff = new Date(now.getTime() - BASE_STUCK_MS);
    const potentials = await prisma.importBatch.findMany({
      where: {
        status: { in: ["completed", "partial"] },
        OR: [
          { scoringStatus: "failed" },
          {
            scoringStatus: "processing",
            importDate: { lt: maxCutoff },
          },
        ],
      },
      select: {
        id: true,
        errorLog: true,
        recordCount: true,
        importDate: true,
        scoringStatus: true,
      },
      take: 10,
    });

    // Second pass: filter stuck batches using per-batch scaled threshold
    const candidates = potentials.filter((batch) => {
      if (batch.scoringStatus === "failed") return true; // explicit failure always qualifies
      // Scale stuck threshold by scoring chunks (150 products per chunk)
      const chunks = Math.max(1, Math.ceil(batch.recordCount / 150));
      const threshold = BASE_STUCK_MS + chunks * PER_CHUNK_STUCK_MS;
      const age = now.getTime() - new Date(batch.importDate).getTime();
      return age > threshold;
    }).slice(0, 5);

    let retried = 0;
    let skipped = 0;

    for (const batch of candidates) {
      const log = (batch.errorLog as Record<string, unknown>) ?? {};
      const retryCount = (log.scoringRetryCount as number) ?? 0;

      if (retryCount >= MAX_SCORING_RETRIES) {
        skipped++;
        continue;
      }

      // Increment retry count and reset status
      await prisma.importBatch.update({
        where: { id: batch.id },
        data: {
          scoringStatus: "processing",
          completedAt: null,
          errorLog: { ...log, scoringRetryCount: retryCount + 1 },
        },
      });

      fireRelay(
        "/api/internal/score-batch",
        { batchId: batch.id },
        `scoring-retry-${retryCount + 1}`,
      );
      retried++;
    }

    // Cleanup zombie BackgroundTasks stuck in processing > 3 min
    const taskStuckCutoff = new Date(now.getTime() - 3 * 60_000);
    const zombieTasks = await prisma.backgroundTask.updateMany({
      where: {
        status: "processing",
        updatedAt: { lt: taskStuckCutoff },
      },
      data: { status: "failed", error: "Timeout — vui lòng thử lại" },
    });

    return NextResponse.json({
      checked: candidates.length,
      retried,
      skipped,
      zombieTasksCleaned: zombieTasks.count,
    });
  } catch (error) {
    console.error("Cron retry-scoring error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    );
  }
}
