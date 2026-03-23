import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { NicheDataClient } from "@/components/niche-finder/niche-finder-client";
import { PageContainer } from "@/components/shared/page-container";

export const metadata: Metadata = {
  title: "Tìm ngách | PASTR",
  description: "So sánh các ngách affiliate TikTok dựa trên dữ liệu FastMoss",
};

export default function NicheFinderPage(): React.ReactElement {
  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Tìm ngách"
          description="So sánh các ngách affiliate dựa trên doanh thu/đơn, sales 28 ngày và số KOL đang bán"
        />
        <NicheDataClient />
      </div>
    </PageContainer>
  );
}
