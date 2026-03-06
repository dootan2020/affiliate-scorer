import type { Metadata } from "next";
import { Suspense } from "react";
import { ChannelDetailClient } from "@/components/channels/channel-detail-client";

export const metadata: Metadata = {
  title: "Chi tiết kênh",
};

export default async function ChannelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <Suspense fallback={<ChannelDetailSkeleton />}>
        <ChannelDetailClient channelId={id} />
      </Suspense>
    </div>
  );
}

function ChannelDetailSkeleton(): React.ReactElement {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-4 w-32 bg-gray-200 dark:bg-slate-700 rounded-lg" />
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-gray-200 dark:bg-slate-700" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-48 bg-gray-200 dark:bg-slate-700 rounded-lg" />
            <div className="h-3 w-24 bg-gray-100 dark:bg-slate-800 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
