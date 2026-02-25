// Phase 2: Nhận diện loại link từ URL paste vào
// Hỗ trợ: TikTok Shop product, TikTok video, TikTok Shop, FastMoss product/shop

export interface ParsedLink {
  originalUrl: string;
  type: "product" | "video" | "shop" | "fastmoss_product" | "fastmoss_shop" | "unknown";
  canonicalUrl: string | null;
  externalId: string | null;
}

/** Parse 1 link → nhận diện loại + canonical URL */
export function parseLink(url: string): ParsedLink {
  const cleaned = url.trim();

  // TikTok Shop product
  // https://shop.tiktok.com/view/product/1734173371940046760
  // https://www.tiktok.com/view/product/...
  const productMatch = cleaned.match(/tiktok\.com\/.*\/product\/(\d+)/);
  if (productMatch) {
    return {
      originalUrl: cleaned,
      type: "product",
      canonicalUrl: `https://shop.tiktok.com/view/product/${productMatch[1]}`,
      externalId: productMatch[1],
    };
  }

  // TikTok video
  // https://www.tiktok.com/@user/video/7379957713536601351
  // https://vt.tiktok.com/ZS...
  const videoMatch = cleaned.match(/tiktok\.com\/.*\/video\/(\d+)/);
  if (videoMatch) {
    return {
      originalUrl: cleaned,
      type: "video",
      canonicalUrl: cleaned,
      externalId: videoMatch[1],
    };
  }
  if (cleaned.match(/vt\.tiktok\.com/)) {
    return {
      originalUrl: cleaned,
      type: "video",
      canonicalUrl: cleaned,
      externalId: null, // Short link — không parse ID được
    };
  }

  // TikTok Shop page
  // https://shop.tiktok.com/view/shop/7495757114449955752
  const shopMatch = cleaned.match(/tiktok\.com\/.*\/shop\/(\d+)/);
  if (shopMatch) {
    return {
      originalUrl: cleaned,
      type: "shop",
      canonicalUrl: `https://shop.tiktok.com/view/shop/${shopMatch[1]}`,
      externalId: shopMatch[1],
    };
  }

  // FastMoss product detail
  // https://www.fastmoss.com/zh/e-commerce/detail/1734173371940046760
  const fastmossProductMatch = cleaned.match(/fastmoss\.com\/.*\/detail\/(\d+)/);
  if (fastmossProductMatch && !cleaned.includes("shop-marketing")) {
    return {
      originalUrl: cleaned,
      type: "fastmoss_product",
      canonicalUrl: `https://shop.tiktok.com/view/product/${fastmossProductMatch[1]}`,
      externalId: fastmossProductMatch[1],
    };
  }

  // FastMoss shop
  // https://www.fastmoss.com/.../shop-marketing/detail/...
  const fastmossShopMatch = cleaned.match(/fastmoss\.com\/.*\/shop-marketing\/detail\/(\d+)/);
  if (fastmossShopMatch) {
    return {
      originalUrl: cleaned,
      type: "fastmoss_shop",
      canonicalUrl: `https://shop.tiktok.com/view/shop/${fastmossShopMatch[1]}`,
      externalId: fastmossShopMatch[1],
    };
  }

  return {
    originalUrl: cleaned,
    type: "unknown",
    canonicalUrl: null,
    externalId: null,
  };
}

/** Batch parse: tách theo newline, parse từng link */
export function parseLinks(text: string): ParsedLink[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line.startsWith("http"))
    .map(parseLink);
}

/** Check xem link type có phải product không (dùng cho dedupe) */
export function isProductLink(type: ParsedLink["type"]): boolean {
  return type === "product" || type === "fastmoss_product";
}
