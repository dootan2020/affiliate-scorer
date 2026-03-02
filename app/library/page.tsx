import type { Metadata } from "next";
import { LibraryPageClient } from "@/components/library/library-page-client";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Thư viện",
  description: "Toàn bộ content assets — lọc theo trạng thái, định dạng, sản phẩm",
};

export default function LibraryPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <PageHeader title="Thư viện" description="Toàn bộ content assets — lọc theo trạng thái, định dạng, sản phẩm" />
      <LibraryPageClient />
    </div>
  );
}
