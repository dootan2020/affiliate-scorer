import { NextResponse } from "next/server";
import { parseFile } from "@/lib/parsers/parse-file";
import { detectFormatExtended } from "@/lib/parsers/detect-format";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Vui lòng chọn file để upload" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File quá lớn. Tối đa 10MB." },
        { status: 413 }
      );
    }

    const { headers, rows } = await parseFile(file);
    const detection = detectFormatExtended(headers);

    return NextResponse.json({
      data: {
        type: detection.type,
        confidence: detection.confidence,
        reason: detection.reason,
        rowsTotal: rows.length,
        headers,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("[import/detect] Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
