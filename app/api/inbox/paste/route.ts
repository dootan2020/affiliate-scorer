// Phase 2: POST /api/inbox/paste — nhận text chứa links, parse + dedupe + tạo identities
import { NextResponse } from "next/server";
import { parseLinks } from "@/lib/parsers/link-parser";
import { processInboxItem } from "@/lib/inbox/process-inbox-item";
import type { ProcessResult } from "@/lib/inbox/process-inbox-item";
import { validateBody } from "@/lib/validations/validate-body";
import { inboxPasteSchema } from "@/lib/validations/schemas-content";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const validation = await validateBody(request, inboxPasteSchema);
    if (validation.error) return validation.error;
    const text = validation.data.text.trim();

    if (!text) {
      return NextResponse.json(
        { error: "Vui lòng dán ít nhất 1 link" },
        { status: 400 },
      );
    }

    const parsed = parseLinks(text);

    if (parsed.length === 0) {
      return NextResponse.json(
        { error: "Không tìm thấy link hợp lệ. Kiểm tra lại định dạng (bắt đầu bằng http)." },
        { status: 400 },
      );
    }

    // Xử lý từng link
    const results: ProcessResult[] = [];
    for (const link of parsed) {
      const result = await processInboxItem(link);
      results.push(result);
    }

    // Tổng kết
    const newProducts = results.filter((r) => r.status === "new_product").length;
    const duplicates = results.filter((r) => r.status === "duplicate").length;
    const videos = results.filter((r) => r.status === "video").length;
    const shops = results.filter((r) => r.status === "shop").length;
    const failed = results.filter((r) => r.status === "failed").length;

    // Build message
    const parts: string[] = [];
    if (newProducts > 0) parts.push(`${newProducts} sản phẩm mới`);
    if (duplicates > 0) parts.push(`${duplicates} đã có`);
    if (videos > 0) parts.push(`${videos} video`);
    if (shops > 0) parts.push(`${shops} shop`);
    if (failed > 0) parts.push(`${failed} không nhận diện được`);

    return NextResponse.json({
      data: {
        total: parsed.length,
        newProducts,
        duplicates,
        videos,
        shops,
        failed,
        results,
      },
      message: `${parsed.length} links → ${parts.join(", ")}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
