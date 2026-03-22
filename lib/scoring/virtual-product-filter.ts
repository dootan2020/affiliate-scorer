// Phase 03 Fix #10: Filter non-sellable virtual products before scoring
// These items (thank-you cards, vouchers, etc.) inflate scores with high commission/sales
// but are not real affiliate products worth making content about.

const VIRTUAL_KEYWORDS = [
  "thẻ cảm ơn", "thank you card", "phiếu bảo hành", "warranty card",
  "voucher", "gift card", "thẻ quà tặng", "phiếu giảm giá",
  "gói quà", "gift wrap", "bao bì", "packaging",
  "phụ kiện đi kèm", "accessory bundle",
];

/** Check if product name indicates a non-sellable virtual item */
export function isVirtualProduct(name: string | null | undefined): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  return VIRTUAL_KEYWORDS.some((kw) => lower.includes(kw));
}
