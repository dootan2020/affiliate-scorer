"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Film,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/ui/copy-button";
import { VideoStatusRadio } from "./video-status-radio";
import type { AssetWithStatus, Scene, VideoStatus } from "@/lib/types/production";

const STATUS_LABELS: Record<string, string> = {
  draft: "Bản nháp",
  produced: "Đã quay",
  rendered: "Đã render",
  published: "Đã đăng",
  archived: "Lưu trữ",
};

interface Props {
  asset: AssetWithStatus;
  onStatusChange?: (assetId: string, status: VideoStatus) => void;
}

function ComplianceBadge({ status }: { status: string | null }): React.ReactElement {
  if (status === "blocked") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-full">
        <ShieldAlert className="w-3 h-3" /> Vi phạm
      </span>
    );
  }
  if (status === "warning") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">
        <AlertTriangle className="w-3 h-3" /> Cần disclaimer
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
      <ShieldCheck className="w-3 h-3" /> OK
    </span>
  );
}

const CONTENT_TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  entertainment: { label: "Giải trí", cls: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30" },
  education: { label: "Giáo dục", cls: "text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/30" },
  review: { label: "Review", cls: "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/30" },
  selling: { label: "Bán hàng", cls: "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30" },
};

const FORMAT_LABELS: Record<string, string> = {
  before_after: "Before/After",
  product_showcase: "Product Showcase",
  slideshow_voiceover: "Slideshow + VO",
  tutorial_steps: "Tutorial Steps",
  comparison: "Comparison",
  trending_hook: "Trending Hook",
};

const SOUND_LABELS: Record<string, string> = {
  upbeat: "Upbeat / Vui tươi",
  calm: "Calm / Nhẹ nhàng",
  dramatic: "Dramatic / Mạnh mẽ",
  trending: "Trending / Viral sound",
};

