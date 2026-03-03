"use client";

import { useCallback, useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  label?: string;
  sublabel?: string;
  disabled?: boolean;
}

export function FileDropzone({
  onFileSelect,
  accept = ".csv,.xlsx,.xls",
  label = "Kéo thả file CSV/Excel vào đây",
  sublabel = "hoặc click để chọn file",
  disabled = false,
}: FileDropzoneProps): React.ReactElement {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) onFileSelect(file);
    },
    [disabled, onFileSelect]
  );

  const handleClick = useCallback(() => {
    if (disabled) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) onFileSelect(file);
    };
    input.click();
  }, [accept, disabled, onFileSelect]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "cursor-pointer rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all",
        isDragging
          ? "border-orange-400 bg-orange-50/50 dark:border-orange-500 dark:bg-orange-950/30"
          : "border-gray-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 hover:bg-gray-50/50 dark:hover:bg-slate-800/50",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
          <Upload className="w-6 h-6 text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{label}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">{sublabel}</p>
        <p className="text-[11px] text-gray-300 dark:text-gray-600">Tối đa 10MB</p>
      </div>
    </div>
  );
}
