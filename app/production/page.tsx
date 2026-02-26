import type { Metadata } from "next";
import { ProductionPageClient } from "@/components/production/production-page-client";

export const metadata: Metadata = {
  title: "Sản xuất",
  description: "Chọn sản phẩm, tạo briefs AI, preview và xuất packs sản xuất",
};

export default function ProductionPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-gray-900 dark:text-gray-50">
          Sản xuất Content
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Chọn sản phẩm từ Inbox → AI tạo scripts + prompts → Xuất packs sản xuất
        </p>
      </div>

      <ProductionPageClient />
    </div>
  );
}
