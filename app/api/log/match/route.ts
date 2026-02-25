// Phase 4: POST /api/log/match — Parse TikTok links, return matched assets
import { NextResponse } from "next/server";
import { matchTikTokLink } from "@/lib/learning/match-tiktok-link";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { links?: string[] };

    if (!body.links || body.links.length === 0) {
      return NextResponse.json({ error: "Thiếu danh sách links" }, { status: 400 });
    }

    const results = [];
    for (const link of body.links) {
      const trimmed = link.trim();
      if (!trimmed) continue;
      const match = await matchTikTokLink(trimmed);
      results.push({ url: trimmed, ...match });
    }

    const matched = results.filter((r) => r.assetId !== null).length;
    const unmatched = results.filter((r) => r.assetId === null).length;

    return NextResponse.json({
      data: results,
      message: `${matched} matched, ${unmatched} không tìm thấy asset`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
