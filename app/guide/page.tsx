import type { Metadata } from "next";
import { GuidePageClient } from "@/components/guide/guide-page-client";
import { PageHeader } from "@/components/shared/page-header";
import { PageContainer } from "@/components/shared/page-container";

export const metadata: Metadata = {
  title: "Hướng dẫn sử dụng",
  description: "Hướng dẫn sử dụng PASTR — Paste links. Ship videos. Learn fast.",
};

export default function GuidePage(): React.ReactElement {
  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader title="Hướng dẫn sử dụng" description="Hướng dẫn từ A-Z cách sử dụng PASTR hiệu quả" />
        <GuidePageClient />
      </div>
    </PageContainer>
  );
}
