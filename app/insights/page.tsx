import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccuracyChart } from "@/components/insights/accuracy-chart";
import { PatternList } from "@/components/insights/pattern-list";
import { WeeklyReport } from "@/components/insights/weekly-report";
import { TriggerLearningButton } from "@/components/insights/trigger-learning-button";
import type { InsightsData } from "@/app/api/insights/route";

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
    <div className="container mx-auto max-w-5xl py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Insights</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Phân tích học máy từ {totalFeedbackCount} feedback thực tế
          </p>
        </div>
        <TriggerLearningButton />
      </div>

      {/* No data state */}
      {!latestLog && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-3">
            <p className="text-muted-foreground text-sm">
              Chưa có dữ liệu learning. Thu thập ít nhất 5 feedback và nhấn &quot;Chạy Learning&quot;.
            </p>
          </CardContent>
        </Card>
      )}

      {latestLog && (
        <>
          {/* Weekly Report */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold">Báo cáo tuần {latestLog.weekNumber}</h2>
            <WeeklyReport
              currentAccuracy={latestLog.currentAccuracy}
              previousAccuracy={latestLog.previousAccuracy}
              insights={latestLog.insights}
              weightsBefore={latestLog.weightsBefore}
              weightsAfter={latestLog.weightsAfter}
              weekNumber={latestLog.weekNumber}
            />
          </section>

          {/* Accuracy Chart */}
          <section className="space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Xu hướng độ chính xác</CardTitle>
              </CardHeader>
              <CardContent>
                <AccuracyChart data={accuracyTrend} />
              </CardContent>
            </Card>
          </section>

          {/* Pattern List */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold">
              Patterns phát hiện ({latestLog.patternsFound.length})
            </h2>
            <PatternList patterns={latestLog.patternsFound} />
          </section>
        </>
      )}
    </div>
  );
}
