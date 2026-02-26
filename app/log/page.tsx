import type { Metadata } from "next";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { LogPageClient } from "@/components/log/log-page-client";

export const metadata: Metadata = {
  title: "Log kết quả | Content Factory",
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

      {/* Sync hint */}
      <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl px-4 py-3">
        <RefreshCw className="w-4 h-4 text-blue-500 shrink-0" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Hoặc upload file TikTok Studio ở trang{" "}
          <Link href="/sync" className="font-medium underline underline-offset-2 hover:text-blue-900 dark:hover:text-blue-100">
            Sync
          </Link>{" "}
          để tự động cập nhật hàng loạt.
        </p>
      </div>

      <LogPageClient />
    </div>
  );
}
