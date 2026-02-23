import { normalizeNumber, normalizeString } from "@/lib/utils/normalize";

interface RawRow {
  [key: string]: unknown;
}

export interface TikTokAdsFeedbackEntry {
  campaignName: string;
  adPlatform: "tiktok";
  adImpressions: number | null;
  adClicks: number | null;
  adConversions: number | null;
  adSpend: number | null;
  orgViews: number | null;
  orgWatchTimeAvg: number | null;
}

function findColumn(row: RawRow, candidates: string[]): unknown {
  for (const candidate of candidates) {
    const lower = candidate.toLowerCase();
    for (const key of Object.keys(row)) {
      const keyNorm = key.toLowerCase().replace(/\s+/g, "_");
      if (keyNorm.includes(lower) || lower.includes(keyNorm)) {
        return row[key];
      }
    }
  }
  return null;
}

export function parseTikTokAds(rows: RawRow[]): TikTokAdsFeedbackEntry[] {
  return rows
    .map((row): TikTokAdsFeedbackEntry | null => {
      const campaignName = normalizeString(
        findColumn(row, ["campaign_name", "campaign name", "tên_chiến_dịch"])
      );
      if (!campaignName) return null;

      return {
        campaignName,
        adPlatform: "tiktok",
        adImpressions: normalizeNumber(
          findColumn(row, ["impressions", "lượt_hiển_thị"])
        ),
        adClicks: normalizeNumber(
          findColumn(row, ["clicks", "lượt_nhấp"])
        ),
        adConversions: normalizeNumber(
          findColumn(row, ["conversions", "kết_quả"])
        ),
        adSpend: normalizeNumber(
          findColumn(row, ["spend", "cost", "chi_tiêu"])
        ),
        orgViews: normalizeNumber(
          findColumn(row, ["video_views", "views", "lượt_xem"])
        ),
        orgWatchTimeAvg: normalizeNumber(
          findColumn(row, ["avg_watch_time", "average_watch_time", "thời_gian_xem_tb"])
        ),
      };
    })
    .filter((entry): entry is TikTokAdsFeedbackEntry => entry !== null);
}
