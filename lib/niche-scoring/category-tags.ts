export type CategoryTag =
  | "product_photo"
  | "text_review"
  | "render_scene"
  | "demo_required"
  | "lifestyle"
  | "fashion"
  | "mixed";

// Primary key: fastmossCategoryId (L1 code) → tags
const TAGS_BY_CODE: Record<number, CategoryTag[]> = {
  28: ["product_photo"], // Trang sức
  8: ["product_photo"], // Phụ kiện thời trang
  12: ["product_photo"], // Vải & Nội thất mềm

  26: ["text_review"], // Sách & Audio
  15: ["text_review"], // Máy tính & TB VP

  20: ["render_scene"], // Nội thất
  22: ["render_scene"], // Cải thiện nhà cửa

  14: ["demo_required"], // Làm đẹp
  25: ["demo_required"], // Sức khỏe
  18: ["demo_required"], // Mẹ & Bé
  24: ["demo_required"], // Thực phẩm & Đồ uống

  9: ["lifestyle"], // Thể thao
  17: ["lifestyle"], // Đồ thú cưng
  19: ["lifestyle"], // Đồ chơi & Sở thích

  2: ["fashion"], // Thời trang nữ
  3: ["fashion"], // Thời trang nam
  4: ["fashion"], // Thời trang trẻ em
  6: ["fashion"], // Giày dép
  7: ["fashion"], // Hành lý

  10: ["mixed"], // Đồ gia dụng
  11: ["mixed"], // Đồ bếp
  13: ["mixed"], // Thiết bị gia dụng
  21: ["mixed"], // Dụng cụ & Phần cứng
  16: ["mixed"], // Điện thoại & Điện tử
  23: ["mixed"], // Ô tô & Xe máy
  30: ["mixed"], // Sưu tầm
  31: ["mixed"], // Đồ đã qua sử dụng
  5: ["mixed"], // Thời trang Hồi giáo
  27: ["mixed"], // Virtual Products
};

// Fallback: Vietnamese category name → tags
const TAGS_BY_NAME: Record<string, CategoryTag[]> = {
  "Trang sức": ["product_photo"],
  "Phụ kiện thời trang": ["product_photo"],
  "Vải & Nội thất mềm": ["product_photo"],
  "Sách & Audio": ["text_review"],
  "Máy tính & TB VP": ["text_review"],
  "Nội thất": ["render_scene"],
  "Cải thiện nhà cửa": ["render_scene"],
  "Làm đẹp": ["demo_required"],
  "Sức khỏe": ["demo_required"],
  "Mẹ & Bé": ["demo_required"],
  "Thực phẩm & Đồ uống": ["demo_required"],
  "Thể thao": ["lifestyle"],
  "Đồ thú cưng": ["lifestyle"],
  "Đồ chơi & Sở thích": ["lifestyle"],
  "Thời trang nữ": ["fashion"],
  "Thời trang nam": ["fashion"],
  "Thời trang trẻ em": ["fashion"],
  "Giày dép": ["fashion"],
  "Hành lý": ["fashion"],
  "Đồ gia dụng": ["mixed"],
  "Đồ bếp": ["mixed"],
  "Thiết bị gia dụng": ["mixed"],
  "Dụng cụ & Phần cứng": ["mixed"],
  "Điện thoại & Điện tử": ["mixed"],
  "Ô tô & Xe máy": ["mixed"],
  "Sưu tầm": ["mixed"],
  "Đồ đã qua sử dụng": ["mixed"],
  "Thời trang Hồi giáo": ["mixed"],
};

/** Resolve tags for a category — code first, name fallback, default mixed */
export function getCategoryTags(
  categoryCode: number,
  categoryName: string
): CategoryTag[] {
  return (
    TAGS_BY_CODE[categoryCode] ??
    TAGS_BY_NAME[categoryName] ?? ["mixed"]
  );
}
