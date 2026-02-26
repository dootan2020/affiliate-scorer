import type { Metadata } from "next";
import { SettingsPageClient } from "@/components/settings/settings-page-client";

export const metadata: Metadata = {
  title: "Cài đặt | AffiliateScorer",
};

export default function SettingsPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-gray-900 dark:text-gray-50">
          Cài đặt
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Cấu hình AI model và API key
        </p>
      </div>
      <SettingsPageClient />
    </div>
  );
}
