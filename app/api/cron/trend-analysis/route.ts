// Nightly cron (22:30 UTC): analyze competitor captures for trending patterns
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { analyzeTrends } from "@/lib/agents/trend-intelligence";
import { verifyCronAuth } from "@/lib/utils/verify-cron-auth";

export async function GET(request: Request): Promise<NextResponse> {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await analyzeTrends();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[cron/trend-analysis]", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
