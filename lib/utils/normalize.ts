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
  const str = String(value).replace(/[,%\s]/g, "");
  const num = Number(str);
  return isNaN(num) ? null : num;
}

export function normalizeString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}
