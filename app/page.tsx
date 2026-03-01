import type { Metadata } from "next";
import { ChannelTaskBoard } from "@/components/dashboard/channel-task-board";
import { MorningBriefWidget } from "@/components/dashboard/morning-brief-widget";
import { QuickPasteWidget } from "@/components/dashboard/quick-paste-widget";
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

      {/* Orphan data alert — only shows if orphans exist */}
      <OrphanAlertWidget />

      {/* Row 1: Channel Task Board (full width) — THE main widget */}
      <ChannelTaskBoard />

      {/* Row 2: Morning Brief (2/3) + Quick Paste (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MorningBriefWidget />
        </div>
        <div className="lg:col-span-1">
          <QuickPasteWidget />
        </div>
      </div>

      {/* Row 3: Content Suggestions */}
      <ContentSuggestionsWidget />

      {/* Row 4: Winning Patterns */}
      <WinningPatternsWidget />
    </div>
  );
}
