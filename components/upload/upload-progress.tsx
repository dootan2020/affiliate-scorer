"use client";

import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { ProcessLog } from "@/components/upload/process-log";
import type { ImportStatus } from "@/lib/hooks/use-import-polling";

export interface UploadResult {
  batchId: string;
  format: string;
  totalParsed: number;
  afterDedup: number;
  source?: string;
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
  /** Live polling status from useImportPolling */
  liveStatus?: ImportStatus | null;
  isPolling?: boolean;
}

export function UploadProgress({
  fileName,
  isUploading,
  result,
  error,
  liveStatus,
  isPolling,
}: UploadProgressProps): React.ReactElement | null {
  // Show live polling progress if available
  if (liveStatus) {
    return (
      <LiveProgress
        status={liveStatus}
        isPolling={isPolling ?? false}
        result={result}
      />
    );
  }

  if (!fileName && !result && !error) return null;

  return (
    <div className="space-y-3 rounded-2xl bg-gray-50 dark:bg-slate-800 p-4">
      {fileName && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center rounded-full bg-orange-50 dark:bg-orange-950 px-2.5 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-300">
            {result?.format === "fastmoss"
              ? "FastMoss"
              : result?.format === "kalodata"
                ? "KaloData"
                : result?.source ?? "Đang xác định..."}
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

      {result && !liveStatus && (
        <StaticResult result={result} />
      )}

      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}

function LiveProgress({
  status,
  isPolling,
  result,
}: {
  status: ImportStatus;
  isPolling: boolean;
  result: UploadResult | null;
}): React.ReactElement {
  const isImporting = status.status === "processing" || status.status === "pending";
  const isScoring = status.scoringStatus === "processing";
  const isDone = status.isTerminal;
  const hasFailed = status.status === "failed";

  const label = hasFailed
    ? "Import thất bại"
    : isImporting && status.progress < 100
      ? `Đang import... ${status.rowsProcessed}/${status.recordCount}`
      : isImporting && status.progress >= 100
        ? "Đang đồng bộ dữ liệu..."
        : isScoring
          ? "Đang chấm điểm AI..."
          : isDone
            ? "Hoàn thành!"
            : "Đang xử lý...";

  const progressValue = isScoring && !isDone
    ? undefined // indeterminate for scoring
    : status.progress;

  return (
    <div className="space-y-3 rounded-2xl bg-gray-50 dark:bg-slate-800 p-4">
      <div className="flex items-center gap-2">
        {isPolling && !isDone && (
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shrink-0" />
        )}
        {isDone && !hasFailed && (
          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
        )}
        {hasFailed && (
          <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
        )}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {status.fileName}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className={`text-sm ${hasFailed ? "text-rose-600 dark:text-rose-400" : isDone ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"}`}>
            {label}
          </p>
          {progressValue !== undefined && (
            <span className="text-xs text-gray-400">{progressValue}%</span>
          )}
        </div>
        <Progress value={progressValue} className="h-2" />
      </div>

      {/* Stats when import phase is done */}
      {!isImporting && status.rowsProcessed > 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {status.rowsCreated > 0 && <span>{status.rowsCreated} mới</span>}
          {status.rowsUpdated > 0 && <span>{status.rowsCreated > 0 ? " · " : ""}{status.rowsUpdated} cập nhật</span>}
          {status.rowsError > 0 && <span className="text-rose-500"> · {status.rowsError} lỗi</span>}
        </div>
      )}

      {isDone && !hasFailed && (
        <Link
          href="/inbox"
          className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 transition-colors"
        >
          Xem Inbox →
        </Link>
      )}

      <ProcessLog result={result} status={status} isPolling={isPolling} />
    </div>
  );
}

function StaticResult({ result }: { result: UploadResult }): React.ReactElement {
  return (
    <div className="space-y-2 text-sm">
      <p className="text-emerald-600 dark:text-emerald-400 font-medium">
        Đã import {result.saved ?? ((result.created ?? 0) + (result.updated ?? 0))} sản phẩm thành công
      </p>
      <p className="text-gray-400 dark:text-gray-500">
        Tổng parse: {result.totalParsed} | Sau dedup: {result.afterDedup}
        {result.created != null && ` | Mới: ${result.created}`}
        {result.updated != null && ` | Cập nhật: ${result.updated}`}
      </p>

      {result.deltaSummary && (
        <div className="flex flex-wrap gap-2 pt-1">
          {result.deltaSummary.NEW > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 dark:bg-orange-950 px-2 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-400">
              {result.deltaSummary.NEW} mới
            </span>
          )}
          {result.deltaSummary.SURGE > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              {result.deltaSummary.SURGE} tăng mạnh
            </span>
          )}
          {result.deltaSummary.COOL > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950 px-2 py-0.5 text-xs font-medium text-rose-700 dark:text-rose-400">
              {result.deltaSummary.COOL} giảm
            </span>
          )}
          {result.deltaSummary.STABLE > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
              {result.deltaSummary.STABLE} ổn định
            </span>
          )}
          {result.deltaSummary.REAPPEAR > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
              {result.deltaSummary.REAPPEAR} quay lại
            </span>
          )}
        </div>
      )}

      <Link
        href="/inbox"
        className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 transition-colors"
      >
        Xem Inbox →
      </Link>
    </div>
  );
}
