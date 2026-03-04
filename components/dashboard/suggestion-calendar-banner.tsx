"use client";

import { Calendar } from "lucide-react";

interface CalendarBannerProps {
  events: Array<{ name: string; startDate: string; eventType: string }>;
}

export function SuggestionCalendarBanner({ events }: CalendarBannerProps): React.ReactElement | null {
  if (events.length === 0) return null;
  const next = events[0];
  // Parse as local date to avoid UTC-offset display bug in VN timezone
  const [y, m, d] = next.startDate.split("T")[0].split("-").map(Number);
  const dateStr = new Date(y, m - 1, d).toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" });
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs mb-3">
      <Calendar className="w-3.5 h-3.5 shrink-0" />
      <span>Sự kiện: <strong>{next.name}</strong> — {dateStr}</span>
      {events.length > 1 && <span className="text-amber-500 dark:text-amber-400">+{events.length - 1}</span>}
    </div>
  );
}
