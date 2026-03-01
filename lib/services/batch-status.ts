// Auto-detect ProductionBatch completion based on asset statuses.
// Called after each asset status change to check if batch should transition.

import { prisma } from "@/lib/db";

const TERMINAL_ASSET_STATUSES = ["published", "logged", "archived", "failed"];

/**
 * Check if all assets in a batch have reached terminal state.
 * Auto-transitions batch to "done" or "failed" accordingly.
 * Returns the new batch status (or current if unchanged).
 */
export async function checkBatchCompletion(batchId: string): Promise<string> {
  const batch = await prisma.productionBatch.findUnique({
    where: { id: batchId },
    include: { assets: { select: { status: true } } },
  });

  if (!batch || batch.status !== "active") return batch?.status ?? "unknown";
  if (batch.assets.length === 0) return "active";

  const statuses = batch.assets.map((a) => a.status);
  const allTerminal = statuses.every((s) => TERMINAL_ASSET_STATUSES.includes(s));
  if (!allTerminal) return "active";

  const allFailedOrArchived = statuses.every((s) => s === "failed" || s === "archived");
  const newStatus = allFailedOrArchived ? "failed" : "done";

  await prisma.productionBatch.update({
    where: { id: batchId },
    data: { status: newStatus },
  });

  return newStatus;
}
