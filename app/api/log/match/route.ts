// Phase 4: POST /api/log/match — Parse TikTok links, return matched assets
import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { matchTikTokLink } from "@/lib/learning/match-tiktok-link";
import { validateBody } from "@/lib/validations/validate-body";

const matchLinksSchema = z.object({
  links: z.array(z.string().min(1)).min(1, "Thiếu danh sách links").max(100),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const validation = await validateBody(request, matchLinksSchema);
    if (validation.error) return validation.error;
    const { links } = validation.data;

    const results = [];
    for (const link of links) {
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
