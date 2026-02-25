"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { FileDropzone } from "@/components/upload/file-dropzone";
import {
  UploadProgress,
  type UploadResult,
} from "@/components/upload/upload-progress";
import { ColumnMapping } from "@/components/upload/column-mapping";
import { ManualFeedbackForm } from "@/components/feedback/manual-feedback-form";
import { CampaignImportZone } from "@/components/upload/campaign-import-zone";
import { ImportHistoryTable } from "@/components/upload/import-history-table";
import { Search, PenLine, History } from "lucide-react";

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
  campaignsCreated: number;
  campaignsUpdated: number;
  productsCreated: number;
  productsUpdated: number;
  financialRecordsCreated: number;
  createdAt: string;
}

export default function UploadPage(): React.ReactElement {
  // Product upload states
  const [fileName, setFileName] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Manual feedback
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([]);

  // Import history
  const [importHistory, setImportHistory] = useState<ImportRecord[]>([]);

  const fetchImportHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/upload/import/history");
      const data = await res.json();
      if (data.data) setImportHistory(data.data as ImportRecord[]);
    } catch {
      // Silently fail — history is not critical
    }
  }, []);

  useEffect(() => {
    fetch("/api/products?limit=200&fields=id,name")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setProducts(d.data);
      })
      .catch(() => {});

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

      setResult(data.data);
      setPreview(null);
      toast.success(data.message);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lỗi không xác định";
      setError(message);
      toast.error(message);
    } finally {
      setIsImporting(false);
    }
  }

  function handleCancelPreview(): void {
    setPreview(null);
    setFile(null);
    setFileName(null);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
          Upload Data
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Upload tất cả dữ liệu để AI ngày càng thông minh hơn
        </p>
      </div>

      {/* Zone 1: Nghien cuu san pham */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center shrink-0">
            <Search className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50">
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
        />
      </div>

      {/* Zone 2: Ket qua chien dich (detect + confirm flow) */}
      <CampaignImportZone onImportComplete={fetchImportHistory} />

      {/* Zone 3: Nhap ket qua thu cong */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center shrink-0">
            <PenLine className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50">
              Nhập kết quả thủ công
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Cho kết quả organic hoặc khi không có file
            </p>
          </div>
        </div>
        {products.length > 0 ? (
          <ManualFeedbackForm products={products} />
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Chưa có sản phẩm.{" "}
            <Link href="/upload" className="text-blue-500 hover:underline">
              Upload sản phẩm trước
            </Link>
            .
          </p>
        )}
      </div>

      {/* Zone 4: Lich su import */}
      {importHistory.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <History className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50">
              Lịch sử import
            </h2>
          </div>
          <ImportHistoryTable records={importHistory} />
        </div>
      )}
    </div>
  );
}
