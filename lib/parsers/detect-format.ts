export type FileFormat =
  | "fastmoss"
  | "kalodata"
  | "fb_ads"
  | "tiktok_ads"
  | "shopee_affiliate"
  | "unknown";

const FORMAT_SIGNATURES: Record<Exclude<FileFormat, "unknown">, string[][]> = {
  fastmoss: [
    // Real FastMoss Vietnamese export (primary)
    ["tên sản phẩm", "tỷ lệ hoa hồng", "lượng bán"],
    ["tên sản phẩm", "giá bán", "tên cửa hàng"],
    ["danh mục sản phẩm", "tổng lượng bán", "doanh thu"],
    // FastMoss English / legacy
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

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[""'']/g, "")
    .replace(/\s+/g, "_");
}

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
