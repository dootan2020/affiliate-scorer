"use client";

import { useState, useCallback } from "react";
import { FileDropzone } from "@/components/upload/file-dropzone";

interface MappingPreview {
  entryName: string;
  productName: string | null;
  confidence: number;
  autoMapped: boolean;
}

interface UploadResult {
  format: string;
  totalParsed: number;
  autoMapped: number;
  saved: number;
  mappings: MappingPreview[];
}

const FORMAT_LABELS: Record<string, string> = {
  fb_ads: "Facebook Ads Manager",
  tiktok_ads: "TikTok Ads",
  shopee_affiliate: "Shopee Affiliate",
};

export function FeedbackUpload(): React.ReactElement {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setStatus("uploading");
    setResult(null);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/feedback", {
        method: "POST",
        body: formData,
      });

      const json = (await res.json()) as { data?: UploadResult; error?: string; message?: string };

      if (!res.ok) {
        setErrorMsg(json.error ?? "Lỗi không xác định");
        setStatus("error");
        return;
      }

      setResult(json.data ?? null);
      setStatus("done");
    } catch {
      setErrorMsg("Lỗi kết nối. Vui lòng thử lại.");
      setStatus("error");
    }
  }, []);

  const handleReset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setErrorMsg(null);
  }, []);

  return (
    <div className="space-y-4">
      {status === "idle" || status === "uploading" ? (
        <FileDropzone
          onFileSelect={handleFileSelect}
          label="Upload file Feedback (Facebook Ads / TikTok Ads / Shopee Affiliate)"
          sublabel="Hỗ trợ .csv, .xlsx, .xls"
          disabled={status === "uploading"}
        />
      ) : null}

      {status === "uploading" && (
        <p className="text-sm text-center text-gray-500 dark:text-gray-400">Đang xử lý file...</p>
      )}

      {status === "error" && (
        <div className="space-y-3">
          <div className="rounded-xl bg-rose-50 dark:bg-rose-950 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
            {errorMsg}
          </div>
          <button
            onClick={handleReset}
            className="bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors w-full sm:w-auto"
          >
            Thử lại
          </button>
        </div>
      )}

      {status === "done" && result && (
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 sm:p-6 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-50">Kết quả upload</p>
              <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                {FORMAT_LABELS[result.format] ?? result.format}
              </span>
            </div>
            <div className="text-sm space-y-1">
              <p className="text-gray-600 dark:text-gray-300">Tổng dòng: <span className="font-medium text-gray-900 dark:text-gray-50">{result.totalParsed}</span></p>
              <p className="text-gray-600 dark:text-gray-300">Tự động ghép: <span className="font-medium text-gray-900 dark:text-gray-50">{result.autoMapped}</span></p>
              <p className="text-gray-600 dark:text-gray-300">Đã lưu: <span className="font-medium text-emerald-600 dark:text-emerald-400">{result.saved}</span></p>
            </div>
          </div>

          {result.mappings.length > 0 && (
            <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 sm:p-6">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-3">Xem trước ghép sản phẩm</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {result.mappings.map((m, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-2 border-b border-gray-100 dark:border-slate-700 last:border-0">
                    <span className="truncate max-w-[40%] text-gray-500 dark:text-gray-400">{m.entryName}</span>
                    <span className="text-gray-300 dark:text-gray-600 mx-2">→</span>
                    <span className="truncate max-w-[35%] font-medium text-gray-900 dark:text-gray-50">{m.productName ?? "Chưa ghép"}</span>
                    <span
                      className={`ml-2 shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        m.autoMapped
                          ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                          : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {m.confidence}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleReset}
            className="bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors w-full sm:w-auto"
          >
            Upload thêm
          </button>
        </div>
      )}
    </div>
  );
}
