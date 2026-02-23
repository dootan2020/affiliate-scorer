import { normalizeNumber, normalizeString } from "@/lib/utils/normalize";

interface RawRow {
  [key: string]: unknown;
}

export interface ShopeeAffiliateFeedbackEntry {
  productName: string;
  salesPlatform: "shopee";
  commissionEarned: number | null;
  conversionRate: number | null;
  orders: number | null;
  revenue: number | null;
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

export function parseShopeeAffiliate(rows: RawRow[]): ShopeeAffiliateFeedbackEntry[] {
  return rows
    .map((row): ShopeeAffiliateFeedbackEntry | null => {
      const productName = normalizeString(
        findColumn(row, ["product_name", "product name", "tên_sản_phẩm", "tên_sp"])
      );
      if (!productName) return null;

      return {
        productName,
        salesPlatform: "shopee",
        commissionEarned: normalizeNumber(
          findColumn(row, ["commission_earned", "commission earned", "hoa_hồng_nhận_được"])
        ),
        conversionRate: normalizeNumber(
          findColumn(row, ["conversion_rate", "conversion rate", "tỷ_lệ_chuyển_đổi"])
        ),
        orders: normalizeNumber(
          findColumn(row, ["orders", "order_count", "đơn_hàng"])
        ),
        revenue: normalizeNumber(
          findColumn(row, ["revenue", "doanh_thu"])
        ),
      };
    })
    .filter((entry): entry is ShopeeAffiliateFeedbackEntry => entry !== null);
}
