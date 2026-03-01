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
