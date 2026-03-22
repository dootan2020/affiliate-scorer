// Nightly cron (22:00 UTC): channel memory updates only
// Fix M6: Weight learning moved to weekly-learning cron to avoid duplicate execution
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { runNightlyLearning } from "@/lib/agents/nightly-learning";
import { verifyCronAuth } from "@/lib/utils/verify-cron-auth";

export async function GET(request: Request): Promise<NextResponse> {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    // Run nightly learning agent (per-channel patterns + channel memory)
    const nightlyResult = await runNightlyLearning();

    return NextResponse.json({
      ok: true,
      nightlyAgent: nightlyResult,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[cron/nightly-learning]", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