export function AssetCardWithStatus({ asset, onStatusChange }: Props): React.ReactElement {
  const [expanded, setExpanded] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const scenes: Scene[] = Array.isArray(asset.videoPrompts) ? asset.videoPrompts : [];
  const tags: string[] = Array.isArray(asset.hashtags) ? asset.hashtags : [];

  const allKling = scenes.map((s) => s.prompt_kling).filter(Boolean).join("\n\n");
  const allVeo3 = scenes.map((s) => s.prompt_veo3).filter(Boolean).join("\n\n");
  const ctBadge = asset.contentType ? CONTENT_TYPE_BADGE[asset.contentType] : null;

  const captionWithHashtags = [
    asset.captionText || "",
    tags.length > 0 ? "\n\n" + tags.join(" ") : "",
  ]
    .join("")
    .trim();

  async function handleStatusChange(newStatus: VideoStatus): Promise<void> {
    const previousStatus = asset.status as VideoStatus;
    setUpdatingStatus(true);
    // Optimistic update
    onStatusChange?.(asset.id, newStatus);
    try {
      const res = await fetch(`/api/assets/${asset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        // Revert optimistic update
        onStatusChange?.(asset.id, previousStatus);
        const body = await res.json().catch(() => null);
        toast.error((body as { error?: string } | null)?.error ?? "Không thể cập nhật trạng thái");
      } else {
        toast.success(`Chuyển sang "${STATUS_LABELS[newStatus] ?? newStatus}"`);
      }
    } catch {
      // Revert optimistic update
      onStatusChange?.(asset.id, previousStatus);
      toast.error("Lỗi kết nối khi cập nhật trạng thái video");
    } finally {
      setUpdatingStatus(false);
    }
  }

  return (
    <div className="border border-gray-100 dark:border-slate-800 rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Film className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
            {asset.videoFormat ? (FORMAT_LABELS[asset.videoFormat] ?? asset.videoFormat) : (asset.format || "Video")}
          </span>
          <span className="text-xs text-gray-400">{asset.assetCode}</span>
          {ctBadge && (
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${ctBadge.cls}`}>
              {ctBadge.label}
            </span>
          )}
          {asset.targetDuration && (
            <span className="text-[10px] font-medium text-gray-500 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
              {asset.targetDuration}s
            </span>
          )}
        </div>
        <ComplianceBadge status={asset.complianceStatus} />
      </div>

      {/* Hook */}
      <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-orange-500 font-medium uppercase">{asset.hookType} hook</span>
          {asset.hookText && <CopyButton text={asset.hookText} />}
        </div>
        <p className="text-sm text-gray-900 dark:text-gray-50 mt-1">{asset.hookText || "—"}</p>
      </div>

      {/* Angle */}
      <p className="text-xs text-gray-500">
        <span className="font-medium">Angle:</span> {asset.angle || "—"}
      </p>

      {/* Script (expandable) */}
      <div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-50 transition-colors"
          >
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            Script
          </button>
          {asset.scriptText && <CopyButton text={asset.scriptText} label="Copy script" />}
        </div>
        {expanded && asset.scriptText && (
          <div className="mt-2 bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3">
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {asset.scriptText}
            </p>
          </div>
        )}
      </div>

      {/* Video Prompts — per-scene copy buttons */}
      {scenes.length > 0 && (
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPrompts(!showPrompts)}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-50 transition-colors"
            >
              {showPrompts ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              Video Prompts ({scenes.length} scenes)
            </button>
            {allKling && <CopyButton text={allKling} label="All Kling" />}
            {allVeo3 && <CopyButton text={allVeo3} label="All Veo3" />}
          </div>
          {showPrompts && (
            <div className="mt-2 space-y-2">
              {scenes.map((scene) => (
                <div key={scene.scene} className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3 space-y-1">
                  <span className="text-xs font-medium text-gray-500">
                    Scene {scene.scene} ({scene.start_s}s–{scene.end_s}s)
                  </span>
                  {scene.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">{scene.description}</p>
                  )}
                  {scene.prompt_kling && (
                    <div className="flex items-start gap-1">
                      <span className="text-[10px] font-medium text-purple-500 shrink-0 mt-0.5">KLING</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400 flex-1">{scene.prompt_kling}</p>
                      <CopyButton text={scene.prompt_kling} label="Kling" />
                    </div>
                  )}
                  {scene.prompt_veo3 && (
                    <div className="flex items-start gap-1">
                      <span className="text-[10px] font-medium text-orange-500 shrink-0 mt-0.5">VEO3</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400 flex-1">{scene.prompt_veo3}</p>
                      <CopyButton text={scene.prompt_veo3} label="Veo3" />
                    </div>
                  )}
                  {scene.text_overlay && (
                    <p className="text-[10px] text-gray-400">Overlay: {scene.text_overlay}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Caption + Copy tất cả */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">Caption</span>
          <div className="flex items-center gap-1">
            {asset.captionText && <CopyButton text={asset.captionText} />}
            {captionWithHashtags && <CopyButton text={captionWithHashtags} label="Copy tất cả" />}
          </div>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300">{asset.captionText || "—"}</p>
      </div>

      {/* Hashtags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag, i) => (
            <span key={i} className="text-xs text-orange-500 bg-orange-50 dark:bg-orange-950/20 px-2 py-0.5 rounded-full">
              {String(tag)}
            </span>
          ))}
        </div>
      )}

      {/* CTA + Sound style */}
      <div className="flex items-center gap-4">
        <p className="text-xs text-gray-500">
          <span className="font-medium">CTA:</span> {asset.ctaText || "—"}
        </p>
        {asset.soundStyle && (
          <p className="text-xs text-gray-500">
            <span className="font-medium">Sound:</span> {SOUND_LABELS[asset.soundStyle] ?? asset.soundStyle}
          </p>
        )}
      </div>

      {/* Compliance notes */}
      {asset.complianceNotes && (
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded-lg">
          {asset.complianceNotes}
        </p>
      )}

      {/* Video Status */}
      <div className="pt-2 border-t border-gray-50 dark:border-slate-800/50">
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1 block">
          Trạng thái video
        </span>
        <VideoStatusRadio
          value={asset.status}
          onChange={(s) => void handleStatusChange(s)}
          disabled={updatingStatus}
        />
      </div>
    </div>
  );
}
