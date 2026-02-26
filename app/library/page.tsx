import type { Metadata } from "next";
import { LibraryPageClient } from "@/components/library/library-page-client";

export const metadata: Metadata = {
  title: "Thư viện",
  description: "Toàn bộ content assets — lọc theo trạng thái, định dạng, sản phẩm",
};

export default function LibraryPage(): React.ReactElement {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <LibraryPageClient />
    </div>
  );
}
