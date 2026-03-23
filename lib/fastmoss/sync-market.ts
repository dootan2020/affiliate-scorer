// lib/fastmoss/sync-market.ts — store market overview data in sync log metadata

import { prisma } from "@/lib/db";

interface SyncMarketResult {
  recordCount: number;
  newCount: number;
  updatedCount: number;
  errorCount: number;
}

export async function syncMarket(
  data: unknown[],
  syncLogId: string
): Promise<SyncMarketResult> {
  // Store raw market data as metadata on the sync log itself
  await prisma.fastMossSyncLog.update({
    where: { id: syncLogId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { metadata: { items: data } as any },
  });

  return {
    recordCount: data.length,
    newCount: 0,
    updatedCount: data.length,
    errorCount: 0,
  };
}
