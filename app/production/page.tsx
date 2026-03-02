import type { Metadata } from "next";
import { ProductionPageClient } from "@/components/production/production-page-client";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Sản xuất",
  description: "Chọn sản phẩm, tạo briefs AI, preview và xuất packs sản xuất",
};

export default function ProductionPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <PageHeader title="Sản xuất Content" description="Chọn sản phẩm từ Inbox → AI tạo scripts + prompts → Xuất packs sản xuất" />

      <ProductionPageClient />
    </div>
  );
}
