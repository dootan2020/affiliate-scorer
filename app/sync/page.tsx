import type { Metadata } from "next";
import { SyncPageContent } from "@/components/sync/sync-page-content";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Đồng bộ dữ liệu",
  description: "Import dữ liệu sản phẩm và analytics TikTok Studio",
};

export default function SyncPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <PageHeader title="Đồng bộ dữ liệu" description="Import dữ liệu sản phẩm và analytics TikTok Studio" />
      <SyncPageContent />
    </div>
  );
}
