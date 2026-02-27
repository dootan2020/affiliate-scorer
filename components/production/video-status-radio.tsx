"use client";

import { VIDEO_STATUSES, VIDEO_STATUS_MAP, type VideoStatus } from "@/lib/types/production";

interface Props {
  value: string;
  onChange: (status: VideoStatus) => void;
  disabled?: boolean;
}

const STATUS_COLORS: Record<VideoStatus, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400",
  produced: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",
  rendered: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
  published: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  archived: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
};

const SELECTED_COLORS: Record<VideoStatus, string> = {
  draft: "bg-gray-600 text-white dark:bg-gray-500",
  produced: "bg-orange-600 text-white dark:bg-orange-500",
  rendered: "bg-purple-600 text-white dark:bg-purple-500",
  published: "bg-emerald-600 text-white dark:bg-emerald-500",
  archived: "bg-rose-600 text-white dark:bg-rose-500",
};

export function VideoStatusRadio({ value, onChange, disabled }: Props): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-1">
      {VIDEO_STATUSES.map((status) => {
        const isSelected = value === status;
        return (
          <button
            key={status}
            onClick={() => onChange(status)}
            disabled={disabled}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
              isSelected ? SELECTED_COLORS[status] : STATUS_COLORS[status]
            } ${disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"}`}
          >
            {VIDEO_STATUS_MAP[status]}
          </button>
        );
      })}
    </div>
  );
}
