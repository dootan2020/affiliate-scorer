"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileDropzone } from "@/components/upload/file-dropzone";
import {
  UploadProgress,
  type UploadResult,
} from "@/components/upload/upload-progress";

export default function UploadPage(): React.ReactElement {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [feedbackFileName, setFeedbackFileName] = useState<string | null>(null);
  const [isFeedbackUploading, setIsFeedbackUploading] = useState(false);
  const [feedbackResult, setFeedbackResult] = useState<UploadResult | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  async function handleProductUpload(file: File): Promise<void> {
    setFileName(file.name);
    setIsUploading(true);
    setResult(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/products", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Lỗi upload");
      }

      setResult(data.data);
      toast.success(data.message);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lỗi không xác định";
      setError(message);
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleFeedbackUpload(file: File): Promise<void> {
    setFeedbackFileName(file.name);
    setIsFeedbackUploading(true);
    setFeedbackResult(null);
    setFeedbackError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

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
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50">Nghiên cứu sản phẩm</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Upload file export từ FastMoss hoặc KaloData để AI phân tích
          </p>
        </div>
        <FileDropzone
          onFileSelect={handleProductUpload}
          label="Kéo thả file FastMoss/KaloData vào đây"
          sublabel="Hỗ trợ .csv, .xlsx, .xls"
          disabled={isUploading}
        />
        <UploadProgress
          fileName={fileName}
          isUploading={isUploading}
          result={result}
          error={error}
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6 space-y-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50">Kết quả thật</h2>
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
