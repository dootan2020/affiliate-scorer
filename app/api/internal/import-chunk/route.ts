// POST /api/internal/import-chunk — Process next import chunk via relay.
// Each invocation handles up to IMPORT_CHUNK products, then chains to the next.
// After the last chunk, fires scoring relay.
export const maxDuration = 60;

import { NextResponse } from "next/server";
import {
  processChunk,
  finalizeImportAndFireScoring,
  IMPORT_CHUNK,
} from "@/lib/import/process-product-batch";
import { updateBatchProgress } from "@/lib/import/update-batch-progress";
import { fireRelay } from "@/lib/import/fire-relay";
import type { NormalizedProduct } from "@/lib/utils/normalize";

export async function POST(request: Request): Promise<NextResponse> {
  let batchId: string | undefined;
  try {
    const body = (await request.json()) as {
      batchId: string;
      products: NormalizedProduct[];
    };
    batchId = body.batchId;

    if (!batchId || !Array.isArray(body.products)) {
      return NextResponse.json(
        { error: "batchId and products required" },
        { status: 400 },
      );
    }

    const chunk = body.products.slice(0, IMPORT_CHUNK);
    const remaining = body.products.slice(IMPORT_CHUNK);

    await processChunk(batchId, chunk);

    if (remaining.length > 0) {
      try {
        await fireRelay(
          "/api/internal/import-chunk",
          { batchId, products: remaining },
          "import-chunk",
        );
      } catch (relayErr) {
        console.error("[import-chunk] relay failed, marking batch as failed:", relayErr);
        await updateBatchProgress(batchId, {
          status: "failed",
          errorLog: { relayError: relayErr instanceof Error ? relayErr.message : String(relayErr) },
        });
      }
      return NextResponse.json({
        ok: true,
        processed: chunk.length,
        remaining: remaining.length,
      });
    }

    // Last chunk — finalize import + fire scoring
    await finalizeImportAndFireScoring(batchId);
    return NextResponse.json({
      ok: true,
      processed: chunk.length,
      remaining: 0,
      finalized: true,
    });
  } catch (error) {
    console.error("Import chunk relay error:", error);
    if (batchId) {
      try {
        await updateBatchProgress(batchId, {
          status: "failed",
          scoringStatus: "failed",
          errorLog: {
            importChunkError:
              error instanceof Error ? error.message : String(error),
          },
          completedAt: new Date(),
        });
      } catch (updateErr) {
        console.error("Failed to update batch after chunk error:", updateErr);
      }
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    );
  }
}
