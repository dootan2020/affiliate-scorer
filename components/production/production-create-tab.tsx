"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Loader2,
  Download,
  FileText,
  FileJson,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { ProductSelector } from "./product-selector";
import { BriefPreviewCard } from "./brief-preview-card";
import type { BriefWithProduct } from "@/lib/types/production";

interface BatchResult {
  productIdentityId: string;
  title: string | null;
  briefId: string | null;
  assetsCreated: number;
  status: "success" | "error";
  error?: string;
}

interface ChannelOption {
  id: string;
  name: string;
  personaName: string;
  voiceStyle: string;
}

const CONTENT_TYPES = [
  { value: "", label: "Tự do (AI chọn)" },
  { value: "entertainment", label: "Giải trí — reach, follower" },
  { value: "education", label: "Giáo dục — trust, save" },
  { value: "review", label: "Review — engagement, soft sell" },
  { value: "selling", label: "Bán hàng — conversion" },
] as const;

const VIDEO_FORMATS = [
  { value: "", label: "Tự do (AI chọn)" },
  { value: "before_after", label: "Before/After — transformation" },
  { value: "product_showcase", label: "Product Showcase — xoay, zoom" },
  { value: "slideshow_voiceover", label: "Slideshow + Voiceover" },
  { value: "tutorial_steps", label: "Tutorial Steps — hướng dẫn" },
  { value: "comparison", label: "Comparison — so sánh" },
  { value: "trending_hook", label: "Trending Hook — bắt trend" },
] as const;

const DURATIONS = [
  { value: 0, label: "Tự do" },
  { value: 15, label: "15s" },
  { value: 30, label: "30s" },
  { value: 45, label: "45s" },
  { value: 60, label: "60s" },
] as const;

const selectCls =
  "w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none";

interface Props {
  onBriefsCreated?: () => void;
}

