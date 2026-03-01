"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Save, ChevronDown, ChevronRight, Shield, Users, Globe, BookOpen, Home, Film, MessageCircle, Lock, Mic } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BibleGenerateButton } from "./bible-generate-button";
import { StringListEditor, TextField } from "./bible-layer-form";

interface BibleData {
  id?: string;
  coreValues: string[];
  coreFear: string;
  crisisResponse: string;
  redLines: string[];
  relationships: Array<{ name: string; role: string; personality: string; catchphrase: string; dynamic: string }>;
  worldRules: Array<{ rule: string; effect: string }>;
  weaknesses: string[];
  originWound: string;
  originVow: string;
  originSymbol: string;
  livingSpaces: Array<{ name: string; mood: string; visualDesc: string }>;
  storyArcs: Array<{ chapter: number; weeks: string; title: string; description: string }>;
  catchphrases: string[];
  insideJokes: string[];
  rituals: string[];
  vocabularyRules: string[];
  visualLocks: { props: string[]; texture: string; colorPalette: string } | null;
  voiceDna: { tone: string; pace: string; signature: string } | null;
  generatedByAi?: boolean;
}

const EMPTY_BIBLE: BibleData = {
  coreValues: [], coreFear: "", crisisResponse: "", redLines: [],
  relationships: [], worldRules: [], weaknesses: [],
  originWound: "", originVow: "", originSymbol: "",
  livingSpaces: [], storyArcs: [],
  catchphrases: [], insideJokes: [], rituals: [], vocabularyRules: [],
  visualLocks: null, voiceDna: null,
};

const LAYERS = [
  { key: "core", label: "Niềm tin & Red Lines", icon: Shield, color: "text-rose-500" },
  { key: "relationships", label: "Nhân vật phụ", icon: Users, color: "text-blue-500" },
  { key: "world", label: "Luật thế giới", icon: Globe, color: "text-emerald-500" },
  { key: "origin", label: "Câu chuyện gốc", icon: BookOpen, color: "text-purple-500" },
  { key: "spaces", label: "Bối cảnh", icon: Home, color: "text-amber-500" },
  { key: "arcs", label: "Story Arc", icon: Film, color: "text-orange-500" },
  { key: "language", label: "Ngôn ngữ & Ritual", icon: MessageCircle, color: "text-cyan-500" },
  { key: "locks", label: "Visual Locks & Voice DNA", icon: Lock, color: "text-gray-500" },
] as const;

interface Props {
  channelId: string;
}

