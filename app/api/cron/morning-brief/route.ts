// Daily cron (23h UTC = 6h VN): auto-generate morning brief
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { generateMorningBrief } from "@/lib/brief/generate-morning-brief";
import { verifyCronAuth } from "@/lib/utils/verify-cron-auth";

export async function GET(request: Request): Promise<NextResponse> {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const briefId = await generateMorningBrief();
    console.log("[cron/morning-brief] generated:", briefId);
    return NextResponse.json({ ok: true, briefId });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[cron/morning-brief]", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
