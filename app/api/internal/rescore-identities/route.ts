export const maxDuration = 60;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncAllIdentityScores } from "@/lib/services/score-identity";
import { resetGlobalStats } from "@/lib/scoring/global-stats";

/**
 * POST /api/internal/rescore-identities
 * Phase 08: Re-scores ALL ProductIdentity records with updated 3-layer formula.
 * Resets global stats first (full migration), then re-scores with sigmoid normalization.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      resetStats?: boolean;
    };

    // Capture before stats
    const before = await prisma.$queryRaw<
      Array<{ total: number; min: number; max: number; avg: number; stddev: number }>
    >`
      SELECT
        COUNT(*)::int as total,
        COALESCE(MIN("combinedScore"::float), 0)::int as min,
        COALESCE(MAX("combinedScore"::float), 0)::int as max,
        COALESCE(ROUND(AVG("combinedScore"::float)::numeric, 1), 0) as avg,
        COALESCE(ROUND(STDDEV("combinedScore"::float)::numeric, 1), 0) as stddev
      FROM "ProductIdentity"
      WHERE "combinedScore" IS NOT NULL
    `;
    console.log("[rescore] BEFORE:", before[0]);

    // ALWAYS reset global stats for full re-score to avoid double-counting
    await resetGlobalStats();
    console.log("[rescore] Global stats reset");

    const count = await syncAllIdentityScores((done, total) => {
      if (done % 100 === 0 || done === total) {
        console.log(`[rescore] Progress: ${done}/${total}`);
      }
    });

    // Capture after stats
    const after = await prisma.$queryRaw<
      Array<{ total: number; min: number; max: number; avg: number; stddev: number; median: number }>
    >`
      SELECT
        COUNT(*)::int as total,
        COALESCE(MIN("combinedScore"::float), 0)::int as min,
        COALESCE(MAX("combinedScore"::float), 0)::int as max,
        COALESCE(ROUND(AVG("combinedScore"::float)::numeric, 1), 0) as avg,
        COALESCE(ROUND(STDDEV("combinedScore"::float)::numeric, 1), 0) as stddev,
        COALESCE(ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "combinedScore"::float)::numeric, 1), 0) as median
      FROM "ProductIdentity"
      WHERE "combinedScore" IS NOT NULL
    `;
    console.log("[rescore] AFTER:", after[0]);

    // Distribution check
    const distribution = await prisma.$queryRaw<
      Array<{ tier: string; count: number }>
    >`
      SELECT
        CASE
          WHEN "combinedScore"::float < 30 THEN '0-29'
          WHEN "combinedScore"::float < 50 THEN '30-49'
          WHEN "combinedScore"::float < 70 THEN '50-69'
          WHEN "combinedScore"::float < 85 THEN '70-84'
          ELSE '85+'
        END as tier,
        COUNT(*)::int as count
      FROM "ProductIdentity"
      WHERE "combinedScore" IS NOT NULL
      GROUP BY tier
      ORDER BY tier
    `;

    return NextResponse.json({
      success: true,
      rescored: count,
      before: before[0],
      after: after[0],
      distribution,
      message: `Re-scored ${count} identities with 3-layer formula + sigmoid normalization`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[rescore] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
