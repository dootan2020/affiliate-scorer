"use client";

import { useCallback, useState } from "react";
import { Upload, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { detectTikTokStudioFileType, FILE_TYPE_LABELS } from "@/lib/parsers/detect-tiktok-studio";
import type { TikTokStudioFileType } from "@/lib/parsers/detect-tiktok-studio";

interface PendingFile {
  file: File;
  type: TikTokStudioFileType;
  typeLabel: string;
  status: "pending" | "processing" | "done" | "error" | "skipped";
  count: number;
  errors: string[];
}

export function TikTokStudioDropzone(): React.ReactElement {
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const addFiles = useCallback((incoming: File[]) => {
    const next: PendingFile[] = incoming.map((f) => {
      const type = detectTikTokStudioFileType(f.name);
      return {
        file: f,
        type,
        typeLabel: FILE_TYPE_LABELS[type],
        status: "pending",
        count: 0,
        errors: [],
      };
    });
    setFiles((prev) => {
      // Avoid duplicates by name
      const existingNames = new Set(prev.map((p) => p.file.name));
      return [...prev, ...next.filter((f) => !existingNames.has(f.file.name))];
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = Array.from(e.dataTransfer.files).filter(
        (f) => f.name.endsWith(".xlsx") || f.name.endsWith(".xls"),
      );
      if (dropped.length > 0) addFiles(dropped);
    },
    [addFiles],
  );

  const handleClick = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls";
    input.multiple = true;
    input.onchange = (e) => {
      const selected = Array.from((e.target as HTMLInputElement).files ?? []);
      if (selected.length > 0) addFiles(selected);
    };
    input.click();
  }, [addFiles]);

  async function handleUpload(): Promise<void> {
    if (isUploading || files.length === 0) return;
    setIsUploading(true);

    const pending = files.filter((f) => f.status === "pending");
    setFiles((prev) =>
      prev.map((f) =>
        f.status === "pending" ? { ...f, status: "processing" } : f,
      ),
    );

    const formData = new FormData();
    for (const pf of pending) formData.append("files", pf.file);

    try {
      const res = await fetch("/api/sync/tiktok-studio", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Lỗi server");

      const resultMap = new Map<
        string,
        { status: string; count: number; errors: string[] }
      >();
      for (const r of data.data?.results ?? []) {
        resultMap.set(r.fileName, r);
      }

      setFiles((prev) =>
        prev.map((f) => {
          if (f.status !== "processing") return f;
          const r = resultMap.get(f.file.name);
          if (!r) return f;
          return {
            ...f,
            status: r.status as PendingFile["status"],
            count: r.count,
            errors: r.errors,
          };
        }),
      );
    } catch (err) {
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "processing"
            ? { ...f, status: "error", errors: [err instanceof Error ? err.message : "Lỗi"] }
            : f,
        ),
      );
    } finally {
      setIsUploading(false);
    }
  }

  function handleRemove(name: string): void {
    setFiles((prev) => prev.filter((f) => f.file.name !== name));
  }

  const pendingCount = files.filter((f) => f.status === "pending").length;

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleClick(); }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all",
          isDragging
            ? "border-purple-400 bg-purple-50/50 dark:border-purple-500 dark:bg-purple-950/30"
            : "border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-gray-50/50 dark:hover:bg-slate-800/50",
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center">
            <Upload className="w-6 h-6 text-purple-400 dark:text-purple-500" />
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
            Kéo thả nhiều file TikTok Studio cùng lúc
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Content.xlsx, Overview.xlsx, FollowerActivity.xlsx, ... (hỗ trợ .xlsx, .xls)
          </p>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((pf) => (
            <div
              key={pf.file.name}
              className="flex items-start gap-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 p-3"
            >
              <div className="mt-0.5 shrink-0">
                {pf.status === "pending" && (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-slate-600" />
                )}
                {pf.status === "processing" && (
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                )}
                {pf.status === "done" && (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                )}
                {(pf.status === "error") && (
                  <XCircle className="w-5 h-5 text-rose-500" />
                )}
                {pf.status === "skipped" && (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {pf.file.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{pf.typeLabel}</p>
                {pf.status === "done" && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    Đã import {pf.count} bản ghi
                  </p>
                )}
                {pf.errors.length > 0 && (
                  <p className="text-xs text-rose-500 mt-1">{pf.errors[0]}</p>
                )}
              </div>
              {pf.status === "pending" && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemove(pf.file.name); }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs"
                >
                  Xóa
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {pendingCount > 0 && (
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm hover:shadow transition-all text-sm"
        >
          {isUploading ? "Đang import..." : `Import ${pendingCount} file`}
        </button>
      )}
    </div>
  );
}
