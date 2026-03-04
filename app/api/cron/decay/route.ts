// Daily cron: apply weight decay to all learning weights
export const maxDuration = 30;

import { NextResponse } from "next/server";
import { applyDecay } from "@/lib/learning/decay";
import { verifyCronAuth } from "@/lib/utils/verify-cron-auth";

export async function GET(request: Request): Promise<NextResponse> {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await applyDecay();
    console.log("[cron/decay]", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[cron/decay]", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
