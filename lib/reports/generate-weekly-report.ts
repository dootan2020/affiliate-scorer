// Phase 5: Weekly auto-report generator
import { prisma } from "@/lib/db";
import { callClaude } from "@/lib/ai/claude";

interface WeeklyReportContent {
  summary: string;
  wins: string[];
  improvements: string[];
  next_week_focus: string;
  playbook_update: string;
}

const SYSTEM_PROMPT = `Bạn là AI analyst cho affiliate content creator TikTok Việt Nam.
Tạo báo cáo tuần ngắn gọn, actionable. Output luôn là JSON hợp lệ, không markdown code fences.`;

export async function generateWeeklyReport(weekStart?: Date): Promise<string | null> {
  // Determine week range
  const now = new Date();
  const start = weekStart || getMonday(now);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  // Gather data
  const [assets, metrics, commissions, weights, patterns] = await Promise.all([
    // Videos in this week
    prisma.contentAsset.findMany({
      where: {
        OR: [
          { publishedAt: { gte: start, lt: end } },
          { createdAt: { gte: start, lt: end } },
        ],
      },
      select: {
        id: true,
        assetCode: true,
        hookType: true,
        format: true,
        angle: true,
        status: true,
        metrics: { orderBy: { capturedAt: "desc" }, take: 1, select: { views: true } },
      },
    }),

    // All metrics this week
    prisma.assetMetric.findMany({
      where: { capturedAt: { gte: start, lt: end } },
      select: { views: true, likes: true, shares: true, saves: true, rewardScore: true },
    }),

    // Commissions this week
    prisma.commission.findMany({
      where: {
        earnedDate: { gte: start, lt: end },
        status: { not: "rejected" },
      },
      select: { amount: true },
    }),

    // Top learning weights
    prisma.learningWeightP4.findMany({
      orderBy: { weight: "desc" },
      take: 15,
    }),

    // Detected patterns
    prisma.userPattern.findMany({
      where: { sampleSize: { gte: 2 } },
      orderBy: { sampleSize: "desc" },
      take: 5,
    }),
  ]);

  const videosCreated = assets.length;
  const videosPublished = assets.filter((a) => a.status === "published").length;

  if (videosPublished < 5) {
    return null; // Not enough data
  }

  const totalViews = metrics.reduce((s, m) => s + (m.views || 0), 0);
  const avgViews = videosPublished > 0 ? Math.round(totalViews / videosPublished) : 0;
  const weekCommission = commissions.reduce((s, c) => s + c.amount, 0);

  // Top/Bottom videos by views
  const sortedAssets = assets
    .filter((a) => a.metrics.length > 0)
    .sort((a, b) => (b.metrics[0]?.views || 0) - (a.metrics[0]?.views || 0));

  const topVideos = sortedAssets.slice(0, 3).map((a) => ({
    hook: a.hookType || "unknown",
    format: a.format || "unknown",
    views: a.metrics[0]?.views || 0,
    product: a.assetCode,
  }));

  const bottomVideos = sortedAssets.slice(-3).reverse().map((a) => ({
    hook: a.hookType || "unknown",
    format: a.format || "unknown",
    views: a.metrics[0]?.views || 0,
    product: a.assetCode,
  }));

  // Learning insights
  const winningHooks = weights
    .filter((w) => w.scope === "hook_type" && Number(w.weight) > 1)
    .map((w) => w.key);
  const losingHooks = weights
    .filter((w) => w.scope === "hook_type" && Number(w.weight) < 0.5)
    .map((w) => w.key);
  const winningFormats = weights
    .filter((w) => w.scope === "format" && Number(w.weight) > 1)
    .map((w) => w.key);

  // Monthly commission (accumulative)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthCommissions = await prisma.commission.findMany({
    where: {
      earnedDate: { gte: monthStart, lt: monthEnd },
      status: { not: "rejected" },
    },
    select: { amount: true },
  });
  const monthCommission = monthCommissions.reduce((s, c) => s + c.amount, 0);

  const weekNumber = getWeekNumber(start);
  const startStr = start.toLocaleDateString("vi-VN");
  const endStr = end.toLocaleDateString("vi-VN");

  const prompt = `
Tạo báo cáo tuần ${weekNumber} (${startStr} — ${endStr}).

SẢN XUẤT:
- Videos tạo: ${videosCreated}
- Videos đăng: ${videosPublished}
- Tổng views: ${totalViews.toLocaleString()}
- Avg views/video: ${avgViews.toLocaleString()}

TOP 3 VIDEO:
${topVideos.map((v, i) => `${i + 1}. Hook "${v.hook}" | ${v.views.toLocaleString()} views | ${v.format} | ${v.product}`).join("\n")}

BOTTOM 3 VIDEO:
${bottomVideos.map((v, i) => `${i + 1}. Hook "${v.hook}" | ${v.views.toLocaleString()} views | ${v.format} | ${v.product}`).join("\n")}

LEARNING:
- Hook win: ${winningHooks.length > 0 ? winningHooks.join(", ") : "chưa đủ data"}
- Hook lose: ${losingHooks.length > 0 ? losingHooks.join(", ") : "chưa có"}
- Format win: ${winningFormats.length > 0 ? winningFormats.join(", ") : "chưa đủ data"}

PATTERNS:
${patterns.length > 0 ? patterns.map((p) => `- ${p.patternType}: ${p.label}`).join("\n") : "Chưa phát hiện pattern rõ ràng"}

COMMISSION:
- Tuần này: ${weekCommission.toLocaleString()}đ
- Tháng này (tích lũy): ${monthCommission.toLocaleString()}đ

Output JSON:
{
  "summary": "2-3 câu tóm tắt tuần",
  "wins": ["Điều tốt 1", "Điều tốt 2"],
  "improvements": ["Cần cải thiện 1", "Cần cải thiện 2"],
  "next_week_focus": "Tuần tới nên tập trung gì",
  "playbook_update": "Pattern mới phát hiện (nếu có)"
}

Chỉ output JSON, không text khác.`.trim();

  const rawResponse = await callClaude(SYSTEM_PROMPT, prompt, 1500);

  let jsonStr = rawResponse.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  let content: WeeklyReportContent;
  try {
    content = JSON.parse(jsonStr);
  } catch (parseError) {
    console.error("[generateWeeklyReport] JSON parse failed:", parseError, "Raw:", jsonStr.substring(0, 200));
    content = {
      summary: "Không thể phân tích báo cáo tuần",
      wins: [],
      improvements: [],
      next_week_focus: "",
      playbook_update: "",
    };
  }

  // Save to DB — use DailyBrief with a special convention: briefDate = Monday of the week
  const saved = await prisma.dailyBrief.upsert({
    where: { briefDate: start },
    create: {
      briefDate: start,
      content: JSON.parse(JSON.stringify({
        type: "weekly_report",
        weekNumber,
        startDate: startStr,
        endDate: endStr,
        stats: { videosCreated, videosPublished, totalViews, avgViews, weekCommission, monthCommission },
        ...content,
      })),
      aiModel: "claude-haiku-4-5",
    },
    update: {
      content: JSON.parse(JSON.stringify({
        type: "weekly_report",
        weekNumber,
        startDate: startStr,
        endDate: endStr,
        stats: { videosCreated, videosPublished, totalViews, avgViews, weekCommission, monthCommission },
        ...content,
      })),
      generatedAt: new Date(),
    },
  });

  return saved.id;
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getWeekNumber(d: Date): number {
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d.getTime() - oneJan.getTime()) / (1000 * 60 * 60 * 24));
  return Math.ceil((days + oneJan.getDay() + 1) / 7);
}
