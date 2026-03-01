"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  Trash2,
  Calendar,
  AlertCircle,
  Package,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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
  contentAsset: { id: string; assetCode: string; status: string; hookText: string | null } | null;
}

interface ChannelOption {
  id: string;
  name: string;
}

interface ProductOption {
  id: string;
  title: string | null;
}

interface AssetOption {
  id: string;
  assetCode: string;
  hookText: string | null;
  status: string;
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

/** Format date as YYYY-MM-DD in LOCAL timezone (avoids UTC shift) */
function formatDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplay(d: Date): string {
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

const selectCls =
  "rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none";

export function CalendarTab(): React.ReactElement {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [channels, setChannels] = useState<ChannelOption[]>([]);
  const [selectedChannel, setSelectedChannel] = useState("");
  const [loading, setLoading] = useState(true);
  const [channelsLoaded, setChannelsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Product options for linking
  const [products, setProducts] = useState<ProductOption[]>([]);

  // New slot form state
  const [newSlotTime, setNewSlotTime] = useState("19:00");
  const [newSlotType, setNewSlotType] = useState("review");
  const [newSlotFormat, setNewSlotFormat] = useState("");
  const [newSlotProduct, setNewSlotProduct] = useState("");
  const [newSlotAsset, setNewSlotAsset] = useState("");
  const [availableAssets, setAvailableAssets] = useState<AssetOption[]>([]);

  const week = useMemo(() => getWeekRange(currentDate), [currentDate.getTime()]);
  const weekStartStr = formatDateLocal(week.start);
  const weekEndStr = formatDateLocal(week.end);

  const fetchSlots = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        start: weekStartStr,
        end: weekEndStr,
      });
      if (selectedChannel) params.set("channelId", selectedChannel);
      const res = await fetch(`/api/calendar/slots?${params}`);
      if (!res.ok) {
        setError(`Lỗi tải lịch (${res.status})`);
        setSlots([]);
        return;
      }
      const json = (await res.json()) as { data?: SlotData[] };
      setSlots(json.data ?? []);
    } catch {
      setError("Không thể tải lịch đăng. Kiểm tra kết nối mạng.");
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [weekStartStr, weekEndStr, selectedChannel]);

  // Fetch channels on mount
  useEffect(() => {
    fetch("/api/channels?active=true")
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((json: { data?: ChannelOption[] }) => {
        const chs = json.data ?? [];
        setChannels(chs);
        if (chs.length > 0 && !selectedChannel) setSelectedChannel(chs[0].id);
      })
      .catch(() => {
        setError("Không thể tải danh sách kênh");
      })
      .finally(() => {
        setChannelsLoaded(true);
        setLoading(false);
      });
  }, []);

  // Fetch scored products for linking
  useEffect(() => {
    fetch("/api/inbox?state=scored&limit=50")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((json: { data?: ProductOption[] }) => setProducts(json.data ?? []))
      .catch(() => {
        // Fallback — try ProductIdentity directly
        fetch("/api/products?limit=50")
          .then((r) => r.ok ? r.json() : Promise.reject())
          .then((json: { data?: ProductOption[] }) => setProducts(json.data ?? []))
          .catch(() => setProducts([]));
      });
  }, []);

