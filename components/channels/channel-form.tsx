"use client";

import { useState, useEffect } from "react";
import { Loader2, Sparkles, PenLine, RefreshCw } from "lucide-react";
import { useBackgroundGenerate } from "@/lib/hooks/use-background-generate";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { dispatchSuggestionEvent } from "@/lib/events/suggestion-events";
import type { ChannelProfileResult } from "@/lib/content/channel-profile-types";
import { ChannelProfilePreview } from "./channel-profile-preview";
import { ChannelManualForm, emptyProfile } from "./channel-manual-form";

interface ChannelInitial {
  id?: string;
  name?: string;
  handle?: string | null;
  niche?: string;
  personaName?: string;
  personaDesc?: string;
  voiceStyle?: string;
  targetAudience?: string | null;
  colorPrimary?: string | null;
  colorSecondary?: string | null;
  fontStyle?: string | null;
  editingStyle?: string | null;
  subNiche?: string | null;
  usp?: string | null;
  contentPillars?: string[] | null;
  hookBank?: string[] | null;
  contentMix?: Record<string, number> | null;
  contentPillarDetails?: Array<{ pillar: string; aiFeasibility: string; recommendedFormats: string[]; productionNotes: string }> | null;
  videoFormats?: Array<{ contentType: string; primaryFormat: string; secondaryFormat: string; aiToolSuggestion: string; productionNotes: string }> | null;
  productionStyle?: string | null;
  productionStyleReason?: string | null;
  postsPerDay?: number | null;
  postingSchedule?: Record<string, { times: string[]; focus: string }> | null;
  seriesSchedule?: Array<{ name: string; dayOfWeek: string; contentPillar: string }> | null;
  ctaTemplates?: Record<string, string> | null;
  competitorChannels?: Array<{ handle: string; followers: string; whyReference: string }> | null;
  generatedByAi?: boolean;
}

interface Props {
  initial?: Partial<ChannelInitial>;
  onSaved: (id?: string) => void;
  onCancel: () => void;
}

const inputCls =
  "w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none";
const labelCls = "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1";

const TONE_OPTIONS = [
  { value: "Vui vẻ Gen Z", label: "Vui vẻ Gen Z" },
  { value: "Chuyên gia uy tín", label: "Chuyên gia uy tín" },
  { value: "Chị gái tâm sự", label: "Chị gái tâm sự" },
  { value: "Honest review thẳng thắn", label: "Review thẳng thắn" },
];

function initialToProfile(initial: Partial<ChannelInitial>): ChannelProfileResult {
  const base = emptyProfile();
  return {
    ...base,
    name: initial.name ?? base.name,
    handle: initial.handle ?? base.handle,
    personaName: initial.personaName ?? base.personaName,
    personaDesc: initial.personaDesc ?? base.personaDesc,
    subNiche: initial.subNiche ?? base.subNiche,
    usp: initial.usp ?? base.usp,
    contentPillars: (initial.contentPillars as string[]) ?? base.contentPillars,
    contentPillarDetails: (initial.contentPillarDetails as ChannelProfileResult["contentPillarDetails"]) ?? base.contentPillarDetails,
    hookBank: (initial.hookBank as string[]) ?? base.hookBank,
    contentMix: initial.contentMix
      ? {
          review: initial.contentMix.review ?? 0,
          lifestyle: initial.contentMix.lifestyle ?? 0,
          tutorial: initial.contentMix.tutorial ?? 0,
          selling: initial.contentMix.selling ?? 0,
          entertainment: initial.contentMix.entertainment ?? 0,
        }
      : base.contentMix,
    contentMixReason: "",
    videoFormats: (initial.videoFormats as ChannelProfileResult["videoFormats"]) ?? base.videoFormats,
    productionStyle: (initial.productionStyle as ChannelProfileResult["productionStyle"]) ?? base.productionStyle,
    productionStyleReason: initial.productionStyleReason ?? base.productionStyleReason,
    postsPerDay: initial.postsPerDay ?? base.postsPerDay,
    postingSchedule: (initial.postingSchedule as ChannelProfileResult["postingSchedule"]) ?? base.postingSchedule,
    seriesSchedule: (initial.seriesSchedule as ChannelProfileResult["seriesSchedule"]) ?? base.seriesSchedule,
    ctaTemplates: initial.ctaTemplates
      ? {
          entertainment: initial.ctaTemplates.entertainment ?? "",
          education: initial.ctaTemplates.education ?? "",
          review: initial.ctaTemplates.review ?? "",
          selling: initial.ctaTemplates.selling ?? "",
        }
      : base.ctaTemplates,
    competitorChannels: (initial.competitorChannels as ChannelProfileResult["competitorChannels"]) ?? base.competitorChannels,
    voiceStyle: initial.voiceStyle ?? base.voiceStyle,
    editingStyle: initial.editingStyle ?? base.editingStyle,
    fontStyle: initial.fontStyle ?? base.fontStyle,
    colorPrimary: initial.colorPrimary ?? base.colorPrimary,
    colorSecondary: initial.colorSecondary ?? base.colorSecondary,
  };
}

