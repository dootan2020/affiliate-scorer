import type { Metadata } from "next";
import { InboxPageContent } from "@/components/inbox/inbox-page-content";

export const metadata: Metadata = {
  title: "Hộp sản phẩm",
  description: "Dán links sản phẩm — tự nhận diện, dedupe, score",
};

export default function InboxPage(): React.ReactElement {
  return <InboxPageContent />;
}
