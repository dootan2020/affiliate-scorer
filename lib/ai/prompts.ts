import type { Product as ProductModel } from "@/lib/types/product";

export interface WeightMap {
  commission: number;
  trending: number;
  competition: number;
  contentFit: number;
  price: number;
  platform: number;
}

export interface ScoringPromptInput {
  products: ProductModel[];
  weights: WeightMap;
  patterns?: string[];
}

export interface LearningPromptInput {
  feedbackSummary: string;
  currentWeights: WeightMap;
  previousPatterns?: string[];
}

export interface RecommendPromptInput {
  productName: string;
  category: string;
  price: number;
  commissionRate: number;
  platform: string;
}

export function buildScoringPrompt(input: ScoringPromptInput): {
  system: string;
  user: string;
} {
  const { products, weights, patterns } = input;

  const system = `Bạn là AI chuyên phân tích sản phẩm affiliate cho thị trường Việt Nam.
Nhiệm vụ của bạn là chấm điểm sản phẩm từ 0-100 dựa trên công thức scoring được cung cấp.
Luôn trả về JSON hợp lệ, không có văn bản thêm vào ngoài JSON.`;

  const formulaDesc = `
Công thức tính điểm (0-100):
- Commission   × ${weights.commission}
- Trending     × ${weights.trending}
- Competition  × ${weights.competition}
- Content Fit  × ${weights.contentFit}
- Price        × ${weights.price}
- Platform     × ${weights.platform}
`.trim();

  const patternText =
    patterns && patterns.length > 0
      ? `\nPatterns lịch sử:\n${patterns.map((p) => `- ${p}`).join("\n")}`
      : "";

  const user = `Chấm điểm cho ${products.length} sản phẩm sau theo công thức:

${formulaDesc}${patternText}

Dữ liệu sản phẩm:
${JSON.stringify(products, null, 2)}

Trả về JSON array với format:
[
  {
    "id": "product_id",
    "aiScore": 85,
    "scoreBreakdown": {
      "commission": {"score": 80, "weight": ${weights.commission}, "weighted": ${(80 * weights.commission).toFixed(1)}},
      "trending": {"score": 100, "weight": ${weights.trending}, "weighted": ${(100 * weights.trending).toFixed(1)}},
      "competition": {"score": 60, "weight": ${weights.competition}, "weighted": ${(60 * weights.competition).toFixed(1)}},
      "contentFit": {"score": 70, "weight": ${weights.contentFit}, "weighted": ${(70 * weights.contentFit).toFixed(1)}},
      "price": {"score": 100, "weight": ${weights.price}, "weighted": ${(100 * weights.price).toFixed(1)}},
      "platform": {"score": 70, "weight": ${weights.platform}, "weighted": ${(70 * weights.platform).toFixed(1)}}
    },
    "reason": "Lý do ngắn gọn 1-2 câu tại sao điểm này.",
    "contentSuggestion": "Gợi ý nội dung video/bài đăng cho sản phẩm.",
    "platformAdvice": "Gợi ý platform tốt nhất để quảng bá."
  }
]`;

  return { system, user };
}

export function buildLearningPrompt(input: LearningPromptInput): {
  system: string;
  user: string;
} {
  const { feedbackSummary, currentWeights, previousPatterns } = input;

  const system = `Bạn là AI phân tích hiệu suất affiliate marketing tại Việt Nam.
Phân tích dữ liệu feedback thực tế để tìm patterns và đề xuất điều chỉnh trọng số scoring.
Luôn trả về JSON hợp lệ.`;

  const user = `Phân tích dữ liệu feedback sau và đề xuất cải thiện:

Trọng số hiện tại:
${JSON.stringify(currentWeights, null, 2)}

${previousPatterns && previousPatterns.length > 0 ? `Patterns cũ:\n${previousPatterns.join("\n")}\n` : ""}

Dữ liệu feedback:
${feedbackSummary}

Trả về JSON:
{
  "accuracy": 0.75,
  "patterns": ["Pattern 1", "Pattern 2"],
  "weightAdjustments": {
    "commission": 0.22,
    "trending": 0.18,
    "competition": 0.20,
    "contentFit": 0.15,
    "price": 0.15,
    "platform": 0.10
  },
  "insights": "Tóm tắt phân tích và chiến lược đề xuất."
}`;

  return { system, user };
}

export function buildRecommendPrompt(input: RecommendPromptInput): {
  system: string;
  user: string;
} {
  const { productName, category, price, commissionRate, platform } = input;

  const system = `Bạn là chuyên gia content marketing affiliate tại Việt Nam.
Đề xuất chiến lược nội dung cụ thể để quảng bá sản phẩm hiệu quả.
Luôn trả về JSON hợp lệ.`;

  const user = `Đề xuất chiến lược nội dung cho sản phẩm:
- Tên: ${productName}
- Danh mục: ${category}
- Giá: ${price.toLocaleString("vi-VN")} VND
- Hoa hồng: ${commissionRate}%
- Platform: ${platform}

Trả về JSON:
{
  "videoType": "Review / Unboxing / Tutorial / So sánh",
  "duration": "60-90 giây",
  "postTime": "19:00-21:00 tối thứ 6-7",
  "adsBudget": "500K-1M/ngày",
  "expectedROAS": "3-5x",
  "hooks": ["Hook mở đầu 1", "Hook mở đầu 2"],
  "keyPoints": ["Điểm bán hàng 1", "Điểm bán hàng 2"],
  "cta": "Kêu gọi hành động phù hợp"
}`;

  return { system, user };
}
