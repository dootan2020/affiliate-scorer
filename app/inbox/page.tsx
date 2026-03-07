import type { Metadata } from "next";
import { Suspense } from "react";
import { InboxPageContent } from "@/components/inbox/inbox-page-content";
import { PageContainer } from "@/components/shared/page-container";

export const metadata: Metadata = {
  title: "Hộp sản phẩm",
  description: "Dán links sản phẩm — tự nhận diện, dedupe, score",
};

export default function InboxPage(): React.ReactElement {
  return (
    <PageContainer>
      <Suspense>
        <InboxPageContent />
      </Suspense>
    </PageContainer>
  );
}
