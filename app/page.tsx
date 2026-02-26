import type { Metadata } from "next";
import { MorningBriefWidget } from "@/components/dashboard/morning-brief-widget";
import { QuickPasteWidget } from "@/components/dashboard/quick-paste-widget";
import { InboxStatsWidget } from "@/components/dashboard/inbox-stats-widget";
import { UpcomingEventsWidget } from "@/components/dashboard/upcoming-events-widget";
import { ContentSuggestionsWidget } from "@/components/dashboard/content-suggestions-widget";

export const metadata: Metadata = {
  title: "Dashboard | AffiliateScorer",
};

export default function DashboardPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-gray-900 dark:text-gray-50">
        Dashboard
      </h1>

      {/* Row 1: Morning Brief (2/3) + Quick Paste (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MorningBriefWidget />
        </div>
        <div className="lg:col-span-1">
          <QuickPasteWidget />
        </div>
      </div>

      {/* Row 2: Content Suggestions (full width) */}
      <ContentSuggestionsWidget />

      {/* Row 3: Inbox Pipeline + Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InboxStatsWidget />
        <UpcomingEventsWidget />
      </div>
    </div>
  );
}
