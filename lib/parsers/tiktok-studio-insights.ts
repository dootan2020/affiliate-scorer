// Generic TikTok Studio insight parser for:
// Viewers, FollowerHistory, FollowerGender, FollowerTopTerritories
// Stores raw data as JSON in AccountInsight table

import * as XLSX from "xlsx";
import { prisma } from "@/lib/db";
import type { TikTokStudioFileType } from "./detect-tiktok-studio";

const FILE_TYPE_TO_INSIGHT: Partial<Record<TikTokStudioFileType, string>> = {
  viewers: "viewers",
  follower_history: "follower_history",
  follower_gender: "follower_gender",
  follower_territories: "follower_territories",
};

export async function parseTikTokStudioInsights(
  buffer: ArrayBuffer,
  fileType: TikTokStudioFileType,
  importBatchId?: string,
): Promise<{ count: number; errors: string[] }> {
  const insightType = FILE_TYPE_TO_INSIGHT[fileType];
  if (!insightType) {
    return { count: 0, errors: [`Loại file không hỗ trợ: ${fileType}`] };
  }

  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

  if (raw.length === 0) return { count: 0, errors: ["File rỗng"] };

  // For follower_history and viewers: create one record per row
  // For gender and territories: store as single aggregated record
  const isSingleRecord = ["follower_gender", "follower_territories"].includes(insightType);

  if (isSingleRecord) {
    await prisma.accountInsight.create({
      data: {
        type: insightType,
        date: null,
        data: raw as object,
        importBatchId: importBatchId ?? null,
      },
    });
    return { count: 1, errors: [] };
  }

  // Time-series: store each row individually
  let created = 0;
  const errors: string[] = [];

  for (let i = 0; i < raw.length; i++) {
    const row = raw[i];
    if (!row || Object.values(row).every((v) => v === "" || v === null)) continue;

    try {
      await prisma.accountInsight.create({
        data: {
          type: insightType,
          date: null,
          data: row as object,
          importBatchId: importBatchId ?? null,
        },
      });
      created++;
    } catch (err) {
      errors.push(`Dòng ${i + 2}: ${err instanceof Error ? err.message : "lỗi"}`);
    }
  }

  return { count: created, errors };
}
