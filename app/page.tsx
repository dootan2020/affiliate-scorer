import type { Metadata } from "next";
import { ChannelTaskBoard } from "@/components/dashboard/channel-task-board";
import { MorningBriefWidget } from "@/components/dashboard/morning-brief-widget";
import { ContentSuggestionsWidget } from "@/components/dashboard/content-suggestions-widget";
import { WinningPatternsWidget } from "@/components/dashboard/winning-patterns-widget";
import { OrphanAlertWidget } from "@/components/dashboard/orphan-alert-widget";
import { YesterdayStatsWidget } from "@/components/dashboard/yesterday-stats-widget";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
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
    // If DB check fails, show dashboard widgets (graceful fallback)
    return true;
  }
}

export default async function DashboardPage(): Promise<React.ReactElement> {
  const hasData = await checkHasData();

  if (!hasData) {
    return (
      <div>
        <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-gray-900 dark:text-gray-50 mb-6">
          Tổng quan
        </h1>
        <DashboardEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-gray-900 dark:text-gray-50">
        Tổng quan
      </h1>

      {/* Row 1: Alert bar — full width, only shows if real orphans exist */}
      <OrphanAlertWidget />

      {/* Row 2: Stat cards — yesterday's key metrics, full width */}
      <YesterdayStatsWidget />

      {/* Row 3: 2-column bento — MorningBrief left, ContentSuggestions right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MorningBriefWidget />
        <ContentSuggestionsWidget />
      </div>

      {/* Row 4: Channel Task Board — full width, horizontal scroll */}
      <ChannelTaskBoard />

      {/* Row 5: Winning Patterns — full width, compact */}
      <WinningPatternsWidget />
    </div>
  );
}
