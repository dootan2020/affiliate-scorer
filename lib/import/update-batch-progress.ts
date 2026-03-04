// Utility to update ImportBatch progress during background processing.
import { prisma } from "@/lib/db";
import type { InputJsonValue } from "@/app/generated/prisma/internal/prismaNamespace";

export async function updateBatchProgress(
  batchId: string,
  data: {
    status?: string;
    rowsProcessed?: number;
    rowsCreated?: number;
    rowsUpdated?: number;
    rowsError?: number;
    scoringStatus?: string;
    errorLog?: InputJsonValue;
    completedAt?: Date;
  },
): Promise<void> {
  await prisma.importBatch.update({
    where: { id: batchId },
    data,
  });
}

/** Increment progress counters atomically — used by chunked import + scoring. */
export async function incrementBatchProgress(
  batchId: string,
  increments: {
    rowsProcessed?: number;
    rowsCreated?: number;
    rowsUpdated?: number;
    rowsError?: number;
    scoredCount?: number;
  },
): Promise<void> {
  const data: Record<string, { increment: number }> = {};
  if (increments.rowsProcessed != null) data.rowsProcessed = { increment: increments.rowsProcessed };
  if (increments.rowsCreated != null) data.rowsCreated = { increment: increments.rowsCreated };
  if (increments.rowsUpdated != null) data.rowsUpdated = { increment: increments.rowsUpdated };
  if (increments.rowsError != null) data.rowsError = { increment: increments.rowsError };
  if (increments.scoredCount != null) data.scoredCount = { increment: increments.scoredCount };

  await prisma.importBatch.update({ where: { id: batchId }, data });
}
