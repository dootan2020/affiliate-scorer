import type { Metadata } from "next";
import { PlaybookPageClient } from "@/components/playbook/playbook-page-client";

export const metadata: Metadata = {
  title: "Playbook | AffiliateScorer",
  description: "Winning/losing patterns từ dữ liệu video — AI học để tạo content tốt hơn",
};

export default function PlaybookPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
          Playbook
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Patterns tích luỹ từ dữ liệu — AI học hook/format/angle nào thắng
        </p>
      </div>

      <PlaybookPageClient />
    </div>
  );
}
