// Phase 2: Content Potential Score
// Đánh giá tiềm năng tạo content cho SP (video TikTok)
// Score dựa trên data HIỆN CÓ — thiếu field → bỏ qua, không block

interface ContentScoreInput {
  imageUrl?: string | null;
  price?: number | null;
  category?: string | null;
  title?: string | null;
  totalKOL?: number | null;
  totalVideos?: number | null;
  commissionRate?: number | null;
  description?: string | null;
}

/** Danh mục → số angle content khả thi */
const CATEGORY_ANGLES: Record<string, number> = {
  "Làm đẹp": 7,       // review, before-after, routine, compare, hack, ingredient, dupe
  "Sức khỏe": 5,       // review, benefit, routine, compare, myth-bust
  "Thời trang": 6,     // try-on, styling, compare, dupe, seasonal, outfit
  "Gia dụng": 5,       // demo, before-after, hack, compare, organize
  "Điện tử": 4,        // unbox, review, compare, setup
  "Thực phẩm": 5,      // taste test, recipe, compare, hack, ASMR
  "Mẹ & Bé": 5,        // review, hack, routine, compare, safety
  "Thú cưng": 6,       // reaction, unbox, compare, hack, cute, before-after
  "Thể thao": 4,       // review, compare, demo, routine
  "Phụ kiện": 5,       // styling, unbox, compare, hack, collection
};

/** Danh mục dễ dựng bằng AI (Kling/Veo3) mà không cần cầm hàng thật */
const AI_FRIENDLY_CATEGORIES: Record<string, number> = {
  "Làm đẹp": 12,       // Dễ dựng scene skincare
  "Gia dụng": 15,      // Dễ dựng scene nhà cửa
  "Thời trang": 10,    // Khó AI — cần người mặc thật
  "Thực phẩm": 8,      // Khó AI — cần thật
  "Điện tử": 14,       // Dễ AI — product shot
  "Phụ kiện": 16,      // Rất dễ AI — product shot
  "Sức khỏe": 10,
  "Mẹ & Bé": 8,
  "Thú cưng": 6,       // Khó AI — cần thú cưng thật
  "Thể thao": 12,
};

/** Danh mục có rủi ro cao (claim y tế, dễ hoàn, dễ report) */
const RISK_KEYWORDS: string[] = [
  "giảm cân", "tăng cân", "trị mụn", "trị nám", "làm trắng",
  "thuốc", "y tế", "chữa bệnh", "điều trị", "giảm đau",
  "bổ thận", "tăng cường sinh lý", "kéo dài", "testosterone",
];

/** Tính Content Potential Score (0-100) */
export function calculateContentPotentialScore(input: ContentScoreInput): number {
  let score = 0;
  let maxScore = 0;

  // 1) 3-second wow: SP có gì visual/gây chú ý? (0-20)
  maxScore += 20;
  if (input.imageUrl) score += 8; // Có ảnh = có nguyên liệu visual
  if (input.price != null) {
    if (input.price < 100_000) score += 12;        // Giá sốc < 100k = easy hook
    else if (input.price < 200_000) score += 8;     // Giá tốt < 200k
    else if (input.price < 500_000) score += 5;     // Giá TB
    else score += 2;                                 // Giá cao — khó viral
  }

  // 2) Số angle content: category có nhiều góc? (0-20)
  maxScore += 20;
  const normalizedCategory = normalizeCategory(input.category);
  const angles = CATEGORY_ANGLES[normalizedCategory] ?? 3;
  score += Math.min(20, angles * 3);

  // 3) Dễ dựng AI: không cần cầm hàng thật? (0-20)
  maxScore += 20;
  const aiScore = AI_FRIENDLY_CATEGORIES[normalizedCategory] ?? 10;
  score += Math.min(20, aiScore);

  // 4) KOL/video count: có UGC làm nguyên liệu? (0-20)
  maxScore += 20;
  if (input.totalKOL != null) {
    if (input.totalKOL > 50) score += 18;
    else if (input.totalKOL > 20) score += 14;
    else if (input.totalKOL > 10) score += 10;
    else if (input.totalKOL > 5) score += 6;
    else score += input.totalKOL;
  }
  if (input.totalVideos != null) {
    score += Math.min(5, Math.floor(input.totalVideos / 100)); // Bonus từ video count
  }

  // 5) Commission — động lực làm content (0-10)
  maxScore += 10;
  if (input.commissionRate != null) {
    if (input.commissionRate >= 20) score += 10;
    else if (input.commissionRate >= 15) score += 8;
    else if (input.commissionRate >= 10) score += 6;
    else if (input.commissionRate >= 5) score += 3;
    else score += 1;
  }

  // 6) Rủi ro (trừ điểm) — claim y tế, dễ report
  maxScore += 10;
  score += 10; // Bắt đầu từ max, trừ nếu có rủi ro
  const titleLower = (input.title || "").toLowerCase();
  const descLower = (input.description || "").toLowerCase();
  const fullText = titleLower + " " + descLower;
  let riskCount = 0;
  for (const keyword of RISK_KEYWORDS) {
    if (fullText.includes(keyword)) riskCount++;
  }
  score -= Math.min(10, riskCount * 3);

  // Normalize to 0-100
  return maxScore > 0 ? Math.max(0, Math.min(100, Math.round((score / maxScore) * 100))) : 0;
}

/** Chuẩn hóa tên category cho lookup */
function normalizeCategory(category?: string | null): string {
  if (!category) return "";
  const lower = category.toLowerCase().trim();

  // Map common FastMoss categories
  if (lower.includes("beauty") || lower.includes("làm đẹp") || lower.includes("skincare") || lower.includes("mỹ phẩm")) return "Làm đẹp";
  if (lower.includes("health") || lower.includes("sức khỏe") || lower.includes("wellness")) return "Sức khỏe";
  if (lower.includes("fashion") || lower.includes("thời trang") || lower.includes("clothing") || lower.includes("quần áo")) return "Thời trang";
  if (lower.includes("home") || lower.includes("gia dụng") || lower.includes("household") || lower.includes("nhà cửa")) return "Gia dụng";
  if (lower.includes("electronic") || lower.includes("điện tử") || lower.includes("tech") || lower.includes("phone")) return "Điện tử";
  if (lower.includes("food") || lower.includes("thực phẩm") || lower.includes("snack") || lower.includes("đồ ăn")) return "Thực phẩm";
  if (lower.includes("baby") || lower.includes("mẹ") || lower.includes("bé") || lower.includes("maternity")) return "Mẹ & Bé";
  if (lower.includes("pet") || lower.includes("thú cưng")) return "Thú cưng";
  if (lower.includes("sport") || lower.includes("thể thao") || lower.includes("fitness")) return "Thể thao";
  if (lower.includes("accessor") || lower.includes("phụ kiện") || lower.includes("jewelry") || lower.includes("trang sức")) return "Phụ kiện";

  return category;
}
