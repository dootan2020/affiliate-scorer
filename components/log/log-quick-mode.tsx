"use client";

import { useState } from "react";
import { Link2, Loader2, Check, AlertCircle, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogRewardResult } from "./log-reward-result";
import type { MatchResult, MetricsInput, LogResult } from "./log-types";
import { EMPTY_METRICS } from "./log-types";

export function LogQuickMode(): React.ReactElement {
  const [url, setUrl] = useState("");
  const [matching, setMatching] = useState(false);
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [metrics, setMetrics] = useState<MetricsInput>({ ...EMPTY_METRICS });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<LogResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleMatch(): Promise<void> {
    if (!url.trim()) return;
    setMatching(true);
    setMatch(null);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/log/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links: [url.trim()] }),
      });
      const json = await res.json() as { data?: MatchResult[] };
      if (json.data?.[0]) setMatch(json.data[0]);
    } catch {
      setError("Lỗi khi match link");
    } finally {
      setMatching(false);
    }
  }

  async function handleSave(): Promise<void> {
    if (!match?.assetId) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/log/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: match.assetId,
          tiktokUrl: url.trim(),
          views: metrics.views ? parseInt(metrics.views) : undefined,
          likes: metrics.likes ? parseInt(metrics.likes) : undefined,
          comments: metrics.comments ? parseInt(metrics.comments) : undefined,
          shares: metrics.shares ? parseInt(metrics.shares) : undefined,
          saves: metrics.saves ? parseInt(metrics.saves) : undefined,
          orders: metrics.orders ? parseInt(metrics.orders) : undefined,
        }),
      });
      const json = await res.json() as { data?: LogResult; error?: string };
      if (!res.ok) throw new Error(json.error || "Lỗi");
      if (json.data) setResult(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi lưu metrics");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* URL input */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100 dark:border-slate-800">
          <Link2 className="w-5 h-5 text-orange-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">Link TikTok</h3>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="https://www.tiktok.com/@you/video/1234567890"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleMatch()}
            className="flex-1 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
          />
          <Button
            onClick={() => void handleMatch()}
            disabled={!url.trim() || matching}
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 dark:disabled:bg-slate-700"
          >
            {matching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Match"}
          </Button>
        </div>

        {/* Match result */}
        {match && (
          <div className={`rounded-xl px-4 py-3 ${
            match.assetId
              ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400"
              : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400"
          }`}>
            {match.assetId ? (
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span className="text-sm">
                  Matched: <strong>{match.assetCode}</strong> — {match.productTitle} — {match.format}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Không tìm thấy asset. Cần match thủ công hoặc publish asset trước.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Metrics input */}
      {match?.assetId && !result && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100 dark:border-slate-800">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">Nhập metrics</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { key: "views" as const, label: "Views", required: true },
              { key: "likes" as const, label: "Likes" },
              { key: "comments" as const, label: "Comments" },
              { key: "shares" as const, label: "Shares" },
              { key: "saves" as const, label: "Saves" },
              { key: "orders" as const, label: "Orders" },
            ].map(({ key, label, required }) => (
              <div key={key}>
                <label className="text-xs text-gray-500 mb-1 block">
                  {label} {required && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={metrics[key]}
                  onChange={(e) => setMetrics({ ...metrics, [key]: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                />
              </div>
            ))}
          </div>
          <Button
            onClick={() => void handleSave()}
            disabled={saving || !metrics.views}
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 dark:disabled:bg-slate-700"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lưu"}
          </Button>
        </div>
      )}

      {/* Result */}
      {result && <LogRewardResult result={result} />}

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
