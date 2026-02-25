"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "planning", label: "Planning" },
  { value: "creating_content", label: "Creating Content" },
  { value: "running", label: "Running" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

const PLATFORM_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
  { value: "shopee", label: "Shopee" },
  { value: "youtube", label: "YouTube" },
  { value: "google", label: "Google" },
  { value: "organic", label: "Organic" },
  { value: "other", label: "Khác" },
] as const;

export function CampaignFilters(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") ?? "";
  const currentPlatform = searchParams.get("platform") ?? "";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      const qs = params.toString();
      router.push(`/campaigns${qs ? `?${qs}` : ""}`);
    },
    [router, searchParams],
  );

  return (
    <div className="flex flex-wrap gap-2">
      {/* Status filter */}
      <div className="flex items-center gap-1 bg-gray-100/80 dark:bg-slate-800/80 rounded-xl p-1 overflow-x-auto scrollbar-none">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => updateParam("status", opt.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
              currentStatus === opt.value
                ? "bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-gray-50"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Platform filter */}
      <div className="flex items-center gap-1 bg-gray-100/80 dark:bg-slate-800/80 rounded-xl p-1 overflow-x-auto scrollbar-none">
        {PLATFORM_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => updateParam("platform", opt.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
              currentPlatform === opt.value
                ? "bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-gray-50"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
