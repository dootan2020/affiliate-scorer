import type { Metadata } from "next";
import { SyncPageContent } from "@/components/sync/sync-page-content";

export const metadata: Metadata = {
  title: "Đồng bộ dữ liệu",
  description: "Import dữ liệu sản phẩm và analytics TikTok Studio",
};

export default function SyncPage(): React.ReactElement {
  return <SyncPageContent />;
}
