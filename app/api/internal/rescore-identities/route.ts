export const maxDuration = 60;

import { NextResponse } from "next/server";
import { syncAllIdentityScores } from "@/lib/services/score-identity";

/**
 * POST /api/internal/rescore-identities
 * Re-scores all ProductIdentity records with the updated 70/30 + normalize formula.
 * Logs before/after distribution for verification.
 */
export async function POST(): Promise<NextResponse> {
  try {
    const count = await syncAllIdentityScores();
    return NextResponse.json({
      success: true,
      rescored: count,
      message: `Re-scored ${count} identities with 70/30 blend + normalization`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
