// Phase 4: GET /api/learning/weights — xem learning weights
//          POST /api/learning/decay — trigger decay
import { NextRequest, NextResponse } from "next/server";
import { getWeights } from "@/lib/learning/update-weights";
import { applyDecay } from "@/lib/learning/decay";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const channelId = request.nextUrl.searchParams.get("channelId") || undefined;
    const weights = await getWeights(channelId);

    // Group by scope
    const grouped: Record<string, typeof weights> = {};
    for (const w of weights) {
      if (!grouped[w.scope]) grouped[w.scope] = [];
      grouped[w.scope].push(w);
    }

    return NextResponse.json({ data: { weights, grouped, channelId: channelId || "global" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(): Promise<NextResponse> {
  try {
    const result = await applyDecay();
    return NextResponse.json({
      data: result,
      message: `Decay applied: ${result.updated} updated, ${result.skipped} skipped`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
