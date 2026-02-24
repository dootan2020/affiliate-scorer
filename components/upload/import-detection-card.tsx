"use client";

import { useState } from "react";
import { FileText, ChevronDown, Loader2, Check, X } from "lucide-react";

interface ImportDetectionCardProps {
  fileName: string;
  detection: {
    type: string;
    confidence: string; // "high" | "medium" | "low"
    reason: string;
    rowsTotal: number;
  };
  onConfirm: (fileType: string) => void;
  onCancel: () => void;
  isImporting: boolean;
}

const FILE_TYPE_OPTIONS = [
  { value: "fb_ads", label: "Facebook Ads" },
  { value: "tiktok_ads", label: "TikTok Ads" },
  { value: "shopee_ads", label: "Shopee Ads" },
  { value: "tiktok_affiliate", label: "TikTok Affiliate" },
  { value: "shopee_affiliate", label: "Shopee Affiliate" },
] as const;

const CONFIDENCE_MAP: Record<string, { label: string; className: string }> = {
  high: {
    label: "cao",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  medium: {
    label: "trung binh",
    className:
      "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  low: {
    label: "thap",
    className:
      "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  },
};

function formatTypeName(type: string): string {
  const labels: Record<string, string> = {
    fb_ads: "Facebook Ads",
    tiktok_ads: "TikTok Ads",
    shopee_ads: "Shopee Ads",
    tiktok_affiliate: "TikTok Affiliate",
    shopee_affiliate: "Shopee Affiliate",
    generic: "Chung",
    unknown: "Khong xac dinh",
  };
  return labels[type] ?? type;
}

export function ImportDetectionCard({
  fileName,
  detection,
  onConfirm,
  onCancel,
  isImporting,
}: ImportDetectionCardProps): React.ReactElement {
  const [selectedType, setSelectedType] = useState<string>(
    detection.type === "unknown" || detection.type === "generic"
      ? "fb_ads"
      : detection.type
  );

  const confidence = CONFIDENCE_MAP[detection.confidence] ?? CONFIDENCE_MAP.low;

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 p-4 sm:p-5 space-y-4">
      {/* File name + detection summary */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">
            {fileName}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Nhan dang:{" "}
            <span className="font-medium">
              {formatTypeName(detection.type)}
            </span>
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${confidence.className}`}
          >
            {confidence.label}
          </span>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          {detection.reason}
        </p>

        <p className="text-sm text-gray-600 dark:text-gray-300">
          <span className="font-medium">{detection.rowsTotal.toLocaleString("vi-VN")}</span>{" "}
          dong du lieu
        </p>
      </div>

      {/* Type override dropdown */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Loai file
        </label>
        <div className="relative">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            disabled={isImporting}
            className="w-full appearance-none rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 pr-10 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none disabled:opacity-50"
          >
            {FILE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={() => onConfirm(selectedType)}
          disabled={isImporting}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-slate-600 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm hover:shadow transition-all disabled:cursor-not-allowed"
        >
          {isImporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          {isImporting ? "Dang import..." : "Import"}
        </button>
        <button
          onClick={onCancel}
          disabled={isImporting}
          className="inline-flex items-center gap-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-xl px-5 py-2.5 font-medium transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
          Huy
        </button>
      </div>
    </div>
  );
}
