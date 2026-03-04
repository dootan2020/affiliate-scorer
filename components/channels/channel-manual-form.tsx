"use client";

import type { ChannelProfileResult } from "@/lib/content/channel-profile-types";
import { ChannelProfilePreview } from "./channel-profile-preview";

const inputCls =
  "w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none";
const labelCls = "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1";

const TONE_OPTIONS = [
  { value: "casual", label: "Vui vẻ Gen Z" },
  { value: "professional", label: "Chuyên gia uy tín" },
  { value: "energetic", label: "Chị gái tâm sự" },
  { value: "calm", label: "Review thẳng thắn" },
];

function emptyProfile(): ChannelProfileResult {
  return {
    name: "",
    handle: "",
    personaName: "",
    personaDesc: "",
    subNiche: "",
    usp: "",
    contentPillars: [""],
    contentPillarDetails: [],
    hookBank: [""],
    contentMix: { review: 0, lifestyle: 0, tutorial: 0, selling: 0, entertainment: 0 },
    contentMixReason: "",
    videoFormats: [],
    productionStyle: "hybrid",
    productionStyleReason: "",
    postsPerDay: 2,
    postingSchedule: {
      mon: { times: ["11:30", "19:30"], focus: "education" },
      tue: { times: ["11:30", "19:30"], focus: "review" },
      wed: { times: ["11:30", "19:30"], focus: "entertainment" },
      thu: { times: ["11:30", "20:00"], focus: "selling" },
      fri: { times: ["11:30", "19:30"], focus: "entertainment" },
      sat: { times: ["7:30", "12:00", "20:00"], focus: "review" },
      sun: { times: ["7:30", "12:00", "20:00"], focus: "education" },
    },
    seriesSchedule: [],
    ctaTemplates: { entertainment: "", education: "", review: "", selling: "" },
    competitorChannels: [],
    voiceStyle: "casual",
    editingStyle: "fast_cut",
    fontStyle: "modern",
    colorPrimary: "#E87B35",
    colorSecondary: "#FFD6B0",
  };
}

interface Props {
  profile: ChannelProfileResult | null;
  onChange: (profile: ChannelProfileResult) => void;
}

export function ChannelManualForm({ profile, onChange }: Props): React.ReactElement {
  const data = profile ?? emptyProfile();

  return (
    <div className="space-y-6">
      {/* Niche & Audience at the top */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Niche</label>
          <input
            className={inputCls}
            value={data.subNiche}
            onChange={(e) => onChange({ ...data, subNiche: e.target.value })}
            placeholder="VD: Skincare cho da dầu mụn"
          />
        </div>
        <div>
          <label className={labelCls}>Tone</label>
          <select
            className={inputCls}
            value={data.voiceStyle}
            onChange={(e) => onChange({ ...data, voiceStyle: e.target.value })}
          >
            {TONE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reuse the preview component for all fields */}
      <ChannelProfilePreview profile={data} onChange={onChange} />
    </div>
  );
}

export { emptyProfile };
