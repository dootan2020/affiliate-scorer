"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, Loader2, RefreshCw, ImageIcon, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { POSES } from "@/lib/ai/model-image-config";
import type { PoseType } from "@/lib/ai/model-image-config";

interface ModelImageMeta {
  id: string;
  poseType: string;
  mimeType: string;
  createdAt: string;
}

interface Props {
  channelId: string;
  channelNiche: string;
}

export function ModelImageGallery({ channelId, channelNiche }: Props): React.ReactElement {
  const [images, setImages] = useState<ModelImageMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [regenerating, setRegenerating] = useState<string | null>(null);

  const fetchImages = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(`/api/channels/${channelId}/model-images`);
      if (res.ok) {
        const json = (await res.json()) as { data: ModelImageMeta[] };
        setImages(json.data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => {
    void fetchImages();
  }, [fetchImages]);

  async function handleGenerateAll(): Promise<void> {
    setGenerating(true);
    try {
      const res = await fetch(`/api/channels/${channelId}/model-images/generate`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Đang tạo bộ hình nhân vật AI... Theo dõi tiến trình ở thanh task.");
      } else {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(body?.error ?? "Lỗi tạo hình");
      }
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setGenerating(false);
    }
  }

  async function handleRegenerate(poseType: string): Promise<void> {
    if (poseType === "hero_fullbody") {
      if (!confirm("Tạo lại ảnh gốc sẽ ảnh hưởng consistency các ảnh khác. Nên tạo lại toàn bộ. Tiếp tục?")) {
        return;
      }
    }
    setRegenerating(poseType);
    try {
      const res = await fetch(
        `/api/channels/${channelId}/model-images/${poseType}/regenerate`,
        { method: "POST" },
      );
      if (res.ok) {
        toast.success("Đã tạo lại ảnh");
        void fetchImages();
      } else {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(body?.error ?? "Lỗi tạo lại ảnh");
      }
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setRegenerating(null);
    }
  }

  function handleDownload(poseType: string): void {
    window.open(`/api/channels/${channelId}/model-images/${poseType}`, "_blank");
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {POSES.map((p) => (
          <div key={p.type} className="aspect-[9/16] bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const imageMap = new Map(images.map(img => [img.poseType, img]));
  const hasAny = images.length > 0;
  const hasApiKey = true; // will be checked server-side

  if (!hasAny) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center mb-4">
          <ImageIcon className="w-8 h-8 text-orange-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
          Chưa có hình nhân vật
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
          Tạo bộ 8 hình AI cho nhân vật kênh {channelNiche ? `(${channelNiche})` : ""} với Gemini Pro
        </p>
        <Button onClick={() => void handleGenerateAll()} disabled={generating}>
          {generating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo...</>
          ) : (
            <><ImageIcon className="w-4 h-4" /> Tạo bộ hình nhân vật</>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Grid 4x2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {POSES.map((pose) => {
          const img = imageMap.get(pose.type);
          const isRegen = regenerating === pose.type;

          return (
            <div key={pose.type} className="group relative">
              <div
                className={`relative overflow-hidden rounded-xl border border-gray-100 dark:border-slate-800 ${
                  pose.aspectRatio === "1:1" ? "aspect-square" : pose.aspectRatio === "16:9" ? "aspect-video" : "aspect-[9/16]"
                } bg-gray-50 dark:bg-slate-800/50`}
              >
                {img ? (
                  <img
                    src={`/api/channels/${channelId}/model-images/${pose.type}`}
                    alt={pose.label}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-300 dark:text-slate-600" />
                  </div>
                )}

                {/* Hover overlay */}
                {img && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => void handleRegenerate(pose.type)}
                      disabled={isRegen}
                      className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
                      title="Tạo lại"
                    >
                      {isRegen ? (
                        <Loader2 className="w-4 h-4 text-gray-700 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 text-gray-700" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDownload(pose.type)}
                      className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
                      title="Tải về"
                    >
                      <Download className="w-4 h-4 text-gray-700" />
                    </button>
                  </div>
                )}
              </div>

              {/* Label */}
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">{pose.label}</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">{pose.aspectRatio}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void handleGenerateAll()}
          disabled={generating}
        >
          {generating ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tạo...</>
          ) : (
            <><RefreshCw className="w-3.5 h-3.5" /> Tạo lại toàn bộ</>
          )}
        </Button>
        {images.length > 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {images.length}/{POSES.length} ảnh
            {images[0] && ` · Tạo lúc ${new Date(images[0].createdAt).toLocaleString("vi-VN")}`}
          </p>
        )}
      </div>
    </div>
  );
}
