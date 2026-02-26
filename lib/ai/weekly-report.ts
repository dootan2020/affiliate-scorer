import { prisma } from "@/lib/db";
import { getProductLifecycle } from "@/lib/ai/lifecycle";

export interface WeeklyReportData {
  weekStart: string;
  weekEnd: string;
  campaigns: {
    active: number;
    paused: number;
    completed: number;
    best: { name: string; roas: number; profit: number } | null;
    worst: { name: string; roas: number; profit: number } | null;
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

async function getCampaignStats(start: Date, end: Date): Promise<WeeklyReportData["campaigns"]> {
  const [active, paused, completed] = await Promise.all([
    prisma.campaign.count({ where: { status: "running" } }),
    prisma.campaign.count({ where: { status: "paused" } }),
    prisma.campaign.count({ where: { status: "completed", endedAt: { gte: start, lte: end } } }),
  ]);
  const all = await prisma.campaign.findMany({
    where: { status: { in: ["running", "completed"] }, updatedAt: { gte: start } },
    select: { name: true, roas: true, profitLoss: true },
    orderBy: { profitLoss: "desc" },
  });
  const best = all.length > 0
    ? { name: all[0].name, roas: all[0].roas ?? 0, profit: all[0].profitLoss } : null;
  const last = all[all.length - 1];
  const worst = all.length > 1
    ? { name: last.name, roas: last.roas ?? 0, profit: last.profitLoss } : null;
  return { active, paused, completed, best, worst };
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

function buildSuggestions(c: WeeklyReportData["campaigns"], f: WeeklyReportData["financial"]): string[] {
  const s: string[] = [];
  if (f.profit < 0) s.push("Lợi nhuận âm tuần này — ưu tiên giảm chi tiêu và ngừng chiến dịch ROAS < 1");
  if (f.vsLastWeek !== null && f.vsLastWeek < -20)
    s.push("Lợi nhuận giảm mạnh so với tuần trước — xem lại chiến dịch nào gây lỗ");
  if (c.active === 0)
    s.push("Không có chiến dịch đang chạy — bắt đầu chiến dịch mới với sản phẩm điểm cao");
  if (c.best && c.best.roas > 2)
    s.push(`"${c.best.name}" chạy tốt (ROAS ${c.best.roas.toFixed(1)}x) — tăng budget`);
  if (c.worst && c.worst.profit < 0)
    s.push(`"${c.worst.name}" đang lỗ — giảm budget hoặc dừng`);
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
  const [campaigns, financial, topNewProducts, goalProgress] = await Promise.all([
    getCampaignStats(start, end),
    getFinancialStats(start, end),
    getTopNewProducts(start, end),
    getGoalProgress(),
  ]);
  return {
    weekStart: fmt(start),
    weekEnd: fmt(end),
    campaigns,
    financial,
    topNewProducts,
    suggestions: buildSuggestions(campaigns, financial),
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