export function ProductionCreateTab({ onBriefsCreated }: Props): React.ReactElement {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [channelId, setChannelId] = useState("");
  const [contentType, setContentType] = useState("");
  const [videoFormat, setVideoFormat] = useState("");
  const [targetDuration, setTargetDuration] = useState(0);
  const [channels, setChannels] = useState<ChannelOption[]>([]);
  const [generating, setGenerating] = useState(false);
  const [briefs, setBriefs] = useState<BriefWithProduct[]>([]);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  useEffect(() => {
    fetch("/api/channels")
      .then((r) => r.json())
      .then((json: { data?: ChannelOption[] }) => setChannels(json.data ?? []))
      .catch(() => {});
  }, []);

  async function handleGenerate(): Promise<void> {
    if (selectedIds.length === 0) return;

    setGenerating(true);
    setError(null);
    setBriefs([]);
    setBatchId(null);
    setProgress({ current: 0, total: selectedIds.length });

    try {
      const res = await fetch("/api/briefs/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIdentityIds: selectedIds,
          ...(channelId && { channelId }),
          ...(contentType && { contentType }),
          ...(videoFormat && { videoFormat }),
          ...(targetDuration > 0 && { targetDuration }),
        }),
      });

      const json = (await res.json()) as { data?: BatchResult[]; error?: string };
      if (!res.ok) throw new Error(json.error || "Lỗi tạo briefs");

      const results = json.data || [];
      setProgress({ current: results.length, total: selectedIds.length });

      // Fetch full brief details
      const loadedBriefs: BriefWithProduct[] = [];
      for (const r of results) {
        if (r.status === "success" && r.briefId) {
          const briefRes = await fetch(`/api/briefs/${r.briefId}`);
          const briefJson = (await briefRes.json()) as { data?: BriefWithProduct };
          if (briefJson.data) loadedBriefs.push(briefJson.data);
        }
      }

      setBriefs(loadedBriefs);

      // Create production batch
      const allAssetIds = loadedBriefs.flatMap((b) => b.assets.map((a) => a.id));
      if (allAssetIds.length > 0) {
        const batchRes = await fetch("/api/production/create-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assetIds: allAssetIds }),
        });
        const batchJson = (await batchRes.json()) as { data?: { id: string } };
        if (batchJson.data?.id) setBatchId(batchJson.data.id);
      }

      // Notify parent to switch to "Đang sản xuất" tab
      if (loadedBriefs.length > 0) {
        onBriefsCreated?.();
      }

      const failed = results.filter((r) => r.status === "error");
      if (failed.length > 0) {
        setError(`${failed.length} sản phẩm lỗi: ${failed.map((f) => f.error).join("; ")}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setGenerating(false);
      setProgress(null);
    }
  }

  function handleExport(type: "scripts" | "prompts" | "checklist"): void {
    if (!batchId) return;
    window.open(`/api/production/${batchId}/export?type=${type}`, "_blank");
  }

  const totalAssets = briefs.reduce((sum, b) => sum + b.assets.length, 0);

  return (
    <div className="space-y-6">
      {/* Step 1: Select products */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100 dark:border-slate-800">
          <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 text-sm font-bold">
            1
          </div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
            Chọn sản phẩm từ Inbox
          </h2>
        </div>
        <ProductSelector
          selected={selectedIds}
          onSelectionChange={setSelectedIds}
          disabled={generating}
        />
      </div>

      {/* Step 1.5: Content options */}
      {selectedIds.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100 dark:border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">
              ✦
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
              Tuỳ chọn content
            </h2>
            <span className="text-xs text-gray-400 ml-auto">Để trống = AI tự chọn</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Kênh TikTok</label>
              <select className={selectCls} value={channelId} onChange={(e) => setChannelId(e.target.value)} disabled={generating}>
                <option value="">Không chọn kênh</option>
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>{ch.name} ({ch.personaName})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Loại content</label>
              <select className={selectCls} value={contentType} onChange={(e) => setContentType(e.target.value)} disabled={generating}>
                {CONTENT_TYPES.map((ct) => (
                  <option key={ct.value} value={ct.value}>{ct.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Video format</label>
              <select className={selectCls} value={videoFormat} onChange={(e) => setVideoFormat(e.target.value)} disabled={generating}>
                {VIDEO_FORMATS.map((vf) => (
                  <option key={vf.value} value={vf.value}>{vf.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Thời lượng</label>
              <select className={selectCls} value={targetDuration} onChange={(e) => setTargetDuration(Number(e.target.value))} disabled={generating}>
                {DURATIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Generate button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => void handleGenerate()}
          disabled={selectedIds.length === 0 || generating}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white rounded-xl px-6 py-3 font-medium shadow-sm hover:shadow transition-all disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang tạo...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Tạo Briefs ({selectedIds.length} SP × 3 video = {selectedIds.length * 3})
            </>
          )}
        </button>
        {progress && (
          <span className="text-sm text-gray-500">
            {progress.current}/{progress.total} hoàn thành
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Step 2: Preview briefs */}
      {briefs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm font-bold">
              2
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
              Preview + Chỉnh sửa
            </h2>
            <div className="flex items-center gap-1 ml-auto">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-gray-500">
                {totalAssets} video từ {briefs.length} sản phẩm
              </span>
            </div>
          </div>
          {briefs.map((brief) => (
            <BriefPreviewCard key={brief.id} brief={brief} />
          ))}
        </div>
      )}

      {/* Step 3: Export packs */}
      {batchId && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100 dark:border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 text-sm font-bold">
              3
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
              Xuất Packs sản xuất
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ExportButton icon={FileText} label="Scripts.md" sub="Scripts đầy đủ" color="orange" onClick={() => handleExport("scripts")} />
            <ExportButton icon={FileJson} label="Prompts.json" sub="Prompts Kling/Veo3" color="purple" onClick={() => handleExport("prompts")} />
            <ExportButton icon={FileSpreadsheet} label="Checklist.csv" sub="Checklist sản xuất" color="emerald" onClick={() => handleExport("checklist")} />
          </div>
        </div>
      )}
    </div>
  );
}

function ExportButton({
  icon: Icon,
  label,
  sub,
  color,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub: string;
  color: string;
  onClick: () => void;
}): React.ReactElement {
  const colorMap: Record<string, string> = {
    orange: "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
  };

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color] || colorMap.orange}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-left">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{label}</p>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
      <Download className="w-4 h-4 text-gray-400 ml-auto" />
    </button>
  );
}
