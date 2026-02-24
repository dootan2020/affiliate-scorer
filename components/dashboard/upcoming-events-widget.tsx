import Link from "next/link";
import { CalendarDays } from "lucide-react";

interface UpcomingEvent {
  id: string;
  name: string;
  eventType: string;
  startDate: string;
  endDate: string;
  daysUntil: number;
}

interface UpcomingEventsWidgetProps {
  events: UpcomingEvent[];
}

function getDotColor(daysUntil: number): string {
  if (daysUntil <= 3) return "bg-rose-500";
  if (daysUntil <= 7) return "bg-amber-500";
  if (daysUntil <= 14) return "bg-blue-500";
  return "bg-gray-400";
}

function getEventSuggestion(event: UpcomingEvent): string | null {
  if (event.daysUntil <= 3) {
    return "Nen chuan bi content tu BAY GIO";
  }
  const type = event.eventType;
  if (type === "seasonal") {
    return "SP phu hop: Phu kien, My pham, Qua tang";
  }
  if (type === "mega_sale") {
    return "Chuan bi banner, voucher, content truoc";
  }
  return null;
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sStr = s.toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "numeric",
  });
  const eStr = e.toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "numeric",
  });
  return `${sStr} - ${eStr}`;
}

export function UpcomingEventsWidget({
  events,
}: UpcomingEventsWidgetProps): React.ReactElement {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-50">
            Sap toi
          </h3>
        </div>
        <Link
          href="/insights?tab=calendar"
          className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-50 transition-colors"
        >
          Xem tat ca →
        </Link>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
          Khong co su kien sap toi
        </p>
      ) : (
        <div className="space-y-4">
          {events.slice(0, 3).map((event) => {
            const suggestion = getEventSuggestion(event);
            return (
              <div key={event.id} className="flex items-start gap-3">
                <span
                  className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${getDotColor(event.daysUntil)}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                      {event.name}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      ({formatDateRange(event.startDate, event.endDate)})
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      — con {event.daysUntil} ngay
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
      )}
    </div>
  );
}
