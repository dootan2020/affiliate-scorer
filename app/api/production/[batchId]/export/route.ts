// Phase 3: GET /api/production/[batchId]/export?type=scripts|prompts|checklist
import { NextResponse } from "next/server";
import { exportScriptsMd, exportPromptsJson, exportChecklistCsv } from "@/lib/content/export-packs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> },
): Promise<NextResponse> {
  try {
    const { batchId } = await params;
    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "scripts";

    switch (type) {
      case "scripts": {
        const content = await exportScriptsMd(batchId);
        return new NextResponse(content, {
          headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Content-Disposition": `attachment; filename="scripts-${batchId.slice(0, 8)}.md"`,
          },
        });
      }
      case "prompts": {
        const content = await exportPromptsJson(batchId);
        return new NextResponse(content, {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Content-Disposition": `attachment; filename="prompts-${batchId.slice(0, 8)}.json"`,
          },
        });
      }
      case "checklist": {
        const content = await exportChecklistCsv(batchId);
        return new NextResponse(content, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="checklist-${batchId.slice(0, 8)}.csv"`,
          },
        });
      }
      default:
        return NextResponse.json(
          { error: "Type không hợp lệ. Cho phép: scripts, prompts, checklist" },
          { status: 400 },
        );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
