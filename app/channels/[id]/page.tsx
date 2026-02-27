import type { Metadata } from "next";
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
      <ChannelDetailClient channelId={id} />
    </div>
  );
}
