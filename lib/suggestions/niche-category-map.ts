// Mapping between channel niche (English) and product categories (Vietnamese)
// Used by smart suggestions to match products to channels

const NICHE_CATEGORY_MAP: Record<string, string[]> = {
  beauty_skincare: ["chăm sóc sắc đẹp", "chăm sóc cá nhân", "mỹ phẩm"],
  home_living: ["đồ gia dụng", "đồ dùng nhà bếp", "nội thất", "thiết bị gia dụng", "đồ dùng gia đình", "đồ nội thất"],
  tech: ["điện thoại", "đồ điện tử", "công nghệ", "máy tính", "thiết bị văn phòng"],
  fashion: ["phụ kiện thời trang", "quần áo", "giày dép", "túi xách", "trang phục nữ", "trang phục nam", "đồ lót", "trang phục", "giày"],
  health: ["sức khỏe", "y tế", "thực phẩm chức năng"],
  food: ["đồ ăn", "đồ uống", "thực phẩm"],
  garden: ["sửa chữa nhà cửa", "vườn", "cây cảnh", "công cụ", "phần cứng"],
  sports: ["thể thao", "ngoài trời", "thể thao & ngoài trời", "fitness"],
  books_media: ["sách", "tạp chí", "âm thanh", "sách, tạp chí & âm thanh"],
  toys: ["đồ chơi", "sở thích", "đồ chơi & sở thích", "bộ sưu tập"],
  automotive: ["ô tô", "xe máy", "ô tô & xe máy", "phụ kiện xe"],
  mother_baby: ["mẹ & bé", "trẻ em", "đồ trẻ em", "trẻ sơ sinh", "thai sản"],
};

/**
 * Normalize a niche string to match map keys.
 * "Home & Living" → "home_living", "beauty_skincare" → "beauty_skincare"
 */
export function normalizeNicheKey(niche: string): string {
  return niche
    .toLowerCase()
    .replace(/\s*&\s*/g, "_")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Check if a product category matches a channel niche.
 * Uses mapping table first, falls back to string includes.
 */
export function matchesNiche(niche: string, category: string): boolean {
  const normalized = normalizeNicheKey(niche);
  const catLower = category.toLowerCase();

  // Try mapping table with normalized key
  const keywords = NICHE_CATEGORY_MAP[normalized];
  if (keywords) {
    return keywords.some((kw) => catLower.includes(kw));
  }

  // Fallback: bidirectional string includes (use original lowercase for readability)
  const nicheLower = niche.toLowerCase();
  return catLower.includes(nicheLower) || nicheLower.includes(catLower);
}
