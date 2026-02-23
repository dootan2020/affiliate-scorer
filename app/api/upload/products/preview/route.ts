import { NextResponse } from "next/server";
import { parseFile } from "@/lib/parsers/parse-file";
import { detectFormat } from "@/lib/parsers/detect-format";
import { aiDetectMapping, TARGET_FIELDS } from "@/lib/parsers/ai-detect";
import type { ColumnMapping } from "@/lib/parsers/ai-detect";

/** Build a default mapping for known formats based on header fuzzy match */
function buildFastMossMapping(headers: string[]): ColumnMapping {
  return {
    name: findBest(headers, ["Tên sản phẩm", "product_name", "name"]) ?? headers[0] ?? "",
    url: findBest(headers, [
      "Địa chỉ trang đích sản phẩm TikTok",
      "Địa chỉ trang chi tiết sản phẩm FastMoss",
      "url", "product_url",
    ]),
    category: findBest(headers, ["Danh mục sản phẩm", "category"]),
    price: findBest(headers, ["Giá bán", "price"]),
    commissionRate: findBest(headers, ["Tỷ lệ hoa hồng", "commission_rate"]),
    platform: null,
    salesTotal: findBest(headers, ["Tổng lượng bán", "sales_total"]),
    salesGrowth7d: null,
    salesGrowth30d: null,
    revenue7d: findBest(headers, ["Doanh thu (7 ngày)", "revenue_7d"]),
    revenue30d: findBest(headers, ["Tổng doanh thu", "revenue"]),
    affiliateCount: findBest(headers, [
      "Tổng số người có ảnh hưởng bán hàng (KOL)",
      "affiliate_count",
    ]),
    creatorCount: findBest(headers, [
      "Tổng số video bán hàng",
      "creator_count",
    ]),
    topVideoViews: findBest(headers, [
      "Tổng số livestream bán hàng",
      "top_video_views",
    ]),
    shopName: findBest(headers, ["Tên cửa hàng", "shop_name"]),
    shopRating: findBest(headers, [
      "Tỷ lệ tạo đơn của người có ảnh hưởng (KOL)",
      "shop_rating",
    ]),
  };
}

function buildKaloDataMapping(headers: string[]): ColumnMapping {
  return {
    name: findBest(headers, ["product_name", "Tên sản phẩm", "name"]) ?? headers[0] ?? "",
    url: findBest(headers, ["url", "product_url", "link"]),
    category: findBest(headers, ["category", "Danh mục", "danh_mục"]),
    price: findBest(headers, ["price", "Giá", "giá_bán"]),
    commissionRate: findBest(headers, ["commission_rate", "commission"]),
    platform: findBest(headers, ["platform", "nền_tảng"]),
    salesTotal: findBest(headers, ["units_sold", "số_lượng_bán"]),
    salesGrowth7d: findBest(headers, ["growth_rate", "growth_7d"]),
    salesGrowth30d: findBest(headers, ["growth_30d"]),
    revenue7d: findBest(headers, ["revenue_7d", "doanh_thu_7d"]),
    revenue30d: findBest(headers, ["revenue", "revenue_30d"]),
    affiliateCount: findBest(headers, ["affiliate_count", "affiliates"]),
    creatorCount: findBest(headers, ["related_videos", "creators"]),
    topVideoViews: findBest(headers, ["top_video_views", "video_views"]),
    shopName: findBest(headers, ["shop_name", "shop"]),
    shopRating: findBest(headers, ["shop_rating", "rating"]),
  };
}

function findBest(headers: string[], candidates: string[]): string | null {
  // Exact match first
  for (const c of candidates) {
    if (headers.includes(c)) return c;
  }
  // Case-insensitive match
  for (const c of candidates) {
    const lower = c.toLowerCase();
    const found = headers.find((h) => h.toLowerCase() === lower);
    if (found) return found;
  }
  // Substring match
  for (const c of candidates) {
    const lower = c.toLowerCase();
    const found = headers.find(
      (h) =>
        h.toLowerCase().includes(lower) || lower.includes(h.toLowerCase())
    );
    if (found) return found;
  }
  return null;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Vui lòng chọn file để upload" },
        { status: 400 }
      );
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File quá lớn. Tối đa 10MB." },
        { status: 413 }
      );
    }

    const { headers, rows } = await parseFile(file);
    const format = detectFormat(headers);

    // Filter out empty columns (__EMPTY, __EMPTY_1, etc.)
    const cleanHeaders = headers.filter(
      (h) => !h.startsWith("__EMPTY") && h.trim() !== ""
    );

    let mapping: ColumnMapping;
    let aiDetected = false;

    if (format === "fastmoss") {
      mapping = buildFastMossMapping(cleanHeaders);
    } else if (format === "kalodata") {
      mapping = buildKaloDataMapping(cleanHeaders);
    } else {
      // AI fallback
      try {
        mapping = await aiDetectMapping(cleanHeaders, rows);
        aiDetected = true;
      } catch {
        // Return headers for manual mapping
        mapping = {
          name: cleanHeaders[0] ?? "",
          url: null,
          category: null,
          price: null,
          commissionRate: null,
          platform: null,
          salesTotal: null,
          salesGrowth7d: null,
          salesGrowth30d: null,
          revenue7d: null,
          revenue30d: null,
          affiliateCount: null,
          creatorCount: null,
          topVideoViews: null,
          shopName: null,
          shopRating: null,
        };
      }
    }

    // Build sample data (first 5 rows, clean columns only)
    const sampleRows = rows.slice(0, 5).map((row) => {
      const clean: Record<string, string> = {};
      for (const h of cleanHeaders) {
        const val = row[h];
        clean[h] =
          val !== null && val !== undefined ? String(val).slice(0, 120) : "";
      }
      return clean;
    });

    return NextResponse.json({
      data: {
        headers: cleanHeaders,
        sampleRows,
        totalRows: rows.length,
        format: format === "unknown" ? (aiDetected ? "ai_detected" : "unknown") : format,
        mapping,
        aiDetected,
        targetFields: TARGET_FIELDS,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
