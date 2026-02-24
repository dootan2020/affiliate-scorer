import type { NormalizedProduct } from "@/lib/utils/normalize";
import { normalizeNumber, normalizeString } from "@/lib/utils/normalize";

interface KaloDataRow {
  [key: string]: unknown;
}

function findColumn(row: KaloDataRow, candidates: string[]): unknown {
  for (const candidate of candidates) {
    const lower = candidate.toLowerCase();
    for (const key of Object.keys(row)) {
      if (
        key.toLowerCase().replace(/\s+/g, "_").includes(lower) ||
        lower.includes(key.toLowerCase().replace(/\s+/g, "_"))
      ) {
        return row[key];
      }
    }
  }
  return null;
}

export function parseKaloData(rows: KaloDataRow[]): NormalizedProduct[] {
  return rows
    .map((row): NormalizedProduct | null => {
      const name = normalizeString(
        findColumn(row, ["product_name", "name", "tên_sản_phẩm"])
      );
      if (!name) return null;

      const price =
        normalizeNumber(
          findColumn(row, ["price", "giá", "giá_bán"])
        ) ?? 0;
      const commissionRate =
        normalizeNumber(
          findColumn(row, [
            "commission_rate",
            "commission",
            "tỷ_lệ_hoa_hồng",
          ])
        ) ?? 0;

      return {
        name,
        url:
          normalizeString(
            findColumn(row, ["url", "link", "product_url"])
          ) || null,
        category:
          normalizeString(
            findColumn(row, ["category", "danh_mục", "ngành_hàng"])
          ) || "Khác",
        price,
        commissionRate,
        commissionVND: price * (commissionRate / 100),
        platform: detectPlatform(row),

        salesTotal: normalizeNumber(
          findColumn(row, ["units_sold", "số_lượng_bán", "sold"])
        ),
        sales7d: null,
        salesGrowth7d: normalizeNumber(
          findColumn(row, ["growth_rate", "growth_7d", "tăng_trưởng"])
        ),
        salesGrowth30d: normalizeNumber(
          findColumn(row, ["growth_30d", "tăng_trưởng_30d"])
        ),
        revenue7d: normalizeNumber(
          findColumn(row, ["revenue_7d", "doanh_thu_7d"])
        ),
        revenue30d: normalizeNumber(
          findColumn(row, ["revenue", "revenue_30d", "doanh_thu"])
        ),
        revenueTotal: null,

        totalKOL: null,
        kolOrderRate: null,
        totalVideos: null,
        totalLivestreams: null,
        affiliateCount: normalizeNumber(
          findColumn(row, [
            "affiliate_count",
            "affiliates",
            "số_affiliate",
          ])
        ) as number | null,
        creatorCount: normalizeNumber(
          findColumn(row, [
            "related_videos",
            "creators",
            "số_creator",
            "creator_count",
          ])
        ) as number | null,
        topVideoViews: normalizeNumber(
          findColumn(row, [
            "top_video_views",
            "video_views",
            "lượt_xem",
          ])
        ) as number | null,

        imageUrl: null,
        tiktokUrl: null,
        fastmossUrl: null,
        shopFastmossUrl: null,

        shopName:
          normalizeString(
            findColumn(row, ["shop_name", "shop", "tên_shop"])
          ) || null,
        shopRating: normalizeNumber(
          findColumn(row, ["shop_rating", "rating", "đánh_giá"])
        ),
        productStatus: null,
        listingDate: null,

        source: "kalodata",
        dataDate: new Date(),
      };
    })
    .filter((p): p is NormalizedProduct => p !== null);
}

function detectPlatform(
  row: KaloDataRow
): "shopee" | "tiktok_shop" | "both" {
  const platform = normalizeString(
    findColumn(row, ["platform", "nền_tảng", "sàn"])
  ).toLowerCase();
  if (platform.includes("shopee") && platform.includes("tiktok"))
    return "both";
  if (platform.includes("shopee")) return "shopee";
  return "tiktok_shop";
}
