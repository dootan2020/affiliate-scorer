// Background processor for TikTok Studio file imports.
// Runs inside next/server after() — independent of browser connection.
import { parseTikTokStudioOverview } from "@/lib/parsers/tiktok-studio-overview";
import { parseTikTokStudioFollowerActivity } from "@/lib/parsers/tiktok-studio-follower-activity";
import { parseTikTokStudioContent } from "@/lib/parsers/tiktok-studio-content";
import { parseTikTokStudioInsights } from "@/lib/parsers/tiktok-studio-insights";
import { updateBatchProgress } from "@/lib/import/update-batch-progress";
import type { InputJsonValue } from "@/app/generated/prisma/internal/prismaNamespace";
import type { TikTokStudioFileType } from "@/lib/parsers/detect-tiktok-studio";

interface PreparedFile {
  fileName: string;
  type: TikTokStudioFileType;
  typeLabel: string;
  buffer: ArrayBuffer;
}

export interface TikTokFileResult {
  fileName: string;
  type: TikTokStudioFileType;
  typeLabel: string;
  status: "done" | "error" | "skipped";
  count: number;
  errors: string[];
}

/** Process all TikTok Studio files in background, updating batch progress. */
export async function processTikTokStudioBatch(
  batchId: string,
  preparedFiles: PreparedFile[],
): Promise<void> {
  let totalImported = 0;
  let filesWithErrors = 0;
  const fileResults: TikTokFileResult[] = [];

  try {
    await updateBatchProgress(batchId, { status: "processing" });

    for (let i = 0; i < preparedFiles.length; i++) {
      const pf = preparedFiles[i];

      try {
        let parseResult: { count: number; errors: string[] };

        if (pf.type === "overview") {
          parseResult = await parseTikTokStudioOverview(pf.buffer, batchId);
        } else if (pf.type === "follower_activity") {
          parseResult = await parseTikTokStudioFollowerActivity(pf.buffer, batchId);
        } else if (pf.type === "content") {
          parseResult = await parseTikTokStudioContent(pf.buffer, batchId);
        } else {
          parseResult = await parseTikTokStudioInsights(pf.buffer, pf.type, batchId);
        }

        totalImported += parseResult.count;
        const hasErrors = parseResult.errors.length > 0;
        if (hasErrors && parseResult.count === 0) filesWithErrors++;

        fileResults.push({
          fileName: pf.fileName,
          type: pf.type,
          typeLabel: pf.typeLabel,
          status: hasErrors && parseResult.count === 0 ? "error" : "done",
          count: parseResult.count,
          errors: parseResult.errors,
        });
      } catch (err) {
        filesWithErrors++;
        fileResults.push({
          fileName: pf.fileName,
          type: pf.type,
          typeLabel: pf.typeLabel,
          status: "error",
          count: 0,
          errors: [err instanceof Error ? err.message : "Lỗi không xác định"],
        });
      }

      // Update progress — ATOMIC on last file: progress + status together
      // Prevents the race where progress=100% but status still "processing"
      const isLastFile = i === preparedFiles.length - 1;

      if (isLastFile) {
        const status = filesWithErrors > 0 && totalImported > 0 ? "partial"
          : filesWithErrors > 0 ? "failed"
          : "completed";

        await updateBatchProgress(batchId, {
          rowsProcessed: i + 1,
          rowsCreated: totalImported,
          rowsError: filesWithErrors,
          status,
          scoringStatus: "completed",
          errorLog: { fileResults } as unknown as InputJsonValue,
          completedAt: new Date(),
        });
      } else {
        await updateBatchProgress(batchId, {
          rowsProcessed: i + 1,
          rowsCreated: totalImported,
          rowsError: filesWithErrors,
        });
      }
    }
  } catch (err) {
    console.error("processTikTokStudioBatch fatal:", err);
    try {
      await updateBatchProgress(batchId, {
        status: "failed",
        scoringStatus: "failed",
        errorLog: { fatal: err instanceof Error ? err.message : "Unknown", fileResults } as unknown as InputJsonValue,
        completedAt: new Date(),
      });
    } catch (updateErr) {
      console.error("Failed to update batch status after fatal:", updateErr);
    }
  }
}
