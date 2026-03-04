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

    // Fetch unscored products for this batch
    const unscored = await prisma.product.findMany({
      where: { importBatchId: batchId, aiScore: null },
      select: { id: true },
      take: SCORE_CHUNK,
    });

    if (unscored.length === 0) {
      // Mark completed FIRST — lifecycle is non-critical and may timeout
      await updateBatchProgress(batchId, {
        scoringStatus: "completed",
        completedAt: new Date(),
      });
      await runLifecycle(batchId);
      return NextResponse.json({ done: true, scored: 0 });
    }

    const productIds = unscored.map((p) => p.id);
    await scoreProducts({ productIds });

    // Increment scoring progress counter
    await incrementBatchProgress(batchId, { scoredCount: productIds.length });

    // Sync identity scores for scored products
    const linked = await prisma.product.findMany({
      where: { id: { in: productIds }, identityId: { not: null } },
      select: { identityId: true },
    });
    const identityIds = linked
      .map((p) => p.identityId)
      .filter((id): id is string => id != null);

    if (identityIds.length > 0) {
      await syncIdentityScores(identityIds);
    }

    // Check if more remain
    const remaining = await prisma.product.count({
      where: { importBatchId: batchId, aiScore: null },
    });

    if (remaining > 0) {
      fireRelay(
        "/api/internal/score-batch",
        { batchId },
        "score-chain",
      );
      return NextResponse.json({
        done: false,
        scored: productIds.length,
        remaining,
      });
    }

    // Mark completed FIRST — lifecycle is non-critical and may timeout
    await updateBatchProgress(batchId, {
      scoringStatus: "completed",
      completedAt: new Date(),
    });
    await runLifecycle(batchId);

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
