import type { Metadata } from "next";
import { SettingsPageClient } from "@/components/settings/settings-page-client";
import { PageHeader } from "@/components/shared/page-header";
import { PageContainer } from "@/components/shared/page-container";

export const metadata: Metadata = {
  title: "Cài đặt",
};

export default function SettingsPage(): React.ReactElement {
  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader title="Cài đặt" description="Cấu hình AI model và API key" />
        <SettingsPageClient />
      </div>
    </PageContainer>
  );
}
