import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { NicheFinderClient } from "@/components/niche-intelligence/niche-finder-client";

export const metadata: Metadata = {
  title: "Tim ngach phu hop | PASTR",
  description: "AI phan tich va goi y ngach affiliate TikTok phu hop voi ban",
};

export default function NicheFinderPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tim ngach phu hop"
        description="Tra loi vai cau hoi, AI se goi y ngach affiliate TikTok phu hop nhat voi ban"
      />
      <NicheFinderClient />
    </div>
  );
}
