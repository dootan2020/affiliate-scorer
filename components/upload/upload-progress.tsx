"use client";

import Link from "next/link";
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
  /** Callback to retry scoring when it fails */
  onRetryScoring?: (batchId: string) => void;
  /** Callback to reset/dismiss results and start fresh */
  onReset?: () => void;
}

export function UploadProgress({
  fileName,
  isUploading,
  result,
  error,
  liveStatus,
  isPolling,
  onRetryScoring,
  onReset,
}: UploadProgressProps): React.ReactElement | null {
  // Show live polling progress if available
  if (liveStatus) {
    return (
      <LiveProgress
        status={liveStatus}
        isPolling={isPolling ?? false}
        result={result}
        onRetryScoring={onRetryScoring}
        onReset={onReset}
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
        <p className="text-sm text-gray-500 dark:text-gray-400">Đang xử lý...</p>
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
  onRetryScoring,
  onReset,
}: {
  status: ImportStatus;
  isPolling: boolean;
  result: UploadResult | null;
  onRetryScoring?: (batchId: string) => void;
  onReset?: () => void;
}): React.ReactElement {
  const isImporting = status.status === "processing" || status.status === "pending";
  const isScoring = status.scoringStatus === "processing";
  const isDone = status.isTerminal;
  const hasFailed = status.status === "failed";
  const scoringFailed = status.scoringStatus === "failed";
  const timedOut = status.timedOut === true;

  // Show chunk progress during import (e.g., "Đang import 600/3000...")
  const importLabel = isImporting && status.rowsProcessed > 0 && status.recordCount > 0
    ? `Đang import ${status.rowsProcessed}/${status.recordCount}...`
    : "Đang import...";

  const label = timedOut
    ? "Mất kết nối theo dõi — kiểm tra lại sau"
    : hasFailed
      ? "Import thất bại"
      : isImporting
        ? importLabel
        : isScoring
          ? "Đang chấm điểm AI..."
          : isDone && !scoringFailed
            ? "Hoàn thành!"
            : isDone && scoringFailed
              ? "Import hoàn tất"
              : "Đang xử lý...";

  return (
    <div className="space-y-3 rounded-2xl bg-gray-50 dark:bg-slate-800 p-4">
      <div className="flex items-center gap-2">
        {isPolling && !isDone && !timedOut && (
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shrink-0" />
        )}
        {isDone && !hasFailed && !scoringFailed && (
          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
        )}
        {isDone && !hasFailed && scoringFailed && (
          <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
        )}
        {(hasFailed || timedOut) && (
          <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
        )}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {status.fileName}
        </span>
      </div>

      <p className={`text-sm ${timedOut ? "text-rose-600 dark:text-rose-400" : hasFailed ? "text-rose-600 dark:text-rose-400" : isDone && !scoringFailed ? "text-emerald-600 dark:text-emerald-400" : isDone && scoringFailed ? "text-amber-600 dark:text-amber-400" : "text-gray-500 dark:text-gray-400"}`}>
        {label}
      </p>

      {/* Stats when import phase is done */}
      {!isImporting && status.rowsProcessed > 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {status.rowsCreated > 0 && <span>{status.rowsCreated} mới</span>}
          {status.rowsUpdated > 0 && <span>{status.rowsCreated > 0 ? " · " : ""}{status.rowsUpdated} cập nhật</span>}
          {status.rowsError > 0 && <span className="text-rose-500"> · {status.rowsError} lỗi</span>}
        </div>
      )}

      {/* Retry scoring button when scoring failed */}
      {isDone && scoringFailed && !hasFailed && onRetryScoring && (
        <button
          type="button"
          onClick={() => onRetryScoring(status.id)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 bg-amber-50 dark:bg-amber-950 hover:bg-amber-100 dark:hover:bg-amber-900 rounded-xl px-4 py-2 transition-colors"
        >
          Thử lại chấm điểm
        </button>
      )}

      {/* Actions after completion */}
      {(isDone || timedOut) && (
        <div className="flex items-center gap-3 flex-wrap pt-1">
          {!hasFailed && !timedOut && (
            <Link
              href="/inbox"
              className="inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-5 py-2 text-sm font-medium shadow-sm hover:shadow transition-all"
            >
              Xem Inbox →
            </Link>
          )}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              Upload file mới
            </button>
          )}
        </div>
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
