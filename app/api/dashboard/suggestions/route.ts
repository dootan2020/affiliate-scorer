// GET /api/dashboard/suggestions — Smart content suggestions per channel
import { NextResponse } from "next/server";
import { computeSmartSuggestions } from "@/lib/suggestions/compute-smart-suggestions";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const channelIds = searchParams.get("channelIds")?.split(",").filter(Boolean) || undefined;
    const result = await computeSmartSuggestions(channelIds);
    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("[dashboard/suggestions]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
