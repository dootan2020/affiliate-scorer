"use client";

import { useState } from "react";
import { toast } from "sonner";
import { dispatchSuggestionEvent } from "@/lib/events/suggestion-events";
import { CalendarDays, Pencil, Trash2 } from "lucide-react";
import type { CalendarEventData } from "./calendar-event-form";
import { Button } from "@/components/ui/button";

const EVENT_TYPE_BADGE: Record<string, { bg: string; text: string }> = {
  mega_sale: {
    bg: "bg-rose-50 dark:bg-rose-950",
    text: "text-rose-700 dark:text-rose-300",
  },
  seasonal: {
    bg: "bg-amber-50 dark:bg-amber-950",
    text: "text-amber-700 dark:text-amber-300",
  },
  flash_sale: {
    bg: "bg-orange-50 dark:bg-orange-950",
    text: "text-orange-700 dark:text-orange-300",
  },
  custom: {
    bg: "bg-gray-100 dark:bg-slate-800",
    text: "text-gray-700 dark:text-gray-300",
  },
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  mega_sale: "Mega Sale",
  seasonal: "Mùa vụ",
  flash_sale: "Flash Sale",
  custom: "Tự định nghĩa",
};

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sStr = s.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" });
  const eStr = e.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" });
  return `${sStr} - ${eStr}`;
}

function getMonthGroupKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthGroupLabel(key: string): string {
  const [y, m] = key.split("-");
  return `Tháng ${parseInt(m)}/${y}`;
}

interface CalendarEventsListProps {
  events: CalendarEventData[];
  loading: boolean;
  onEdit: (event: CalendarEventData) => void;
  onDeleted: (id: string) => void;
}

export function CalendarEventsList({
  events,
  loading,
  onEdit,
  onDeleted,
}: CalendarEventsListProps): React.ReactElement {
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string): Promise<void> {
    if (deleting) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/calendar/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast.success("Đã xóa sự kiện");
      dispatchSuggestionEvent("calendar-updated");
      onDeleted(id);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Lỗi khi xóa sự kiện"
      );
    } finally {
      setDeleting(null);
    }
  }

  // Group events by month
  const grouped = events.reduce<Record<string, CalendarEventData[]>>(
    (acc, event) => {
      const key = getMonthGroupKey(event.startDate);
      if (!acc[key]) acc[key] = [];
      acc[key].push(event);
      return acc;
    },
    {}
  );
  const sortedMonths = Object.keys(grouped).sort();

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (sortedMonths.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <CalendarDays className="w-6 h-6 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-1">
          Chưa có sự kiện
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
          Thêm sự kiện sale, mùa vụ để không bỏ lỡ cơ hội.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedMonths.map((monthKey) => (
        <div key={monthKey}>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            {getMonthGroupLabel(monthKey)}
          </h3>
          <div className="space-y-2">
            {grouped[monthKey].map((event) => {
              const badge =
                EVENT_TYPE_BADGE[event.eventType] ?? EVENT_TYPE_BADGE.custom;
              return (
                <div
                  key={event.id}
                  className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-slate-800/50 p-4 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-50">
                        {event.name}
                      </h4>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge.bg} ${badge.text}`}
                      >
                        {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDateRange(event.startDate, event.endDate)}
                    </p>
                    {event.platforms.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {event.platforms.map((p) => (
                          <span
                            key={p}
                            className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-slate-800 px-2 py-0.5 rounded"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                    {event.notes && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {event.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(event)}
                      className="text-gray-400 hover:text-orange-600 dark:hover:text-orange-400"
                      title="Sua"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(event.id)}
                      disabled={deleting === event.id}
                      className="text-gray-400 hover:text-rose-500 dark:hover:text-rose-400"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
