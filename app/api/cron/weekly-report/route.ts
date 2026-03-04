// Weekly cron (Sunday 6h): generate weekly performance report
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { generateWeeklyReport } from "@/lib/reports/generate-weekly-report";
import { verifyCronAuth } from "@/lib/utils/verify-cron-auth";

export async function GET(request: Request): Promise<NextResponse> {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const reportId = await generateWeeklyReport();

    if (!reportId) {
      console.log("[cron/weekly-report] Skipped — not enough published videos");
      return NextResponse.json({ ok: true, skipped: true, reason: "not_enough_data" });
    }

    console.log("[cron/weekly-report] Generated:", reportId);
    return NextResponse.json({ ok: true, reportId });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[cron/weekly-report]", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
