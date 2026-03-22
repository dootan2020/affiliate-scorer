// Internal score relay — scores products in a separate function invocation.
// Each invocation scores up to 150 products, then chains to the next if more remain.
// Also handles identity score sync + lifecycle recalc.
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scoreProducts } from "@/lib/ai/scoring";
import { syncIdentityScores } from "@/lib/services/score-identity";
import { pctChange, determineStage } from "@/lib/ai/lifecycle";
import { updateBatchProgress, incrementBatchProgress } from "@/lib/import/update-batch-progress";
import { fireRelay } from "@/lib/import/fire-relay";
import { getGlobalStats } from "@/lib/scoring/global-stats";
import { dispatchRescore, checkGlobalStatsDrift } from "@/lib/scoring/rescore-dispatcher";

const SCORE_CHUNK = 150;
const PARALLEL = 20;

export async function POST(request: Request): Promise<NextResponse> {
  let batchId: string | undefined;
  try {
    const body = (await request.json()) as { batchId: string };
    batchId = body.batchId;

    if (!batchId) {
      return NextResponse.json({ error: "batchId required" }, { status: 400 });
    }

    // Reset scoringStatus to "processing" (supports retry from failed/cron)
    await updateBatchProgress(batchId, { scoringStatus: "processing" });

    // Fix #9 + C1a: Save preImportStats only on FIRST chunk (don't overwrite on subsequent chains)
    const existingLog = (await prisma.importBatch.findUnique({
      where: { id: batchId }, select: { errorLog: true },
    }))?.errorLog as Record<string, unknown> | null;
    if (!existingLog?.preImportStats) {
      const preStats = await getGlobalStats();
      await prisma.importBatch.update({
        where: { id: batchId },
        data: { errorLog: { ...(existingLog ?? {}), preImportStats: JSON.parse(JSON.stringify(preStats)) } },
      });
    }

    // Fetch unscored products for this batch
    const unscored = await prisma.product.findMany({
      where: { importBatchId: batchId, aiScore: null },
      select: { id: true },
      take: SCORE_CHUNK,
    });

    if (unscored.length === 0) {
      // Set scoredCount = recordCount so progress naturally reaches 100%
      const batch = await prisma.importBatch.findUnique({
        where: { id: batchId },
        select: { recordCount: true },
      });
      await updateBatchProgress(batchId, {
        scoringStatus: "completed",
        completedAt: new Date(),
      });
      if (batch) {
        await prisma.importBatch.update({
          where: { id: batchId },
          data: { scoredCount: batch.recordCount },
        });
      }
      await runLifecycle(batchId);
      return NextResponse.json({ done: true, scored: 0 });
    }

    const productIds = unscored.map((p) => p.id);
    await scoreProducts({ productIds });

    // Increment scoring progress counter
    console.log(`[score-batch] scored ${productIds.length}, incrementing scoredCount`);
    await incrementBatchProgress(batchId, { scoredCount: productIds.length });

    // Sync identity scores for scored products.
    // Also repair any broken Product→Identity links (identityId=null) caused by
    // $transaction failures during import — look up identity via ProductUrl instead.
    const scoredProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, identityId: true, tiktokUrl: true },
    });

    // Collect already-linked identity IDs
    const identityIds = scoredProducts
      .map((p) => p.identityId)
      .filter((id): id is string => id != null);

    // For products with no identityId, attempt repair via tiktokUrl → ProductUrl → identity
    const unlinked = scoredProducts.filter((p) => !p.identityId && p.tiktokUrl);
    if (unlinked.length > 0) {
      const productUrls = await prisma.productUrl.findMany({
        where: { url: { in: unlinked.map((p) => p.tiktokUrl!) } },
        select: { productIdentityId: true, url: true },
      });
      const urlToIdentity = new Map(productUrls.map((u) => [u.url, u.productIdentityId]));

      // Re-link and collect repaired identity IDs
      const repairs: Array<{ productId: string; identityId: string }> = [];
      for (const p of unlinked) {
        const identityId = p.tiktokUrl ? urlToIdentity.get(p.tiktokUrl) : null;
        if (identityId) {
          repairs.push({ productId: p.id, identityId });
          if (!identityIds.includes(identityId)) identityIds.push(identityId);
        }
      }

      if (repairs.length > 0) {
        console.log(`[score-batch] repairing ${repairs.length} broken Product→Identity links`);
        await Promise.allSettled(
          repairs.map(({ productId, identityId }) =>
            prisma.product.update({
              where: { id: productId },
              data: { identityId },
            }),
          ),
        );
      }
    }

    if (identityIds.length > 0) {
      await syncIdentityScores(identityIds);
    }

    // Check if more remain
    const remaining = await prisma.product.count({
      where: { importBatchId: batchId, aiScore: null },
    });

    if (remaining > 0) {
      try {
        await fireRelay(
          "/api/internal/score-batch",
          { batchId },
          "score-chain",
        );
      } catch (relayErr) {
        console.error("[score-batch] relay failed, marking batch scoring as failed:", relayErr);
        const existingBatch = await prisma.importBatch.findUnique({
          where: { id: batchId },
          select: { errorLog: true },
        });
        const existingLog = (existingBatch?.errorLog as Record<string, unknown>) ?? {};
        await updateBatchProgress(batchId, {
          scoringStatus: "failed",
          errorLog: { ...existingLog, relayError: relayErr instanceof Error ? relayErr.message : String(relayErr) },
        });
      }
      return NextResponse.json({
        done: false,
        scored: productIds.length,
        remaining,
      });
    }

    // Set scoredCount = recordCount so progress naturally reaches 100%
    const batchFinal = await prisma.importBatch.findUnique({
      where: { id: batchId },
      select: { recordCount: true },
    });
    // Mark completed FIRST — lifecycle is non-critical and may timeout
    await updateBatchProgress(batchId, {
      scoringStatus: "completed",
      completedAt: new Date(),
    });
    if (batchFinal) {
      await prisma.importBatch.update({
        where: { id: batchId },
        data: { scoredCount: batchFinal.recordCount },
      });
    }
    await runLifecycle(batchId);

    // Fix #9: Check global stats drift for large batches → trigger re-normalize if needed
    const finalBatch = await prisma.importBatch.findUnique({
      where: { id: batchId },
      select: { recordCount: true, errorLog: true },
    });
    if (finalBatch && finalBatch.recordCount >= 50) {
      const savedPreStats = (finalBatch.errorLog as Record<string, unknown>)?.preImportStats;
      if (savedPreStats) {
        const postStats = await getGlobalStats();
        const drift = await checkGlobalStatsDrift(
          savedPreStats as { count: number; mean: number; stddev: number; globalMin: number; globalMax: number },
          postStats,
        );
        if (drift.drifted) {
          console.log(`[score-batch] Global mean shifted ${drift.shift.toFixed(1)}pt — triggering re-normalize`);
          await dispatchRescore({
            type: "normalize_only",
            scope: "all",
            reason: `batch-drift: shift=${drift.shift.toFixed(1)}pt`,
          });
        }
      }
    }

    return NextResponse.json({ done: true, scored: productIds.length });
  } catch (error) {
    console.error("Score batch relay error:", error);
    if (batchId) {
      try {
        // Merge errorLog to preserve import-phase errors
        const batch = await prisma.importBatch.findUnique({
          where: { id: batchId },
          select: { errorLog: true },
        });
        const existingLog = (batch?.errorLog as Record<string, unknown>) ?? {};
        await updateBatchProgress(batchId, {
          scoringStatus: "failed",
          completedAt: new Date(),
          errorLog: { ...existingLog, scoringError: error instanceof Error ? error.message : String(error) },
        });
      } catch (updateErr) {
        console.error("Failed to update batch after scoring error:", updateErr);
      }
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    );
  }
}

