import type { DetectionResult, ExtendedFileFormat } from "./types";

export type { DetectionResult, ExtendedFileFormat };

export type FileFormat =
  | "fastmoss"
  | "kalodata"
  | "fb_ads"
  | "tiktok_ads"
  | "shopee_affiliate"
  | "unknown";

type SignatureMap = Record<string, string[][]>;

const FORMAT_SIGNATURES: Record<Exclude<FileFormat, "unknown">, string[][]> = {
  fastmoss: [
    ["tên sản phẩm", "tỷ lệ hoa hồng", "lượng bán"],
    ["tên sản phẩm", "giá bán", "tên cửa hàng"],
    ["danh mục sản phẩm", "tổng lượng bán", "doanh thu"],
    ["commission_rate", "affiliate_count", "growth"],
    ["commission rate", "affiliate count", "growth rate"],
    ["tỷ lệ hoa hồng", "số affiliate", "tăng trưởng"],
  ],
  kalodata: [
    ["units_sold", "related_videos"],
    ["units sold", "related videos"],
    ["số lượng bán", "video liên quan"],
  ],
  fb_ads: [
    ["campaign_name", "cpc", "roas"],
    ["campaign name", "cost per result", "return on ad spend"],
    ["tên chiến dịch", "cpc", "roas"],
  ],
  tiktok_ads: [
    ["campaign_name", "video_views", "avg_watch_time"],
    ["campaign name", "video views", "average watch time"],
  ],
  shopee_affiliate: [
    ["commission_earned", "conversion_rate"],
    ["commission earned", "conversion rate"],
    ["hoa hồng nhận được", "tỷ lệ chuyển đổi"],
  ],
};

const EXTENDED_SIGNATURES: SignatureMap = {
  fastmoss: FORMAT_SIGNATURES.fastmoss,
  kalodata: FORMAT_SIGNATURES.kalodata,
  fb_ads: [
    ...FORMAT_SIGNATURES.fb_ads,
    ["campaign_name", "amount_spent", "impressions"],
    ["campaign name", "amount spent", "results"],
    ["tên chiến dịch", "số tiền đã chi", "lượt hiển thị"],
  ],
  tiktok_ads: [
    ...FORMAT_SIGNATURES.tiktok_ads,
    ["campaign_name", "cost", "impressions", "clicks"],
    ["campaign", "total_cost", "complete_payment"],
    ["tên chiến dịch", "chi phí", "lượt hiển thị"],
  ],
  shopee_ads: [
    ["tên chiến dịch", "loại quảng cáo", "chi phí"],
    ["campaign", "ad type", "cost", "shopee"],
    ["tên chiến dịch", "chi phí", "lượt click", "đơn hàng"],
    ["campaign_name", "ad_type", "cost", "impressions"],
  ],
  tiktok_affiliate: [
    ["mã đơn hàng", "hoa hồng"],
    ["order_id", "commission", "tiktok"],
    ["mã đơn hàng", "hoa hồng", "tiktok"],
    ["order id", "commission rate", "product name"],
  ],
  shopee_affiliate: [
    ...FORMAT_SIGNATURES.shopee_affiliate,
    ["mã đơn hàng", "hoa hồng", "shopee"],
    ["order_id", "commission", "shopee"],
    ["mã đơn hàng", "hoa hồng nhận được", "tỷ lệ chuyển đổi"],
  ],
};

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[""'']/g, "")
    .replace(/\s+/g, "_");
}

function countMatchingColumns(
  normalized: string[],
  signature: string[]
): number {
  const normalizedSig = signature.map(normalizeHeader);
  return normalizedSig.filter((sig) =>
    normalized.some((h) => h.includes(sig) || sig.includes(h))
  ).length;
}

/** Original detection — returns basic FileFormat for backward compat */
export function detectFormat(headers: string[]): FileFormat {
  const normalized = headers.map(normalizeHeader);

  for (const [format, signatures] of Object.entries(FORMAT_SIGNATURES)) {
    for (const signature of signatures) {
      const normalizedSig = signature.map(normalizeHeader);
      const allMatch = normalizedSig.every((sig) =>
        normalized.some((h) => h.includes(sig) || sig.includes(h))
      );
      if (allMatch) return format as FileFormat;
    }
  }

  return "unknown";
}

/** Extended detection with confidence scoring and reason */
export function detectFormatExtended(headers: string[]): DetectionResult {
  const normalized = headers.map(normalizeHeader);
  const headerStr = normalized.join("|");

  let bestFormat: ExtendedFileFormat = "unknown";
  let bestScore = 0;
  let bestTotal = 0;
  let bestReason = "";

  for (const [format, signatures] of Object.entries(EXTENDED_SIGNATURES)) {
    for (const signature of signatures) {
      const matched = countMatchingColumns(normalized, signature);
      const total = signature.length;
      const score = total > 0 ? matched / total : 0;

      if (matched > bestScore || (matched === bestScore && score > (bestScore / bestTotal || 0))) {
        bestFormat = format as ExtendedFileFormat;
        bestScore = matched;
        bestTotal = total;
        bestReason = `Matched ${matched}/${total} signature columns for ${format}`;
      }
    }
  }

  // Quick check for generic CSV with spend/revenue columns
  if (bestScore < 2) {
    const hasSpend = normalized.some((h) => h.includes("spend") || h.includes("chi_phí") || h.includes("cost"));
    const hasRevenue = normalized.some((h) => h.includes("revenue") || h.includes("doanh_thu"));
    if (hasSpend || hasRevenue) {
      return {
        type: "generic",
        confidence: "low",
        reason: `No strong format match. Found generic columns: ${headerStr.substring(0, 100)}`,
      };
    }
  }

  if (bestScore < 2) {
    return { type: "unknown", confidence: "low", reason: "No matching signature found" };
  }

  const confidence: DetectionResult["confidence"] =
    bestScore >= 3 ? "high" : bestScore >= 2 ? "medium" : "low";

  return { type: bestFormat, confidence, reason: bestReason };
}
