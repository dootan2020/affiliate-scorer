"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, RefreshCw, Check, X, AlertCircle, ChevronDown, Clock, History } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { TacticalSuggestion, TacticalRefreshLogEntry } from "@/lib/content/tactical-refresh-types";

interface ChannelData {
  hookBank?: string[] | null;
  contentMix?: Record<string, number> | null;
  contentPillars?: string[] | null;
  contentPillarDetails?: unknown[] | null;
  postingSchedule?: Record<string, unknown> | null;
  postsPerDay?: number | null;
  seriesSchedule?: unknown[] | null;
  videoFormats?: unknown[] | null;
  ctaTemplates?: Record<string, string> | null;
  competitorChannels?: unknown[] | null;
  editingStyle?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: ChannelData;
  channelId: string;
  onRefreshed: () => void;
}

type Phase = "inputting" | "generating" | "reviewing" | "applying";

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  add: { label: "Thêm", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" },
  remove: { label: "Xoá", color: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400" },
  replace: { label: "Thay", color: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" },
  adjust: { label: "Chỉnh", color: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" },
};

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "(trống)";
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (Array.isArray(val)) {
    if (val.length === 0) return "(trống)";
    if (typeof val[0] === "string") return val.slice(0, 3).join(", ") + (val.length > 3 ? ` (+${val.length - 3})` : "");
    return `${val.length} mục`;
  }
  if (typeof val === "object") {
    const keys = Object.keys(val as Record<string, unknown>);
    return `{${keys.slice(0, 3).join(", ")}${keys.length > 3 ? "..." : ""}}`;
  }
  return String(val);
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + "…";
}

export function TacticalRefreshDialog({
  open,
  onOpenChange,
  channel,
  channelId,
  onRefreshed,
}: Props): React.ReactElement {
  const [phase, setPhase] = useState<Phase>("inputting");
  const [trendingContext, setTrendingContext] = useState("");
  const [useTracking, setUseTracking] = useState(false);
  const [trackedCount, setTrackedCount] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<TacticalSuggestion[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [analysisNotes, setAnalysisNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<TacticalRefreshLogEntry[]>([]);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Fetch tracked count + history on dialog open
  const fetchInitialData = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(`/api/channels/${channelId}/refresh-tactics`);
      if (res.ok) {
        const json = (await res.json()) as { count: number; history: TacticalRefreshLogEntry[] };
        setTrackedCount(json.count);
        setHistory(json.history ?? []);
      } else {
        setTrackedCount(0);
        setHistory([]);
      }
    } catch {
      toast.error("Lỗi tải dữ liệu chiến thuật");
      setTrackedCount(0);
      setHistory([]);
    }
  }, [channelId]);

  useEffect(() => {
    if (open) {
      setPhase("inputting");
      setTrendingContext("");
      setUseTracking(false);
      setSuggestions([]);
      setSelected(new Set());
      setAnalysisNotes("");
      setError(null);
      setExpandedLogId(null);
      setHistoryOpen(false);
      void fetchInitialData();
    }
  }, [open, fetchInitialData]);

  const trackingDisabled = trackedCount !== null && trackedCount < 10;
  const canGenerate = trendingContext.trim().length >= 10 || useTracking;

  async function handleGenerate(): Promise<void> {
    setPhase("generating");
    setError(null);
    try {
      const res = await fetch(`/api/channels/${channelId}/refresh-tactics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trendingContext: trendingContext.trim(), useTracking }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? "Lỗi server");
      }
      const json = (await res.json()) as {
        data: { suggestions: TacticalSuggestion[]; analysisNotes: string };
      };
      setSuggestions(json.data.suggestions);
      setAnalysisNotes(json.data.analysisNotes);
      // Select all by default
      setSelected(new Set(json.data.suggestions.map((_, i) => i)));
      setPhase("reviewing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
      setPhase("inputting");
    }
  }

  async function handleApply(): Promise<void> {
    if (selected.size === 0) {
      toast.info("Chưa chọn thay đổi nào");
      return;
    }

    setPhase("applying");
    setError(null);

    try {
      // Build applied values and field names from selected suggestions
      const appliedValues: Record<string, unknown> = {};
      const appliedFields: string[] = [];
      for (const idx of selected) {
        const s = suggestions[idx];
        if (s) {
          appliedValues[s.field] = s.suggested;
          appliedFields.push(s.field);
        }
      }

      const res = await fetch(`/api/channels/${channelId}/refresh-tactics`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trendingContext: trendingContext.trim(),
          usedTracking: useTracking,
          analysisNotes,
          suggestions: suggestions as unknown as Record<string, unknown>[],
          appliedFields,
          appliedValues,
        }),
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? "Không thể cập nhật");
      }

      toast.success(`Đã áp dụng ${selected.size} thay đổi`);
      onOpenChange(false);
      onRefreshed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi áp dụng");
      setPhase("reviewing");
    }
  }

  function toggleSelection(idx: number): void {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            Refresh Tactics
          </DialogTitle>
          <DialogDescription>
            Cập nhật chiến lược kênh dựa trên trending và dữ liệu performance
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="text-sm text-rose-700 dark:text-rose-300">{error}</span>
          </div>
        )}

        {/* INPUT PHASE */}
        {(phase === "inputting" || phase === "generating") && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Trending tuần này
              </label>
              <textarea
                value={trendingContext}
                onChange={(e) => setTrendingContext(e.target.value)}
                placeholder="VD: Hook &quot;POV&quot; đang viral, format Before/After makeup đang trend, sound &quot;nhạc chill lo-fi&quot; được dùng nhiều, format slideshow nhanh đang lên..."
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none resize-none"
                rows={4}
                disabled={phase === "generating"}
              />
              <p className="text-xs text-gray-400 mt-1">
                Mô tả trending bạn đang thấy trên TikTok (tối thiểu 10 ký tự)
              </p>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="use-tracking"
                checked={useTracking}
                onChange={(e) => setUseTracking(e.target.checked)}
                disabled={trackingDisabled || phase === "generating"}
                className="mt-0.5 rounded border-gray-300 dark:border-slate-600 accent-[#E87B35] focus:ring-orange-500/20 disabled:opacity-50"
              />
              <div>
                <label
                  htmlFor="use-tracking"
                  className={`text-sm font-medium ${trackingDisabled ? "text-gray-400" : "text-gray-700 dark:text-gray-300"}`}
                >
                  Phân tích tracking data
                </label>
                <p className="text-xs text-gray-400 mt-0.5">
                  {trackedCount === null
                    ? "Đang kiểm tra..."
                    : trackingDisabled
                      ? `Chỉ có ${trackedCount} video tracked — cần ≥10 để phân tích có ý nghĩa`
                      : `${trackedCount} video tracked — AI sẽ dùng data performance để đề xuất`}
                </p>
              </div>
            </div>

            {/* HISTORY SECTION */}
            {history.length > 0 && (
              <HistorySection
                history={history}
                historyOpen={historyOpen}
                setHistoryOpen={setHistoryOpen}
                expandedLogId={expandedLogId}
                setExpandedLogId={setExpandedLogId}
              />
            )}
          </div>
        )}

        {/* REVIEW PHASE */}
        {phase === "reviewing" && (
          <div className="space-y-4">
            {analysisNotes && (
              <div className="bg-orange-50 dark:bg-orange-950/30 rounded-xl p-4">
                <p className="text-sm text-orange-800 dark:text-orange-300">{analysisNotes}</p>
              </div>
            )}

            <div className="space-y-2">
              {suggestions.map((s, i) => {
                const actionStyle = ACTION_LABELS[s.action] ?? ACTION_LABELS.adjust;
                return (
                  <div
                    key={i}
                    className={`border rounded-xl p-3 transition-colors cursor-pointer ${
                      selected.has(i)
                        ? "border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/20"
                        : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    }`}
                    onClick={() => toggleSelection(i)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                        selected.has(i)
                          ? "bg-primary border-primary"
                          : "border-gray-300 dark:border-slate-600"
                      }`}>
                        {selected.has(i) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {s.label}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${actionStyle.color}`}>
                            {actionStyle.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          {s.reason}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-400 line-through truncate max-w-[40%]">
                            {formatValue(s.current)}
                          </span>
                          <span className="text-gray-300">→</span>
                          <span className="text-emerald-600 dark:text-emerald-400 truncate max-w-[40%]">
                            {formatValue(s.suggested)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {suggestions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">AI không có đề xuất thay đổi nào.</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {(phase === "inputting" || phase === "generating") && (
            <Button
              onClick={() => void handleGenerate()}
              disabled={!canGenerate || phase === "generating"}
            >
              {phase === "generating" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang phân tích...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Phân tích & đề xuất
                </>
              )}
            </Button>
          )}

          {phase === "reviewing" && suggestions.length > 0 && (
            <>
              <Button
                variant="secondary"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-4 h-4" />
                Bỏ qua
              </Button>
              <Button
                onClick={() => void handleApply()}
                disabled={selected.size === 0}
              >
                <Check className="w-4 h-4" />
                Áp dụng {selected.size}/{suggestions.length} đã chọn
              </Button>
            </>
          )}

          {phase === "applying" && (
            <Button
              disabled
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang áp dụng...
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── History sub-component ─── */

function HistorySection({
  history,
  historyOpen,
  setHistoryOpen,
  expandedLogId,
  setExpandedLogId,
}: {
  history: TacticalRefreshLogEntry[];
  historyOpen: boolean;
  setHistoryOpen: (v: boolean) => void;
  expandedLogId: string | null;
  setExpandedLogId: (v: string | null) => void;
}): React.ReactElement {
  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <Button
        type="button"
        variant="ghost"
        onClick={() => setHistoryOpen(!historyOpen)}
        className="w-full justify-between px-4 py-3 h-auto font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-none"
      >
        <span className="flex items-center gap-2">
          <History className="w-4 h-4 text-gray-400" />
          Lịch sử refresh
          <span className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-full px-2 py-0.5">
            {history.length}
          </span>
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${historyOpen ? "rotate-180" : ""}`} />
      </Button>

      {historyOpen && (
        <div className="border-t border-gray-200 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
          {history.map((entry) => {
            const isExpanded = expandedLogId === entry.id;
            const appliedCount = Array.isArray(entry.appliedFields) ? entry.appliedFields.length : 0;
            const entrySuggestions = (Array.isArray(entry.suggestions) ? entry.suggestions : []) as TacticalSuggestion[];

            return (
              <div key={entry.id} className="px-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setExpandedLogId(isExpanded ? null : entry.id)}
                  className="w-full justify-start gap-3 py-3 h-auto rounded-none"
                >
                  <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {relativeTime(entry.createdAt)}
                      </span>
                      <span className="text-[10px] bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 rounded-full px-2 py-0.5 font-medium">
                        {appliedCount} áp dụng
                      </span>
                      {entry.usedTracking && (
                        <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-full px-2 py-0.5">
                          tracking
                        </span>
                      )}
                    </div>
                    {entry.trendingContext && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                        {truncate(entry.trendingContext, 80)}
                      </p>
                    )}
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-300 transition-transform shrink-0 ${isExpanded ? "rotate-180" : ""}`} />
                </Button>

                {isExpanded && (
                  <div className="pb-3 space-y-2">
                    {entry.analysisNotes && (
                      <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3">
                        <p className="text-xs text-orange-800 dark:text-orange-300">{entry.analysisNotes}</p>
                      </div>
                    )}
                    {entrySuggestions.length > 0 && (
                      <div className="space-y-1.5">
                        {entrySuggestions.map((s, i) => {
                          const wasApplied = Array.isArray(entry.appliedFields) && entry.appliedFields.includes(s.field);
                          const actionStyle = ACTION_LABELS[s.action] ?? ACTION_LABELS.adjust;
                          return (
                            <div
                              key={i}
                              className={`rounded-lg px-3 py-2 text-xs ${
                                wasApplied
                                  ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800"
                                  : "bg-gray-50 dark:bg-slate-800/50"
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                {wasApplied && <Check className="w-3 h-3 text-emerald-600" />}
                                <span className="font-medium text-gray-700 dark:text-gray-300">{s.label}</span>
                                <span className={`text-[9px] px-1 py-0.5 rounded-full ${actionStyle.color}`}>
                                  {actionStyle.label}
                                </span>
                              </div>
                              <p className="text-gray-500 dark:text-gray-400 mt-0.5">{s.reason}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
