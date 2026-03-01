// Internal score relay for large batches (>500 products).
// Each invocation scores up to 500 products, then chains to the next if more remain.
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scoreProducts } from "@/lib/ai/scoring";
import { syncIdentityScores } from "@/lib/services/score-identity";
import { updateBatchProgress } from "@/lib/import/update-batch-progress";

const SCORE_CHUNK = 500;

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { batchId, offset = 0 } = (await request.json()) as {
      batchId: string;
      offset?: number;
    };

    if (!batchId) {
      return NextResponse.json({ error: "batchId required" }, { status: 400 });
    }

    // Fetch unscored products for this batch
    const unscored = await prisma.product.findMany({
      where: { importBatchId: batchId, aiScore: null },
      select: { id: true },
      take: SCORE_CHUNK,
      skip: 0,
    });

    if (unscored.length === 0) {
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
      // Chain to next invocation
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
      if (baseUrl) {
        const url = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
        fetch(`${url}/api/internal/score-batch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batchId, offset: offset + SCORE_CHUNK }),
        }).catch((err) => console.error("Score relay chain failed:", err));
      }

      return NextResponse.json({
        done: false,
        scored: productIds.length,
        remaining,
      });
    }

    await updateBatchProgress(batchId, {
      scoringStatus: "completed",
      completedAt: new Date(),
    });

    return NextResponse.json({ done: true, scored: productIds.length });
  } catch (error) {
    console.error("Score batch relay error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    );
  }
}
