// Mapping between channel niche (English) and product categories (Vietnamese)
// Used by smart suggestions to match products to channels

const NICHE_CATEGORY_MAP: Record<string, string[]> = {
  beauty_skincare: ["chăm sóc sắc đẹp", "chăm sóc cá nhân", "mỹ phẩm"],
  home_living: ["đồ gia dụng", "đồ dùng nhà bếp", "nội thất"],
  tech: ["điện thoại", "đồ điện tử", "công nghệ"],
  fashion: ["phụ kiện thời trang", "quần áo", "giày dép", "túi xách"],
  health: ["sức khỏe", "y tế", "thực phẩm chức năng"],
  food: ["đồ ăn", "đồ uống", "thực phẩm"],
  garden: ["sửa chữa nhà cửa", "vườn", "cây cảnh"],
};

/**
 * Check if a product category matches a channel niche.
 * Uses mapping table first, falls back to string includes.
 */
export function matchesNiche(niche: string, category: string): boolean {
  const nicheLower = niche.toLowerCase();
  const catLower = category.toLowerCase();

  // Try mapping table first
  const keywords = NICHE_CATEGORY_MAP[nicheLower];
  if (keywords) {
    return keywords.some((kw) => catLower.includes(kw));
  }

  // Fallback: bidirectional string includes
  return catLower.includes(nicheLower) || nicheLower.includes(catLower);
}
