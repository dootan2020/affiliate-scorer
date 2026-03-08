// Nightly cron (22:00 UTC): run nightly learning + pattern regeneration + channel memory updates
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { runNightlyLearning } from "@/lib/agents/nightly-learning";
import { runLearningCycle } from "@/lib/ai/learning";
import { verifyCronAuth } from "@/lib/utils/verify-cron-auth";

export async function GET(request: Request): Promise<NextResponse> {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    // Run learning cycle (accuracy evaluation + weight updates)
    const learningResult = await runLearningCycle();
    console.log("[cron/nightly-learning] learning:", {
      accuracy: learningResult.accuracy,
      weightsAdjusted: learningResult.weightsAdjusted,
    });

    // Run nightly learning agent (per-channel patterns + channel memory)
    const nightlyResult = await runNightlyLearning();

    return NextResponse.json({
      ok: true,
      learning: {
        accuracy: learningResult.accuracy,
        previousAccuracy: learningResult.previousAccuracy,
        weightsAdjusted: learningResult.weightsAdjusted,
        patterns: learningResult.patterns.length,
      },
      nightlyAgent: nightlyResult,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[cron/nightly-learning]", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
