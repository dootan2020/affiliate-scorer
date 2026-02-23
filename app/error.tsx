"use client";

import { AlertCircle } from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({
  error,
  reset,
}: ErrorPageProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-rose-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">Đã xảy ra lỗi</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm">
        {error.message || "Không thể tải trang. Vui lòng thử lại."}
      </p>
      <button
        onClick={reset}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm hover:shadow transition-all"
      >
        Thử lại
      </button>
    </div>
  );
}
