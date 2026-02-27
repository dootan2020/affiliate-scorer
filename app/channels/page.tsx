import type { Metadata } from "next";
import { ChannelListClient } from "@/components/channels/channel-list-client";

export const metadata: Metadata = {
  title: "Kênh TikTok",
};

export default function ChannelsPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
          Kênh TikTok
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Quản lý kênh, persona, style guide cho sản xuất content
        </p>
      </div>
      <ChannelListClient />
    </div>
  );
}
