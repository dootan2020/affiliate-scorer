import type { NormalizedProduct } from "@/lib/utils/normalize";
import { normalizeNumber, normalizeString } from "@/lib/utils/normalize";

interface FastMossRow {
  [key: string]: unknown;
}

/**
 * Exact column names from real FastMoss Vietnamese export (20 columns).
 * Maps each column name → NormalizedProduct field.
 */
const COLUMN_MAP = {
  name: "Tên sản phẩm",
  productStatus: "Tình trạng sản phẩm",
  shopName: "Tên cửa hàng",
  country: "Quốc gia / Khu vực",
  category: "Danh mục sản phẩm",
  price: "Giá bán",
  commissionRate: "Tỷ lệ hoa hồng",
  sales7d: "Lượng bán (7 ngày)",
  revenue7d: "Doanh thu (7 ngày)",
  salesTotal: "Tổng lượng bán",
  revenueTotal: "Tổng doanh thu",
  totalKOL: "Tổng số người có ảnh hưởng bán hàng (KOL)",
  kolOrderRate:
    "Tỷ lệ tạo đơn của người có ảnh hưởng (KOL) / Tỷ lệ chốt đơn KOL",
  totalVideos: "Tổng số video bán hàng",
  totalLivestreams: "Tổng số livestream bán hàng",
  imageUrl: "Hình ảnh sản phẩm",
  fastmossUrl: "Địa chỉ trang chi tiết sản phẩm FastMoss",
  tiktokUrl: "Địa chỉ trang đích sản phẩm TikTok",
  shopFastmossUrl: "Địa chỉ trang chi tiết cửa hàng FastMoss",
  listingDate: "Ngày dự kiến niêm yết",
} as const;

/**
 * Get column value from row using exact match first, then fuzzy match.
 */
function getCol(row: FastMossRow, columnName: string): unknown {
  // Exact key match
  if (columnName in row) return row[columnName];

  // Case-insensitive match
  const lower = columnName.toLowerCase();
  for (const key of Object.keys(row)) {
    if (key.toLowerCase() === lower) return row[key];
  }

  // Substring match as fallback
  for (const key of Object.keys(row)) {
    const kl = key.toLowerCase();
    if (kl.includes(lower) || lower.includes(kl)) return row[key];
  }

  return null;
}

function parseDate(raw: unknown): Date | null {
  const str = normalizeString(raw);
  if (!str) return null;
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function strOrNull(value: unknown): string | null {
  const s = normalizeString(value);
  return s || null;
}

export function parseFastMoss(rows: FastMossRow[]): NormalizedProduct[] {
  return rows
    .map((row): NormalizedProduct | null => {
      const name = normalizeString(getCol(row, COLUMN_MAP.name));
      if (!name) return null;

      const price =
        normalizeNumber(getCol(row, COLUMN_MAP.price)) ?? 0;
      const commissionRate =
        normalizeNumber(getCol(row, COLUMN_MAP.commissionRate)) ?? 0;

      const tiktokUrl = strOrNull(getCol(row, COLUMN_MAP.tiktokUrl));

      return {
        name,
        url: tiktokUrl,
        category:
          normalizeString(getCol(row, COLUMN_MAP.category)) || "Khác",
        price,
        commissionRate,
        commissionVND: price * (commissionRate / 100),
        platform: "tiktok_shop",

        // Sales
        salesTotal: normalizeNumber(
          getCol(row, COLUMN_MAP.salesTotal)
        ),
        sales7d: normalizeNumber(getCol(row, COLUMN_MAP.sales7d)),
        salesGrowth7d: null,
        salesGrowth30d: null,
        revenue7d: normalizeNumber(getCol(row, COLUMN_MAP.revenue7d)),
        revenue30d: null,
        revenueTotal: normalizeNumber(
          getCol(row, COLUMN_MAP.revenueTotal)
        ),

        // Competition
        totalKOL: normalizeNumber(
          getCol(row, COLUMN_MAP.totalKOL)
        ) as number | null,
        kolOrderRate: normalizeNumber(
          getCol(row, COLUMN_MAP.kolOrderRate)
        ),
        totalVideos: normalizeNumber(
          getCol(row, COLUMN_MAP.totalVideos)
        ) as number | null,
        totalLivestreams: normalizeNumber(
          getCol(row, COLUMN_MAP.totalLivestreams)
        ) as number | null,
        affiliateCount: normalizeNumber(
          getCol(row, COLUMN_MAP.totalKOL)
        ) as number | null,
        creatorCount: null,
        topVideoViews: null,

        // Media & Links
        imageUrl: strOrNull(getCol(row, COLUMN_MAP.imageUrl)),
        tiktokUrl,
        fastmossUrl: strOrNull(getCol(row, COLUMN_MAP.fastmossUrl)),
        shopFastmossUrl: strOrNull(
          getCol(row, COLUMN_MAP.shopFastmossUrl)
        ),

        // Shop
        shopName: strOrNull(getCol(row, COLUMN_MAP.shopName)),
        shopRating: null,
        productStatus: strOrNull(
          getCol(row, COLUMN_MAP.productStatus)
        ),

        // Listing
        listingDate: parseDate(getCol(row, COLUMN_MAP.listingDate)),

        // Source
        source: "fastmoss",
        dataDate: parseDate(getCol(row, COLUMN_MAP.listingDate)) ?? new Date(),
      };
    })
    .filter((p): p is NormalizedProduct => p !== null);
}
