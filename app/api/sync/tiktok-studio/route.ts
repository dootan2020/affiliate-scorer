import { NextResponse } from "next/server";
import { detectTikTokStudioFileType, FILE_TYPE_LABELS } from "@/lib/parsers/detect-tiktok-studio";
import { parseTikTokStudioOverview } from "@/lib/parsers/tiktok-studio-overview";
import { parseTikTokStudioFollowerActivity } from "@/lib/parsers/tiktok-studio-follower-activity";
import { parseTikTokStudioContent } from "@/lib/parsers/tiktok-studio-content";
import { parseTikTokStudioInsights } from "@/lib/parsers/tiktok-studio-insights";
import type { TikTokStudioFileType } from "@/lib/parsers/detect-tiktok-studio";

interface FileResult {
  fileName: string;
  type: TikTokStudioFileType;
  typeLabel: string;
  status: "success" | "partial" | "error" | "skipped";
  count: number;
  errors: string[];
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Vui lòng chọn ít nhất một file" },
        { status: 400 },
      );
    }

    const results: FileResult[] = [];
    const batchId = `tiktok_studio_${Date.now()}`;

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        results.push({
          fileName: file.name,
          type: "unknown",
          typeLabel: FILE_TYPE_LABELS.unknown,
          status: "error",
          count: 0,
          errors: ["File quá lớn (tối đa 10MB)"],
        });
        continue;
      }

      const fileType = detectTikTokStudioFileType(file.name);
      const typeLabel = FILE_TYPE_LABELS[fileType];

      if (fileType === "unknown") {
        results.push({
          fileName: file.name,
          type: fileType,
          typeLabel,
          status: "skipped",
          count: 0,
          errors: ["Không nhận diện được loại file TikTok Studio"],
        });
        continue;
      }

      try {
        const buffer = await file.arrayBuffer();
        let parseResult: { count: number; errors: string[] };

        if (fileType === "overview") {
          parseResult = await parseTikTokStudioOverview(buffer, batchId);
        } else if (fileType === "follower_activity") {
          parseResult = await parseTikTokStudioFollowerActivity(buffer, batchId);
        } else if (fileType === "content") {
          parseResult = await parseTikTokStudioContent(buffer, batchId);
        } else {
          parseResult = await parseTikTokStudioInsights(buffer, fileType, batchId);
        }

        const status =
          parseResult.errors.length === 0
            ? "success"
            : parseResult.count > 0
              ? "partial"
              : "error";

        results.push({
          fileName: file.name,
          type: fileType,
          typeLabel,
          status,
          count: parseResult.count,
          errors: parseResult.errors,
        });
      } catch (err) {
        results.push({
          fileName: file.name,
          type: fileType,
          typeLabel,
          status: "error",
          count: 0,
          errors: [err instanceof Error ? err.message : "Lỗi không xác định"],
        });
      }
    }

    const totalImported = results.reduce((sum, r) => sum + r.count, 0);
    const hasErrors = results.some((r) => r.status === "error");
    const allOk = results.every((r) => r.status === "success");

    return NextResponse.json({
      data: { results, batchId, totalImported },
      message: allOk
        ? `Import thành công ${totalImported} bản ghi`
        : hasErrors
          ? `Import hoàn thành với một số lỗi (${totalImported} bản ghi)`
          : `Import hoàn thành ${totalImported} bản ghi`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
