"use client";

import { useState } from "react";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import type { ChannelProfileResult } from "@/lib/content/channel-profile-types";
import { Button } from "@/components/ui/button";

const inputCls =
  "w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none";
const labelCls = "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1";
const sectionCls = "space-y-3";
const sectionTitle = "text-sm font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2";

const VOICE_OPTIONS = [
  { value: "casual", label: "Tự nhiên" },
  { value: "professional", label: "Chuyên nghiệp" },
  { value: "energetic", label: "Năng động" },
  { value: "calm", label: "Nhẹ nhàng" },
];

const FONT_OPTIONS = [
  { value: "modern", label: "Hiện đại" },
  { value: "elegant", label: "Sang trọng" },
  { value: "playful", label: "Vui tươi" },
  { value: "minimal", label: "Tối giản" },
];

const EDIT_OPTIONS = [
  { value: "fast_cut", label: "Cắt nhanh" },
  { value: "smooth", label: "Mượt" },
  { value: "cinematic", label: "Cinematic" },
  { value: "minimal", label: "Tối giản" },
];

interface Props {
  profile: ChannelProfileResult;
  onChange: (profile: ChannelProfileResult) => void;
}

export function ChannelProfilePreview({ profile, onChange }: Props): React.ReactElement {
  const [mixError, setMixError] = useState<string | null>(null);

  function update<K extends keyof ChannelProfileResult>(key: K, value: ChannelProfileResult[K]): void {
    onChange({ ...profile, [key]: value });
  }

  function updateListItem(key: "contentPillars" | "hookBank", index: number, value: string): void {
    const list = [...profile[key]];
    list[index] = value;
    update(key, list);
  }

  function addListItem(key: "contentPillars" | "hookBank"): void {
    update(key, [...profile[key], ""]);
  }

  function removeListItem(key: "contentPillars" | "hookBank", index: number): void {
    update(key, profile[key].filter((_, i) => i !== index));
  }

  function updateContentMix(field: keyof ChannelProfileResult["contentMix"], value: number): void {
    const newMix = { ...profile.contentMix, [field]: value };
    const total = newMix.entertainment + newMix.education + newMix.review + newMix.selling;
    setMixError(total !== 100 ? `Tổng hiện tại: ${total}% (cần = 100%)` : null);
    update("contentMix", newMix);
  }

  function updateCompetitor(
    index: number,
    field: keyof ChannelProfileResult["competitorChannels"][0],
    value: string,
  ): void {
    const list = [...profile.competitorChannels];
    list[index] = { ...list[index], [field]: value };
    update("competitorChannels", list);
  }

  function addCompetitor(): void {
    update("competitorChannels", [
      ...profile.competitorChannels,
      { handle: "", followers: "", whyReference: "" },
    ]);
  }

  function removeCompetitor(index: number): void {
    update("competitorChannels", profile.competitorChannels.filter((_, i) => i !== index));
  }

  function updateSeries(
    index: number,
    field: keyof ChannelProfileResult["seriesSchedule"][0],
    value: string,
  ): void {
    const list = [...profile.seriesSchedule];
    list[index] = { ...list[index], [field]: value };
    update("seriesSchedule", list);
  }

  function addSeries(): void {
    update("seriesSchedule", [
      ...profile.seriesSchedule,
      { name: "", dayOfWeek: "", contentPillar: "" },
    ]);
  }

  function removeSeries(index: number): void {
    update("seriesSchedule", profile.seriesSchedule.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <section className={sectionCls}>
        <h4 className={sectionTitle}>📋 Thông tin cơ bản</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Tên kênh</label>
            <input className={inputCls} value={profile.name} onChange={(e) => update("name", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Handle</label>
            <input className={inputCls} value={profile.handle} onChange={(e) => update("handle", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Tên nhân vật</label>
            <input className={inputCls} value={profile.personaName} onChange={(e) => update("personaName", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Sub-niche</label>
            <input className={inputCls} value={profile.subNiche} onChange={(e) => update("subNiche", e.target.value)} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Mô tả persona</label>
          <textarea className={inputCls + " min-h-[60px] resize-y"} value={profile.personaDesc} onChange={(e) => update("personaDesc", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>USP — Điểm khác biệt</label>
          <textarea className={inputCls + " min-h-[60px] resize-y"} value={profile.usp} onChange={(e) => update("usp", e.target.value)} />
        </div>
      </section>

      {/* Content Pillars */}
      <section className={sectionCls}>
        <h4 className={sectionTitle}>📌 Content Pillars ({profile.contentPillars.length})</h4>
        <div className="space-y-2">
          {profile.contentPillars.map((pillar, i) => (
            <div key={i} className="flex items-center gap-2">
              <input className={inputCls} value={pillar} onChange={(e) => updateListItem("contentPillars", i, e.target.value)} />
              <Button type="button" variant="ghost" size="icon-xs" onClick={() => removeListItem("contentPillars", i)} className="text-gray-400 hover:text-rose-500 shrink-0">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="link" onClick={() => addListItem("contentPillars")} className="text-primary hover:text-primary/80 px-0">
            <Plus className="w-4 h-4" /> Thêm pillar
          </Button>
        </div>
      </section>

      {/* Hook Bank */}
      <section className={sectionCls}>
        <h4 className={sectionTitle}>🪝 Hook Bank ({profile.hookBank.length})</h4>
        <div className="space-y-2">
          {profile.hookBank.map((hook, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-6 text-right shrink-0">{i + 1}.</span>
              <input className={inputCls} value={hook} onChange={(e) => updateListItem("hookBank", i, e.target.value)} />
              <Button type="button" variant="ghost" size="icon-xs" onClick={() => removeListItem("hookBank", i)} className="text-gray-400 hover:text-rose-500 shrink-0">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="link" onClick={() => addListItem("hookBank")} className="text-primary hover:text-primary/80 px-0">
            <Plus className="w-4 h-4" /> Thêm hook
          </Button>
        </div>
      </section>

      {/* Production Style */}
      <section className={sectionCls}>
        <h4 className={sectionTitle}>🎬 Production Style</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Phong cách sản xuất</label>
            <select className={inputCls} value={profile.productionStyle} onChange={(e) => update("productionStyle", e.target.value as ChannelProfileResult["productionStyle"])}>
              <option value="voiceover_broll">Voiceover + B-roll</option>
              <option value="talking_head">Talking Head</option>
              <option value="product_showcase">Product Showcase</option>
              <option value="hybrid">Hybrid (kết hợp)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Lý do</label>
            <input className={inputCls} value={profile.productionStyleReason} onChange={(e) => update("productionStyleReason", e.target.value)} placeholder="Tại sao chọn style này?" />
          </div>
        </div>
      </section>

      {/* Content Pillar Details — AI Feasibility */}
      {profile.contentPillarDetails.length > 0 && (
        <section className={sectionCls}>
          <h4 className={sectionTitle}>🤖 AI Feasibility per Pillar</h4>
          <div className="space-y-2">
            {profile.contentPillarDetails.map((d, i) => (
              <div key={i} className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{d.pillar}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    d.aiFeasibility === "high" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                    : d.aiFeasibility === "medium" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                  }`}>
                    AI: {d.aiFeasibility}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{d.productionNotes}</p>
                <p className="text-xs text-gray-400 mt-0.5">Formats: {d.recommendedFormats.join(", ")}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Video Formats */}
      {profile.videoFormats.length > 0 && (
        <section className={sectionCls}>
          <h4 className={sectionTitle}>📹 Video Format Mapping</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {profile.videoFormats.map((vf, i) => (
              <div key={i} className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3">
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">{vf.contentType}</p>
                <p className="text-sm text-gray-900 dark:text-gray-100">{vf.primaryFormat} <span className="text-gray-400">/ {vf.secondaryFormat}</span></p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Tool: {vf.aiToolSuggestion}</p>
                <p className="text-xs text-gray-400 mt-0.5">{vf.productionNotes}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Content Mix */}
      <section className={sectionCls}>
        <h4 className={sectionTitle}>📊 Content Mix</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(["entertainment", "education", "review", "selling"] as const).map((key) => (
            <div key={key}>
              <label className={labelCls}>{key === "entertainment" ? "Giải trí" : key === "education" ? "Giáo dục" : key === "review" ? "Review" : "Bán hàng"}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  className={inputCls + " w-20"}
                  value={profile.contentMix[key]}
                  onChange={(e) => updateContentMix(key, Number(e.target.value))}
                />
                <span className="text-xs text-gray-400">%</span>
              </div>
            </div>
          ))}
        </div>
        {mixError && (
          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> {mixError}
          </p>
        )}
        <div>
          <label className={labelCls}>Lý do Content Mix</label>
          <textarea className={inputCls + " min-h-[50px] resize-y"} value={profile.contentMixReason} onChange={(e) => update("contentMixReason", e.target.value)} />
        </div>
      </section>

      {/* Posting Schedule */}
      <section className={sectionCls}>
        <h4 className={sectionTitle}>📅 Lịch đăng</h4>
        <div>
          <label className={labelCls}>Posts/ngày</label>
          <input type="number" min={1} max={10} className={inputCls + " w-24"} value={profile.postsPerDay} onChange={(e) => update("postsPerDay", Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          {Object.entries(profile.postingSchedule).map(([day, schedule]) => (
            <div key={day} className="flex items-center gap-3 text-sm">
              <span className="w-10 text-xs font-medium text-gray-500 uppercase">{day}</span>
              <input
                className={inputCls + " w-40"}
                value={schedule.times.join(", ")}
                onChange={(e) => {
                  const newSchedule = { ...profile.postingSchedule };
                  newSchedule[day] = { ...schedule, times: e.target.value.split(",").map((t) => t.trim()) };
                  update("postingSchedule", newSchedule);
                }}
                placeholder="10:00, 19:30"
              />
              <input
                className={inputCls + " w-32"}
                value={schedule.focus}
                onChange={(e) => {
                  const newSchedule = { ...profile.postingSchedule };
                  newSchedule[day] = { ...schedule, focus: e.target.value };
                  update("postingSchedule", newSchedule);
                }}
                placeholder="focus"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Series Schedule */}
      <section className={sectionCls}>
        <h4 className={sectionTitle}>🎬 Series Schedule ({profile.seriesSchedule.length})</h4>
        <div className="space-y-2">
          {profile.seriesSchedule.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <input className={inputCls + " flex-1"} value={s.name} onChange={(e) => updateSeries(i, "name", e.target.value)} placeholder="Tên series" />
              <input className={inputCls + " w-28"} value={s.dayOfWeek} onChange={(e) => updateSeries(i, "dayOfWeek", e.target.value)} placeholder="Thứ mấy" />
              <input className={inputCls + " w-32"} value={s.contentPillar} onChange={(e) => updateSeries(i, "contentPillar", e.target.value)} placeholder="Pillar" />
              <Button type="button" variant="ghost" size="icon-xs" onClick={() => removeSeries(i)} className="text-gray-400 hover:text-rose-500 shrink-0">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="link" onClick={() => addSeries()} className="text-primary hover:text-primary/80 px-0">
            <Plus className="w-4 h-4" /> Thêm series
          </Button>
        </div>
      </section>

      {/* CTA Templates */}
      <section className={sectionCls}>
        <h4 className={sectionTitle}>🎯 CTA Templates</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(["entertainment", "education", "review", "selling"] as const).map((key) => (
            <div key={key}>
              <label className={labelCls}>{key === "entertainment" ? "Giải trí" : key === "education" ? "Giáo dục" : key === "review" ? "Review" : "Bán hàng"}</label>
              <textarea
                className={inputCls + " min-h-[50px] resize-y"}
                value={profile.ctaTemplates[key]}
                onChange={(e) => update("ctaTemplates", { ...profile.ctaTemplates, [key]: e.target.value })}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Competitor Channels */}
      <section className={sectionCls}>
        <h4 className={sectionTitle}>🔍 Kênh tham khảo ({profile.competitorChannels.length})</h4>
        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> Kiểm tra lại các kênh tham khảo — AI có thể gợi ý chưa chính xác
        </p>
        <div className="space-y-2">
          {profile.competitorChannels.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <input className={inputCls + " w-36"} value={c.handle} onChange={(e) => updateCompetitor(i, "handle", e.target.value)} placeholder="@handle" />
              <input className={inputCls + " w-24"} value={c.followers} onChange={(e) => updateCompetitor(i, "followers", e.target.value)} placeholder="Followers" />
              <input className={inputCls + " flex-1"} value={c.whyReference} onChange={(e) => updateCompetitor(i, "whyReference", e.target.value)} placeholder="Lý do tham khảo" />
              <Button type="button" variant="ghost" size="icon-xs" onClick={() => removeCompetitor(i)} className="text-gray-400 hover:text-rose-500 shrink-0">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="link" onClick={() => addCompetitor()} className="text-primary hover:text-primary/80 px-0">
            <Plus className="w-4 h-4" /> Thêm kênh
          </Button>
        </div>
      </section>

      {/* Style */}
      <section className={sectionCls}>
        <h4 className={sectionTitle}>🎨 Style</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className={labelCls}>Voice</label>
            <select className={inputCls} value={profile.voiceStyle} onChange={(e) => update("voiceStyle", e.target.value)}>
              {VOICE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Editing</label>
            <select className={inputCls} value={profile.editingStyle} onChange={(e) => update("editingStyle", e.target.value)}>
              {EDIT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Font</label>
            <select className={inputCls} value={profile.fontStyle} onChange={(e) => update("fontStyle", e.target.value)}>
              {FONT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <div>
              <label className={labelCls}>Màu chính</label>
              <input type="color" value={profile.colorPrimary} onChange={(e) => update("colorPrimary", e.target.value)} className="w-9 h-9 rounded-lg border border-gray-200 dark:border-slate-700 cursor-pointer" />
            </div>
            <div>
              <label className={labelCls}>Màu phụ</label>
              <input type="color" value={profile.colorSecondary} onChange={(e) => update("colorSecondary", e.target.value)} className="w-9 h-9 rounded-lg border border-gray-200 dark:border-slate-700 cursor-pointer" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
