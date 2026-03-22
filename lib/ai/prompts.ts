// Phase 02: Rubric-Anchored AI Scoring Prompts
// 4 criteria with explicit 5-tier rubric (20/40/60/80/100)
// Token-efficient: only send fields AI needs for qualitative judgment

import type { Product as ProductModel } from "@/lib/types/product";

export interface WeightMap {
  commission: number;
  trending: number;
  competition: number;
  priceAppeal: number;
  salesVelocity: number;
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

/** Build token-efficient product context for AI scoring */
function buildProductContext(products: ProductModel[]): string {
  return JSON.stringify(
    products.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      commissionRate: p.commissionRate,
      sales7d: p.sales7d,
      totalKOL: p.totalKOL,
      shopRating: p.shopRating,
      platform: p.platform,
    })),
  );
}

export function buildScoringPrompt(input: ScoringPromptInput): {
  system: string;
  user: string;
} {
  const { products } = input;

  // Fix F1/H4: Vietnamese diacritics for better AI comprehension
  const system = `Bạn là chuyên gia affiliate marketing TikTok Shop Việt Nam với 5+ năm kinh nghiệm.
Đánh giá sản phẩm cho creator muốn làm video bán hàng affiliate.

QUAN TRỌNG: Chấm điểm CHÍNH XÁC theo rubric dưới đây. Đừng cho điểm cao quá dễ dàng.
Điểm trung bình nên khoảng 50-60. Chỉ SP thật sự xuất sắc mới đạt 80+.

## Rubric chấm điểm (mỗi tiêu chí 1-5 sao):

### 1. Nhu cầu thị trường (market_demand) — SP có người muốn mua không?
20: SP ngách rất hẹp, ít ai cần, không trending
40: Có nhu cầu nhưng không nổi bật, thị trường bão hòa
60: Nhu cầu ổn, có tìm kiếm, phù hợp một segment
80: Nhu cầu cao, đang hot, nhiều người tìm kiếm
100: Viral potential, giải quyết pain point phổ biến, trending mạnh

### 2. Chất lượng & uy tín (quality_trust) — SP có đáng tin không?
20: Không rõ nguồn gốc, mô tả sơ sài, có dấu hiệu hàng kém chất lượng
40: SP tạm được nhưng không nổi bật, review trung bình
60: SP ổn, có thương hiệu nhỏ, mô tả rõ ràng
80: SP tốt, thương hiệu uy tín, review tốt, có chứng nhận
100: SP xuất sắc, top thương hiệu, best-seller ngành

### 3. Tiềm năng viral (viral_potential) — Dễ làm video hay không?
20: Nhàm chán, khó demo, không có wow factor
40: Có thể demo nhưng video sẽ bình thường
60: Có góc content hấp dẫn, before/after khá
80: Dễ viral — reaction mạnh, transformation rõ, visual đẹp
100: Chắc chắn viral — wow factor cực mạnh, trigger cảm xúc

### 4. Rủi ro (risk) — Bán SP này có rủi ro gì?
20: Rủi ro cao — claim y tế, dễ hoàn, chất cấm, dễ bị report
40: Có rủi ro — SP nhạy cảm, tỷ lệ hoàn cao, cạnh tranh giá khốc liệt
60: Rủi ro trung bình — SP bình thường, không vấn đề lớn
80: Rủi ro thấp — SP an toàn, ít hoàn, category ổn định
100: Gần như không rủi ro — SP thiết yếu, repeat purchase, uy tín cao

Trả về JSON array, KHÔNG text thêm. Mỗi SP:`;

  const outputFormat = `[{
  "id": "product_id",
  "scores": {
    "market_demand": 60,
    "quality_trust": 40,
    "viral_potential": 80,
    "risk": 60
  },
  "aiScore": 58,
  "reason": "1-2 câu giải thích điểm số",
  "contentAngle": "Góc video hay nhất cho SP này"
}]

QUAN TRỌNG:
- aiScore = TRUNG BÌNH CÓ TRỌNG SỐ: market_demand*0.35 + quality_trust*0.25 + viral_potential*0.25 + risk*0.15
- Mỗi tiêu chí CHỈ cho 20/40/60/80/100 (5 mức, không số lẻ)
- Điểm TRUNG BÌNH của toàn batch nên khoảng 50-60, KHÔNG phải 70-80`;

  const anchorExamples = `
VÍ DỤ THAM KHẢO (để calibrate điểm):

SP 85 điểm — Nồi chiên không dầu Xiaomi 5.5L, giá 890K, commission 15%:
  market_demand=80, quality_trust=80, viral_potential=100, risk=80
  → Nhu cầu cao, thương hiệu Xiaomi uy tín, dễ demo trước/sau, an toàn

SP 55 điểm — Ốp lưng iPhone silicon, giá 25K, commission 30%:
  market_demand=60, quality_trust=40, viral_potential=40, risk=80
  → Nhu cầu có nhưng cạnh tranh khốc liệt, chất lượng tạm, khó làm video hay, nhưng an toàn

SP 27 điểm — Viên giảm cân thảo dược XYZ, giá 350K, commission 40%:
  market_demand=40, quality_trust=20, viral_potential=20, risk=20
  → aiScore = 40*0.35 + 20*0.25 + 20*0.25 + 20*0.15 = 27
  → Có người tìm nhưng nhạy cảm, không rõ nguồn gốc, khó demo, rủi ro cao bị report`;

  const user = `Cham diem cho ${products.length} san pham:

${anchorExamples}

Du lieu san pham:
${buildProductContext(products)}

Format tra ve:
${outputFormat}`;

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

  const user = `Phan tich du lieu feedback sau va de xuat cai thien:

Trong so hien tai:
${JSON.stringify(currentWeights, null, 2)}

${previousPatterns && previousPatterns.length > 0 ? `Patterns cu:\n${previousPatterns.join("\n")}\n` : ""}

Du lieu feedback:
${feedbackSummary}

Tra ve JSON:
{
  "accuracy": 0.75,
  "patterns": ["Pattern 1", "Pattern 2"],
  "weightAdjustments": {
    "commission": 0.25,
    "trending": 0.25,
    "competition": 0.20,
    "priceAppeal": 0.15,
    "salesVelocity": 0.15
  },
  "insights": "Tom tat phan tich va chien luoc de xuat."
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

  const user = `De xuat chien luoc noi dung cho san pham:
- Ten: ${productName}
- Danh muc: ${category}
- Gia: ${price.toLocaleString("vi-VN")} VND
- Hoa hong: ${commissionRate}%
- Platform: ${platform}

Tra ve JSON:
{
  "videoType": "Review / Unboxing / Tutorial / So sanh",
  "duration": "60-90 giay",
  "postTime": "19:00-21:00 toi thu 6-7",
  "adsBudget": "500K-1M/ngay",
  "expectedROAS": "3-5x",
  "hooks": ["Hook mo dau 1", "Hook mo dau 2"],
  "keyPoints": ["Diem ban hang 1", "Diem ban hang 2"],
  "cta": "Keu goi hanh dong phu hop"
}`;

  return { system, user };
}
