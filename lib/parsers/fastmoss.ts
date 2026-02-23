import type { NormalizedProduct } from "@/lib/utils/normalize";
import { normalizeNumber, normalizeString } from "@/lib/utils/normalize";

interface FastMossRow {
  [key: string]: unknown;
}

/**
 * Fuzzy column lookup: tries exact match first, then substring match
 * on lowercased, underscore-normalized keys.
 */
function findColumn(row: FastMossRow, candidates: string[]): unknown {
  const keys = Object.keys(row);
  // Pass 1: exact lowercase match
  for (const candidate of candidates) {
    const lower = candidate.toLowerCase();
    for (const key of keys) {
      if (key.toLowerCase() === lower) return row[key];
    }
  }
  // Pass 2: substring match (normalized with underscores)
  for (const candidate of candidates) {
    const lower = candidate.toLowerCase().replace(/\s+/g, "_");
    for (const key of keys) {
      const normalized = key.toLowerCase().replace(/\s+/g, "_");
      if (normalized.includes(lower) || lower.includes(normalized)) {
        return row[key];
      }
    }
  }
  return null;
}

function parseListingDate(row: FastMossRow): Date {
  const raw = normalizeString(
    findColumn(row, [
      "Ngày dự kiến niêm yết", "ngày_niêm_yết",
      "listing_date", "date",
    ])
  );
  if (raw) {
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

export function parseFastMoss(rows: FastMossRow[]): NormalizedProduct[] {
  return rows
    .map((row): NormalizedProduct | null => {
      const name = normalizeString(
        findColumn(row, [
          "Tên sản phẩm", "product_name", "name", "tên_sp",
        ])
      );
      if (!name) return null;

      const price =
        normalizeNumber(
          findColumn(row, ["Giá bán", "price", "giá", "giá_bán"])
        ) ?? 0;

      const commissionRate =
        normalizeNumber(
          findColumn(row, [
            "Tỷ lệ hoa hồng", "commission_rate", "commission",
          ])
        ) ?? 0;

      const url =
        normalizeString(
          findColumn(row, [
            "Địa chỉ trang đích sản phẩm TikTok",
            "Địa chỉ trang chi tiết sản phẩm FastMoss",
            "url", "link", "product_url",
          ])
        ) || null;

      return {
        name,
        url,
        category:
          normalizeString(
            findColumn(row, [
              "Danh mục sản phẩm", "category", "danh_mục", "ngành_hàng",
            ])
          ) || "Khác",
        price,
        commissionRate,
        commissionVND: price * (commissionRate / 100),
        platform: detectPlatform(row),
        salesTotal: normalizeNumber(
          findColumn(row, [
            "Tổng lượng bán", "sales_total", "total_sales", "tổng_bán",
          ])
        ),
        salesGrowth7d: null, // FastMoss exports sales count, not growth rate
        salesGrowth30d: null,
        revenue7d: normalizeNumber(
          findColumn(row, [
            "Doanh thu (7 ngày)", "revenue_7d", "doanh_thu_7d",
          ])
        ),
        revenue30d: normalizeNumber(
          findColumn(row, [
            "Tổng doanh thu", "revenue_30d", "doanh_thu", "revenue",
          ])
        ),
        affiliateCount: normalizeNumber(
          findColumn(row, [
            "Tổng số người có ảnh hưởng bán hàng (KOL)",
            "affiliate_count", "affiliates", "số_affiliate", "KOL",
          ])
        ) as number | null,
        creatorCount: normalizeNumber(
          findColumn(row, [
            "Tổng số video bán hàng",
            "creator_count", "creators", "số_creator",
          ])
        ) as number | null,
        topVideoViews: normalizeNumber(
          findColumn(row, [
            "Tổng số livestream bán hàng",
            "top_video_views", "views", "lượt_xem",
          ])
        ) as number | null,
        shopName:
          normalizeString(
            findColumn(row, [
              "Tên cửa hàng", "shop_name", "shop", "tên_shop",
            ])
          ) || null,
        shopRating: normalizeNumber(
          findColumn(row, [
            "Tỷ lệ tạo đơn của người có ảnh hưởng (KOL)",
            "shop_rating", "rating", "đánh_giá",
          ])
        ),
        source: "fastmoss",
        dataDate: parseListingDate(row),
      };
    })
    .filter((p): p is NormalizedProduct => p !== null);
}

function detectPlatform(
  row: FastMossRow
): "shopee" | "tiktok_shop" | "both" {
  // Check if there's a TikTok product URL → it's TikTok Shop data
  const tiktokUrl = normalizeString(
    findColumn(row, [
      "Địa chỉ trang đích sản phẩm TikTok",
      "platform", "nền_tảng", "sàn",
    ])
  ).toLowerCase();
  if (tiktokUrl.includes("tiktok")) return "tiktok_shop";
  if (tiktokUrl.includes("shopee")) return "shopee";

  // FastMoss is primarily TikTok Shop data
  return "tiktok_shop";
}
