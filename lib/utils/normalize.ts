export interface NormalizedProduct {
  name: string;
  url: string | null;
  category: string;
  price: number;
  commissionRate: number;
  commissionVND: number;
  platform: "shopee" | "tiktok_shop" | "both";
  salesTotal: number | null;
  salesGrowth7d: number | null;
  salesGrowth30d: number | null;
  revenue7d: number | null;
  revenue30d: number | null;
  affiliateCount: number | null;
  creatorCount: number | null;
  topVideoViews: number | null;
  shopName: string | null;
  shopRating: number | null;
  source: "fastmoss" | "kalodata";
  dataDate: Date;
}

export function normalizeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;

  let str = String(value).trim();
  if (str === "-" || str === "N/A" || str === "n/a") return null;

  const isVndPrice = str.includes("₫");
  const isPercent = str.includes("%");

  // Remove currency symbol
  str = str.replace(/₫/g, "");

  if (isVndPrice) {
    // Vietnamese price: dots are thousand separators, commas are decimal
    // "59.073" → 59073, "1.234.567" → 1234567
    str = str.replace(/\./g, "").replace(",", ".");
  } else if (isPercent) {
    // Percentage: "38,45%" → 38.45, "2%" → 2
    str = str.replace(/%/g, "").replace(",", ".");
  } else {
    // General: strip non-numeric except dots and minus
    str = str.replace(/[^\d.\-,]/g, "");
    // If has both dots and commas, determine which is decimal
    if (str.includes(",") && str.includes(".")) {
      // "1.234,56" → comma is decimal (European/VN)
      // "1,234.56" → dot is decimal (US)
      const lastDot = str.lastIndexOf(".");
      const lastComma = str.lastIndexOf(",");
      if (lastComma > lastDot) {
        str = str.replace(/\./g, "").replace(",", ".");
      } else {
        str = str.replace(/,/g, "");
      }
    } else if (str.includes(",")) {
      // Could be thousand sep or decimal — check pattern
      // "1,234" likely thousand sep, "3,5" likely decimal
      const parts = str.split(",");
      if (parts.length === 2 && parts[1].length === 3) {
        str = str.replace(",", ""); // thousand separator
      } else {
        str = str.replace(",", "."); // decimal separator
      }
    }
  }

  str = str.trim();
  const num = Number(str);
  return isNaN(num) ? null : num;
}

export function normalizeString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}
