"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";

const EVENT_TYPE_OPTIONS = [
  { value: "mega_sale", label: "Mega Sale" },
  { value: "seasonal", label: "Mùa vụ" },
  { value: "flash_sale", label: "Flash Sale" },
  { value: "custom", label: "Tự định nghĩa" },
] as const;

const PLATFORM_OPTIONS = [
  "TikTok Shop",
  "Shopee",
  "Lazada",
  "Facebook",
  "Instagram",
] as const;

export interface CalendarEventData {
  id: string;
  name: string;
  eventType: string;
  startDate: string;
  endDate: string;
  platforms: string[];
  notes: string | null;
}

interface CalendarEventFormProps {
  editingEvent: CalendarEventData | null;
  onClose: () => void;
  onSaved: () => void;
}

export function CalendarEventForm({
  editingEvent,
  onClose,
  onSaved,
}: CalendarEventFormProps): React.ReactElement {
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState(editingEvent?.name ?? "");
  const [formType, setFormType] = useState(
    editingEvent?.eventType ?? "mega_sale"
  );
  const [formStart, setFormStart] = useState(
    editingEvent?.startDate.split("T")[0] ?? ""
  );
  const [formEnd, setFormEnd] = useState(
    editingEvent?.endDate.split("T")[0] ?? ""
  );
  const [formPlatforms, setFormPlatforms] = useState<string[]>(
    editingEvent?.platforms ?? []
  );
  const [formNotes, setFormNotes] = useState(editingEvent?.notes ?? "");

  function togglePlatform(platform: string): void {
    setFormPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!formName.trim() || !formStart || !formEnd) {
      toast.error("Nhập tên, ngày bắt đầu và kết thúc");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        eventType: formType,
        startDate: formStart,
        endDate: formEnd,
        platforms: formPlatforms,
        notes: formNotes || null,
      };

      const url = editingEvent
        ? `/api/calendar/${editingEvent.id}`
        : "/api/calendar";
      const method = editingEvent ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(
        editingEvent ? "Đã cập nhật sự kiện" : "Đã thêm sự kiện"
      );
      onSaved();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Lỗi khi lưu sự kiện"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
          {editingEvent ? "Sửa sự kiện" : "Thêm sự kiện mới"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          Tên sự kiện *
        </label>
        <input
          type="text"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          placeholder="VD: 3.3 Sale, 8/3 Quốc tế Phụ nữ..."
          className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Loại *
          </label>
          <select
            value={formType}
            onChange={(e) => setFormType(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
          >
            {EVENT_TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Bắt đầu *
          </label>
          <input
            type="date"
            value={formStart}
            onChange={(e) => setFormStart(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Kết thúc *
          </label>
          <input
            type="date"
            value={formEnd}
            onChange={(e) => setFormEnd(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          Nền tảng
        </label>
        <div className="flex flex-wrap gap-1.5">
          {PLATFORM_OPTIONS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => togglePlatform(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                formPlatforms.includes(p)
                  ? "bg-orange-600 text-white"
                  : "bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-950"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          Ghi chú
        </label>
        <input
          type="text"
          value={formNotes}
          onChange={(e) => setFormNotes(e.target.value)}
          placeholder="Ghi chú thêm (tùy chọn)"
          className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-400 text-white rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving
          ? "Đang lưu..."
          : editingEvent
            ? "Cập nhật sự kiện"
            : "Thêm sự kiện"}
      </button>
    </form>
  );
}
