"use client";

import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({
  error,
  reset,
}: ErrorPageProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="text-4xl">!</div>
      <h2 className="text-lg font-semibold">Đã xảy ra lỗi</h2>
      <p className="text-sm text-muted-foreground max-w-md text-center">
        {error.message || "Không thể tải trang. Vui lòng thử lại."}
      </p>
      <Button onClick={reset} variant="outline" size="sm">
        Thử lại
      </Button>
    </div>
  );
}
