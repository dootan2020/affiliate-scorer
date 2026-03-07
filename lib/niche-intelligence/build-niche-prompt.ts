import type { QuestionnaireAnswers, NicheStats } from "./types";

const SYSTEM_PROMPT = `Bạn là chuyên gia tư vấn ngách (niche) cho người làm affiliate TikTok tại Việt Nam.
Nhiệm vụ: Phân tích thông tin người dùng + dữ liệu thị trường -> gợi ý 3-5 ngách phù hợp nhất.

Yêu cầu:
- Trả lời bằng tiếng Việt
- Mỗi gợi ý phải có lý do cụ thể, không chung chung
- Đánh giá mức độ cạnh tranh thực tế trên TikTok Việt Nam
- Gợi ý content ideas cụ thể, có thể làm ngay
- Ước tính thu nhập thực tế (không phải hứa suông)

Trả về JSON THUẦN (không markdown, không code block) với format:
{
  "recommendations": [
    {
      "nicheKey": "beauty_skincare",
      "nicheLabel": "Làm đẹp & Skincare",
      "score": 85,
      "reasoning": "Lý do cụ thể...",
      "marketInsight": "Thông tin thị trường...",
      "competitionLevel": "medium",
      "contentIdeas": ["Ý tưởng 1", "Ý tưởng 2", "Ý tưởng 3"],
      "estimatedEarning": "3-8 triệu/tháng"
    }
  ],
  "summary": "Tóm tắt phân tích tổng thể..."
}

Các ngách phổ biến trên TikTok Việt Nam:
- beauty_skincare: Làm đẹp, skincare, mỹ phẩm
- fashion: Thời trang, phụ kiện
- food: Đồ ăn, đồ uống, snack
- home_living: Đồ gia dụng, nội thất, bếp
- health: Sức khỏe, thực phẩm chức năng, fitness
- tech: Công nghệ, điện tử, phụ kiện điện thoại
- mom_baby: Mẹ và bé, đồ trẻ em
- pet: Thú cưng, phụ kiện thú cưng
- stationery: Văn phòng phẩm, đồ học tập
- lifestyle: Phong cách sống, du lịch, cafe`;

export function buildNichePrompt(
  answers: QuestionnaireAnswers,
  stats: NicheStats[]
): { systemPrompt: string; userPrompt: string } {
  const interestLabels: Record<string, string> = {
    beauty_skincare: "Làm đẹp & Skincare",
    fashion: "Thời trang",
    food: "Đồ ăn & Đồ uống",
    home_living: "Đồ gia dụng",
    health: "Sức khỏe",
    tech: "Công nghệ",
    mom_baby: "Mẹ và bé",
    pet: "Thú cưng",
    stationery: "Văn phòng phẩm",
    lifestyle: "Phong cách sống",
  };

  const experienceLabels: Record<string, string> = {
    beginner: "Mới bắt đầu, chưa có kinh nghiệm",
    intermediate: "Đã làm 3-6 tháng, có kinh nghiệm cơ bản",
    expert: "Chuyên nghiệp, đã có thu nhập ổn định",
  };

  const goalLabels: Record<string, string> = {
    passive_income: "Thu nhập thụ động",
    full_time: "Làm full-time",
    brand_building: "Xây dựng thương hiệu cá nhân",
    quick_money: "Kiếm tiền nhanh",
  };

  const budgetLabels: Record<string, string> = {
    zero: "Không có ngân sách (chỉ organic)",
    low: "Dưới 1 triệu/tháng",
    medium: "1-5 triệu/tháng",
    high: "Trên 5 triệu/tháng",
  };

  // Build user context section
  const userContext = [
    `## Thông tin người dùng`,
    `- Lĩnh vực quan tâm: ${answers.interests.map((i) => interestLabels[i] ?? i).join(", ")}`,
    `- Kinh nghiệm: ${experienceLabels[answers.experience] ?? answers.experience}`,
    `- Mục tiêu: ${answers.goals.map((g) => goalLabels[g] ?? g).join(", ")}`,
    `- Phong cách nội dung: ${answers.contentStyle.join(", ")}`,
    `- Ngân sách: ${budgetLabels[answers.budget] ?? answers.budget}`,
  ].join("\n");

  // Build market data section
  let marketData = "\n## Dữ liệu thị trường từ hệ thống\n";
  if (stats.length === 0) {
    marketData +=
      "Chưa có dữ liệu sản phẩm trong hệ thống. Hãy dựa vào kiến thức thị trường TikTok Việt Nam để tư vấn.\n";
  } else {
    for (const s of stats) {
      marketData += `\n### ${interestLabels[s.nicheKey] ?? s.nicheKey}\n`;
      marketData += `- Số sản phẩm: ${s.productCount}\n`;
      marketData += `- Điểm trung bình: ${s.avgScore?.toFixed(1) ?? "N/A"}\n`;
      marketData += `- Số kênh đang hoạt động: ${s.channelCount}\n`;
      if (s.topProducts.length > 0) {
        marketData += `- Top sản phẩm: ${s.topProducts.map((p) => `${p.title} (${p.score.toFixed(1)})`).join(", ")}\n`;
      }
    }
  }

  const userPrompt = userContext + marketData + "\n\nHãy phân tích và gợi ý 3-5 ngách phù hợp nhất.";

  return { systemPrompt: SYSTEM_PROMPT, userPrompt };
}