  // Fetch assets when product selection changes (for slot→asset linking)
  useEffect(() => {
    if (!newSlotProduct) {
      setAvailableAssets([]);
      setNewSlotAsset("");
      return;
    }
    fetch(`/api/assets?productIdentityId=${newSlotProduct}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((json: { data?: AssetOption[] }) => setAvailableAssets(json.data ?? []))
      .catch(() => setAvailableAssets([]));
  }, [newSlotProduct]);

  // Fetch slots when channel or week changes
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
    setError(null);
    try {
      const res = await fetch("/api/calendar/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: selectedChannel,
          scheduledDate: dateStr,
          scheduledTime: newSlotTime || undefined,
          contentType: newSlotType,
          videoFormat: newSlotFormat || undefined,
          productIdentityId: newSlotProduct || undefined,
          contentAssetId: newSlotAsset || undefined,
        }),
      });
      if (!res.ok) {
        toast.error("Không thể tạo slot. Thử lại.");
        return;
      }
      toast.success("Đã thêm slot mới");
      setAdding(null);
      setNewSlotProduct("");
      setNewSlotAsset("");
      void fetchSlots();
    } catch {
      toast.error("Lỗi kết nối khi tạo slot");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSlot(slotId: string): Promise<void> {
    if (!confirm("Xoá slot này?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/calendar/slots/${slotId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Không thể xoá slot");
        return;
      }
      toast.success("Đã xoá slot");
      void fetchSlots();
    } catch {
      toast.error("Lỗi kết nối khi xoá slot");
    }
  }

  // Build days array for the week
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(week.start);
    d.setDate(week.start.getDate() + i);
    days.push(d);
  }

  // Group slots by date (use local date format for matching)
  const slotsByDate: Record<string, SlotData[]> = {};
  for (const slot of slots) {
    // Parse scheduledDate from API (ISO or date string) and format locally
    const slotDate = new Date(slot.scheduledDate);
    const key = formatDateLocal(slotDate);
    if (!slotsByDate[key]) slotsByDate[key] = [];
    slotsByDate[key].push(slot);
  }

  // Stats
  const totalSlots = slots.length;
  const typeCounts: Record<string, number> = {};
  for (const slot of slots) {
    typeCounts[slot.contentType] = (typeCounts[slot.contentType] || 0) + 1;
  }

  const today = formatDateLocal(new Date());

  // Show empty state if channels haven't loaded yet
  if (!channelsLoaded) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="h-9 w-40 bg-gray-200 dark:bg-slate-700 rounded-xl" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gray-100 dark:bg-slate-800 rounded-lg" />
              <div className="h-8 w-20 bg-gray-100 dark:bg-slate-800 rounded-lg" />
              <div className="h-4 w-28 bg-gray-200 dark:bg-slate-700 rounded" />
              <div className="h-8 w-8 bg-gray-100 dark:bg-slate-800 rounded-lg" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-4">
              <div className="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded mb-2" />
              <div className="h-3 w-16 bg-gray-100 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-600 text-xs">✕</button>
        </div>
      )}

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
            <Button onClick={prevWeek} variant="ghost" size="icon-sm">
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </Button>
            <button onClick={goToday} className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-50 px-3 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
              Hôm nay
            </button>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-50 min-w-[120px] text-center">
              {formatDisplay(week.start)} — {formatDisplay(week.end)}
            </span>
            <Button onClick={nextWeek} variant="ghost" size="icon-sm">
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      {channels.length > 0 && (
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
      )}

      {/* Week list */}
      {channels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Calendar className="w-8 h-8 text-gray-400 mb-3" />
          <p className="text-sm text-gray-500 mb-4">Tạo kênh TikTok trước để dùng lịch đăng</p>
          <Button asChild>
            <Link href="/channels">Tạo kênh</Link>
          </Button>
        </div>
      ) : loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-4">
              <div className="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded mb-2" />
              <div className="h-3 w-16 bg-gray-100 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {days.map((day, dayIdx) => {
            const dateStr = formatDateLocal(day);
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
                  <Button
                    onClick={() => setAdding(adding === dateStr ? null : dateStr)}
                    variant="link"
                    size="xs"
                    className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm
                  </Button>
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
                      {slot.contentAsset && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-1.5 py-0.5 rounded-full shrink-0 font-mono">
                          {slot.contentAsset.assetCode}
                        </span>
                      )}
                      {slot.productIdentity && !slot.contentAsset && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-full shrink-0">
                          <Package className="w-2.5 h-2.5" />
                          SP
                        </span>
                      )}
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">
                        {slot.productIdentity?.title || slot.notes || "—"}
                      </span>
                      <span className="text-xs shrink-0">{STATUS_ICONS[slot.status] || "⏳"}</span>
                      <Button
                        onClick={() => void handleDeleteSlot(slot.id)}
                        variant="ghost"
                        size="icon-xs"
                        className="text-gray-300 hover:text-rose-500 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  );
                })}

                {/* Add slot inline form */}
                {adding === dateStr && (
                  <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-end gap-2 flex-wrap">
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
                    </div>
                    {/* Product selector */}
                    {products.length > 0 && (
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-0.5">Sản phẩm (tuỳ chọn)</label>
                        <select className={selectCls + " w-full"} value={newSlotProduct} onChange={(e) => { setNewSlotProduct(e.target.value); setNewSlotAsset(""); }}>
                          <option value="">Không gắn SP</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.title ?? `SP ${p.id.slice(-6)}`}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {/* Asset selector — appears after product selected */}
                    {availableAssets.length > 0 && (
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-0.5">Video/Asset (tuỳ chọn)</label>
                        <select className={selectCls + " w-full"} value={newSlotAsset} onChange={(e) => setNewSlotAsset(e.target.value)}>
                          <option value="">Không gắn video</option>
                          {availableAssets.map((a) => (
                            <option key={a.id} value={a.id}>{a.assetCode} — {a.hookText?.slice(0, 40) || a.status}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => void handleAddSlot(dateStr)}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 gap-1"
                        size="sm"
                      >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        Thêm
                      </Button>
                      <Button
                        onClick={() => setAdding(null)}
                        variant="link"
                        size="xs"
                        className="text-gray-400 hover:text-gray-700"
                      >
                        Huỷ
                      </Button>
                    </div>
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
