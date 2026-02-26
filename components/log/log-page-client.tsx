"use client";

import { useState } from "react";
import {
  Link2,
  Loader2,
  Check,
  AlertCircle,
  Trophy,
  TrendingDown,
  Minus,
  BarChart3,
} from "lucide-react";

interface MatchResult {
  url: string;
  assetId: string | null;
  assetCode: string | null;
  productTitle: string | null;
  format: string | null;
  hookType: string | null;
  matchMethod: string;
}

interface MetricsInput {
  views: string;
  likes: string;
  comments: string;
  shares: string;
  saves: string;
  orders: string;
}

interface LogResult {
  rewardScore: number;
  analysis: {
    verdict: "win" | "loss" | "neutral";
    factors: Array<{ factor: string; value: string | null; impact: string; detail?: string }>;
  };
}

export function LogPageClient(): React.ReactElement {
  const [mode, setMode] = useState<"quick" | "batch">("quick");

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex items-center gap-1 bg-gray-100/80 dark:bg-slate-800/80 rounded-xl p-1 w-fit">
        <button
          onClick={() => setMode("quick")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === "quick"
              ? "bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-gray-50"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          Quick (1 video)
        </button>
        <button
          onClick={() => setMode("batch")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === "batch"
              ? "bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-gray-50"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          Batch (nhiều video)
        </button>
      </div>

      {mode === "quick" ? <QuickMode /> : <BatchMode />}
    </div>
  );
}

function QuickMode(): React.ReactElement {
  const [url, setUrl] = useState("");
  const [matching, setMatching] = useState(false);
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [metrics, setMetrics] = useState<MetricsInput>({
    views: "", likes: "", comments: "", shares: "", saves: "", orders: "",
  });
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
          <button
            onClick={() => void handleMatch()}
            disabled={!url.trim() || matching}
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm transition-all disabled:cursor-not-allowed flex items-center gap-2"
          >
            {matching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Match"}
          </button>
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
          <button
            onClick={() => void handleSave()}
            disabled={saving || !metrics.views}
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white rounded-xl px-6 py-2.5 font-medium shadow-sm transition-all disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lưu"}
          </button>
        </div>
      )}

      {/* Result */}
      {result && <RewardResult result={result} />}

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}

function BatchMode(): React.ReactElement {
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
          init[m.assetId] = { views: "", likes: "", comments: "", shares: "", saves: "", orders: "" };
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

function RewardResult({ result }: { result: LogResult }): React.ReactElement {
  const { rewardScore, analysis } = result;
  const VerdictIcon = analysis.verdict === "win" ? Trophy :
    analysis.verdict === "loss" ? TrendingDown : Minus;
  const verdictColor = analysis.verdict === "win" ? "text-emerald-600 dark:text-emerald-400" :
    analysis.verdict === "loss" ? "text-rose-600 dark:text-rose-400" : "text-gray-500";
  const verdictLabel = analysis.verdict === "win" ? "WIN" :
    analysis.verdict === "loss" ? "LOSS" : "Trung bình";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          analysis.verdict === "win" ? "bg-emerald-50 dark:bg-emerald-950/30" :
          analysis.verdict === "loss" ? "bg-rose-50 dark:bg-rose-950/30" :
          "bg-gray-100 dark:bg-slate-800"
        }`}>
          <VerdictIcon className={`w-6 h-6 ${verdictColor}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{rewardScore}</p>
          <p className={`text-sm font-medium ${verdictColor}`}>{verdictLabel}</p>
        </div>
      </div>

      {analysis.factors.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase">Phân tích</p>
          {analysis.factors.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                f.impact === "positive" ? "bg-emerald-500" :
                f.impact === "negative" ? "bg-rose-500" : "bg-gray-300"
              }`} />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                <strong>{f.factor}:</strong> {f.value || "—"}
              </span>
              {f.detail && (
                <span className="text-xs text-gray-400 ml-auto">{f.detail}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
