import { prisma } from "@/lib/db";
import { getProductLifecycle } from "@/lib/ai/lifecycle";

export interface WeeklyReportData {
  weekStart: string;
  weekEnd: string;
  content: {
    created: number;
    published: number;
    logged: number;
    avgReward: number;
    topAsset: { code: string; views: number; reward: number } | null;
  };
  financial: {
    income: number;
    expense: number;
    profit: number;
    vsLastWeek: number | null;
  };
  topNewProducts: Array<{ name: string; aiScore: number; lifecycle: string }>;
  suggestions: string[];
  goalProgress: { target: number; current: number; percent: number } | null;
}

function getWeekBounds(offsetWeeks = 0): { start: Date; end: Date } {
  const now = new Date();
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1) - offsetWeeks * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

function fmt(d: Date): string { return d.toISOString().split("T")[0]; }

async function getContentStats(start: Date, end: Date): Promise<WeeklyReportData["content"]> {
  const [created, published, metrics] = await Promise.all([
    prisma.contentAsset.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.contentAsset.count({ where: { publishedAt: { gte: start, lte: end } } }),
    prisma.assetMetric.findMany({
      where: { capturedAt: { gte: start, lte: end } },
      select: { rewardScore: true, views: true, contentAssetId: true },
    }),
  ]);

  const logged = metrics.length;
  const avgReward = logged > 0
    ? metrics.reduce((s, m) => s + Number(m.rewardScore), 0) / logged
    : 0;

  // Find top asset by views
  let topAsset: WeeklyReportData["content"]["topAsset"] = null;
  if (metrics.length > 0) {
    const sorted = [...metrics].sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
    const top = sorted[0];
    if (top.contentAssetId) {
      const asset = await prisma.contentAsset.findUnique({
        where: { id: top.contentAssetId },
        select: { assetCode: true },
      });
      topAsset = {
        code: asset?.assetCode ?? "unknown",
        views: top.views ?? 0,
        reward: Number(top.rewardScore),
      };
    }
  }

  return { created, published, logged, avgReward: Math.round(avgReward * 10) / 10, topAsset };
}

function sumFinancial(records: Array<{ type: string; amount: number }>): { income: number; expense: number } {
  let income = 0, expense = 0;
  for (const r of records) {
    if (r.type === "commission_received") income += r.amount; else expense += r.amount;
  }
  return { income, expense };
}

async function getFinancialStats(start: Date, end: Date): Promise<WeeklyReportData["financial"]> {
  const records = await prisma.financialRecord.findMany({
    where: { date: { gte: start, lte: end } }, select: { type: true, amount: true },
  });
  const { income, expense } = sumFinancial(records);
  const profit = income - expense;

  const prev = getWeekBounds(1);
  const prevRecs = await prisma.financialRecord.findMany({
    where: { date: { gte: prev.start, lte: prev.end } }, select: { type: true, amount: true },
  });
  const prevSums = sumFinancial(prevRecs);
  const prevProfit = prevSums.income - prevSums.expense;
  const vs = prevProfit !== 0 ? Math.round(((profit - prevProfit) / Math.abs(prevProfit)) * 100) : null;
  return { income: Math.round(income), expense: Math.round(expense), profit: Math.round(profit), vsLastWeek: vs };
}

async function getTopNewProducts(start: Date, end: Date): Promise<WeeklyReportData["topNewProducts"]> {
  const products = await prisma.product.findMany({
    where: { firstSeenAt: { gte: start, lte: end }, aiScore: { not: null } },
    orderBy: { aiScore: "desc" },
    take: 3,
    select: { id: true, name: true, aiScore: true },
  });
  const results: WeeklyReportData["topNewProducts"] = [];
  for (const p of products) {
    const lc = await getProductLifecycle(p.id);
    results.push({ name: p.name, aiScore: p.aiScore ?? 0, lifecycle: lc.stage });
  }
  return results;
}

function buildSuggestions(
  c: WeeklyReportData["content"],
  f: WeeklyReportData["financial"],
): string[] {
  const s: string[] = [];
  if (f.profit < 0) s.push("Lợi nhuận âm tuần này — ưu tiên sản phẩm commission cao hơn");
  if (f.vsLastWeek !== null && f.vsLastWeek < -20)
    s.push("Lợi nhuận giảm mạnh so với tuần trước — xem lại content strategy");
  if (c.published === 0)
    s.push("Chưa publish video tuần này — bắt đầu với sản phẩm điểm cao nhất trong inbox");
  if (c.published > 0 && c.avgReward > 0.5)
    s.push(`Reward trung bình tốt (${c.avgReward.toFixed(1)}) — tăng số lượng video`);
  if (c.published > 0 && c.avgReward < -0.5)
    s.push("Reward trung bình thấp — thử format/hook khác từ playbook");
  if (s.length === 0) s.push("Hoạt động ổn định — tiếp tục theo dõi và tối ưu");
  return s.slice(0, 4);
}

async function getGoalProgress(): Promise<WeeklyReportData["goalProgress"]> {
  const now = new Date();
  const goal = await prisma.goalP5.findFirst({
    where: { periodStart: { lte: now }, periodEnd: { gte: now } },
    orderBy: { createdAt: "desc" },
    select: { targetCommission: true, actualCommission: true },
  });
  if (!goal || !goal.targetCommission) return null;
  const percent = goal.targetCommission > 0
    ? Math.round((goal.actualCommission / goal.targetCommission) * 100)
    : 0;
  return { target: goal.targetCommission, current: goal.actualCommission, percent };
}

export async function generateWeeklyReport(): Promise<WeeklyReportData> {
  const { start, end } = getWeekBounds(0);
  const [content, financial, topNewProducts, goalProgress] = await Promise.all([
    getContentStats(start, end),
    getFinancialStats(start, end),
    getTopNewProducts(start, end),
    getGoalProgress(),
  ]);
  return {
    weekStart: fmt(start),
    weekEnd: fmt(end),
    content,
    financial,
    topNewProducts,
    suggestions: buildSuggestions(content, financial),
    goalProgress,
  };
}

export async function saveWeeklyReport(data: WeeklyReportData): Promise<string> {
  const report = await prisma.weeklyReport.create({
    data: {
      weekStart: new Date(data.weekStart),
      weekEnd: new Date(data.weekEnd),
      reportData: JSON.parse(JSON.stringify(data)),
    },
  });
  return report.id;
}
