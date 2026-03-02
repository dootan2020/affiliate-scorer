"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2, Save, Eye, Palette, Music, BookOpen, Lock, Unlock,
  Sparkles, ChevronDown, ChevronRight, Plus, Trash2, Camera, Clapperboard,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TextField, StringListEditor } from "./bible-layer-form";

interface VideoBibleData {
  id?: string;
  channelId?: string;
  version?: number;
  locked?: boolean;
  // Visual (5)
  framing: string;
  lighting: string;
  composition: string;
  palette: string;
  editRhythm: string;
  // Audio (4)
  voiceStyleLock: string;
  sfxPack: string[];
  bgmMoods: string[];
  roomTone: string;
  // Narrative (3)
  openingRitual: string;
  proofTokenRule: string;
  closingRitual: string;
  // Mode
  aiMode: string;
  // Sub-resources
  shotCodes?: ShotCodeRow[];
  sceneTemplates?: SceneTemplateRow[];
}

interface ShotCodeRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  durationHint: string | null;
  camera: string | null;
  notes: string | null;
  sortOrder: number;
}

interface SceneTemplateRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  blocks: Array<{ blockType: string; label: string; description: string }>;
  defaultShotSequence: string[] | null;
  sortOrder: number;
}

const EMPTY: VideoBibleData = {
  framing: "", lighting: "", composition: "", palette: "", editRhythm: "",
  voiceStyleLock: "", sfxPack: [], bgmMoods: [], roomTone: "",
  openingRitual: "", proofTokenRule: "", closingRitual: "",
  aiMode: "hybrid",
};

const GROUPS = [
  { key: "visual", label: "Visual Locks", icon: Eye, color: "text-purple-500" },
  { key: "audio", label: "Audio Locks", icon: Music, color: "text-blue-500" },
  { key: "narrative", label: "Narrative Locks", icon: BookOpen, color: "text-emerald-500" },
  { key: "shots", label: "Shot Codes", icon: Camera, color: "text-orange-500" },
  { key: "scenes", label: "Scene Templates", icon: Clapperboard, color: "text-amber-500" },
] as const;

interface Props {
  channelId: string;
}

