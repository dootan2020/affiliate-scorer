// Phase 2: Chuẩn hóa URL + tạo fingerprint cho dedupe

import { createHash } from "crypto";

/** Tracking params cần loại bỏ khi chuẩn hóa URL */
const TRACKING_PARAMS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "ref", "fbclid", "gclid", "region", "local", "locale",
  "share_app_id", "tt_from", "is_from_webapp",
];

/** Chuẩn hóa URL: remove tracking params, lowercase hostname, remove trailing slash */
export function canonicalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    for (const p of TRACKING_PARAMS) {
      parsed.searchParams.delete(p);
    }
    parsed.hostname = parsed.hostname.toLowerCase();
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
    return parsed.toString();
  } catch {
    // Nếu URL không hợp lệ → trả về nguyên bản
    return url.trim().toLowerCase();
  }
}

/** Tạo fingerprint hash từ canonical URL + title + shop name */
export function generateFingerprint(
  canonicalUrl: string | null,
  title: string | null,
  shopName: string | null,
): string {
  const input = [
    canonicalUrl || "",
    (title || "").toLowerCase().trim(),
    (shopName || "").toLowerCase().trim(),
  ].join("|");
  return createHash("sha256").update(input).digest("hex");
}
