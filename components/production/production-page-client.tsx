"use client";

import { useState } from "react";
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

interface Asset {
  id: string;
  assetCode: string | null;
  format: string | null;
  hookText: string | null;
  hookType: string | null;
  angle: string | null;
  scriptText: string | null;
  captionText: string | null;
  hashtags: string[] | null;
  ctaText: string | null;
  videoPrompts: unknown;
  complianceStatus: string | null;
  complianceNotes: string | null;
  status: string;
}

interface BriefData {
  id: string;
  angles: string[];
  hooks: Array<{ text: string; type: string }>;
  assets: Asset[];
  productIdentity?: {
    title: string | null;
    price: unknown;
  };
}

interface BatchResult {
  productIdentityId: string;
  title: string | null;
  briefId: string | null;
  assetsCreated: number;
  status: "success" | "error";
  error?: string;
}

export function ProductionPageClient(): React.ReactElement {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [briefs, setBriefs] = useState<BriefData[]>([]);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  async function handleGenerate(): Promise<void> {
    if (selectedIds.length === 0) return;

    setGenerating(true);
    setError(null);
    setBriefs([]);
    setBatchId(null);
    setProgress({ current: 0, total: selectedIds.length });

    try {
      // Generate briefs qua batch API
      const res = await fetch("/api/briefs/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIdentityIds: selectedIds }),
      });

      const json = await res.json() as { data?: BatchResult[]; error?: string };

      if (!res.ok) {
        throw new Error(json.error || "Lỗi tạo briefs");
      }

      const results = json.data || [];
      setProgress({ current: results.length, total: selectedIds.length });

      // Lấy chi tiết từng brief
      const loadedBriefs: BriefData[] = [];
      for (const r of results) {
        if (r.status === "success" && r.briefId) {
          const briefRes = await fetch(`/api/briefs/${r.briefId}`);
          const briefJson = await briefRes.json() as { data?: BriefData };
          if (briefJson.data) {
            loadedBriefs.push(briefJson.data);
          }
        }
      }

      setBriefs(loadedBriefs);

      // Tạo batch sản xuất
      const allAssetIds = loadedBriefs.flatMap((b) => b.assets.map((a) => a.id));
      if (allAssetIds.length > 0) {
        const batchRes = await fetch("/api/production/create-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assetIds: allAssetIds }),
        });
        const batchJson = await batchRes.json() as { data?: { id: string } };
        if (batchJson.data?.id) {
          setBatchId(batchJson.data.id);
        }
      }

      // Check failed
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
    <div className="space-y-8">
      {/* Bước 1: Chọn sản phẩm */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
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

      {/* Button tạo briefs */}
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

      {/* Bước 2: Preview briefs */}
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

      {/* Bước 3: Xuất packs */}
      {batchId && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 text-sm font-bold">
              3
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
              Xuất Packs sản xuất
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => handleExport("scripts")}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-50">Scripts.md</p>
                <p className="text-xs text-gray-400">Scripts đầy đủ</p>
              </div>
              <Download className="w-4 h-4 text-gray-400 ml-auto" />
            </button>

            <button
              onClick={() => handleExport("prompts")}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <FileJson className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-50">Prompts.json</p>
                <p className="text-xs text-gray-400">Prompts Kling/Veo3</p>
              </div>
              <Download className="w-4 h-4 text-gray-400 ml-auto" />
            </button>

            <button
              onClick={() => handleExport("checklist")}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-50">Checklist.csv</p>
                <p className="text-xs text-gray-400">Checklist sản xuất</p>
              </div>
              <Download className="w-4 h-4 text-gray-400 ml-auto" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
