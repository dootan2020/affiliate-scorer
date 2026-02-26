"use client";

import { useState } from "react";
import { Loader2, Check, AlertCircle } from "lucide-react";
import type { MatchResult, MetricsInput } from "./log-types";
import { EMPTY_METRICS } from "./log-types";

export function LogBatchMode(): React.ReactElement {
  const [text, setText] = useState("");
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [matching, setMatching] = useState(false);
  const [batchMetrics, setBatchMetrics] = useState<Record<string, MetricsInput>>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleParse(): Promise<void> {
    const links = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (links.length === 0) return;

    setMatching(true);
    setMatches([]);
    setDone(false);
    setError(null);

    try {
      const res = await fetch("/api/log/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links }),
      });
      const json = await res.json() as { data?: MatchResult[] };
      const results = json.data || [];
      setMatches(results);

      // Init metrics for matched
      const init: Record<string, MetricsInput> = {};
      for (const m of results) {
        if (m.assetId) {
          init[m.assetId] = { ...EMPTY_METRICS };
        }
      }
      setBatchMetrics(init);
    } catch {
      setError("Lỗi parse links");
    } finally {
      setMatching(false);
    }
  }

  async function handleSaveAll(): Promise<void> {
    setSaving(true);
    setError(null);

    const items = matches
      .filter((m) => m.assetId && batchMetrics[m.assetId]?.views)
      .map((m) => {
        const met = batchMetrics[m.assetId!];
        return {
          assetId: m.assetId!,
          tiktokUrl: m.url,
          views: met.views ? parseInt(met.views) : undefined,
          likes: met.likes ? parseInt(met.likes) : undefined,
          comments: met.comments ? parseInt(met.comments) : undefined,
          shares: met.shares ? parseInt(met.shares) : undefined,
          saves: met.saves ? parseInt(met.saves) : undefined,
          orders: met.orders ? parseInt(met.orders) : undefined,
        };
      });

    if (items.length === 0) {
      setError("Nhập ít nhất views cho 1 video");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/log/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) throw new Error(json.error || "Lỗi");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi batch log");
    } finally {
      setSaving(false);
    }
  }

  const matchedCount = matches.filter((m) => m.assetId).length;

  return (
    <div className="space-y-4">
      {/* Textarea */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-5 space-y-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 pb-3 border-b border-gray-100 dark:border-slate-800">
          Paste nhiều link TikTok (1 link/dòng)
        </h3>
        <textarea
          placeholder={"https://www.tiktok.com/@you/video/111\nhttps://www.tiktok.com/@you/video/222"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none resize-none"
        />
        <button
          onClick={() => void handleParse()}
          disabled={!text.trim() || matching}
          className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm transition-all disabled:cursor-not-allowed flex items-center gap-2"
        >
          {matching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Parse links"}
        </button>
      </div>

      {/* Match results + metrics */}
      {matches.length > 0 && !done && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-5 space-y-4">
          <p className="text-sm text-gray-500">
            {matchedCount}/{matches.length} matched
          </p>

          <div className="space-y-3">
            {matches.map((m, i) => (
              <div key={i} className={`rounded-xl border p-3 ${
                m.assetId
                  ? "border-emerald-200 dark:border-emerald-800/30"
                  : "border-gray-200 dark:border-slate-700 opacity-50"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {m.assetId ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">
                    {m.assetId ? `${m.assetCode} — ${m.productTitle} — ${m.format}` : "Không match"}
                  </span>
                </div>

                {m.assetId && batchMetrics[m.assetId] && (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {(["views", "likes", "comments", "shares", "saves", "orders"] as const).map((key) => (
                      <input
                        key={key}
                        type="number"
                        placeholder={key}
                        value={batchMetrics[m.assetId!][key]}
                        onChange={(e) =>
                          setBatchMetrics({
                            ...batchMetrics,
                            [m.assetId!]: { ...batchMetrics[m.assetId!], [key]: e.target.value },
                          })
                        }
                        className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => void handleSaveAll()}
            disabled={saving}
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white rounded-xl px-6 py-2.5 font-medium shadow-sm transition-all disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lưu tất cả"}
          </button>
        </div>
      )}

      {done && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl p-5 text-center">
          <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            Đã log thành công! Learning weights đã cập nhật.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
