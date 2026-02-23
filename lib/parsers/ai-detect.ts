import { callClaude } from "@/lib/ai/claude";
import type { ParsedRow } from "@/lib/parsers/parse-file";

/**
 * Column mapping: key = NormalizedProduct field, value = source column name.
 * null means "skip / not available".
 */
export interface ColumnMapping {
  name: string;
  url: string | null;
  category: string | null;
  price: string | null;
  commissionRate: string | null;
  platform: string | null;
  salesTotal: string | null;
  salesGrowth7d: string | null;
  salesGrowth30d: string | null;
  revenue7d: string | null;
  revenue30d: string | null;
  affiliateCount: string | null;
  creatorCount: string | null;
  topVideoViews: string | null;
  shopName: string | null;
  shopRating: string | null;
}

const TARGET_FIELDS: Array<{ key: keyof ColumnMapping; label: string }> = [
  { key: "name", label: "Tên sản phẩm (bắt buộc)" },
  { key: "url", label: "URL sản phẩm" },
  { key: "category", label: "Danh mục" },
  { key: "price", label: "Giá bán (VND)" },
  { key: "commissionRate", label: "Tỷ lệ hoa hồng (%)" },
  { key: "platform", label: "Nền tảng (shopee/tiktok)" },
  { key: "salesTotal", label: "Tổng lượng bán" },
  { key: "salesGrowth7d", label: "Tăng trưởng 7 ngày (%)" },
  { key: "salesGrowth30d", label: "Tăng trưởng 30 ngày (%)" },
  { key: "revenue7d", label: "Doanh thu 7 ngày" },
  { key: "revenue30d", label: "Doanh thu 30 ngày / tổng" },
  { key: "affiliateCount", label: "Số affiliate / KOL" },
  { key: "creatorCount", label: "Số creator / video" },
  { key: "topVideoViews", label: "Lượt xem video top" },
  { key: "shopName", label: "Tên shop" },
  { key: "shopRating", label: "Đánh giá shop" },
];

export { TARGET_FIELDS };

const SYSTEM_PROMPT = `Bạn là chuyên gia phân tích dữ liệu affiliate marketing.
Nhiệm vụ: nhận danh sách tên cột (headers) và dữ liệu mẫu từ file CSV/Excel,
rồi map các cột vào schema chuẩn.

Trả về JSON object duy nhất, KHÔNG có text khác. Format:
{
  "name": "Tên cột nguồn chứa tên sản phẩm",
  "url": "Tên cột chứa URL hoặc null",
  "category": "Tên cột danh mục hoặc null",
  "price": "Tên cột giá hoặc null",
  "commissionRate": "Tên cột hoa hồng hoặc null",
  "platform": "Tên cột nền tảng hoặc null",
  "salesTotal": "Tên cột tổng bán hoặc null",
  "salesGrowth7d": "Tên cột tăng trưởng 7d hoặc null",
  "salesGrowth30d": "Tên cột tăng trưởng 30d hoặc null",
  "revenue7d": "Tên cột doanh thu 7d hoặc null",
  "revenue30d": "Tên cột doanh thu 30d/tổng hoặc null",
  "affiliateCount": "Tên cột số affiliate/KOL hoặc null",
  "creatorCount": "Tên cột số creator/video hoặc null",
  "topVideoViews": "Tên cột lượt xem hoặc null",
  "shopName": "Tên cột tên shop hoặc null",
  "shopRating": "Tên cột đánh giá shop hoặc null"
}

Quy tắc:
- "name" là bắt buộc, phải tìm được cột chứa tên sản phẩm
- Các trường khác: null nếu không có cột phù hợp
- Giá trị phải chính xác tên cột gốc (case-sensitive)
- Cột chứa URL, hình ảnh, ID nội bộ → chỉ map vào "url" nếu là link sản phẩm`;

export async function aiDetectMapping(
  headers: string[],
  sampleRows: ParsedRow[]
): Promise<ColumnMapping> {
  const sampleData = sampleRows.slice(0, 5).map((row) => {
    const obj: Record<string, string> = {};
    for (const h of headers) {
      const val = row[h];
      obj[h] = val !== null && val !== undefined ? String(val).slice(0, 100) : "";
    }
    return obj;
  });

  const userPrompt = `Headers: ${JSON.stringify(headers)}

Dữ liệu mẫu (${sampleData.length} dòng):
${JSON.stringify(sampleData, null, 2)}

Hãy map các cột vào schema. Trả về JSON duy nhất.`;

  try {
    const response = await callClaude(SYSTEM_PROMPT, userPrompt, 1024);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI không trả về JSON hợp lệ");

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, string | null>;

    // Validate: "name" must exist and be a real header
    if (!parsed.name || !headers.includes(parsed.name)) {
      throw new Error("AI không xác định được cột tên sản phẩm");
    }

    // Build mapping, only keep values that are actual headers
    const mapping: ColumnMapping = {
      name: parsed.name,
      url: validHeader(parsed.url, headers),
      category: validHeader(parsed.category, headers),
      price: validHeader(parsed.price, headers),
      commissionRate: validHeader(parsed.commissionRate, headers),
      platform: validHeader(parsed.platform, headers),
      salesTotal: validHeader(parsed.salesTotal, headers),
      salesGrowth7d: validHeader(parsed.salesGrowth7d, headers),
      salesGrowth30d: validHeader(parsed.salesGrowth30d, headers),
      revenue7d: validHeader(parsed.revenue7d, headers),
      revenue30d: validHeader(parsed.revenue30d, headers),
      affiliateCount: validHeader(parsed.affiliateCount, headers),
      creatorCount: validHeader(parsed.creatorCount, headers),
      topVideoViews: validHeader(parsed.topVideoViews, headers),
      shopName: validHeader(parsed.shopName, headers),
      shopRating: validHeader(parsed.shopRating, headers),
    };

    return mapping;
  } catch (error) {
    console.error("AI detect mapping failed:", error);
    throw new Error(
      "Không thể tự động nhận diện cột. Vui lòng chọn mapping thủ công."
    );
  }
}

function validHeader(
  value: string | null | undefined,
  headers: string[]
): string | null {
  if (!value) return null;
  return headers.includes(value) ? value : null;
}
