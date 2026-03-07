import type { Metadata } from "next";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { LogPageClient } from "@/components/log/log-page-client";
import { PageHeader } from "@/components/shared/page-header";
import { PageContainer } from "@/components/shared/page-container";

export const metadata: Metadata = {
  title: "Nhật ký",
  description: "Paste TikTok links, nhập metrics → AI học patterns",
};

export default function LogPage(): React.ReactElement {
  return (
    <PageContainer>
    <div className="space-y-6">
      <PageHeader title="Log kết quả" description="Paste link TikTok → nhập views/likes/orders → AI học pattern thắng/thua" />

      {/* Sync hint */}
      <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-xl px-4 py-3">
        <RefreshCw className="w-4 h-4 text-orange-500 shrink-0" />
        <p className="text-sm text-orange-700 dark:text-orange-300">
          Hoặc upload file TikTok Studio ở trang{" "}
          <Link href="/sync" className="font-medium underline underline-offset-2 hover:text-orange-900 dark:hover:text-orange-100">
            Sync
          </Link>{" "}
          để tự động cập nhật hàng loạt.
        </p>
      </div>

      <LogPageClient />
    </div>
    </PageContainer>
  );
}
