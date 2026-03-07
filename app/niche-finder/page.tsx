import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { NicheFinderClient } from "@/components/niche-intelligence/niche-finder-client";

export const metadata: Metadata = {
  title: "Tìm ngách phù hợp | PASTR",
  description: "AI phân tích và gợi ý ngách affiliate TikTok phù hợp với bạn",
};

export default function NicheFinderPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tìm ngách phù hợp"
        description="Trả lời vài câu hỏi, AI sẽ gợi ý ngách affiliate TikTok phù hợp nhất với bạn"
      />
      <NicheFinderClient />
    </div>
  );
}
