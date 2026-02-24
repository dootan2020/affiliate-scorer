"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { FileDropzone } from "@/components/upload/file-dropzone";
import {
  UploadProgress,
  type UploadResult,
} from "@/components/upload/upload-progress";
import { ColumnMapping } from "@/components/upload/column-mapping";
import { ManualFeedbackForm } from "@/components/feedback/manual-feedback-form";
import { Search, Target, PenLine } from "lucide-react";

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
  const [feedbackResult, setFeedbackResult] = useState<UploadResult | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Manual feedback
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetch("/api/products?limit=200&fields=id,name")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setProducts(d.data);
      })
      .catch(() => {});
  }, []);

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
          Upload tất cả dữ liệu để AI ngày càng thông minh hơn
        </p>
      </div>

      {/* Zone 1: Nghiên cứu sản phẩm */}
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

      {/* Zone 2: Kết quả chiến dịch */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50">
              Kết quả chiến dịch
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Upload kết quả từ FB Ads, TikTok Ads, Shopee Affiliate — AI sẽ học từ data này
            </p>
          </div>
        </div>
        <FileDropzone
          onFileSelect={handleFeedbackUpload}
          label="Kéo thả file kết quả vào đây"
          sublabel="FB Ads, TikTok Ads, Shopee (.csv, .xlsx)"
          disabled={isFeedbackUploading}
        />
        <UploadProgress
          fileName={feedbackFileName}
          isUploading={isFeedbackUploading}
          result={feedbackResult}
          error={feedbackError}
        />
      </div>

      {/* Zone 3: Nhập kết quả thủ công */}
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
            Chưa có sản phẩm. <Link href="/upload" className="text-blue-500 hover:underline">Upload sản phẩm trước</Link>.
          </p>
        )}
      </div>
    </div>
  );
}
