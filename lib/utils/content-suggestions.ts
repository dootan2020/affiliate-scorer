/** Template-based content & strategy suggestions (no AI API needed) */

interface ProductData {
  name: string;
  category: string;
  price: number;
  commissionRate: number;
  commissionVND: number;
  sales7d: number | null;
  totalKOL: number | null;
  totalVideos: number | null;
  totalLivestreams: number | null;
  platform: string;
}

export interface ContentTip {
  videoTypes: string[];
  angles: string[];
  hooks: string[];
  duration: string;
  opportunity: string | null;
}

export interface PlatformStrategy {
  platform: string;
  reason: string;
  priorityChannel: string;
  videoOpportunity: string | null;
  competition: string;
  budgetSuggestion: string;
}

const CATEGORY_VIDEO_MAP: Record<string, { types: string[]; angles: string[] }> = {
  "Phụ kiện thời trang": { types: ["Review", "Unbox", "So sánh", "Try-on"], angles: ["Cận sản phẩm + đeo thử + phối đồ"] },
  "Thời trang": { types: ["Try-on haul", "Outfit check", "OOTD"], angles: ["Phối đồ + mirror selfie + before/after"] },
  "Làm đẹp": { types: ["Review", "Tutorial", "Before/After"], angles: ["Cận da mặt + thao tác bôi + kết quả"] },
  "Mỹ phẩm": { types: ["Swatch", "Tutorial", "So sánh"], angles: ["Swatch trên tay + trang điểm + ánh sáng tốt"] },
  "Điện tử": { types: ["Unbox", "So sánh", "Review chi tiết"], angles: ["Unbox + demo tính năng + so sánh đối thủ"] },
  "Gia dụng": { types: ["Demo sử dụng", "Before/After", "Review"], angles: ["Demo thực tế + kết quả trước/sau"] },
  "Thực phẩm": { types: ["Mukbang", "Review vị", "Công thức"], angles: ["Nấu nướng + thử vị + reaction"] },
  "Sức khỏe": { types: ["Review", "Routine", "Chia sẻ kinh nghiệm"], angles: ["Chia sẻ kết quả + routine hàng ngày"] },
};

const DEFAULT_VIDEO = { types: ["Review", "Unbox", "Demo"], angles: ["Cận sản phẩm + demo sử dụng thực tế"] };

function getPriceHook(price: number): string {
  if (price < 100_000) return "Rẻ bất ngờ — dưới 100K";
  if (price <= 300_000) return "Đáng tiền — chất lượng vượt giá";
  if (price <= 500_000) return "Quà tặng lý tưởng";
  return "Premium — đầu tư xứng đáng";
}

function getSeasonalHook(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.includes("valentine") || lower.includes("tình yêu")) return "Quà Valentine hot";
  if (lower.includes("tết") || lower.includes("xuân")) return "Deal Tết không thể bỏ qua";
  if (lower.includes("noel") || lower.includes("giáng sinh")) return "Quà Giáng Sinh ý nghĩa";
  if (lower.includes("8/3") || lower.includes("phụ nữ")) return "Quà 8/3 cho nàng";
  if (lower.includes("hè") || lower.includes("mùa hè")) return "Must-have mùa hè";
  return null;
}

export function generateContentTips(product: ProductData): ContentTip {
  const catData = CATEGORY_VIDEO_MAP[product.category] ?? DEFAULT_VIDEO;
  const hooks: string[] = [getPriceHook(product.price)];

  const seasonal = getSeasonalHook(product.name);
  if (seasonal) hooks.push(seasonal);

  let opportunity: string | null = null;
  if (product.totalKOL !== null && product.totalKOL < 20) {
    opportunity = `Ít KOL (${product.totalKOL}) → ít cạnh tranh content`;
  }

  return {
    videoTypes: catData.types,
    angles: catData.angles,
    hooks,
    duration: "15-30s (TikTok optimal)",
    opportunity,
  };
}

export function generatePlatformStrategy(product: ProductData): PlatformStrategy {
  const videos = product.totalVideos ?? 0;
  const livestreams = product.totalLivestreams ?? 0;
  const kol = product.totalKOL ?? 0;

  let priorityChannel: string;
  let videoOpportunity: string | null = null;

  if (livestreams > 0 && videos === 0) {
    priorityChannel = `Livestream (${livestreams} LS đang bán, chưa có video)`;
    videoOpportunity = "Cơ hội lớn — chưa có video bán hàng, bạn có thể là người đầu tiên";
  } else if (livestreams > videos * 2) {
    priorityChannel = `Livestream (${livestreams} LS vs ${videos} video → LS đang hiệu quả hơn)`;
    videoOpportunity = `Chỉ có ${videos} video — ít cạnh tranh trên kênh video`;
  } else if (videos > livestreams * 2) {
    priorityChannel = `Video ngắn (${videos} video vs ${livestreams} LS → video đang mạnh)`;
  } else {
    priorityChannel = `Cả hai kênh (${videos} video + ${livestreams} LS)`;
  }

  let competition: string;
  if (kol < 10) competition = "Rất thấp — gần như chưa có KOL";
  else if (kol < 20) competition = "Thấp — ít cạnh tranh";
  else if (kol < 50) competition = "Trung bình";
  else if (kol < 100) competition = "Cao — cần content độc đáo";
  else competition = `Rất cao (${kol} KOL) — cần content nổi bật để cạnh tranh`;

  const dailyBudgetLow = Math.round(product.commissionVND * 10 / 1000) * 1000;
  const dailyBudgetHigh = Math.round(product.commissionVND * 15 / 1000) * 1000;

  let reason = "";
  if (kol > 0 || livestreams > 0 || videos > 0) {
    reason = `${kol} KOL, ${livestreams} livestream, ${videos} video đang bán → thị trường đang hoạt động`;
  } else {
    reason = "Chưa có dữ liệu KOL/video — sản phẩm mới";
  }

  return {
    platform: product.platform,
    reason,
    priorityChannel,
    videoOpportunity,
    competition,
    budgetSuggestion: `${formatBudget(dailyBudgetLow)}-${formatBudget(dailyBudgetHigh)}/ngày cho ads`,
  };
}

function formatBudget(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}tr`;
  return `${Math.round(amount / 1000)}K`;
}
