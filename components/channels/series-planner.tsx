"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2, Plus, ChevronDown, ChevronRight, Pencil, Trash2, Sparkles,
  CheckCircle2, Play, Pause, Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useBackgroundGenerate } from "@/lib/hooks/use-background-generate";
import {
  SERIES_TYPE_LABELS, SERIES_STATUS_LABELS,
  EPISODE_GOAL_LABELS, EPISODE_STATUS_LABELS,
  type SeriesType, type SeriesStatus,
} from "@/lib/content/series-types";

interface SeriesRow {
  id: string;
  name: string;
  type: SeriesType;
  premise: string | null;
  status: SeriesStatus;
  _count?: { episodes: number };
}

interface EpisodeRow {
  id: string;
  episodeNumber: number;
  title: string;
  goal: string | null;
  formatSlug: string | null;
  pillar: string | null;
  status: string;
  plannedDate: string | null;
  notes: string | null;
}

interface Props {
  channelId: string;
}

export function SeriesPlanner({ channelId }: Props): React.ReactElement {
  const [seriesList, setSeriesList] = useState<SeriesRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchSeries = useCallback(async () => {
    try {
      const res = await fetch(`/api/channels/${channelId}/series`);
      const json = (await res.json()) as { data: SeriesRow[] };
      setSeriesList(json.data || []);
    } catch {
      toast.error("Lỗi tải series");
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => { void fetchSeries(); }, [fetchSeries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {seriesList.length} series
        </h3>
        <Button onClick={() => setCreating(true)} size="sm" disabled={creating}>
          <Plus className="w-3.5 h-3.5" /> Tạo series
        </Button>
      </div>

      {creating && (
        <CreateSeriesForm
          channelId={channelId}
          onCreated={() => { setCreating(false); void fetchSeries(); }}
          onCancel={() => setCreating(false)}
        />
      )}

      {seriesList.length === 0 && !creating && (
        <div className="flex flex-col items-center py-12 text-center">
          <Calendar className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm text-gray-500">Chưa có series nào</p>
          <p className="text-xs text-gray-400 mt-1">Tạo series để lên kế hoạch nội dung theo chủ đề</p>
        </div>
      )}

      {seriesList.map((s) => (
        <div key={s.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <StatusIcon status={s.status} />
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500">
                  {SERIES_TYPE_LABELS[s.type]}
                </span>
              </div>
              {s.premise && <p className="text-xs text-gray-400 truncate mt-0.5">{s.premise}</p>}
            </div>
            <span className="text-xs text-gray-400">{s._count?.episodes ?? 0} ep</span>
            {expandedId === s.id ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          </button>

          {expandedId === s.id && (
            <div className="border-t border-gray-100 dark:border-slate-800">
              <SeriesDetail channelId={channelId} series={s} onUpdated={() => void fetchSeries()} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Status Icon ───

function StatusIcon({ status }: { status: SeriesStatus }): React.ReactElement {
  switch (status) {
    case "active": return <Play className="w-4 h-4 text-emerald-500 shrink-0" />;
    case "paused": return <Pause className="w-4 h-4 text-amber-500 shrink-0" />;
    case "completed": return <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />;
    default: return <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-slate-600 shrink-0" />;
  }
}

// ─── Create Series Form ───

function CreateSeriesForm({ channelId, onCreated, onCancel }: {
  channelId: string;
  onCreated: () => void;
  onCancel: () => void;
}): React.ReactElement {
  const [name, setName] = useState("");
  const [type, setType] = useState<SeriesType>("evergreen");
  const [premise, setPremise] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!name.trim()) { toast.error("Tên series không được trống"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/channels/${channelId}/series`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), type, premise: premise.trim() || null }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error || "Lỗi tạo series");
      }
      toast.success("Đã tạo series");
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi tạo series");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Tên series</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Review Đồ Bếp" className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Loại</label>
          <select value={type} onChange={(e) => setType(e.target.value as SeriesType)} className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20">
            {Object.entries(SERIES_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Premise (tùy chọn)</label>
        <textarea value={premise} onChange={(e) => setPremise(e.target.value)} placeholder="Mô tả chủ đề series" rows={2} className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
      </div>
      <div className="flex items-center gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Huỷ</Button>
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Tạo
        </Button>
      </div>
    </form>
  );
}

// ─── Series Detail (episodes) ───

function SeriesDetail({ channelId, series, onUpdated }: {
  channelId: string;
  series: SeriesRow;
  onUpdated: () => void;
}): React.ReactElement {
  const [episodes, setEpisodes] = useState<EpisodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchEpisodes = useCallback(async () => {
    try {
      const res = await fetch(`/api/channels/${channelId}/series/${series.id}/episodes`);
      const json = (await res.json()) as { data: EpisodeRow[] };
      setEpisodes(json.data || []);
    } catch {
      toast.error("Lỗi tải episodes");
    } finally {
      setLoading(false);
    }
  }, [channelId, series.id]);

  useEffect(() => { void fetchEpisodes(); }, [fetchEpisodes]);

  const epGen = useBackgroundGenerate(() => {
    setGenerating(false);
    toast.success("Đã tạo episodes bằng AI");
    void fetchEpisodes();
    onUpdated();
  });

  useEffect(() => {
    if (epGen.status === "failed") {
      setGenerating(false);
      toast.error(epGen.error ?? "Lỗi tạo episodes");
      epGen.reset();
    }
  }, [epGen.status, epGen.error]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGenerateEpisodes(): Promise<void> {
    setGenerating(true);
    const taskId = await epGen.start(
      `/api/channels/${channelId}/series/${series.id}/episodes/generate`,
      { body: { count: 5, goalDistribution: { awareness: 40, lead: 30, sale: 30 } } },
    );
    if (!taskId) {
      setGenerating(false);
      toast.error(epGen.error ?? "Lỗi tạo");
    }
  }

  async function handleDeleteSeries(): Promise<void> {
    if (!confirm(`Xoá series "${series.name}" và tất cả episodes?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/channels/${channelId}/series/${series.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Lỗi xoá");
      toast.success("Đã xoá series");
      onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi xoá");
    } finally {
      setDeleting(false);
    }
  }

  async function handleUpdateStatus(status: SeriesStatus): Promise<void> {
    try {
      const res = await fetch(`/api/channels/${channelId}/series/${series.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Lỗi cập nhật");
      toast.success(`Đã chuyển sang "${SERIES_STATUS_LABELS[status]}"`);
      onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi");
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* Series actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          series.status === "active" ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600"
          : series.status === "paused" ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600"
          : series.status === "completed" ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600"
          : "bg-gray-100 dark:bg-slate-800 text-gray-500"
        }`}>
          {SERIES_STATUS_LABELS[series.status]}
        </span>
        {series.status === "draft" && (
          <Button size="sm" variant="secondary" onClick={() => void handleUpdateStatus("active")}>
            <Play className="w-3 h-3" /> Kích hoạt
          </Button>
        )}
        {series.status === "active" && (
          <Button size="sm" variant="secondary" onClick={() => void handleUpdateStatus("paused")}>
            <Pause className="w-3 h-3" /> Tạm dừng
          </Button>
        )}
        {series.status === "paused" && (
          <Button size="sm" variant="secondary" onClick={() => void handleUpdateStatus("active")}>
            <Play className="w-3 h-3" /> Tiếp tục
          </Button>
        )}
        <Button size="sm" variant="secondary" onClick={() => void handleGenerateEpisodes()} disabled={generating}>
          {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          Tạo 5 EP bằng AI
        </Button>
        <Button size="sm" variant="ghost" onClick={() => void handleDeleteSeries()} disabled={deleting} className="text-rose-500 hover:text-rose-600 ml-auto">
          {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
          Xoá series
        </Button>
      </div>

      {/* Episodes list */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        </div>
      ) : episodes.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Chưa có episodes. Tạo bằng AI hoặc thêm thủ công.</p>
      ) : (
        <div className="space-y-1">
          {episodes.map((ep) => (
            <EpisodeItem key={ep.id} episode={ep} channelId={channelId} seriesId={series.id} onUpdated={() => { void fetchEpisodes(); onUpdated(); }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Episode Item ───

function EpisodeItem({ episode, channelId, seriesId, onUpdated }: {
  episode: EpisodeRow;
  channelId: string;
  seriesId: string;
  onUpdated: () => void;
}): React.ReactElement {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(): Promise<void> {
    setDeleting(true);
    try {
      const res = await fetch(`/api/channels/${channelId}/series/${seriesId}/episodes/${episode.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Lỗi xoá");
      toast.success("Đã xoá episode");
      onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setDeleting(false);
    }
  }

  const goalLabel = episode.goal ? EPISODE_GOAL_LABELS[episode.goal as keyof typeof EPISODE_GOAL_LABELS] : null;
  const statusLabel = EPISODE_STATUS_LABELS[episode.status as keyof typeof EPISODE_STATUS_LABELS] || episode.status;

  return (
    <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg px-3 py-2 group">
      <span className="text-xs font-mono text-gray-400 w-6 text-right shrink-0">#{episode.episodeNumber}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{episode.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {goalLabel && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              episode.goal === "sale" ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600"
              : episode.goal === "lead" ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600"
              : "bg-purple-50 dark:bg-purple-950/30 text-purple-600"
            }`}>
              {goalLabel}
            </span>
          )}
          {episode.formatSlug && (
            <span className="text-[10px] text-gray-400">{episode.formatSlug}</span>
          )}
          {episode.pillar && (
            <span className="text-[10px] text-gray-400">{episode.pillar}</span>
          )}
        </div>
      </div>
      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500">{statusLabel}</span>
      <button onClick={() => void handleDelete()} disabled={deleting} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-rose-500">
        {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
