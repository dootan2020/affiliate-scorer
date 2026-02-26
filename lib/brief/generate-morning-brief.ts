// Phase 5: Morning Brief generator — "Hôm nay sản xuất gì?"
import { prisma } from "@/lib/db";
import { callAI } from "@/lib/ai/call-ai";

interface BriefContent {
  greeting: string;
  produce_today: Array<{ product: string; reason: string; videos: number; priority: number }>;
  new_products_alert: Array<{ product: string; why: string }>;
  yesterday_recap: string;
  tip: string;
  weekly_progress: string;
}

const SYSTEM_PROMPT = `Bạn là AI thư ký cho affiliate marketer TikTok Việt Nam.
Tạo Morning Brief ngắn gọn, actionable. Output luôn là JSON hợp lệ, không có markdown code fences.`;

export async function generateMorningBrief(): Promise<string> {
  const today = new Date();
  const todayStr = today.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric", year: "numeric" });

  // Gather data
  const [newProducts, briefedProducts, yesterdayMetrics, topWeights, currentGoal] = await Promise.all([
    // SP mới chưa tạo content
    prisma.productIdentity.findMany({
      where: { inboxState: { in: ["scored", "enriched"] } },
      orderBy: { combinedScore: "desc" },
      take: 10,
      select: { id: true, title: true, deltaType: true, combinedScore: true, contentPotentialScore: true },
    }),
    // SP đã có brief chưa sản xuất
    prisma.productIdentity.findMany({
      where: { inboxState: "briefed" },
      take: 5,
      select: { id: true, title: true, _count: { select: { briefs: true } } },
    }),
    // Metrics hôm qua
    getYesterdayStats(),
    // Learning weights
    prisma.learningWeightP4.findMany({
      orderBy: { weight: "desc" },
      take: 10,
    }),
    // Current goal
    prisma.goalP5.findFirst({
      where: {
        periodType: "weekly",
        periodStart: { lte: today },
        periodEnd: { gte: today },
      },
    }),
  ]);

  // Top hook/format
  const topHook = topWeights.find((w) => w.scope === "hook_type")?.key || "chưa có data";
  const topFormat = topWeights.find((w) => w.scope === "format")?.key || "chưa có data";
  const topCategories = topWeights
    .filter((w) => w.scope === "category")
    .slice(0, 3)
    .map((w) => w.key);

  const prompt = `
Tạo Morning Brief cho ngày ${todayStr}.

SẢN PHẨM MỚI (chưa tạo content):
${newProducts.length > 0
    ? newProducts.map((p) => `- ${p.title || "Chưa có tên"} | ${p.deltaType || "?"} | Score: ${p.combinedScore || "?"}`).join("\n")
    : "Không có SP mới"}

SẢN PHẨM ĐÃ CÓ BRIEF (chưa sản xuất):
${briefedProducts.length > 0
    ? briefedProducts.map((p) => `- ${p.title || "Chưa có tên"} | ${p._count.briefs} briefs`).join("\n")
    : "Không có"}

KẾT QUẢ HÔM QUA:
- Videos đăng: ${yesterdayMetrics.published}
- Tổng views: ${yesterdayMetrics.totalViews}
- Reward trung bình: ${yesterdayMetrics.avgReward.toFixed(1)}

LEARNING INSIGHTS:
- Hook tốt nhất: ${topHook}
- Format tốt nhất: ${topFormat}
- Category mạnh: ${topCategories.length > 0 ? topCategories.join(", ") : "chưa có"}

MỤC TIÊU TUẦN:
${currentGoal
    ? `- Target: ${currentGoal.targetVideos || "?"} videos\n- Đã làm: ${currentGoal.actualVideos} videos\n- Còn lại: ${(currentGoal.targetVideos || 0) - currentGoal.actualVideos}`
    : "Chưa đặt mục tiêu"}

Output JSON:
{
  "greeting": "Chào buổi sáng ngắn gọn",
  "produce_today": [{ "product": "Tên SP", "reason": "Tại sao", "videos": 3, "priority": 1 }],
  "new_products_alert": [{ "product": "Tên SP", "why": "Tại sao đáng chú ý" }],
  "yesterday_recap": "1-2 câu tóm tắt",
  "tip": "1 gợi ý content dựa trên learning",
  "weekly_progress": "X/Y videos, còn Z ngày"
}

Chỉ output JSON, không text khác.`.trim();

  const rawResponse = await callAI(SYSTEM_PROMPT, prompt, 2000, "morning_brief");

  // Parse JSON
  let jsonStr = rawResponse.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  let content: BriefContent;
  try {
    content = JSON.parse(jsonStr);
  } catch (parseError) {
    console.error("[generateMorningBrief] JSON parse failed:", parseError, "Raw:", jsonStr.substring(0, 200));
    content = {
      greeting: "Chào buổi sáng!",
      produce_today: [],
      new_products_alert: [],
      yesterday_recap: "Không thể phân tích dữ liệu hôm qua",
      tip: "Thử lại sau",
      weekly_progress: "",
    };
  }

  // Save to DB
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const saved = await prisma.dailyBrief.upsert({
    where: { briefDate: todayDate },
    create: {
      briefDate: todayDate,
      content: JSON.parse(JSON.stringify(content)),
      aiModel: "claude-haiku-4-5",
    },
    update: {
      content: JSON.parse(JSON.stringify(content)),
      generatedAt: new Date(),
    },
  });

  return saved.id;
}

async function getYesterdayStats(): Promise<{
  published: number;
  totalViews: number;
  avgReward: number;
}> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const published = await prisma.contentAsset.count({
    where: {
      publishedAt: { gte: yesterday, lt: today },
    },
  });

  const metrics = await prisma.assetMetric.findMany({
    where: {
      capturedAt: { gte: yesterday, lt: today },
    },
    select: { views: true, rewardScore: true },
  });

  const totalViews = metrics.reduce((s, m) => s + (m.views || 0), 0);
  const avgReward = metrics.length > 0
    ? metrics.reduce((s, m) => s + Number(m.rewardScore), 0) / metrics.length
    : 0;

  return { published, totalViews, avgReward };
}
