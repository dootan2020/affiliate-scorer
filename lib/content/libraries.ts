// Phase 3: Hook / Format / Angle library — seed data cho content generation

export interface HookTemplate {
  type: string;
  template: string;
  example: string;
}

export interface FormatTemplate {
  id: string;
  name: string;
  duration: string;
  description: string;
}

export const HOOK_LIBRARY: HookTemplate[] = [
  // Result hooks
  { type: "result", template: "Dùng {product} {duration}, kết quả...", example: "Dùng serum này 7 ngày, da tôi thay đổi thật sự" },
  { type: "result", template: "Trước/sau khi dùng {product}", example: "Da tôi trước vs sau 2 tuần dùng serum này" },
  // Price hooks
  { type: "price", template: "{price} mà chất lượng như {higher_price}", example: "99K mà chất lượng như 500K" },
  { type: "price", template: "Deal {event} chỉ còn {price}", example: "Deal 3.3 chỉ còn 79K" },
  // Compare hooks
  { type: "compare", template: "{product_A} vs {product_B} — cái nào đáng?", example: "Serum A 99K vs Serum B 350K — cái nào đáng?" },
  // Myth hooks
  { type: "myth", template: "Đừng mua {product} trước khi xem video này", example: "Đừng mua kem chống nắng trước khi xem video này" },
  { type: "myth", template: "{product} có thật sự tốt như quảng cáo?", example: "Serum vitamin C có thật sự làm sáng da?" },
  // Problem hooks
  { type: "problem", template: "Nếu bạn đang {problem}, thử cái này", example: "Nếu da bạn đang xỉn màu, thử cái này" },
  // Unbox hooks
  { type: "unbox", template: "Unbox hàng TikTok Shop {price}", example: "Unbox hàng TikTok Shop 99K — liệu có hời?" },
  // Trend hooks
  { type: "trend", template: "Trend TikTok đang viral — {product}", example: "Trend làm đẹp đang viral — serum vitamin C" },
];

export const FORMAT_LIBRARY: FormatTemplate[] = [
  { id: "review_short", name: "Review ngắn", duration: "15-30s", description: "Talking head + show SP + kết quả" },
  { id: "demo", name: "Demo sản phẩm", duration: "15-20s", description: "Hands-on, show cách dùng" },
  { id: "compare", name: "So sánh 2 SP", duration: "20-30s", description: "Side by side, bên nào hơn" },
  { id: "unbox", name: "Unbox/Haul", duration: "15-30s", description: "Mở hộp, first impression" },
  { id: "lifestyle", name: "Lifestyle", duration: "15-20s", description: "SP trong đời thường, aesthetic" },
  { id: "greenscreen", name: "Green screen", duration: "15-25s", description: "Green screen + voiceover + ảnh SP" },
  { id: "problem_solution", name: "Vấn đề → Giải pháp", duration: "20-30s", description: "Nêu vấn đề → SP giải quyết" },
];

export const ANGLE_LIBRARY: string[] = [
  "Giá rẻ bất ngờ (so với chất lượng)",
  "Chất lượng vượt giá",
  "Giải quyết pain point cụ thể",
  "Trend/viral đang hot",
  "Review thật sau X ngày dùng",
  "So sánh với sản phẩm đắt hơn",
  "Quà tặng/đi date/dịp đặc biệt",
  "Hidden gem ít người biết",
  "Hack tiết kiệm",
  "Dùng thử để bạn khỏi mua hớ",
];
