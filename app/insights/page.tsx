import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { InsightsPageClient } from "@/components/insights/insights-page-client";
import { TriggerLearningButton } from "@/components/insights/trigger-learning-button";
import { ChannelFilter } from "@/components/insights/channel-filter";
import { ConfidenceWidget } from "@/components/ai/confidence-widget";
import { WeeklyReportCard } from "@/components/ai/weekly-report-card";
import { PlaybookSection } from "@/components/ai/playbook-section";
import type { WeightMap } from "@/lib/ai/prompts";

export const metadata: Metadata = {
  title: "Phân tích",
};

const DEFAULT_WEIGHTS: WeightMap = {
  commission: 0.25, trending: 0.25, competition: 0.20,
  priceAppeal: 0.15, salesVelocity: 0.15,
};

function safeJsonParse<T>(json: string, fallback: T): T {
  try { return JSON.parse(json) as T; } catch { return fallback; }
}

async function getInsights() {
  const [logs, feedbackCount, feedbacks, scoredCount] = await Promise.all([
    prisma.learningLog.findMany({
      orderBy: { runDate: "desc" },
      take: 10,
    }),
    prisma.feedback.count(),
    prisma.feedback.findMany({
      orderBy: { feedbackDate: "desc" },
      take: 100,
      select: {
        id: true,
        aiScoreAtSelection: true,
        adPlatform: true,
        salesPlatform: true,
        adROAS: true,
        revenue: true,
        overallSuccess: true,
        feedbackDate: true,
        product: { select: { name: true } },
      },
    }),
    prisma.product.count({ where: { aiScore: { not: null } } }),
  ]);

  const latestLog = logs[0]
    ? {
        id: logs[0].id,
        weekNumber: logs[0].weekNumber,
        currentAccuracy: logs[0].currentAccuracy,
        previousAccuracy: logs[0].previousAccuracy,
        weightsBefore: safeJsonParse<WeightMap>(logs[0].weightsBefore, DEFAULT_WEIGHTS),
        weightsAfter: safeJsonParse<WeightMap>(logs[0].weightsAfter, DEFAULT_WEIGHTS),
        patternsFound: safeJsonParse<string[]>(logs[0].patternsFound, []),
        insights: logs[0].insights,
      }
    : null;

  const accuracyTrend = [...logs].reverse().map((log) => ({
    weekNumber: log.weekNumber,
    currentAccuracy: log.currentAccuracy,
  }));

  const tableData = feedbacks.map((fb) => ({
    id: fb.id,
    productName: fb.product.name,
    aiScoreAtSelection: fb.aiScoreAtSelection,
    adPlatform: fb.adPlatform,
    salesPlatform: fb.salesPlatform,
    adROAS: fb.adROAS,
    revenue: fb.revenue,
    overallSuccess: fb.overallSuccess,
    feedbackDate: fb.feedbackDate.toISOString(),
  }));

  return {
    latestLog,
    accuracyTrend,
    totalFeedbackCount: feedbackCount,
    feedbackTable: tableData,
    scoredCount,
  };
}

async function getOverviewData() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [
    totalProducts,
    productsWithNotes,
    shopsReviewed,
    incomeRecords,
    expenseRecords,
    upcomingEventsRaw,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { personalNotes: { not: null } } }),
    prisma.shop.count({ where: { commissionReliability: { not: null } } }),
    prisma.financialRecord.aggregate({
      _sum: { amount: true },
      where: {
        type: { in: ["commission_received"] },
        date: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.financialRecord.aggregate({
      _sum: { amount: true },
      where: {
        type: { in: ["ads_spend", "other_cost"] },
        date: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.calendarEvent.findMany({
      where: {
        startDate: { gte: now, lte: thirtyDaysLater },
      },
      orderBy: { startDate: "asc" },
      take: 5,
    }),
  ]);

  const upcomingEvents = upcomingEventsRaw.map((e) => ({
    id: e.id,
    name: e.name,
    startDate: e.startDate.toISOString(),
    daysUntil: Math.ceil(
      (e.startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    ),
  }));

  return {
    totalProducts,
    productsWithNotes,
    shopsReviewed,
    monthIncome: incomeRecords._sum.amount ?? 0,
    monthExpense: expenseRecords._sum.amount ?? 0,
    upcomingEvents,
  };
}

function getConfidenceLabel(feedbackCount: number): string {
  if (feedbackCount >= 100) return "Cao";
  if (feedbackCount >= 50) return "Khá";
  if (feedbackCount >= 20) return "TB";
  if (feedbackCount >= 10) return "Thấp";
  return "Rất thấp";
}

interface InsightsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function InsightsPage({ searchParams }: InsightsPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const channelId = typeof params.channelId === "string" ? params.channelId : undefined;

  const [insights, overview, channels] = await Promise.all([
    getInsights(),
    getOverviewData(),
    prisma.tikTokChannel.findMany({
      where: { isActive: true },
      select: { id: true, name: true, personaName: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const confidenceLabel = getConfidenceLabel(insights.totalFeedbackCount);

  const channelOptions = channels.map((ch) => ({
    id: ch.id,
    name: ch.name,
    personaName: ch.personaName,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-gray-900 dark:text-gray-50">
            AI Insights
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Phân tích từ {insights.totalFeedbackCount} feedback thực tế
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Suspense>
            <ChannelFilter channels={channelOptions} currentChannelId={channelId} />
          </Suspense>
          <TriggerLearningButton />
        </div>
      </div>

      <Suspense>
        <InsightsPageClient
          totalProducts={overview.totalProducts}
          productsWithNotes={overview.productsWithNotes}
          shopsReviewed={overview.shopsReviewed}
          totalFeedbackCount={insights.totalFeedbackCount}
          scoredCount={insights.scoredCount}
          monthIncome={overview.monthIncome}
          monthExpense={overview.monthExpense}
          upcomingEvents={overview.upcomingEvents}
          confidenceLabel={confidenceLabel}
          latestLog={insights.latestLog}
          accuracyTrend={insights.accuracyTrend}
          feedbackTable={insights.feedbackTable}
          channelId={channelId}
        />
      </Suspense>

      {/* Phase 4: AI Intelligence */}
      <div className="space-y-6 mt-8">
        <h2 className="text-xl font-medium text-gray-900 dark:text-gray-50">AI Intelligence</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ConfidenceWidget />
          <WeeklyReportCard />
        </div>
        <PlaybookSection />
      </div>
    </div>
  );
}
