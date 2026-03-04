// Weekly cron (Sunday 0h): run learning cycle + regenerate patterns
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { runLearningCycle } from "@/lib/ai/learning";
import { regeneratePatterns } from "@/lib/learning/pattern-detection";
import { verifyCronAuth } from "@/lib/utils/verify-cron-auth";

export async function GET(request: Request): Promise<NextResponse> {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const learningResult = await runLearningCycle();
    console.log("[cron/weekly-learning] learning:", {
      accuracy: learningResult.accuracy,
      weightsAdjusted: learningResult.weightsAdjusted,
    });

    const patternResult = await regeneratePatterns();
    console.log("[cron/weekly-learning] patterns:", patternResult);

    return NextResponse.json({
      ok: true,
      learning: {
        accuracy: learningResult.accuracy,
        previousAccuracy: learningResult.previousAccuracy,
        weightsAdjusted: learningResult.weightsAdjusted,
        patterns: learningResult.patterns.length,
      },
      patternDetection: patternResult,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[cron/weekly-learning]", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