export function CharacterBibleEditor({ channelId }: Props): React.ReactElement {
  const [bible, setBible] = useState<BibleData>(EMPTY_BIBLE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openLayers, setOpenLayers] = useState<Set<string>>(new Set(["core"]));

  const fetchBible = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/channels/${channelId}/character-bible`);
      const json = (await res.json()) as { data: BibleData | null };
      if (json.data) {
        setBible({
          ...EMPTY_BIBLE,
          ...json.data,
          coreValues: (json.data.coreValues as string[]) || [],
          redLines: (json.data.redLines as string[]) || [],
          relationships: (json.data.relationships as BibleData["relationships"]) || [],
          worldRules: (json.data.worldRules as BibleData["worldRules"]) || [],
          weaknesses: (json.data.weaknesses as string[]) || [],
          livingSpaces: (json.data.livingSpaces as BibleData["livingSpaces"]) || [],
          storyArcs: (json.data.storyArcs as BibleData["storyArcs"]) || [],
          catchphrases: (json.data.catchphrases as string[]) || [],
          insideJokes: (json.data.insideJokes as string[]) || [],
          rituals: (json.data.rituals as string[]) || [],
          vocabularyRules: (json.data.vocabularyRules as string[]) || [],
        });
        // Expand all layers when data exists
        setOpenLayers(new Set(LAYERS.map((l) => l.key)));
      }
    } catch {
      toast.error("Lỗi tải Character Bible");
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => { void fetchBible(); }, [fetchBible]);

  async function handleSave(): Promise<void> {
    setSaving(true);
    try {
      const res = await fetch(`/api/channels/${channelId}/character-bible`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bible),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error || "Lỗi lưu");
      }
      toast.success("Đã lưu Character Bible");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi lưu");
    } finally {
      setSaving(false);
    }
  }

  function toggleLayer(key: string): void {
    setOpenLayers((prev) => {
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

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <BibleGenerateButton channelId={channelId} hasExisting={!!bible.id} onGenerated={() => void fetchBible()} />
        <Button onClick={() => void handleSave()} disabled={saving} size="sm">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Lưu
        </Button>
      </div>

      {/* Accordion layers */}
      {LAYERS.map(({ key, label, icon: Icon, color }) => (
        <div key={key} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggleLayer(key)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <Icon className={`w-4 h-4 ${color}`} />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex-1 text-left">{label}</span>
            {openLayers.has(key) ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          </button>

          {openLayers.has(key) && (
            <div className="px-4 pb-4 space-y-4 border-t border-gray-100 dark:border-slate-800 pt-4">
              {key === "core" && <CoreLayer bible={bible} onChange={setBible} />}
              {key === "relationships" && <RelationshipsLayer bible={bible} onChange={setBible} />}
              {key === "world" && <WorldLayer bible={bible} onChange={setBible} />}
              {key === "origin" && <OriginLayer bible={bible} onChange={setBible} />}
              {key === "spaces" && <SpacesLayer bible={bible} onChange={setBible} />}
              {key === "arcs" && <ArcsLayer bible={bible} onChange={setBible} />}
              {key === "language" && <LanguageLayer bible={bible} onChange={setBible} />}
              {key === "locks" && <LocksLayer bible={bible} onChange={setBible} />}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Layer sub-components ───

interface LayerProps { bible: BibleData; onChange: (b: BibleData) => void; }

function CoreLayer({ bible, onChange }: LayerProps): React.ReactElement {
  return (
    <>
      <StringListEditor label="Niềm tin cốt lõi (3)" values={bible.coreValues} onChange={(v) => onChange({ ...bible, coreValues: v })} placeholder="VD: Đồ tốt là đồ dùng được 2 năm" />
      <TextField label="Nỗi sợ sâu xa" value={bible.coreFear} onChange={(v) => onChange({ ...bible, coreFear: v })} placeholder="VD: Sợ người xem tốn tiền oan vì lời mình" />
      <TextField label="Phản ứng khi khủng hoảng" value={bible.crisisResponse} onChange={(v) => onChange({ ...bible, crisisResponse: v })} />
      <StringListEditor label="Red Lines — điều KHÔNG BAO GIỜ làm" values={bible.redLines} onChange={(v) => onChange({ ...bible, redLines: v })} placeholder="VD: Không review sai sự thật" />
    </>
  );
}

function RelationshipsLayer({ bible, onChange }: LayerProps): React.ReactElement {
  function addRelationship(): void {
    onChange({ ...bible, relationships: [...bible.relationships, { name: "", role: "sidekick", personality: "", catchphrase: "", dynamic: "" }] });
  }
  function removeRelationship(i: number): void {
    onChange({ ...bible, relationships: bible.relationships.filter((_, idx) => idx !== i) });
  }
  function updateRelationship(i: number, field: string, value: string): void {
    const updated = [...bible.relationships];
    updated[i] = { ...updated[i], [field]: value };
    onChange({ ...bible, relationships: updated });
  }

  return (
    <div className="space-y-3">
      {bible.relationships.map((r, i) => (
        <div key={i} className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Nhân vật #{i + 1}</span>
            <button onClick={() => removeRelationship(i)} className="text-xs text-rose-500 hover:text-rose-600">Xoá</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={r.name} onChange={(e) => updateRelationship(i, "name", e.target.value)} placeholder="Tên" className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-sm outline-none" />
            <select value={r.role} onChange={(e) => updateRelationship(i, "role", e.target.value)} className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-sm outline-none">
              <option value="sidekick">Sidekick</option>
              <option value="mentor">Mentor</option>
              <option value="anti-fan">Anti-fan</option>
              <option value="rival">Rival</option>
            </select>
          </div>
          <input value={r.personality} onChange={(e) => updateRelationship(i, "personality", e.target.value)} placeholder="Tính cách" className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-sm outline-none" />
          <input value={r.catchphrase} onChange={(e) => updateRelationship(i, "catchphrase", e.target.value)} placeholder="Câu cửa miệng" className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-sm outline-none" />
          <input value={r.dynamic} onChange={(e) => updateRelationship(i, "dynamic", e.target.value)} placeholder="Cách tương tác" className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-sm outline-none" />
        </div>
      ))}
      <button onClick={addRelationship} className="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400">+ Thêm nhân vật</button>
    </div>
  );
}

function WorldLayer({ bible, onChange }: LayerProps): React.ReactElement {
  function addRule(): void {
    onChange({ ...bible, worldRules: [...bible.worldRules, { rule: "", effect: "" }] });
  }
  function removeRule(i: number): void {
    onChange({ ...bible, worldRules: bible.worldRules.filter((_, idx) => idx !== i) });
  }
  function updateRule(i: number, field: string, value: string): void {
    const updated = [...bible.worldRules];
    updated[i] = { ...updated[i], [field]: value };
    onChange({ ...bible, worldRules: updated });
  }

  return (
    <div className="space-y-3">
      {bible.worldRules.map((r, i) => (
        <div key={i} className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Luật #{i + 1}</span>
            <button onClick={() => removeRule(i)} className="text-xs text-rose-500">Xoá</button>
          </div>
          <input value={r.rule} onChange={(e) => updateRule(i, "rule", e.target.value)} placeholder="Luật" className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-sm outline-none" />
          <input value={r.effect} onChange={(e) => updateRule(i, "effect", e.target.value)} placeholder="Hiệu ứng content" className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-sm outline-none" />
        </div>
      ))}
      <button onClick={addRule} className="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400">+ Thêm luật</button>
      <StringListEditor label="Điểm yếu dễ thương" values={bible.weaknesses} onChange={(v) => onChange({ ...bible, weaknesses: v })} placeholder="VD: Hơi cầu toàn" />
    </div>
  );
}

function OriginLayer({ bible, onChange }: LayerProps): React.ReactElement {
  return (
    <>
      <TextField label="Wound — vết thương quá khứ" value={bible.originWound} onChange={(v) => onChange({ ...bible, originWound: v })} multiline placeholder="Tại sao bắt đầu làm content?" />
      <TextField label="Vow — lời thề" value={bible.originVow} onChange={(v) => onChange({ ...bible, originVow: v })} placeholder="Sứ mệnh cá nhân" />
      <TextField label="Symbol — biểu tượng nhận diện" value={bible.originSymbol} onChange={(v) => onChange({ ...bible, originSymbol: v })} placeholder="VD: Chiếc thước dây" />
    </>
  );
}

function SpacesLayer({ bible, onChange }: LayerProps): React.ReactElement {
  function addSpace(): void {
    onChange({ ...bible, livingSpaces: [...bible.livingSpaces, { name: "", mood: "", visualDesc: "" }] });
  }
  function removeSpace(i: number): void {
    onChange({ ...bible, livingSpaces: bible.livingSpaces.filter((_, idx) => idx !== i) });
  }
  function updateSpace(i: number, field: string, value: string): void {
    const updated = [...bible.livingSpaces];
    updated[i] = { ...updated[i], [field]: value };
    onChange({ ...bible, livingSpaces: updated });
  }

  return (
    <div className="space-y-3">
      {bible.livingSpaces.map((s, i) => (
        <div key={i} className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Bối cảnh #{i + 1}</span>
            <button onClick={() => removeSpace(i)} className="text-xs text-rose-500">Xoá</button>
          </div>
          <input value={s.name} onChange={(e) => updateSpace(i, "name", e.target.value)} placeholder="Tên bối cảnh" className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-sm outline-none" />
          <input value={s.mood} onChange={(e) => updateSpace(i, "mood", e.target.value)} placeholder="Mood/cảm xúc" className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-sm outline-none" />
          <textarea value={s.visualDesc} onChange={(e) => updateSpace(i, "visualDesc", e.target.value)} placeholder="Mô tả hình ảnh" rows={2} className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-sm outline-none" />
        </div>
      ))}
      <button onClick={addSpace} className="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400">+ Thêm bối cảnh</button>
    </div>
  );
}

function ArcsLayer({ bible, onChange }: LayerProps): React.ReactElement {
  function addArc(): void {
    const nextChapter = bible.storyArcs.length + 1;
    const weeksMap: Record<number, string> = { 1: "1-4", 2: "5-8", 3: "9-12" };
    onChange({ ...bible, storyArcs: [...bible.storyArcs, { chapter: nextChapter, weeks: weeksMap[nextChapter] || `${(nextChapter - 1) * 4 + 1}-${nextChapter * 4}`, title: "", description: "" }] });
  }
  function removeArc(i: number): void {
    onChange({ ...bible, storyArcs: bible.storyArcs.filter((_, idx) => idx !== i) });
  }
  function updateArc(i: number, field: string, value: string): void {
    const updated = [...bible.storyArcs];
    updated[i] = { ...updated[i], [field]: value };
    onChange({ ...bible, storyArcs: updated });
  }

  return (
    <div className="space-y-3">
      {bible.storyArcs.map((a, i) => (
        <div key={i} className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Chapter {a.chapter} (tuần {a.weeks})</span>
            <button onClick={() => removeArc(i)} className="text-xs text-rose-500">Xoá</button>
          </div>
          <input value={a.title} onChange={(e) => updateArc(i, "title", e.target.value)} placeholder="Tiêu đề chapter" className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-sm outline-none" />
          <textarea value={a.description} onChange={(e) => updateArc(i, "description", e.target.value)} placeholder="Mô tả nội dung arc" rows={2} className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-sm outline-none" />
        </div>
      ))}
      <button onClick={addArc} className="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400">+ Thêm chapter</button>
    </div>
  );
}

function LanguageLayer({ bible, onChange }: LayerProps): React.ReactElement {
  return (
    <>
      <StringListEditor label="Catchphrases (câu cửa miệng)" values={bible.catchphrases} onChange={(v) => onChange({ ...bible, catchphrases: v })} placeholder="VD: Đáng tiền không?" />
      <StringListEditor label="Inside Jokes" values={bible.insideJokes} onChange={(v) => onChange({ ...bible, insideJokes: v })} placeholder="VD: Hộp đồ fail" />
      <StringListEditor label="Rituals (thói quen lặp)" values={bible.rituals} onChange={(v) => onChange({ ...bible, rituals: v })} placeholder="VD: Mở hộp bằng tay trái" />
      <StringListEditor label="Vocabulary Rules" values={bible.vocabularyRules} onChange={(v) => onChange({ ...bible, vocabularyRules: v })} placeholder="VD: Luôn nói 'test thực tế'" />
    </>
  );
}

function LocksLayer({ bible, onChange }: LayerProps): React.ReactElement {
  const vl = bible.visualLocks || { props: [], texture: "", colorPalette: "" };
  const vd = bible.voiceDna || { tone: "", pace: "", signature: "" };

  function updateVL(field: string, value: unknown): void {
    onChange({ ...bible, visualLocks: { ...vl, [field]: value } });
  }
  function updateVD(field: string, value: string): void {
    onChange({ ...bible, voiceDna: { ...vd, [field]: value } });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Lock className="w-4 h-4 text-gray-400" />
        <span className="text-xs font-medium text-gray-500 uppercase">Visual Locks</span>
      </div>
      <StringListEditor label="Props nhận diện" values={vl.props} onChange={(v) => updateVL("props", v)} placeholder="VD: Thước dây, nhãn PASS/FAIL" />
      <TextField label="Texture (ánh sáng, nền, vibe)" value={vl.texture} onChange={(v) => updateVL("texture", v)} />
      <TextField label="Bảng màu chủ đạo" value={vl.colorPalette} onChange={(v) => updateVL("colorPalette", v)} />

      <div className="flex items-center gap-2 mb-2 mt-6">
        <Mic className="w-4 h-4 text-gray-400" />
        <span className="text-xs font-medium text-gray-500 uppercase">Voice DNA</span>
      </div>
      <TextField label="Tone giọng" value={vd.tone} onChange={(v) => updateVD("tone", v)} placeholder="VD: Thân thiện, hài, đôi khi hơi cay" />
      <TextField label="Nhịp nói" value={vd.pace} onChange={(v) => updateVD("pace", v)} placeholder="VD: Nhanh khi excited, chậm khi review" />
      <TextField label="Đặc điểm nhận diện" value={vd.signature} onChange={(v) => updateVD("signature", v)} placeholder="VD: Hay cười nhẹ cuối câu" />
    </div>
  );
}
