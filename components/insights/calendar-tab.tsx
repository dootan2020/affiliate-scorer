"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { CalendarDays, Plus } from "lucide-react";
import { CalendarEventForm, type CalendarEventData } from "./calendar-event-form";
import { CalendarEventsList } from "./calendar-events-list";

export function CalendarTab(): React.ReactElement {
  const [events, setEvents] = useState<CalendarEventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventData | null>(
    null
  );

  const fetchEvents = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await fetch("/api/calendar");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEvents(data.data ?? []);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Lỗi khi tải sự kiện"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  function openCreateForm(): void {
    setEditingEvent(null);
    setShowForm(true);
  }

  function openEditForm(event: CalendarEventData): void {
    setEditingEvent(event);
    setShowForm(true);
  }

  function handleFormSaved(): void {
    setShowForm(false);
    setEditingEvent(null);
    void fetchEvents();
  }

  function handleFormClose(): void {
    setShowForm(false);
    setEditingEvent(null);
  }

  function handleDeleted(id: string): void {
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-orange-500" />
          <h2 className="text-xl font-medium text-gray-900 dark:text-gray-50">
            Lịch sự kiện
          </h2>
        </div>
        <button
          onClick={openCreateForm}
          className="inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-400 text-white rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm hover:shadow transition-all"
        >
          <Plus className="w-4 h-4" />
          Thêm sự kiện
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <CalendarEventForm
          editingEvent={editingEvent}
          onClose={handleFormClose}
          onSaved={handleFormSaved}
        />
      )}

      {/* Events list */}
      <CalendarEventsList
        events={events}
        loading={loading}
        onEdit={openEditForm}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
