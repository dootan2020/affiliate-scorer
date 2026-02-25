import type { Metadata } from "next";
import { LogPageClient } from "@/components/log/log-page-client";

export const metadata: Metadata = {
  title: "Log kết quả | AffiliateScorer",
  description: "Paste TikTok links, nhập metrics → AI học patterns",
};

export default function LogPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
          Log kết quả
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Paste link TikTok → nhập views/likes/orders → AI học pattern thắng/thua
        </p>
      </div>

      <LogPageClient />
    </div>
  );
}
