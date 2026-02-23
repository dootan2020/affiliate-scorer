"use client";

import { Progress } from "@/components/ui/progress";

export interface UploadResult {
  batchId: string;
  format: string;
  totalParsed: number;
  afterDedup: number;
  saved: number;
}

interface UploadProgressProps {
  fileName: string | null;
  isUploading: boolean;
  result: UploadResult | null;
  error: string | null;
}

export function UploadProgress({
  fileName,
  isUploading,
  result,
  error,
}: UploadProgressProps): React.ReactElement | null {
  if (!fileName && !result && !error) return null;

  return (
    <div className="space-y-3 rounded-2xl bg-gray-50 dark:bg-slate-800 p-4">
      {fileName && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
            {result?.format === "fastmoss"
              ? "FastMoss"
              : result?.format === "kalodata"
                ? "KaloData"
                : "Đang xác định..."}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-300 truncate">{fileName}</span>
        </div>
      )}

      {isUploading && (
        <div className="space-y-1.5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Đang xử lý...</p>
          <Progress value={undefined} className="h-2" />
        </div>
      )}

      {result && (
        <div className="space-y-1 text-sm">
          <p className="text-emerald-600 dark:text-emerald-400 font-medium">
            Đã import {result.saved} sản phẩm thành công
          </p>
          <p className="text-gray-400 dark:text-gray-500">
            Tổng parse: {result.totalParsed} | Sau dedup: {result.afterDedup} |
            Đã lưu: {result.saved}
          </p>
        </div>
      )}

      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}
