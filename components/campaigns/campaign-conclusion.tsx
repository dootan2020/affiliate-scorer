"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { formatVND } from "@/lib/utils/format";

interface CampaignConclusionProps {
  campaignId: string;
  currentVerdict?: string;
  currentLessons?: string;
  profitLoss: number;
}

const VERDICT_OPTIONS = [
  {
    value: "profitable",
    label: "Lai",
    icon: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800",
  },
  {
    value: "break_even",
    label: "Hoa",
    icon: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
  },
  {
    value: "loss",
    label: "Lo",
    icon: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800",
  },
];

export function CampaignConclusion({
  campaignId,
  currentVerdict,
  currentLessons,
  profitLoss,
}: CampaignConclusionProps): React.ReactElement {
  const [verdict, setVerdict] = useState(currentVerdict ?? "");
  const [lessons, setLessons] = useState(currentLessons ?? "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(): Promise<void> {
    if (!verdict) return;
    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verdict,
          lessonsLearned: lessons.trim() || undefined,
          status: "completed",
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Lưu thất bại");
      }

      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-50">
          Ket luan campaign
        </h4>
        <span
          className={`text-sm font-semibold ${
            profitLoss >= 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400"
          }`}
        >
          {profitLoss >= 0 ? "+" : ""}
          {formatVND(profitLoss)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {VERDICT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setVerdict(opt.value)}
            className={`rounded-xl border-2 px-3 py-3 text-center text-sm font-medium transition-all ${
              verdict === opt.value
                ? opt.bg
                : "border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700"
            }`}
          >
            <span className={verdict === opt.value ? opt.icon : "text-gray-600 dark:text-gray-300"}>
              {opt.label}
            </span>
          </button>
        ))}
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
          Bai hoc rut ra
        </label>
        <textarea
          value={lessons}
          onChange={(e) => setLessons(e.target.value)}
          className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none"
          rows={3}
          placeholder="VD: Content review hieu qua hon content demo. Nen tang x hieu qua hon y..."
        />
      </div>

      {error && (
        <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
      )}

      {saved && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <CheckCircle2 className="w-4 h-4" />
          Đã lưu kết luận và đánh dấu Hoàn thành
        </p>
      )}

      <button
        type="button"
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm hover:shadow transition-all disabled:opacity-50"
        onClick={handleSave}
        disabled={loading || !verdict}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CheckCircle2 className="w-4 h-4" />
        )}
        Lưu kết luận + Đánh dấu Completed
      </button>
    </div>
  );
}
