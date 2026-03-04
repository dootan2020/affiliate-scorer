// Phase 5: Morning Brief generator — "Hôm nay sản xuất gì?"
import { prisma } from "@/lib/db";
import { callAI } from "@/lib/ai/call-ai";

interface BriefContent {
  greeting: string;
  channel_tasks?: Array<{ channel: string; channelId?: string; action: string; priority: number }>;
  produce_today: Array<{ product: string; productId?: string; reason: string; videos: number; priority: number }>;
  new_products_alert: Array<{ product: string; productId?: string; why: string }>;
  upcoming_events?: Array<{ title: string; date: string }>;
  yesterday_recap: string;
  tip: string;
  weekly_progress: string;
}

const SYSTEM_PROMPT = `Bạn là AI thư ký cho affiliate marketer TikTok Việt Nam.
Tạo Morning Brief ngắn gọn, actionable. Output luôn là JSON hợp lệ, không có markdown code fences.
QUAN TRỌNG: Với mỗi sản phẩm, PHẢI trả về đúng productId đã cung cấp. Với mỗi kênh, PHẢI trả về đúng channelId đã cung cấp.`;

export async function generateMorningBrief(): Promise<string> {
  const today = new Date();
  const todayStr = today.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric", year: "numeric" });

  // Today boundaries for channel queries
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  // 7 days from now for upcoming events
  const sevenDaysLater = new Date(todayStart);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

  // Gather data
  const [newProducts, briefedProducts, yesterdayMetrics, topWeights, currentGoal, activeChannels, upcomingEvents, winningPatterns, losingPatterns] = await Promise.all([
    // SP mới chưa tạo content
    prisma.productIdentity.findMany({
      where: { inboxState: { in: ["scored", "enriched"] } },
      orderBy: { combinedScore: "desc" },
      take: 10,
      select: { id: true, title: true, deltaType: true, combinedScore: true, contentPotentialScore: true, category: true },
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
    // Active channels with today's slot counts + draft counts
    prisma.tikTokChannel.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        personaName: true,
        contentSlots: {
          where: { scheduledDate: { gte: todayStart, lt: tomorrowStart } },
          select: { status: true },
        },
        contentAssets: {
          where: { status: "draft" },
          select: { id: true },
        },
        _count: {
          select: { contentAssets: true },
        },
      },
    }),
    // Upcoming calendar events (next 7 days)
    prisma.calendarEvent.findMany({
      where: {
        startDate: { gte: todayStart, lte: sevenDaysLater },
      },
      orderBy: { startDate: "asc" },
      take: 5,
      select: { name: true, startDate: true, eventType: true },
    }),
    // Winning patterns from learning
    prisma.userPattern.findMany({
      where: { patternType: "winning", sampleSize: { gte: 2 } },
      orderBy: { winRate: "desc" },
      take: 3,
      select: { label: true, winRate: true, avgViews: true, sampleSize: true, conditions: true },
    }),
    // Losing patterns to avoid
    prisma.userPattern.findMany({
      where: { patternType: "losing", sampleSize: { gte: 2 }, winRate: { not: null } },
      orderBy: { winRate: "asc" },
      take: 2,
      select: { label: true, winRate: true, sampleSize: true },
    }),
  ]);

  // Top hook/format
  const topHook = topWeights.find((w) => w.scope === "hook_type")?.key || "chưa có data";
  const topFormat = topWeights.find((w) => w.scope === "format")?.key || "chưa có data";
  const topCategories = topWeights
    .filter((w) => w.scope === "category")
    .slice(0, 3)
    .map((w) => w.key);

  // Build channel summary with IDs
  const channelLines = activeChannels.map((ch) => {
    const totalSlots = ch.contentSlots.length;
    const planned = ch.contentSlots.filter((s) => s.status === "planned").length;
    const briefed = ch.contentSlots.filter((s) => s.status === "briefed").length;
    const draftCount = ch.contentAssets.length;
    const totalAssets = ch._count.contentAssets;

    let classification: string;
    if (totalAssets === 0) {
      classification = "Kênh mới — cần tạo brief đầu tiên";
    } else if (draftCount > 0) {
      classification = `Có ${draftCount} draft chờ xuất bản`;
    } else {
      classification = `${totalAssets} assets tổng`;
    }

    return `- ${ch.name} (channelId: ${ch.id}, persona: ${ch.personaName}): ${classification} | ${totalSlots} slots today (${planned} planned, ${briefed} briefed)`;
  });

  // Build product lines with IDs
  const productLines = newProducts.map((p) =>
    `- ${p.title || "Chưa có tên"} (productId: ${p.id}) | ${p.deltaType || "?"} | Score: ${p.combinedScore || "?"}`
  );

  const briefedLines = briefedProducts.map((p) =>
    `- ${p.title || "Chưa có tên"} (productId: ${p.id}) | ${p._count.briefs} briefs`
  );

  // Build event lines
  const eventLines = upcomingEvents.map((e) => {
    const dateStr = new Date(e.startDate).toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" });
    return `- ${e.name} (${e.eventType}) — ngày ${dateStr}`;
  });

  // Build pattern lines with product cross-references
  const winPatternLines = winningPatterns.map((p) => {
    const raw = p.conditions;
    const cond = raw !== null && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : null;
    const category = typeof cond?.category === "string" ? cond.category : undefined;
    const hookType = typeof cond?.hook_type === "string" ? cond.hook_type : "?";
    const format = typeof cond?.format === "string" ? cond.format : "?";
    const matchingProducts = category
      ? newProducts
          .filter((prod) => prod.category?.toLowerCase() === category.toLowerCase())
          .slice(0, 2)
          .map((prod) => prod.title || "?")
      : [];
    const productNote = matchingProducts.length > 0
      ? ` | SP phù hợp: ${matchingProducts.join(", ")}`
      : "";
    const viewsStr = p.avgViews != null ? `${p.avgViews} avg views` : "chưa có data views";
    return `- ${p.label} | Win rate: ${(Number(p.winRate ?? 0) * 100).toFixed(0)}% | ${viewsStr} | ${p.sampleSize} videos | Hook: ${hookType}, Format: ${format}${productNote}`;
  });

  const losePatternLines = losingPatterns.map((p) =>
    `- ${p.label} | Win rate: ${(Number(p.winRate ?? 0) * 100).toFixed(0)}% | ${p.sampleSize} videos`
  );

  const prompt = `
Tạo Morning Brief cho ngày ${todayStr}.

KÊNH HOẠT ĐỘNG:
${channelLines.length > 0 ? channelLines.join("\n") : "CHƯA CÓ KÊNH — đề xuất tạo kênh đầu tiên"}

SẢN PHẨM MỚI (chưa tạo content):
${productLines.length > 0 ? productLines.join("\n") : "Không có SP mới"}

SẢN PHẨM ĐÃ CÓ BRIEF (chưa sản xuất):
${briefedLines.length > 0 ? briefedLines.join("\n") : "Không có"}

SỰ KIỆN SẮP TỚI (7 ngày):
${eventLines.length > 0 ? eventLines.join("\n") : "Không có sự kiện"}

KẾT QUẢ HÔM QUA:
- Videos đăng: ${yesterdayMetrics.published}
- Tổng views: ${yesterdayMetrics.totalViews}
- Reward trung bình: ${yesterdayMetrics.avgReward.toFixed(1)}

LEARNING INSIGHTS:
- Hook tốt nhất: ${topHook}
- Format tốt nhất: ${topFormat}
- Category mạnh: ${topCategories.length > 0 ? topCategories.join(", ") : "chưa có"}

WINNING PATTERNS (đã chứng minh hiệu quả):
${winPatternLines.length > 0 ? winPatternLines.join("\n") : "Chưa phát hiện pattern"}

PATTERNS NÊN TRÁNH:
${losePatternLines.length > 0 ? losePatternLines.join("\n") : "Chưa có"}

MỤC TIÊU TUẦN:
${currentGoal
    ? `- Target: ${currentGoal.targetVideos || "?"} videos\n- Đã làm: ${currentGoal.actualVideos} videos\n- Còn lại: ${(currentGoal.targetVideos || 0) - currentGoal.actualVideos}`
    : "Chưa đặt mục tiêu"}

Output JSON (trả về ĐÚNG channelId và productId đã cung cấp ở trên, KHÔNG bịa ra):
{
  "greeting": "Chào buổi sáng ngắn gọn",
  "channel_tasks": [{ "channel": "Tên kênh", "channelId": "id_kênh", "action": "Việc cần làm", "priority": 1 }],
  "produce_today": [{ "product": "Tên SP", "productId": "id_sp", "reason": "Tại sao", "videos": 3, "priority": 1 }],
  "new_products_alert": [{ "product": "Tên SP", "productId": "id_sp", "why": "Tại sao đáng chú ý" }],
  "upcoming_events": [{ "title": "Tên sự kiện", "date": "dd/mm" }],
  "yesterday_recap": "1-2 câu tóm tắt",
  "tip": "1 gợi ý content dựa trên learning + winning patterns (nêu cụ thể combo hook+format nào, SP nào phù hợp)",
  "weekly_progress": "X/Y videos, còn Z ngày"
}

Chỉ output JSON, không text khác.`.trim();

  const { text: rawResponse, modelUsed } = await callAI(SYSTEM_PROMPT, prompt, 2000, "morning_brief");

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
      channel_tasks: [],
      produce_today: [],
      new_products_alert: [],
      upcoming_events: [],
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
      aiModel: modelUsed,
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