export function ChannelForm({ initial, onSaved, onCancel }: Props): React.ReactElement {
  const isEdit = !!initial?.id;
  const hasExistingData = isEdit && (initial?.contentPillars?.length ?? 0) > 0;

  const [tab, setTab] = useState<"ai" | "manual">(hasExistingData ? "manual" : "ai");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI input fields
  const [aiNiche, setAiNiche] = useState(initial?.niche ?? "");
  const [aiAudience, setAiAudience] = useState(initial?.targetAudience ?? "");
  const [aiTone, setAiTone] = useState(TONE_OPTIONS[0].value);

  // Profile (shared between AI result and manual editing)
  const [profile, setProfile] = useState<ChannelProfileResult | null>(
    hasExistingData ? initialToProfile(initial!) : null,
  );
  const [wasAiGenerated, setWasAiGenerated] = useState(initial?.generatedByAi ?? false);

  const gen = useBackgroundGenerate(() => {
    // result available from gen.result
  });

  // When AI generation completes, extract result
  useEffect(() => {
    if (gen.status === "completed" && gen.result) {
      setProfile(gen.result as ChannelProfileResult);
      setWasAiGenerated(true);
      setGenerating(false);
      toast.success("AI đã tạo profile kênh. Kiểm tra và chỉnh sửa nếu cần.");
      gen.reset();
    } else if (gen.status === "failed") {
      setError(gen.error ?? "Lỗi tạo profile");
      toast.error(gen.error ?? "Lỗi tạo profile");
      setGenerating(false);
      gen.reset();
    }
  }, [gen.status, gen.result, gen.error]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGenerate(): Promise<void> {
    if (!aiNiche || !aiAudience) {
      toast.error("Vui lòng nhập Niche và Đối tượng mục tiêu");
      return;
    }
    setGenerating(true);
    setError(null);
    const taskId = await gen.start("/api/channels/generate", {
      body: { niche: aiNiche, targetAudience: aiAudience, tone: aiTone },
    });
    if (!taskId) {
      setGenerating(false);
      setError(gen.error ?? "Lỗi kết nối");
      toast.error(gen.error ?? "Lỗi kết nối");
    }
  }

  async function handleSave(): Promise<void> {
    if (!profile) return;
    if (!profile.name || !profile.personaName || !profile.personaDesc) {
      toast.error("Vui lòng nhập Tên kênh, Tên nhân vật, Mô tả persona");
      return;
    }

    // Validate content mix = 100%
    const mixTotal = profile.contentMix.review + profile.contentMix.lifestyle
      + profile.contentMix.tutorial + profile.contentMix.selling + profile.contentMix.entertainment;
    if (mixTotal !== 100) {
      toast.error(`Content Mix phải tổng = 100% (hiện tại: ${mixTotal}%)`);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const url = isEdit ? `/api/channels/${initial!.id}` : "/api/channels";
      const method = isEdit ? "PUT" : "POST";
      const payload = {
        name: profile.name,
        handle: profile.handle?.replace(/^@+/, "") || undefined,
        niche: aiNiche || profile.subNiche || "beauty_skincare",
        personaName: profile.personaName,
        personaDesc: profile.personaDesc,
        voiceStyle: profile.voiceStyle,
        targetAudience: aiAudience || undefined,
        colorPrimary: profile.colorPrimary || undefined,
        colorSecondary: profile.colorSecondary || undefined,
        fontStyle: profile.fontStyle || undefined,
        editingStyle: profile.editingStyle || undefined,
        subNiche: profile.subNiche || undefined,
        usp: profile.usp || undefined,
        contentPillars: profile.contentPillars.filter(Boolean),
        hookBank: profile.hookBank.filter(Boolean),
        contentMix: profile.contentMix,
        contentPillarDetails: profile.contentPillarDetails.length > 0 ? profile.contentPillarDetails : undefined,
        videoFormats: profile.videoFormats.length > 0 ? profile.videoFormats : undefined,
        productionStyle: profile.productionStyle || undefined,
        productionStyleReason: profile.productionStyleReason || undefined,
        postsPerDay: profile.postsPerDay,
        postingSchedule: profile.postingSchedule,
        seriesSchedule: profile.seriesSchedule,
        ctaTemplates: profile.ctaTemplates,
        competitorChannels: profile.competitorChannels,
        generatedByAi: wasAiGenerated,
        aiGeneratedAt: wasAiGenerated ? new Date().toISOString() : undefined,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(isEdit ? "Đã cập nhật kênh" : "Đã tạo kênh mới");
        dispatchSuggestionEvent("channel-updated");
        const body = await res.json().catch(() => null) as { data?: { id?: string } } | null;
        onSaved(body?.data?.id);
      } else {
        const body = await res.json().catch(() => null) as { error?: string } | null;
        throw new Error(body?.error ?? `Lỗi ${res.status}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi kết nối";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 space-y-5">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
        {isEdit ? "Sửa kênh" : "Tạo kênh mới"}
      </h3>

      {/* Tabs */}
      <nav className="flex items-center gap-1 bg-gray-100/80 dark:bg-slate-800/80 rounded-xl p-1">
        <button
          type="button"
          onClick={() => setTab("ai")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "ai"
              ? "bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-gray-50"
              : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          <Sparkles className="w-4 h-4" /> AI Tạo tự động
        </button>
        <button
          type="button"
          onClick={() => setTab("manual")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "manual"
              ? "bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-gray-50"
              : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          <PenLine className="w-4 h-4" /> Tự điền
        </button>
      </nav>

      {/* AI Tab — input fields */}
      {tab === "ai" && !profile && (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Niche cụ thể *</label>
            <input
              className={inputCls}
              value={aiNiche}
              onChange={(e) => setAiNiche(e.target.value)}
              placeholder="VD: Skincare cho da dầu mụn"
            />
          </div>
          <div>
            <label className={labelCls}>Đối tượng mục tiêu *</label>
            <input
              className={inputCls}
              value={aiAudience}
              onChange={(e) => setAiAudience(e.target.value)}
              placeholder="VD: Nữ 18-30, sinh viên/nhân viên văn phòng, budget trung bình"
            />
          </div>
          <div>
            <label className={labelCls}>Tone mong muốn *</label>
            <select className={inputCls} value={aiTone} onChange={(e) => setAiTone(e.target.value)}>
              {TONE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={generating}
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang tạo profile... (~15 giây)
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                AI Tạo Profile Kênh
              </>
            )}
          </Button>
        </div>
      )}

      {/* AI Tab — after generation, show editable preview */}
      {tab === "ai" && profile && (
        <ChannelProfilePreview profile={profile} onChange={setProfile} />
      )}

      {/* Manual Tab */}
      {tab === "manual" && (
        <ChannelManualForm
          profile={profile}
          onChange={setProfile}
        />
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl px-4 py-3">
          <span className="text-sm text-rose-700 dark:text-rose-300">{error}</span>
        </div>
      )}

      {/* Actions — show once profile exists or in manual mode */}
      {(profile || tab === "manual") && (
        <div className="flex items-center gap-3 pt-2 flex-wrap">
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !profile}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? "Lưu thay đổi" : "Lưu kênh"}
          </Button>
          {tab === "ai" && profile && (
            <button
              type="button"
              onClick={() => { setProfile(null); setWasAiGenerated(false); }}
              className="bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl px-5 py-2.5 font-medium transition-colors inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Generate lại
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl px-5 py-2.5 font-medium transition-colors"
          >
            Hủy
          </button>
        </div>
      )}
    </div>
  );
}