async function runLifecycle(batchId: string): Promise<void> {
  try {
    const products = await prisma.product.findMany({
      where: { importBatchId: batchId, identityId: { not: null } },
      select: { id: true, identityId: true, salesTotal: true },
    });

    if (products.length === 0) return;

    // Batch-query: 1 query for ALL snapshots instead of N+1
    const productIds = products.map((p) => p.id);
    const allSnapshots = await prisma.productSnapshot.findMany({
      where: { productId: { in: productIds } },
      orderBy: { snapshotDate: "desc" },
      select: { productId: true, sales7d: true, salesTotal: true, totalKOL: true },
    });

    // Group by productId, keep top 2 per product
    const snapsByProduct = new Map<string, typeof allSnapshots>();
    for (const snap of allSnapshots) {
      const list = snapsByProduct.get(snap.productId) ?? [];
      if (list.length < 2) {
        list.push(snap);
        snapsByProduct.set(snap.productId, list);
      }
    }

    // Compute lifecycle stage per product
    const updates: Array<{ identityId: string; stage: string }> = [];
    for (const p of products) {
      const snaps = snapsByProduct.get(p.id);
      if (!snaps || snaps.length < 2) {
        updates.push({ identityId: p.identityId!, stage: "unknown" });
        continue;
      }
      const [latest, previous] = snaps;
      const salesChange = pctChange(latest.sales7d, previous.sales7d);
      const kolChange = pctChange(latest.totalKOL, previous.totalKOL);
      const stage = determineStage(latest.salesTotal, salesChange, kolChange);
      updates.push({ identityId: p.identityId!, stage });
    }

    // Batch write in parallel chunks
    for (let i = 0; i < updates.length; i += PARALLEL) {
      const chunk = updates.slice(i, i + PARALLEL);
      await Promise.allSettled(
        chunk.map(({ identityId, stage }) =>
          prisma.productIdentity.update({
            where: { id: identityId },
            data: { lifecycleStage: stage },
          }),
        ),
      );
    }
  } catch (err) {
    console.error("Lifecycle recalc failed (non-critical):", err);
  }
}
