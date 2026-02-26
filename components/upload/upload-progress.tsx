"use client";

import { Progress } from "@/components/ui/progress";

export interface UploadResult {
  batchId: string;
  format: string;
  totalParsed: number;
  afterDedup: number;
  saved?: number;
  created?: number;
  updated?: number;
  deltaSummary?: {
    NEW: number;
    SURGE: number;
    COOL: number;
    STABLE: number;
    REAPPEAR: number;
  };
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
          <span className="inline-flex items-center rounded-full bg-orange-50 dark:bg-orange-950 px-3 py-1 text-xs font-medium text-orange-700 dark:text-orange-300">
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
        <div className="space-y-2 text-sm">
          <p className="text-emerald-600 dark:text-emerald-400 font-medium">
            Đã import {result.saved ?? ((result.created ?? 0) + (result.updated ?? 0))} sản phẩm thành công
          </p>
          <p className="text-gray-400 dark:text-gray-500">
            Tổng parse: {result.totalParsed} | Sau dedup: {result.afterDedup}
            {result.created != null && ` | Mới: ${result.created}`}
            {result.updated != null && ` | Cập nhật: ${result.updated}`}
          </p>

          {/* Phase 2: Delta Summary */}
          {result.deltaSummary && (
            <div className="flex flex-wrap gap-2 pt-1">
              {result.deltaSummary.NEW > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 dark:bg-orange-950 px-2.5 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-400">
                  🆕 {result.deltaSummary.NEW} mới
                </span>
              )}
              {result.deltaSummary.SURGE > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  🚀 {result.deltaSummary.SURGE} tăng mạnh
                </span>
              )}
              {result.deltaSummary.COOL > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950 px-2.5 py-0.5 text-xs font-medium text-rose-700 dark:text-rose-400">
                  ❄️ {result.deltaSummary.COOL} giảm
                </span>
              )}
              {result.deltaSummary.STABLE > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                  ➡️ {result.deltaSummary.STABLE} ổn định
                </span>
              )}
              {result.deltaSummary.REAPPEAR > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                  🔄 {result.deltaSummary.REAPPEAR} quay lại
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}
