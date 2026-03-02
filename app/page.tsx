import type { Metadata } from "next";
import { ChannelTaskBoard } from "@/components/dashboard/channel-task-board";
import { MorningBriefWidget } from "@/components/dashboard/morning-brief-widget";
import { ContentSuggestionsWidget } from "@/components/dashboard/content-suggestions-widget";
import { WinningPatternsWidget } from "@/components/dashboard/winning-patterns-widget";
import { OrphanAlertWidget } from "@/components/dashboard/orphan-alert-widget";
import { YesterdayStatsWidget } from "@/components/dashboard/yesterday-stats-widget";

export const metadata: Metadata = {
  title: "Tổng quan | PASTR",
};

export default function DashboardPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-gray-900 dark:text-gray-50">
        Tổng quan
      </h1>

      {/* 1. Alert bar — only shows if real orphans exist */}
      <OrphanAlertWidget />

      {/* 2. Stat cards — yesterday's key metrics */}
      <YesterdayStatsWidget />

      {/* 3. Channel Task Board — full width, horizontal scroll */}
      <ChannelTaskBoard />

      {/* 4. Content Suggestions — full width table, top 5 */}
      <ContentSuggestionsWidget />

      {/* 5. Morning Brief — collapsible, default closed */}
      <MorningBriefWidget />

      {/* 6. Winning Patterns — compact, bottom */}
      <WinningPatternsWidget />
    </div>
  );
}
