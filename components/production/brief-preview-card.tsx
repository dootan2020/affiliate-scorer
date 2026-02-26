"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Film,
  Copy,
  Check,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

interface Scene {
  scene: number;
  start_s: number;
  end_s: number;
  description?: string;
  prompt_kling?: string;
  prompt_veo3?: string;
  text_overlay?: string;
  audio_note?: string;
}

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

interface Brief {
  id: string;
  angles: string[];
  hooks: Array<{ text: string; type: string }>;
  assets: Asset[];
  productIdentity?: {
    title: string | null;
    price: unknown;
  };
}

interface Props {
  brief: Brief;
  onUpdateAsset?: (assetId: string, data: Record<string, unknown>) => Promise<void>;
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

function CopyButton({ text }: { text: string }): React.ReactElement {
  const [copied, setCopied] = useState(false);

  function handleCopy(): void {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
      title="Copy"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
    </button>
  );
}

function AssetCard({ asset }: { asset: Asset }): React.ReactElement {
  const [expanded, setExpanded] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);

  const scenes = Array.isArray(asset.videoPrompts) ? asset.videoPrompts : [];
  const tags = Array.isArray(asset.hashtags) ? asset.hashtags : [];

  return (
    <div className="border border-gray-100 dark:border-slate-800 rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
            {asset.format || "Video"}
          </span>
          <span className="text-xs text-gray-400">{asset.assetCode}</span>
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
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-50 transition-colors"
        >
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          Script
        </button>
        {expanded && asset.scriptText && (
          <div className="mt-2 bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3 relative">
            <div className="absolute top-2 right-2">
              <CopyButton text={asset.scriptText} />
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap pr-8">
              {asset.scriptText}
            </p>
          </div>
        )}
      </div>

      {/* Prompts Kling/Veo3 (expandable) */}
      {scenes.length > 0 && (
        <div>
          <button
            onClick={() => setShowPrompts(!showPrompts)}
            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-50 transition-colors"
          >
            {showPrompts ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            Video Prompts ({scenes.length} scenes)
          </button>
          {showPrompts && (
            <div className="mt-2 space-y-2">
              {scenes.map((scene) => (
                <div key={scene.scene} className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">
                      Scene {scene.scene} ({scene.start_s}s–{scene.end_s}s)
                    </span>
                  </div>
                  {scene.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">{scene.description}</p>
                  )}
                  {scene.prompt_kling && (
                    <div className="flex items-start gap-1">
                      <span className="text-[10px] font-medium text-purple-500 shrink-0 mt-0.5">KLING</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{scene.prompt_kling}</p>
                      <CopyButton text={scene.prompt_kling} />
                    </div>
                  )}
                  {scene.prompt_veo3 && (
                    <div className="flex items-start gap-1">
                      <span className="text-[10px] font-medium text-orange-500 shrink-0 mt-0.5">VEO3</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{scene.prompt_veo3}</p>
                      <CopyButton text={scene.prompt_veo3} />
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

      {/* Caption */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">Caption</span>
          {asset.captionText && <CopyButton text={asset.captionText} />}
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

      {/* CTA */}
      <p className="text-xs text-gray-500">
        <span className="font-medium">CTA:</span> {asset.ctaText || "—"}
      </p>

      {/* Compliance notes */}
      {asset.complianceNotes && (
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded-lg">
          {asset.complianceNotes}
        </p>
      )}
    </div>
  );
}

export function BriefPreviewCard({ brief }: Props): React.ReactElement {
  const productTitle = brief.productIdentity?.title || "Sản phẩm";
  const [showAngles, setShowAngles] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-5 space-y-4">
      {/* Product header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
          {productTitle}
        </h3>
        <span className="text-xs text-gray-400">
          {brief.assets.length} video
        </span>
      </div>

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

      {/* Assets */}
      <div className="space-y-3">
        {brief.assets.map((asset) => (
          <AssetCard key={asset.id} asset={asset} />
        ))}
      </div>
    </div>
  );
}
