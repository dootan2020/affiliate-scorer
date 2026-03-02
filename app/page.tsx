import type { Metadata } from "next";
import { ChannelTaskBoard } from "@/components/dashboard/channel-task-board";
import { MorningBriefWidget } from "@/components/dashboard/morning-brief-widget";
import { ContentSuggestionsWidget } from "@/components/dashboard/content-suggestions-widget";
import { WinningPatternsWidget } from "@/components/dashboard/winning-patterns-widget";
import { OrphanAlertWidget } from "@/components/dashboard/orphan-alert-widget";

export const metadata: Metadata = {
  title: "Tổng quan | PASTR",
};

export default function DashboardPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-gray-900 dark:text-gray-50">
        Tổng quan
      </h1>

      {/* Row 0: Alert bar — only shows if real orphans exist */}
      <OrphanAlertWidget />

      {/* Row 1: Morning Brief — full width, most important */}
      <MorningBriefWidget />

      {/* Row 2: Channel Task Board (left) + Content Suggestions (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <ChannelTaskBoard />
        </div>
        <div className="lg:col-span-2">
          <ContentSuggestionsWidget />
        </div>
      </div>

      {/* Row 3: Winning Patterns — compact, only if ≥10 videos tracked */}
      <WinningPatternsWidget />
    </div>
  );
}
