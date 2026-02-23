import { normalizeNumber, normalizeString } from "@/lib/utils/normalize";

interface RawRow {
  [key: string]: unknown;
}

export interface FbAdsFeedbackEntry {
  campaignName: string;
  adPlatform: "facebook";
  adImpressions: number | null;
  adClicks: number | null;
  adCTR: number | null;
  adCPC: number | null;
  adConversions: number | null;
  adCostPerConv: number | null;
  adROAS: number | null;
  adSpend: number | null;
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

export function parseFbAds(rows: RawRow[]): FbAdsFeedbackEntry[] {
  return rows
    .map((row): FbAdsFeedbackEntry | null => {
      const campaignName = normalizeString(
        findColumn(row, ["campaign_name", "campaign name", "tên_chiến_dịch"])
      );
      if (!campaignName) return null;

      return {
        campaignName,
        adPlatform: "facebook",
        adImpressions: normalizeNumber(
          findColumn(row, ["impressions", "lượt_hiển_thị"])
        ),
        adClicks: normalizeNumber(
          findColumn(row, ["clicks", "link_clicks", "lượt_nhấp"])
        ),
        adCTR: normalizeNumber(
          findColumn(row, ["ctr", "click_through_rate"])
        ),
        adCPC: normalizeNumber(
          findColumn(row, ["cpc", "cost_per_click"])
        ),
        adConversions: normalizeNumber(
          findColumn(row, ["conversions", "results", "kết_quả"])
        ),
        adCostPerConv: normalizeNumber(
          findColumn(row, ["cost_per_conversion", "cost_per_result", "chi_phí_mỗi_kq"])
        ),
        adROAS: normalizeNumber(
          findColumn(row, ["roas", "return_on_ad_spend"])
        ),
        adSpend: normalizeNumber(
          findColumn(row, ["spend", "amount_spent", "chi_tiêu"])
        ),
      };
    })
    .filter((entry): entry is FbAdsFeedbackEntry => entry !== null);
}
