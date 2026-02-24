import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { AccuracyChart } from "@/components/insights/accuracy-chart";
import { PatternList } from "@/components/insights/pattern-list";
import { WeeklyReport } from "@/components/insights/weekly-report";
import { TriggerLearningButton } from "@/components/insights/trigger-learning-button";
import { FeedbackTable } from "@/components/feedback/feedback-table";
import { Sparkles, MessageSquare, Upload } from "lucide-react";
import type { WeightMap } from "@/lib/ai/prompts";

export const metadata: Metadata = {
  title: "AI Insights | AffiliateScorer",
};

const DEFAULT_WEIGHTS: WeightMap = {
  commission: 0.2, trending: 0.2, competition: 0.2,
  contentFit: 0.15, price: 0.15, platform: 0.1,
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

export default async function InsightsPage() {
  const { latestLog, accuracyTrend, totalFeedbackCount, feedbackTable, scoredCount } =
    await getInsights();

  const confidenceLabel =
    totalFeedbackCount === 0
      ? "RẤT THẤP"
      : totalFeedbackCount < 10
        ? "THẤP"
        : totalFeedbackCount < 30
          ? "TRUNG BÌNH"
          : "CAO";

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
            AI Insights
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Phân tích từ {totalFeedbackCount} feedback thực tế
          </p>
        </div>
        <TriggerLearningButton />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Feedback</p>
          <p className="text-3xl font-semibold text-gray-900 dark:text-gray-50">
            {totalFeedbackCount}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">bản ghi</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Độ tin cậy</p>
          <p className="text-3xl font-semibold text-gray-900 dark:text-gray-50">
            {confidenceLabel}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {totalFeedbackCount}/{scoredCount > 20 ? 20 : scoredCount} SP
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Lần học gần nhất</p>
          <p className="text-3xl font-semibold text-gray-900 dark:text-gray-50">
            {latestLog ? `W${latestLog.weekNumber}` : "—"}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {latestLog
              ? `Accuracy: ${(latestLog.currentAccuracy * 100).toFixed(0)}%`
              : "Chưa chạy"}
          </p>
        </div>
      </div>

      {/* Learning results */}
      {latestLog && (
        <>
          <section className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50">
              Kết quả Learning — Tuần {latestLog.weekNumber}
            </h2>
            <WeeklyReport
              currentAccuracy={latestLog.currentAccuracy}
              previousAccuracy={latestLog.previousAccuracy}
              insights={latestLog.insights}
              weightsBefore={latestLog.weightsBefore}
              weightsAfter={latestLog.weightsAfter}
              weekNumber={latestLog.weekNumber}
            />
          </section>

          <section className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Xu hướng độ chính xác
              </p>
              <AccuracyChart data={accuracyTrend} />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50">
              Patterns phát hiện ({latestLog.patternsFound.length})
            </h2>
            <PatternList patterns={latestLog.patternsFound} />
          </section>
        </>
      )}

      {/* Feedback history (moved from /feedback) */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50">
          Lịch sử Feedback ({feedbackTable.length} bản ghi)
        </h2>
        {feedbackTable.length > 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <FeedbackTable feedbacks={feedbackTable} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-1">
              Chưa có dữ liệu
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
              Upload kết quả chiến dịch tại trang Upload để AI bắt đầu học.
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm hover:shadow transition-all text-sm"
            >
              <Upload className="w-4 h-4" />
              Đi tới Upload
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
