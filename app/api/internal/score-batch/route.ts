// Internal score relay — scores products in a separate function invocation.
// Each invocation scores up to 150 products, then chains to the next if more remain.
// Also handles identity score sync + lifecycle recalc.
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scoreProducts } from "@/lib/ai/scoring";
import { syncIdentityScores } from "@/lib/services/score-identity";
import { getProductLifecycle } from "@/lib/ai/lifecycle";
import { updateBatchProgress } from "@/lib/import/update-batch-progress";

const SCORE_CHUNK = 150;
const PARALLEL = 20;

export async function POST(request: Request): Promise<NextResponse> {
  let batchId: string | undefined;
  try {
    const body = (await request.json()) as { batchId: string; offset?: number };
    batchId = body.batchId;

    if (!batchId) {
      return NextResponse.json({ error: "batchId required" }, { status: 400 });
    }

    // Fetch unscored products for this batch
    const unscored = await prisma.product.findMany({
      where: { importBatchId: batchId, aiScore: null },
      select: { id: true },
      take: SCORE_CHUNK,
    });

    if (unscored.length === 0) {
      await runLifecycle(batchId);
      await updateBatchProgress(batchId, {
        scoringStatus: "completed",
        completedAt: new Date(),
      });
      return NextResponse.json({ done: true, scored: 0 });
    }

    const productIds = unscored.map((p) => p.id);
    await scoreProducts({ productIds });

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
      chainToNext(batchId, (body.offset ?? 0) + SCORE_CHUNK);
      return NextResponse.json({
        done: false,
        scored: productIds.length,
        remaining,
      });
    }

    // All scored — lifecycle + finalize
    await runLifecycle(batchId);
    await updateBatchProgress(batchId, {
      scoringStatus: "completed",
      completedAt: new Date(),
    });

    return NextResponse.json({ done: true, scored: productIds.length });
  } catch (error) {
    console.error("Score batch relay error:", error);
    if (batchId) {
      try {
        await updateBatchProgress(batchId, {
          scoringStatus: "failed",
          completedAt: new Date(),
          errorLog: { scoringError: error instanceof Error ? error.message : String(error) },
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

function chainToNext(batchId: string, offset: number): void {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  if (!baseUrl) return;
  const url = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
  fetch(`${url}/api/internal/score-batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ batchId, offset }),
  }).catch((err) => console.error("Score relay chain failed:", err));
}

async function runLifecycle(batchId: string): Promise<void> {
  try {
    const products = await prisma.product.findMany({
      where: { importBatchId: batchId, identityId: { not: null } },
      select: { id: true, identityId: true },
    });

    if (products.length === 0) return;

    for (let i = 0; i < products.length; i += PARALLEL) {
      const chunk = products.slice(i, i + PARALLEL);
      const results = await Promise.allSettled(
        chunk.map(async (p) => {
          const lifecycle = await getProductLifecycle(p.id);
          return { identityId: p.identityId!, stage: lifecycle.stage as string };
        }),
      );

      const updates: Array<{ identityId: string; stage: string }> = [];
      for (const r of results) {
        if (r.status === "fulfilled") updates.push(r.value);
      }

      if (updates.length > 0) {
        await Promise.allSettled(
          updates.map(({ identityId, stage }) =>
            prisma.productIdentity.update({
              where: { id: identityId },
              data: { lifecycleStage: stage },
            }),
          ),
        );
      }
    }
  } catch (err) {
    console.error("Lifecycle recalc failed (non-critical):", err);
  }
}
