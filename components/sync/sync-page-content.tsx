"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { FileDropzone } from "@/components/upload/file-dropzone";
import {
  UploadProgress,
  type UploadResult,
} from "@/components/upload/upload-progress";
import { ColumnMapping } from "@/components/upload/column-mapping";
import { ImportHistoryTable } from "@/components/upload/import-history-table";
import { TikTokStudioDropzone } from "@/components/sync/tiktok-studio-dropzone";
import { useImportPolling } from "@/lib/hooks/use-import-polling";
import { Search, TrendingUp, History } from "lucide-react";

interface PreviewData {
  headers: string[];
  sampleRows: Record<string, string>[];
  totalRows: number;
  format: string;
  mapping: Record<string, string | null>;
  aiDetected: boolean;
  targetFields: Array<{ key: string; label: string }>;
}

interface ImportRecord {
  id: string;
  sourceType: string;
  fileName: string | null;
  status: string;
  rowsTotal: number;
  rowsImported: number;
  rowsError: number;
  productsCreated: number;
  productsUpdated: number;
  financialRecordsCreated: number;
  createdAt: string;
}

export function SyncPageContent(): React.ReactElement {
  const [fileName, setFileName] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [pollingBatchId, setPollingBatchId] = useState<string | null>(null);
  const [importHistory, setImportHistory] = useState<ImportRecord[]>([]);

  // Poll import progress after upload
  const { status: liveStatus, isPolling } = useImportPolling(pollingBatchId);

  const fetchImportHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/upload/import/history");
      const data = await res.json();
      if (data.data) setImportHistory(data.data as ImportRecord[]);
    } catch {
      // Silently fail — history is not critical
    }
  }, []);

  // Refresh history when polling completes
  useEffect(() => {
    if (liveStatus?.isTerminal) {
      fetchImportHistory();
    }
  }, [liveStatus?.isTerminal, fetchImportHistory]);

  useEffect(() => {
    fetchImportHistory();
  }, [fetchImportHistory]);

  async function handleProductUpload(selectedFile: File): Promise<void> {
    setFileName(selectedFile.name);
    setFile(selectedFile);
    setIsUploading(true);
    setResult(null);
    setError(null);
    setPreview(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/upload/products/preview", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Lỗi đọc file");
      }

      setPreview(data.data as PreviewData);
      toast.success("Đã đọc file. Kiểm tra mapping và xác nhận import.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lỗi không xác định";
      setError(message);
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleConfirmImport(
    mapping: Record<string, string | null>,
  ): Promise<void> {
    if (!file) return;

    setIsImporting(true);
    setError(null);
    setPollingBatchId(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mapping", JSON.stringify(mapping));

      const response = await fetch("/api/upload/products", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Lỗi import");
      }

      // Server returns immediately with batchId — start polling
      setResult(data.data);
      setPreview(null);
      setPollingBatchId(data.data.batchId);
      toast.success(data.message);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lỗi không xác định";
      setError(message);
      toast.error(message);
    } finally {
      setIsImporting(false);
    }
  }

  async function handleRetryScoring(batchId: string): Promise<void> {
    try {
      const res = await fetch("/api/internal/score-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId }),
      });
      if (!res.ok) throw new Error("Retry failed");
      toast.success("Đã gửi yêu cầu chấm điểm lại");
      // Restart polling by resetting then setting the batchId
      setPollingBatchId(null);
      setTimeout(() => setPollingBatchId(batchId), 100);
    } catch {
      toast.error("Không thể thử lại chấm điểm");
    }
  }

  function handleCancelPreview(): void {
    setPreview(null);
    setFile(null);
    setFileName(null);
  }

  return (
    <div className="space-y-8">
      {/* Section 1: Nghiên cứu sản phẩm */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950 flex items-center justify-center shrink-0">
            <Search className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h2 className="text-xl font-medium text-gray-900 dark:text-gray-50">
              Nghiên cứu sản phẩm
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Upload file từ FastMoss, KaloData
            </p>
          </div>
        </div>

        {!preview && (
          <FileDropzone
            onFileSelect={handleProductUpload}
            label="Kéo thả file vào đây"
            sublabel="Hỗ trợ .csv, .xlsx, .xls"
            disabled={isUploading}
          />
        )}

        {isUploading && (
          <div className="rounded-2xl bg-gray-50 dark:bg-slate-800 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Đang đọc file và phân tích cột...
            </p>
          </div>
        )}

        {preview && (
          <ColumnMapping
            headers={preview.headers}
            sampleRows={preview.sampleRows}
            mapping={preview.mapping}
            targetFields={preview.targetFields}
            format={preview.format}
            aiDetected={preview.aiDetected}
            totalRows={preview.totalRows}
            onConfirm={handleConfirmImport}
            onCancel={handleCancelPreview}
            isImporting={isImporting}
          />
        )}

        <UploadProgress
          fileName={fileName}
          isUploading={false}
          result={result}
          error={error}
          liveStatus={liveStatus}
          isPolling={isPolling}
          onRetryScoring={handleRetryScoring}
        />
      </div>

      {/* Section 2: TikTok Studio Analytics */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h2 className="text-xl font-medium text-gray-900 dark:text-gray-50">
              TikTok Studio Analytics
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Import dữ liệu analytics từ TikTok Studio — hỗ trợ nhiều file cùng lúc
            </p>
          </div>
        </div>

        <TikTokStudioDropzone />
      </div>

      {/* Section 3: Lịch sử import */}
      {importHistory.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <History className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
            <h2 className="text-xl font-medium text-gray-900 dark:text-gray-50">
              Lịch sử import
            </h2>
          </div>
          <ImportHistoryTable records={importHistory} />
        </div>
      )}
    </div>
  );
}
