"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileDropzone } from "@/components/upload/file-dropzone";
import {
  UploadProgress,
  type UploadResult,
} from "@/components/upload/upload-progress";
import { ColumnMapping } from "@/components/upload/column-mapping";

interface PreviewData {
  headers: string[];
  sampleRows: Record<string, string>[];
  totalRows: number;
  format: string;
  mapping: Record<string, string | null>;
  aiDetected: boolean;
  targetFields: Array<{ key: string; label: string }>;
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

  // Feedback upload states
  const [feedbackFileName, setFeedbackFileName] = useState<string | null>(null);
  const [isFeedbackUploading, setIsFeedbackUploading] = useState(false);
  const [feedbackResult, setFeedbackResult] = useState<UploadResult | null>(
    null
  );
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

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

      // Step 1: Preview - get column mapping
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
    mapping: Record<string, string | null>
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

  async function handleFeedbackUpload(selectedFile: File): Promise<void> {
    setFeedbackFileName(selectedFile.name);
    setIsFeedbackUploading(true);
    setFeedbackResult(null);
    setFeedbackError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/upload/feedback", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Lỗi upload");
      }

      setFeedbackResult(data.data);
      toast.success(data.message);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lỗi không xác định";
      setFeedbackError(message);
      toast.error(message);
    } finally {
      setIsFeedbackUploading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
          Upload Data
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Upload file CSV/Excel từ FastMoss, KaloData hoặc kết quả ads
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6 space-y-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50">
            Nghiên cứu sản phẩm
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Upload file export từ FastMoss hoặc KaloData để AI phân tích
          </p>
        </div>

        {!preview && (
          <FileDropzone
            onFileSelect={handleProductUpload}
            label="Kéo thả file FastMoss/KaloData vào đây"
            sublabel="Hỗ trợ .csv, .xlsx, .xls — AI sẽ tự nhận diện format"
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

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6 space-y-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50">
            Kết quả thật
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Upload kết quả từ FB Ads, TikTok Ads hoặc Shopee Affiliate
          </p>
        </div>
        <FileDropzone
          onFileSelect={handleFeedbackUpload}
          label="Kéo thả file kết quả vào đây"
          sublabel="FB Ads, TikTok Ads, Shopee Affiliate (.csv, .xlsx)"
          disabled={isFeedbackUploading}
        />
        <UploadProgress
          fileName={feedbackFileName}
          isUploading={isFeedbackUploading}
          result={feedbackResult}
          error={feedbackError}
        />
      </div>
    </div>
  );
}