export function VideoBibleEditor({ channelId }: Props): React.ReactElement {
  const [data, setData] = useState<VideoBibleData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(["visual"]));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/channels/${channelId}/video-bible`);
      const json = (await res.json()) as { data: VideoBibleData | null };
      if (json.data) {
        setData({
          ...EMPTY,
          ...json.data,
          sfxPack: Array.isArray(json.data.sfxPack) ? json.data.sfxPack as string[] : [],
          bgmMoods: Array.isArray(json.data.bgmMoods) ? json.data.bgmMoods as string[] : [],
        });
        setOpenGroups(new Set(GROUPS.map((g) => g.key)));
      }
    } catch {
      toast.error("Lỗi tải Video Bible");
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  async function handleSave(): Promise<void> {
    setSaving(true);
    try {
      const { shotCodes: _s, sceneTemplates: _t, id: _id, channelId: _c, version: _v, locked: _l, ...payload } = data;
      const res = await fetch(`/api/channels/${channelId}/video-bible`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error || "Lỗi lưu");
      }
      toast.success("Đã lưu Video Bible");
      void fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi lưu");
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerate(): Promise<void> {
    if (data.id && !confirm("Tạo mới sẽ ghi đè dữ liệu hiện tại. Tiếp tục?")) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/channels/${channelId}/video-bible/generate`, { method: "POST" });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error || "Lỗi tạo");
      }
      toast.success("Đã tạo Video Bible bằng AI");
      void fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi tạo");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSeedDefaults(): Promise<void> {
    setSeeding(true);
    try {
      const res = await fetch(`/api/channels/${channelId}/video-bible/seed`, { method: "POST" });
      if (!res.ok) throw new Error("Lỗi seed");
      const json = (await res.json()) as { shotCodes?: number; sceneTemplates?: number };
      toast.success(`Đã seed ${json.shotCodes ?? 0} shot codes, ${json.sceneTemplates ?? 0} scene templates`);
      void fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi seed");
    } finally {
      setSeeding(false);
    }
  }

  async function handleToggleLock(): Promise<void> {
    try {
      const res = await fetch(`/api/channels/${channelId}/video-bible/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locked: !data.locked }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error || "Lỗi");
      }
      const json = (await res.json()) as { message?: string };
      toast.success(json.message || "OK");
      void fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi");
    }
  }

  function toggleGroup(key: string): void {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  const isLocked = data.locked === true;

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button onClick={() => void handleGenerate()} disabled={generating || isLocked} size="sm" variant="secondary">
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Tạo bằng AI
          </Button>
          <Button onClick={() => void handleSeedDefaults()} disabled={seeding || isLocked} size="sm" variant="secondary">
            {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Seed mặc định
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {data.id && (
            <>
              <VersionBadge version={data.version} locked={isLocked} />
              <Button onClick={() => void handleToggleLock()} size="sm" variant="ghost" className={isLocked ? "text-amber-600" : "text-gray-500"}>
                {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                {isLocked ? "Mở khóa" : "Khóa"}
              </Button>
            </>
          )}
          <Button onClick={() => void handleSave()} disabled={saving || isLocked} size="sm">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Lưu
          </Button>
        </div>
      </div>

      {isLocked && (
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
          <Lock className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-sm text-amber-700 dark:text-amber-300">Version {data.version} đã khóa. Mở khóa để chỉnh sửa.</span>
        </div>
      )}

      {/* Lock groups */}
      {GROUPS.map(({ key, label, icon: Icon, color }) => (
        <div key={key} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggleGroup(key)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <Icon className={`w-4 h-4 ${color}`} />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex-1 text-left">{label}</span>
            {key === "shots" && data.shotCodes && (
              <span className="text-xs text-gray-400">{data.shotCodes.length} codes</span>
            )}
            {key === "scenes" && data.sceneTemplates && (
              <span className="text-xs text-gray-400">{data.sceneTemplates.length} templates</span>
            )}
            {openGroups.has(key) ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          </button>

          {openGroups.has(key) && (
            <div className="px-4 pb-4 space-y-4 border-t border-gray-100 dark:border-slate-800 pt-4">
              {key === "visual" && <VisualGroup data={data} onChange={setData} disabled={isLocked} />}
              {key === "audio" && <AudioGroup data={data} onChange={setData} disabled={isLocked} />}
              {key === "narrative" && <NarrativeGroup data={data} onChange={setData} disabled={isLocked} />}
              {key === "shots" && <ShotCodesView codes={data.shotCodes ?? []} />}
              {key === "scenes" && <SceneTemplatesView templates={data.sceneTemplates ?? []} />}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Sub-components ───

function VersionBadge({ version, locked }: { version?: number; locked: boolean }): React.ReactElement {
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
      locked
        ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
        : "bg-gray-100 dark:bg-slate-800 text-gray-500"
    }`}>
      {locked && <Lock className="w-3 h-3" />}
      v{version ?? 1}
    </span>
  );
}

interface GroupProps { data: VideoBibleData; onChange: (d: VideoBibleData) => void; disabled: boolean }

function VisualGroup({ data, onChange, disabled }: GroupProps): React.ReactElement {
  return (
    <>
      <TextField label="Framing" value={data.framing} onChange={(v) => onChange({ ...data, framing: v })} placeholder="VD: Close-up sản phẩm + medium shot mặt" disabled={disabled} />
      <TextField label="Lighting" value={data.lighting} onChange={(v) => onChange({ ...data, lighting: v })} placeholder="VD: Ring light + window light" disabled={disabled} />
      <TextField label="Composition" value={data.composition} onChange={(v) => onChange({ ...data, composition: v })} placeholder="VD: Rule of thirds, sản phẩm center" disabled={disabled} />
      <TextField label="Palette" value={data.palette} onChange={(v) => onChange({ ...data, palette: v })} placeholder="VD: Warm tone, trắng kem + cam" disabled={disabled} />
      <TextField label="Edit Rhythm" value={data.editRhythm} onChange={(v) => onChange({ ...data, editRhythm: v })} placeholder="VD: Cut mỗi 2-3s, jump cut nhẹ" disabled={disabled} />
    </>
  );
}

