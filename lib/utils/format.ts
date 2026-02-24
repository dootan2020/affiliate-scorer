export function formatVND(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}tr`;
  }
  if (amount >= 1_000) {
    return `${Math.round(amount / 1_000)}K`;
  }
  return `${Math.round(amount)}đ`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

const PLATFORM_LABELS: Record<string, string> = {
  tiktok_shop: "TikTok Shop",
  tiktok: "TikTok",
  shopee: "Shopee",
  both: "TikTok + Shopee",
};

export function formatPlatform(platform: string): string {
  return PLATFORM_LABELS[platform.toLowerCase()] ?? platform;
}

const SOURCE_LABELS: Record<string, string> = {
  fastmoss: "FastMoss",
  kalodata: "KaloData",
  manual: "Nhập tay",
};

export function formatSource(source: string): string {
  return SOURCE_LABELS[source.toLowerCase()] ?? source;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
