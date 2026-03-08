import type { Metadata } from "next";
import { GuidePageClient } from "@/components/guide/guide-page-client";

export const metadata: Metadata = {
  title: "Hướng dẫn sử dụng",
  description: "Hướng dẫn sử dụng PASTR — Paste links. Ship videos. Learn fast.",
};

export default function GuidePage(): React.ReactElement {
  return <GuidePageClient />;
}
