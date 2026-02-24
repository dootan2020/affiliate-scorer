import { NextResponse } from "next/server";
import { processImport, RedirectError, DetectionError } from "./process-import";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const fileType = (formData.get("fileType") as string | null) || null;

    if (!file) {
      return NextResponse.json(
        { error: "Vui long chon file de upload" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File qua lon. Toi da 10MB." },
        { status: 413 }
      );
    }

    const { summary, message } = await processImport(file, fileType);

    return NextResponse.json({ data: summary, message });
  } catch (error) {
    if (error instanceof RedirectError) {
      return NextResponse.json(
        { error: error.message, redirect: "/api/upload/products" },
        { status: 400 }
      );
    }

    if (error instanceof DetectionError) {
      return NextResponse.json(
        { error: error.message, requiresFileType: true },
        { status: 422 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Loi khong xac dinh";
    console.error("[import] Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
