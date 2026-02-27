"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  Trash2,
  Calendar,
} from "lucide-react";

interface SlotData {
  id: string;
  channelId: string;
  scheduledDate: string;
  scheduledTime: string | null;
  contentType: string;
  videoFormat: string | null;
  status: string;
  notes: string | null;
  productIdentity: { id: string; title: string | null; imageUrl: string | null } | null;
  channel: { id: string; name: string } | null;
}

interface ChannelOption {
  id: string;
  name: string;
}

const CONTENT_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  entertainment: { label: "Giải trí", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30" },
  education: { label: "Giáo dục", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/30" },
  review: { label: "Review", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/30" },
  selling: { label: "Bán hàng", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/30" },
};

const STATUS_ICONS: Record<string, string> = {
  planned: "⏳",
  briefed: "📝",
  produced: "🎬",
  published: "✅",
  skipped: "⏭️",
};

const DAY_NAMES = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function getWeekRange(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday = start
  const start = new Date(d);
  start.setDate(d.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDisplay(d: Date): string {
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

const selectCls =
  "rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none";

export function CalendarTab(): React.ReactElement {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [channels, setChannels] = useState<ChannelOption[]>([]);
  const [selectedChannel, setSelectedChannel] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null); // date string of day being added to
  const [saving, setSaving] = useState(false);

  // New slot form state
  const [newSlotTime, setNewSlotTime] = useState("19:00");
  const [newSlotType, setNewSlotType] = useState("review");
  const [newSlotFormat, setNewSlotFormat] = useState("");

  const week = getWeekRange(currentDate);

  const fetchSlots = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        start: formatDate(week.start),
        end: formatDate(week.end),
      });
      if (selectedChannel) params.set("channelId", selectedChannel);
      const res = await fetch(`/api/calendar/slots?${params}`);
      const json = (await res.json()) as { data?: SlotData[] };
      setSlots(json.data ?? []);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [week.start.toISOString(), week.end.toISOString(), selectedChannel]);

  useEffect(() => {
    fetch("/api/channels")
      .then((r) => r.json())
      .then((json: { data?: ChannelOption[] }) => {
        const chs = json.data ?? [];
        setChannels(chs);
        if (chs.length > 0 && !selectedChannel) setSelectedChannel(chs[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedChannel) void fetchSlots();
  }, [selectedChannel, fetchSlots]);

  function prevWeek(): void {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  }

  function nextWeek(): void {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  }

  function goToday(): void {
    setCurrentDate(new Date());
  }

  async function handleAddSlot(dateStr: string): Promise<void> {
    if (!selectedChannel) return;
    setSaving(true);
    try {
      await fetch("/api/calendar/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: selectedChannel,
          scheduledDate: dateStr,
          scheduledTime: newSlotTime || undefined,
          contentType: newSlotType,
          videoFormat: newSlotFormat || undefined,
        }),
      });
      setAdding(null);
      void fetchSlots();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSlot(slotId: string): Promise<void> {
    if (!confirm("Xoá slot này?")) return;
    try {
      await fetch(`/api/calendar/slots/${slotId}`, { method: "DELETE" });
      void fetchSlots();
    } catch {
      // silent
    }
  }

  // Build days array for the week
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(week.start);
    d.setDate(week.start.getDate() + i);
    days.push(d);
  }

  // Group slots by date
  const slotsByDate: Record<string, SlotData[]> = {};
  for (const slot of slots) {
    const key = slot.scheduledDate.slice(0, 10);
    if (!slotsByDate[key]) slotsByDate[key] = [];
    slotsByDate[key].push(slot);
  }

  // Stats
  const totalSlots = slots.length;
  const typeCounts: Record<string, number> = {};
  for (const slot of slots) {
    typeCounts[slot.contentType] = (typeCounts[slot.contentType] || 0) + 1;
  }

  const today = formatDate(new Date());

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {channels.length > 0 && (
              <select
                className={selectCls}
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
              >
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>{ch.name}</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prevWeek} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <button onClick={goToday} className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-50 px-3 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
              Hôm nay
            </button>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-50 min-w-[120px] text-center">
              {formatDisplay(week.start)} — {formatDisplay(week.end)}
            </span>
            <button onClick={nextWeek} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm px-4 py-3">
        <div className="flex items-center gap-4 flex-wrap text-xs">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Tuần này: <strong>{totalSlots}</strong> slots
          </span>
          {Object.entries(CONTENT_TYPE_CONFIG).map(([key, cfg]) => (
            <span key={key} className={cfg.color}>
              {cfg.label}: <strong>{typeCounts[key] || 0}</strong>
            </span>
          ))}
        </div>
      </div>

      {/* Week list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : channels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Calendar className="w-8 h-8 text-gray-400 mb-3" />
          <p className="text-sm text-gray-500">Tạo kênh TikTok trước để dùng lịch đăng</p>
        </div>
      ) : (
        <div className="space-y-2">
          {days.map((day, dayIdx) => {
            const dateStr = formatDate(day);
            const daySlots = slotsByDate[dateStr] || [];
            const isToday = dateStr === today;

            return (
              <div
                key={dateStr}
                className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-4 ${isToday ? "ring-2 ring-orange-300 dark:ring-orange-600" : ""}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${isToday ? "text-orange-600 dark:text-orange-400" : "text-gray-900 dark:text-gray-50"}`}>
                      {DAY_NAMES[dayIdx]} — {day.getDate()}/{day.getMonth() + 1}
                    </span>
                    {isToday && (
                      <span className="text-[10px] font-medium text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/30 px-1.5 py-0.5 rounded-full">
                        Hôm nay
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setAdding(adding === dateStr ? null : dateStr)}
                    className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm
                  </button>
                </div>

                {/* Slots for this day */}
                {daySlots.length === 0 && adding !== dateStr && (
                  <p className="text-xs text-gray-400 italic">Không có slot</p>
                )}
                {daySlots.map((slot) => {
                  const cfg = CONTENT_TYPE_CONFIG[slot.contentType];
                  return (
                    <div
                      key={slot.id}
                      className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-slate-800/50 last:border-0"
                    >
                      <span className="text-xs text-gray-400 w-12 shrink-0 font-mono">
                        {slot.scheduledTime || "—"}
                      </span>
                      {cfg && (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${cfg.color} ${cfg.bg}`}>
                          {cfg.label}
                        </span>
                      )}
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">
                        {slot.productIdentity?.title || slot.notes || "—"}
                      </span>
                      <span className="text-xs shrink-0">{STATUS_ICONS[slot.status] || "⏳"}</span>
                      <button
                        onClick={() => void handleDeleteSlot(slot.id)}
                        className="text-gray-300 hover:text-rose-500 transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}

                {/* Add slot inline form */}
                {adding === dateStr && (
                  <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-800 flex items-end gap-2 flex-wrap">
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-0.5">Giờ</label>
                      <input
                        type="time"
                        value={newSlotTime}
                        onChange={(e) => setNewSlotTime(e.target.value)}
                        className={selectCls + " w-24"}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-0.5">Loại</label>
                      <select className={selectCls} value={newSlotType} onChange={(e) => setNewSlotType(e.target.value)}>
                        <option value="entertainment">Giải trí</option>
                        <option value="education">Giáo dục</option>
                        <option value="review">Review</option>
                        <option value="selling">Bán hàng</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-0.5">Format</label>
                      <select className={selectCls} value={newSlotFormat} onChange={(e) => setNewSlotFormat(e.target.value)}>
                        <option value="">Tự do</option>
                        <option value="before_after">Before/After</option>
                        <option value="product_showcase">Product Showcase</option>
                        <option value="slideshow_voiceover">Slideshow + VO</option>
                        <option value="tutorial_steps">Tutorial Steps</option>
                        <option value="comparison">Comparison</option>
                        <option value="trending_hook">Trending Hook</option>
                      </select>
                    </div>
                    <button
                      onClick={() => void handleAddSlot(dateStr)}
                      disabled={saving}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition-all disabled:opacity-50 flex items-center gap-1"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      Thêm
                    </button>
                    <button
                      onClick={() => setAdding(null)}
                      className="text-xs text-gray-400 hover:text-gray-700 px-3 py-2 transition-colors"
                    >
                      Huỷ
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
