import type { Metadata } from "next";
import { InboxPageClient } from "@/components/inbox/inbox-page-client";

export const metadata: Metadata = {
  title: "Inbox | AffiliateScorer",
  description: "Dán links sản phẩm TikTok/FastMoss — tự nhận diện, dedupe, score",
};

export default function InboxPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
          Inbox
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Dán links sản phẩm — tự nhận diện loại, dedupe, và thêm vào pipeline
        </p>
      </div>

      <InboxPageClient />
    </div>
  );
}
