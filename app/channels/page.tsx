import type { Metadata } from "next";
import { ChannelListClient } from "@/components/channels/channel-list-client";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Kênh TikTok",
};

export default function ChannelsPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <PageHeader title="Kênh TikTok" description="Quản lý kênh, persona, style guide cho sản xuất content" />
      <ChannelListClient />
    </div>
  );
}
