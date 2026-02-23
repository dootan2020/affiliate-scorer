import type { Metadata } from "next";
import { AccuracyChart } from "@/components/insights/accuracy-chart";
import { PatternList } from "@/components/insights/pattern-list";
import { WeeklyReport } from "@/components/insights/weekly-report";
import { TriggerLearningButton } from "@/components/insights/trigger-learning-button";
import { Sparkles } from "lucide-react";
import type { InsightsData } from "@/app/api/insights/route";

export const metadata: Metadata = {
  title: "AI Insights | AffiliateScorer",
};

async function getInsights(): Promise<InsightsData> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/insights`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Fetch failed");
    const json = (await res.json()) as { data: InsightsData };
    return json.data;
  } catch {
    return {
      latestLog: null,
      accuracyTrend: [],
      totalFeedbackCount: 0,
    };
  }
}

export default async function InsightsPage() {
  const insights = await getInsights();
  const { latestLog, accuracyTrend, totalFeedbackCount } = insights;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
            AI Insights
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Phân tích học máy từ {totalFeedbackCount} feedback thực tế
          </p>
        </div>
        <TriggerLearningButton />
      </div>

      {!latestLog && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-1">
            Chưa có dữ liệu learning
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
            Thu thập ít nhất 5 feedback và nhấn &quot;Chạy Learning&quot;.
          </p>
        </div>
      )}

      {latestLog && (
        <>
          <section className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50">
              Báo cáo tuần {latestLog.weekNumber}
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
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Xu hướng độ chính xác</p>
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
    </div>
  );
}
