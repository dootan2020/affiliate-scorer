"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { fetchWithRetry } from "@/lib/utils/fetch-with-retry";

interface UpcomingEvent {
  id: string;
  name: string;
  eventType: string;
  startDate: string;
  endDate: string;
  daysUntil: number;
}

function getDotColor(daysUntil: number): string {
  if (daysUntil <= 3) return "bg-rose-500";
  if (daysUntil <= 7) return "bg-amber-500";
  if (daysUntil <= 14) return "bg-orange-500";
  return "bg-gray-400";
}

function getEventSuggestion(event: UpcomingEvent): string | null {
  if (event.daysUntil <= 3) return "Nên chuẩn bị content từ BÂY GIỜ";
  if (event.eventType === "seasonal") return "SP phù hợp: Phụ kiện, Mỹ phẩm, Quà tặng";
  if (event.eventType === "mega_sale") return "Chuẩn bị banner, voucher, content trước";
  return null;
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" })} - ${e.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" })}`;
}

export function UpcomingEventsWidget(): React.ReactElement {
  const [events, setEvents] = useState<UpcomingEvent[]>([]);

  useEffect(() => {
    fetchWithRetry("/api/calendar/upcoming")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.data)) setEvents(d.data);
      })
      .catch((e) => { console.error("[upcoming-events-widget]", e); });
  }, []);

  if (events.length === 0) return <></>;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-orange-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
            Sắp tới
          </h3>
        </div>
        <Link
          href="/insights?tab=calendar"
          className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-50 transition-colors"
        >
          Xem tất cả →
        </Link>
      </div>

      <div className="space-y-4">
        {events.slice(0, 3).map((event) => {
          const suggestion = getEventSuggestion(event);
          return (
            <div key={event.id} className="flex items-start gap-3">
              <span
                className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${getDotColor(event.daysUntil)}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                    {event.name}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    ({formatDateRange(event.startDate, event.endDate)})
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    — còn {event.daysUntil} ngày
                  </span>
                </div>
                {suggestion && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {suggestion}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
