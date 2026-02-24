import { normalizeNumber, normalizeString } from "@/lib/utils/normalize";
import type {
  ImportParseResult,
  ImportedCampaign,
  ImportedDailyResult,
  ImportedFinancialRecord,
} from "./types";

interface RawRow {
  [key: string]: unknown;
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

function parseDate(value: unknown): string | null {
  if (!value) return null;
  const str = String(value).trim();
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  const slashMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (slashMatch) return `${slashMatch[3]}-${slashMatch[2]}-${slashMatch[1]}`;
  const usMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (usMatch) {
    const month = usMatch[1].padStart(2, "0");
    const day = usMatch[2].padStart(2, "0");
    return `${usMatch[3]}-${month}-${day}`;
  }
  return null;
}

export function parseShopeeAdsCampaigns(_headers: string[], rows: RawRow[]): ImportParseResult {
  const campaigns: ImportedCampaign[] = [];
  const financialRecords: ImportedFinancialRecord[] = [];
  const errors: Array<{ row: number; message: string }> = [];

  const campaignMap = new Map<string, { rows: RawRow[]; indices: number[] }>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = normalizeString(
      findColumn(row, [
        "tên_chiến_dịch", "campaign_name", "tên chiến dịch",
      ])
    );

    if (!name) {
      errors.push({ row: i + 1, message: "Thiếu tên chiến dịch" });
      continue;
    }

    const existing = campaignMap.get(name);
    if (existing) {
      existing.rows.push(row);
      existing.indices.push(i);
    } else {
      campaignMap.set(name, { rows: [row], indices: [i] });
    }
  }

  for (const [name, group] of campaignMap) {
    const dailyResults: ImportedDailyResult[] = [];

    for (let j = 0; j < group.rows.length; j++) {
      const row = group.rows[j];
      const rowIdx = group.indices[j];

      const dateStr = parseDate(
        findColumn(row, ["ngày", "date"])
      );
      const spend = normalizeNumber(
        findColumn(row, ["chi_phí", "cost", "chi phí"])
      ) ?? 0;
      const revenue = normalizeNumber(
        findColumn(row, ["doanh_thu", "revenue"])
      ) ?? 0;
      const orders = normalizeNumber(
        findColumn(row, ["đơn_hàng", "orders"])
      ) ?? 0;
      const clicks = normalizeNumber(
        findColumn(row, ["lượt_click", "clicks"])
      );
      const impressions = normalizeNumber(
        findColumn(row, ["lượt_hiển_thị", "impressions"])
      );

      if (!dateStr) {
        errors.push({ row: rowIdx + 1, message: `Không tìm thấy ngày cho "${name}"` });
        continue;
      }

      dailyResults.push({
        date: dateStr,
        spend,
        orders: Math.round(orders),
        revenue,
        clicks: clicks ?? undefined,
        impressions: impressions ?? undefined,
      });

      if (spend > 0) {
        financialRecords.push({
          type: "ads_spend",
          amount: spend,
          source: "shopee_ads",
          productId: null,
          campaignId: null,
          date: new Date(dateStr),
          notes: `Shopee Ads: ${name} - ${dateStr}`,
        });
      }
    }

    if (dailyResults.length === 0) continue;

    const sortedResults = dailyResults.sort((a, b) => a.date.localeCompare(b.date));

    campaigns.push({
      name,
      platform: "shopee",
      sourceType: "shopee_ads",
      productId: null,
      dailyResults: sortedResults,
      startDate: sortedResults[0].date,
      endDate: sortedResults[sortedResults.length - 1].date,
    });
  }

  return { campaigns, financialRecords, errors };
}