function AudioGroup({ data, onChange, disabled }: GroupProps): React.ReactElement {
  return (
    <>
      <TextField label="Voice Style" value={data.voiceStyleLock} onChange={(v) => onChange({ ...data, voiceStyleLock: v })} placeholder="VD: Tự nhiên, nói chuyện thân mật" disabled={disabled} />
      <StringListEditor label="SFX Pack" values={data.sfxPack} onChange={(v) => onChange({ ...data, sfxPack: v })} placeholder="VD: *ding*, *swoosh*" disabled={disabled} />
      <StringListEditor label="BGM Moods" values={data.bgmMoods} onChange={(v) => onChange({ ...data, bgmMoods: v })} placeholder="VD: Lo-fi chill, upbeat pop" disabled={disabled} />
      <TextField label="Room Tone" value={data.roomTone} onChange={(v) => onChange({ ...data, roomTone: v })} placeholder="VD: Yên tĩnh, studio" disabled={disabled} />
    </>
  );
}

function NarrativeGroup({ data, onChange, disabled }: GroupProps): React.ReactElement {
  return (
    <>
      <TextField label="Opening Ritual" value={data.openingRitual} onChange={(v) => onChange({ ...data, openingRitual: v })} placeholder="VD: 'Xin chào, hôm nay chúng ta sẽ test...'" disabled={disabled} />
      <TextField label="Proof Token Rule" value={data.proofTokenRule} onChange={(v) => onChange({ ...data, proofTokenRule: v })} placeholder="VD: Luôn show bằng chứng dùng thật 7 ngày" disabled={disabled} />
      <TextField label="Closing Ritual" value={data.closingRitual} onChange={(v) => onChange({ ...data, closingRitual: v })} placeholder="VD: 'Follow để xem thêm review thật!'" disabled={disabled} />
      <div>
        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">AI Mode</label>
        <select
          value={data.aiMode}
          onChange={(e) => onChange({ ...data, aiMode: e.target.value })}
          disabled={disabled}
          className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
        >
          <option value="hybrid">Hybrid (AI + Human)</option>
          <option value="ai_only">AI Only</option>
        </select>
      </div>
    </>
  );
}

function ShotCodesView({ codes }: { codes: ShotCodeRow[] }): React.ReactElement {
  if (codes.length === 0) {
    return <p className="text-sm text-gray-400">Chưa có shot codes. Bấm &quot;Seed mặc định&quot; để tạo.</p>;
  }
  return (
    <div className="space-y-2">
      {codes.map((c) => (
        <div key={c.id} className="flex items-start gap-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3">
          <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 px-2 py-0.5 rounded shrink-0">{c.code}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.name}</p>
            {c.description && <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>}
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
              {c.durationHint && <span>{c.durationHint}</span>}
              {c.camera && <span>{c.camera}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SceneTemplatesView({ templates }: { templates: SceneTemplateRow[] }): React.ReactElement {
  if (templates.length === 0) {
    return <p className="text-sm text-gray-400">Chưa có scene templates. Bấm &quot;Seed mặc định&quot; để tạo.</p>;
  }
  return (
    <div className="space-y-3">
      {templates.map((t) => (
        <div key={t.id} className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded">{t.slug}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.name}</span>
          </div>
          {t.description && <p className="text-xs text-gray-500 mb-2">{t.description}</p>}
          <div className="flex flex-wrap gap-1.5">
            {(t.blocks as SceneTemplateRow["blocks"]).map((b, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-600">
                {b.label}
              </span>
            ))}
          </div>
          {t.defaultShotSequence && t.defaultShotSequence.length > 0 && (
            <p className="text-[10px] text-gray-400 mt-1.5">Shots: {(t.defaultShotSequence as string[]).join(" → ")}</p>
          )}
        </div>
      ))}
    </div>
  );
}
