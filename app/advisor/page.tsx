import type { Metadata } from "next";
import { AdvisorPageClient } from "@/components/advisor/advisor-page-client";

export const metadata: Metadata = {
  title: "Cố vấn AI | PASTR",
  description: "Ban lãnh đạo AI phân tích và ra quyết định chiến lược",
};

export default function AdvisorPage(): React.ReactElement {
  return <AdvisorPageClient />;
}
