"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  FileJson,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/ui/copy-button";
import { BriefProductHeader } from "./brief-product-header";
import { AssetCardWithStatus } from "./asset-card-with-status";
import type { BriefWithProduct, VideoStatus } from "@/lib/types/production";

interface Props {
  brief: BriefWithProduct;
  onRegenerate?: () => Promise<void>;
  todayBriefCount?: number;
  collapsed?: boolean;
  showReplacedBadge?: boolean;
  showExport?: boolean;
}

export function BriefPreviewCard({
  brief,
  onRegenerate,
  todayBriefCount = 0,
  collapsed = false,
  showReplacedBadge = false,
  showExport = false,
}: Props): React.ReactElement {
  const [showAngles, setShowAngles] = useState(false);
  const [showAllHooks, setShowAllHooks] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const [assets, setAssets] = useState(brief.assets);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [creatingBatch, setCreatingBatch] = useState(false);

  function handleAssetStatusChange(assetId: string, newStatus: VideoStatus): void {
    setAssets((prev) =>
      prev.map((a) => (a.id === assetId ? { ...a, status: newStatus } : a)),
    );
  }

  async function handleExport(type: "scripts" | "prompts" | "checklist"): Promise<void> {
    let id = batchId;
    if (!id) {
      setCreatingBatch(true);
      try {
        const assetIds = assets.map((a) => a.id);
        const res = await fetch("/api/production/create-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assetIds }),
        });
        const json = (await res.json()) as { data?: { id: string } };
        id = json.data?.id ?? null;
        if (id) setBatchId(id);
      } catch {
        toast.error("Không thể tạo batch export");
      } finally {
        setCreatingBatch(false);
      }
    }
    if (id) {
      window.open(`/api/production/${id}/export?type=${type}`, "_blank");
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-5 space-y-4">
      {/* Product header */}
      <BriefProductHeader
        product={brief.productIdentity}
        onRegenerate={onRegenerate}
        todayBriefCount={todayBriefCount}
      />

      {/* Replaced badge */}
      {showReplacedBadge && brief.status === "replaced" && (
        <span className="inline-flex items-center text-xs font-medium text-gray-400 bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
          (Đã thay thế)
        </span>
      )}

      {/* Collapse toggle for completed tab */}
      {collapsed && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-50 transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {isCollapsed ? "Xem chi tiết" : "Thu gọn"} · {assets.length} video
        </button>
      )}

      {!isCollapsed && (
        <>
          {/* Angles */}
          {brief.angles && brief.angles.length > 0 && (
            <div>
              <button
                onClick={() => setShowAngles(!showAngles)}
                className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-50 transition-colors"
              >
                {showAngles ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                {brief.angles.length} angles
              </button>
              {showAngles && (
                <ul className="mt-1.5 space-y-1">
                  {brief.angles.map((angle, i) => (
                    <li key={i} className="text-xs text-gray-600 dark:text-gray-400 pl-4">
                      {i + 1}. {String(angle)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* All Hooks */}
          {brief.hooks && brief.hooks.length > 0 && (
            <div>
              <button
                onClick={() => setShowAllHooks(!showAllHooks)}
                className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-50 transition-colors"
              >
                {showAllHooks ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                Tất cả câu mở đầu ({brief.hooks.length})
              </button>
              {showAllHooks && (
                <div className="mt-2 space-y-1.5">
                  {brief.hooks.map((hook, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 px-3 py-2 rounded-lg bg-orange-50 dark:bg-orange-950/20"
                    >
                      <span className="shrink-0 text-[10px] font-semibold uppercase text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/40 px-1.5 py-0.5 rounded mt-0.5">
                        {hook.type}
                      </span>
                      <p className="flex-1 text-sm text-gray-800 dark:text-gray-200">{hook.text}</p>
                      <CopyButton text={hook.text} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Assets */}
          <div className="space-y-3">
            {assets.map((asset) => (
              <AssetCardWithStatus
                key={asset.id}
                asset={asset}
                onStatusChange={handleAssetStatusChange}
              />
            ))}
          </div>

          {/* Export packs */}
          {showExport && assets.length > 0 && (
            <div className="pt-3 border-t border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <Download className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-500">Tải Packs sản xuất</span>
                {creatingBatch && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => void handleExport("scripts")}
                  disabled={creatingBatch}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors disabled:opacity-50"
                >
                  <FileText className="w-3.5 h-3.5 text-orange-500" /> Scripts.md
                </button>
                <button
                  onClick={() => void handleExport("prompts")}
                  disabled={creatingBatch}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors disabled:opacity-50"
                >
                  <FileJson className="w-3.5 h-3.5 text-purple-500" /> Prompts.json
                </button>
                <button
                  onClick={() => void handleExport("checklist")}
                  disabled={creatingBatch}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" /> Checklist.csv
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
