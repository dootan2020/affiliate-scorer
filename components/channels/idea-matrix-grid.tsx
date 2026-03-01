"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Sparkles, Filter } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { IdeaMatrixCard } from "./idea-matrix-card";
import { BIBLE_LAYER_LABELS } from "@/lib/content/character-bible-types";
import type { BibleLayerKey } from "@/lib/content/character-bible-types";

interface IdeaItem {
  id: string;
  bibleLayer: string;
  layerDetail: string;
  formatSlug: string;
  ideaTitle: string;
  hookSuggestions: string[] | null;
  angle: string | null;
  notes: string | null;
  status: string;
}

interface Props {
  channelId: string;
}

export function IdeaMatrixGrid({ channelId }: Props): React.ReactElement {
  const [ideas, setIdeas] = useState<IdeaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filterLayer, setFilterLayer] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  const fetchIdeas = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterLayer) params.set("layer", filterLayer);
      const res = await fetch(`/api/channels/${channelId}/idea-matrix?${params}`);
      const json = (await res.json()) as { data: IdeaItem[] };
      setIdeas(json.data || []);
    } catch {
      toast.error("Lỗi tải Idea Matrix");
    } finally {
      setLoading(false);
    }
  }, [channelId, filterLayer, filterStatus]);

  useEffect(() => { void fetchIdeas(); }, [fetchIdeas]);

  async function handleGenerate(): Promise<void> {
    setGenerating(true);
    try {
      const res = await fetch(`/api/channels/${channelId}/idea-matrix/generate`, { method: "POST" });
      const json = (await res.json()) as { data?: { created: number }; message?: string; error?: string };
      if (!res.ok) throw new Error(json.error || "Lỗi");
      toast.success(json.message || "Đã tạo ý tưởng mới");
      void fetchIdeas();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi tạo Idea Matrix");
    } finally {
      setGenerating(false);
    }
  }

  async function handleUpdateStatus(itemId: string, status: string): Promise<void> {
    try {
      const res = await fetch(`/api/channels/${channelId}/idea-matrix/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error || "Lỗi cập nhật");
      }
      setIdeas((prev) => prev.map((i) => i.id === itemId ? { ...i, status } : i));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi");
    }
  }

  // Group ideas by bible layer
  const grouped = ideas.reduce<Record<string, IdeaItem[]>>((acc, idea) => {
    const key = idea.bibleLayer;
    if (!acc[key]) acc[key] = [];
    acc[key].push(idea);
    return acc;
  }, {});

  const selectCls = "rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs outline-none";

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Actions + filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          onClick={() => void handleGenerate()}
          disabled={generating}
          size="sm"
          variant="secondary"
          className="bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-950/30 dark:text-orange-400"
        >
          {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {ideas.length > 0 ? "Tạo lại ý tưởng" : "Tạo Idea Matrix"}
        </Button>

        <div className="flex items-center gap-2 ml-auto">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <select value={filterLayer} onChange={(e) => setFilterLayer(e.target.value)} className={selectCls}>
            <option value="">Tất cả tầng</option>
            {Object.entries(BIBLE_LAYER_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectCls}>
            <option value="">Tất cả trạng thái</option>
            <option value="fresh">Mới</option>
            <option value="picked">Đã chọn</option>
            <option value="briefed">Đã tạo brief</option>
            <option value="dismissed">Bỏ qua</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      {ideas.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>{ideas.length} ý tưởng</span>
          <span>{ideas.filter((i) => i.status === "fresh").length} mới</span>
          <span>{ideas.filter((i) => i.status === "picked").length} đã chọn</span>
          <span>{ideas.filter((i) => i.status === "briefed").length} đã brief</span>
        </div>
      )}

      {/* Ideas grouped by layer */}
      {ideas.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Chưa có ý tưởng</p>
          <p className="text-xs text-gray-400">Cần có Character Bible + Format Bank để tạo Idea Matrix</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([layer, items]) => (
            <div key={layer}>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                {BIBLE_LAYER_LABELS[layer as BibleLayerKey] || layer} ({items.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((idea) => (
                  <IdeaMatrixCard
                    key={idea.id}
                    idea={idea}
                    onPick={(id) => void handleUpdateStatus(id, "picked")}
                    onDismiss={(id) => void handleUpdateStatus(id, "dismissed")}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
