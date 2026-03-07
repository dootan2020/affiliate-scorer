import type { Metadata } from "next";
import { ChannelTaskBoard } from "@/components/dashboard/channel-task-board";
import { MorningBriefWidget } from "@/components/dashboard/morning-brief-widget";
import { ContentSuggestionsWidget } from "@/components/dashboard/content-suggestions-widget";
import { WinningPatternsWidget } from "@/components/dashboard/winning-patterns-widget";
import { OrphanAlertWidget } from "@/components/dashboard/orphan-alert-widget";
import { YesterdayStatsWidget } from "@/components/dashboard/yesterday-stats-widget";
import { UpcomingEventsWidget } from "@/components/dashboard/upcoming-events-widget";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { OnboardingChecklist } from "@/components/niche-intelligence/onboarding-checklist";
import { WidgetErrorBoundary } from "@/components/dashboard/widget-error-boundary";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Tổng quan | PASTR",
};

async function checkHasData(): Promise<boolean> {
  try {
    const [channelCount, productCount] = await Promise.all([
      prisma.tikTokChannel.count({ where: { isActive: true } }),
      prisma.productIdentity.count(),
    ]);
    return channelCount > 0 || productCount > 0;
  } catch {
    return true;
  }
}

export default async function DashboardPage(): Promise<React.ReactElement> {
  const hasData = await checkHasData();

  if (!hasData) {
    return (
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-gray-900 dark:text-gray-50 mb-6">
          Tổng quan
        </h1>
        <DashboardEmptyState />
      </div>
    );
  }

  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-gray-900 dark:text-gray-50">
        Tổng quan
      </h1>

      <WidgetErrorBoundary name="Onboarding">
        <OnboardingChecklist />
      </WidgetErrorBoundary>

      {/* Alert bar */}
      <WidgetErrorBoundary name="Cảnh báo">
        <OrphanAlertWidget />
      </WidgetErrorBoundary>

      {/* Stat cards */}
      <WidgetErrorBoundary name="Thống kê">
        <YesterdayStatsWidget />
      </WidgetErrorBoundary>

      {/* 3-column bento grid — mobile: ContentSuggestions first, MorningBrief collapsed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="order-2 lg:order-1">
          <WidgetErrorBoundary name="Bản tin sáng">
            <MorningBriefWidget />
          </WidgetErrorBoundary>
        </div>
        <div className="order-1 lg:order-2">
          <WidgetErrorBoundary name="Gợi ý nội dung">
            <ContentSuggestionsWidget />
          </WidgetErrorBoundary>
        </div>
        <div className="order-3">
          <WidgetErrorBoundary name="Kênh hôm nay">
            <ChannelTaskBoard />
          </WidgetErrorBoundary>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WidgetErrorBoundary name="Winning Patterns">
          <WinningPatternsWidget />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary name="Sự kiện">
          <UpcomingEventsWidget />
        </WidgetErrorBoundary>
      </div>
    </div>
  );
}
