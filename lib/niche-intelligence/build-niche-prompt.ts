import type { QuestionnaireAnswers, NicheStats } from "./types";

const SYSTEM_PROMPT = `Ban la chuyen gia tu van ngach (niche) cho nguoi lam affiliate TikTok tai Viet Nam.
Nhiem vu: Phan tich thong tin nguoi dung + du lieu thi truong -> goi y 3-5 ngach phu hop nhat.

Yeu cau:
- Tra loi bang tieng Viet
- Moi goi y phai co ly do cu the, khong chung chung
- Danh gia muc do canh tranh thuc te tren TikTok Viet Nam
- Goi y content ideas cu the, co the lam ngay
- Uoc tinh thu nhap thuc te (khong phai hua suong)

Tra ve JSON THUAN (khong markdown, khong code block) voi format:
{
  "recommendations": [
    {
      "nicheKey": "beauty_skincare",
      "nicheLabel": "Lam dep & Skincare",
      "score": 85,
      "reasoning": "Ly do cu the...",
      "marketInsight": "Thong tin thi truong...",
      "competitionLevel": "medium",
      "contentIdeas": ["Y tuong 1", "Y tuong 2", "Y tuong 3"],
      "estimatedEarning": "3-8 trieu/thang"
    }
  ],
  "summary": "Tom tat phan tich tong the..."
}

Cac ngach pho bien tren TikTok Viet Nam:
- beauty_skincare: Lam dep, skincare, my pham
- fashion: Thoi trang, phu kien
- food: Do an, do uong, snack
- home_living: Do gia dung, noi that, bep
- health: Suc khoe, thuc pham chuc nang, fitness
- tech: Cong nghe, dien tu, phu kien dien thoai
- mom_baby: Me va be, do tre em
- pet: Thu cung, phu kien thu cung
- stationery: Van phong pham, do hoc tap
- lifestyle: Phong cach song, du lich, cafe`;

export function buildNichePrompt(
  answers: QuestionnaireAnswers,
  stats: NicheStats[]
): { systemPrompt: string; userPrompt: string } {
  const interestLabels: Record<string, string> = {
    beauty_skincare: "Lam dep & Skincare",
    fashion: "Thoi trang",
    food: "Do an & Do uong",
    home_living: "Do gia dung",
    health: "Suc khoe",
    tech: "Cong nghe",
    mom_baby: "Me va be",
    pet: "Thu cung",
    stationery: "Van phong pham",
    lifestyle: "Phong cach song",
  };

  const experienceLabels: Record<string, string> = {
    beginner: "Moi bat dau, chua co kinh nghiem",
    intermediate: "Da lam 3-6 thang, co kinh nghiem co ban",
    expert: "Chuyen nghiep, da co thu nhap on dinh",
  };

  const goalLabels: Record<string, string> = {
    passive_income: "Thu nhap thu dong",
    full_time: "Lam full-time",
    brand_building: "Xay dung thuong hieu ca nhan",
    quick_money: "Kiem tien nhanh",
  };

  const budgetLabels: Record<string, string> = {
    zero: "Khong co ngan sach (chi organic)",
    low: "Duoi 1 trieu/thang",
    medium: "1-5 trieu/thang",
    high: "Tren 5 trieu/thang",
  };

  // Build user context section
  const userContext = [
    `## Thong tin nguoi dung`,
    `- Linh vuc quan tam: ${answers.interests.map((i) => interestLabels[i] ?? i).join(", ")}`,
    `- Kinh nghiem: ${experienceLabels[answers.experience] ?? answers.experience}`,
    `- Muc tieu: ${answers.goals.map((g) => goalLabels[g] ?? g).join(", ")}`,
    `- Phong cach noi dung: ${answers.contentStyle.join(", ")}`,
    `- Ngan sach: ${budgetLabels[answers.budget] ?? answers.budget}`,
  ].join("\n");

  // Build market data section
  let marketData = "\n## Du lieu thi truong tu he thong\n";
  if (stats.length === 0) {
    marketData +=
      "Chua co du lieu san pham trong he thong. Hay dua vao kien thuc thi truong TikTok Viet Nam de tu van.\n";
  } else {
    for (const s of stats) {
      marketData += `\n### ${interestLabels[s.nicheKey] ?? s.nicheKey}\n`;
      marketData += `- So san pham: ${s.productCount}\n`;
      marketData += `- Diem trung binh: ${s.avgScore?.toFixed(1) ?? "N/A"}\n`;
      marketData += `- So kenh dang hoat dong: ${s.channelCount}\n`;
      if (s.topProducts.length > 0) {
        marketData += `- Top san pham: ${s.topProducts.map((p) => `${p.title} (${p.score.toFixed(1)})`).join(", ")}\n`;
      }
    }
  }

  const userPrompt = userContext + marketData + "\n\nHay phan tich va goi y 3-5 ngach phu hop nhat.";

  return { systemPrompt: SYSTEM_PROMPT, userPrompt };
}
