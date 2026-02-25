"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { InsightsTabs } from "./insights-tabs";
import { OverviewTab } from "./overview-tab";
import { FinancialTab } from "./financial-tab";
import { CalendarTab } from "./calendar-tab";
import { AccuracyChart } from "./accuracy-chart";
import { PatternList } from "./pattern-list";
import { WeeklyReport } from "./weekly-report";
import { FeedbackTable } from "@/components/feedback/feedback-table";
import { MessageSquare, Upload } from "lucide-react";
import type { WeightMap } from "@/lib/ai/prompts";

interface LatestLogData {
  id: string;
  weekNumber: number;
  currentAccuracy: number;
  previousAccuracy: number;
  weightsBefore: WeightMap;
  weightsAfter: WeightMap;
  patternsFound: string[];
  insights: string;
}

interface FeedbackRow {
  id: string;
  productName: string;
  aiScoreAtSelection: number;
  adPlatform: string | null;
  salesPlatform: string | null;
  adROAS: number | null;
  revenue: number | null;
  overallSuccess: string;
  feedbackDate: string;
}

interface AccuracyPoint {
  weekNumber: number;
  currentAccuracy: number;
}

interface UpcomingEventItem {
  id: string;
  name: string;
  startDate: string;
  daysUntil: number;
}

export interface InsightsPageClientProps {
  // Overview data
  totalProducts: number;
  productsWithNotes: number;
  shopsReviewed: number;
  totalFeedbackCount: number;
  scoredCount: number;
  monthIncome: number;
  monthExpense: number;
  upcomingEvents: UpcomingEventItem[];
  confidenceLabel: string;
  // Learning data
  latestLog: LatestLogData | null;
  accuracyTrend: AccuracyPoint[];
  // Feedback data
  feedbackTable: FeedbackRow[];
}

function InsightsPageClientInner(
  props: InsightsPageClientProps,
): React.ReactElement {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (tab: string): void => {
    setActiveTab(tab);
    router.replace(`/insights?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <InsightsTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {activeTab === "overview" && (
        <OverviewTab
          totalProducts={props.totalProducts}
          productsWithNotes={props.productsWithNotes}
          shopsReviewed={props.shopsReviewed}
          monthIncome={props.monthIncome}
          monthExpense={props.monthExpense}
          upcomingEvents={props.upcomingEvents}
          feedbackCount={props.totalFeedbackCount}
          confidenceLabel={props.confidenceLabel}
        />
      )}

      {activeTab === "financial" && <FinancialTab />}

      {activeTab === "calendar" && <CalendarTab />}

      {activeTab === "feedback" && (
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50">
            Lịch sử Feedback ({props.feedbackTable.length} bản ghi)
          </h2>
          {props.feedbackTable.length > 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  <FeedbackTable feedbacks={props.feedbackTable} />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-1">
                Chua co du lieu
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                Upload kết quả chiến dịch tại trang Upload để AI bắt đầu học.
              </p>
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm hover:shadow transition-all text-sm"
              >
                <Upload className="w-4 h-4" />
                Di toi Upload
              </Link>
            </div>
          )}
        </section>
      )}

      {activeTab === "learning" && (
        <>
          {props.latestLog ? (
            <>
              <section className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50">
                  Kết quả Learning — Tuần {props.latestLog.weekNumber}
                </h2>
                <WeeklyReport
                  currentAccuracy={props.latestLog.currentAccuracy}
                  previousAccuracy={props.latestLog.previousAccuracy}
                  insights={props.latestLog.insights}
                  weightsBefore={props.latestLog.weightsBefore}
                  weightsAfter={props.latestLog.weightsAfter}
                  weekNumber={props.latestLog.weekNumber}
                />
              </section>

              <section className="space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Xu hướng độ chính xác
                  </p>
                  <AccuracyChart data={props.accuracyTrend} />
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50">
                  Patterns phát hiện ({props.latestLog.patternsFound.length})
                </h2>
                <PatternList patterns={props.latestLog.patternsFound} />
              </section>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-1">
                Chưa có dữ liệu learning
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                Cần có feedback để AI bắt đầu học và cải thiện scoring.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function InsightsPageClient(
  props: InsightsPageClientProps,
): React.ReactElement {
  return (
    <Suspense fallback={<div className="h-10 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />}>
      <InsightsPageClientInner {...props} />
    </Suspense>
  );
}
