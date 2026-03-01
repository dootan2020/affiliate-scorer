"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({
  error,
  reset,
}: ErrorPageProps): React.ReactElement {
  if (process.env.NODE_ENV === "development") {
    console.error("ErrorPage:", error);
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-rose-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-1">Đã xảy ra lỗi</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
        {error.message || "Không thể tải trang. Vui lòng thử lại."}
      </p>
      <Button
        onClick={reset}
        className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-400 w-full sm:w-auto"
      >
        Thử lại
      </Button>
    </div>
  );
}
