export const maxDuration = 60;

import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/db";
import { detectTikTokStudioFileType, FILE_TYPE_LABELS } from "@/lib/parsers/detect-tiktok-studio";
import { processTikTokStudioBatch } from "@/lib/import/process-tiktok-studio-batch";
import type { TikTokStudioFileType } from "@/lib/parsers/detect-tiktok-studio";

interface PreparedFile {
  fileName: string;
  type: TikTokStudioFileType;
  typeLabel: string;
  buffer: ArrayBuffer;
}

interface SkippedFile {
  fileName: string;
  type: TikTokStudioFileType;
  typeLabel: string;
  reason: string;
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

    // Phase 1: Read all file buffers (fast, stays in request)
    const prepared: PreparedFile[] = [];
    const skipped: SkippedFile[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        skipped.push({
          fileName: file.name,
          type: "unknown",
          typeLabel: FILE_TYPE_LABELS.unknown,
          reason: "File quá lớn (tối đa 10MB)",
        });
        continue;
      }

      const fileType = detectTikTokStudioFileType(file.name);
      if (fileType === "unknown") {
        skipped.push({
          fileName: file.name,
          type: fileType,
          typeLabel: FILE_TYPE_LABELS[fileType],
          reason: "Không nhận diện được loại file TikTok Studio",
        });
        continue;
      }

      prepared.push({
        fileName: file.name,
        type: fileType,
        typeLabel: FILE_TYPE_LABELS[fileType],
        buffer: await file.arrayBuffer(),
      });
    }

    if (prepared.length === 0) {
      return NextResponse.json({
        data: { results: skipped.map((s) => ({ ...s, status: "skipped", count: 0, errors: [s.reason] })) },
        message: "Không có file hợp lệ để import",
      });
    }

    // Phase 2: Create ImportBatch for tracking
    const batch = await prisma.importBatch.create({
      data: {
        source: "tiktok_studio",
        fileName: prepared.map((f) => f.fileName).join(", "),
        recordCount: prepared.length,
        status: "pending",
      },
    });

    // Phase 3: Kick off background processing
    after(() => processTikTokStudioBatch(batch.id, prepared));

    // Return immediately
    return NextResponse.json({
      data: {
        batchId: batch.id,
        fileCount: prepared.length,
        skipped: skipped.map((s) => ({ ...s, status: "skipped", count: 0, errors: [s.reason] })),
      },
      message: `Đang import ${prepared.length} file TikTok Studio...`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
