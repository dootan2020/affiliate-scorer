"use client";

import { ThumbsUp, ThumbsDown, Lightbulb } from "lucide-react";
import { BIBLE_LAYER_LABELS } from "@/lib/content/character-bible-types";
import type { BibleLayerKey } from "@/lib/content/character-bible-types";
import { IDEA_STATUS_LABELS, IDEA_STATUS_COLORS } from "@/lib/content/idea-matrix-types";
import type { IdeaStatus } from "@/lib/content/idea-matrix-types";

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
  idea: IdeaItem;
  onPick: (id: string) => void;
  onDismiss: (id: string) => void;
}

const LAYER_COLORS: Record<string, string> = {
  core_beliefs: "border-l-rose-400",
  relationships: "border-l-blue-400",
  world_rules: "border-l-emerald-400",
  origin: "border-l-purple-400",
  living_spaces: "border-l-amber-400",
  story_arcs: "border-l-orange-400",
  language: "border-l-cyan-400",
};

export function IdeaMatrixCard({ idea, onPick, onDismiss }: Props): React.ReactElement {
  const hooks = (idea.hookSuggestions as string[]) || [];
  const isFresh = idea.status === "fresh";

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm border-l-4 ${LAYER_COLORS[idea.bibleLayer] || "border-l-gray-300"} p-3 space-y-2`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight">{idea.ideaTitle}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500">
              {BIBLE_LAYER_LABELS[idea.bibleLayer as BibleLayerKey] || idea.bibleLayer}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400">
              {idea.formatSlug}
            </span>
          </div>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${IDEA_STATUS_COLORS[idea.status as IdeaStatus] || ""}`}>
          {IDEA_STATUS_LABELS[idea.status as IdeaStatus] || idea.status}
        </span>
      </div>

      {/* Layer detail */}
      <p className="text-xs text-gray-500 dark:text-gray-400">{idea.layerDetail}</p>

      {/* Hooks */}
      {hooks.length > 0 && (
        <div className="space-y-1">
          {hooks.map((h, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <Lightbulb className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
              <span className="text-xs text-gray-600 dark:text-gray-300">{h}</span>
            </div>
          ))}
        </div>
      )}

      {/* Angle + Notes */}
      {idea.angle && <p className="text-xs text-gray-500"><strong>Góc:</strong> {idea.angle}</p>}
      {idea.notes && <p className="text-xs text-gray-400 italic">{idea.notes}</p>}

      {/* Actions */}
      {isFresh && (
        <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-slate-800">
          <button
            onClick={() => onPick(idea.id)}
            className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
          >
            <ThumbsUp className="w-3 h-3" /> Chọn
          </button>
          <button
            onClick={() => onDismiss(idea.id)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
          >
            <ThumbsDown className="w-3 h-3" /> Bỏ qua
          </button>
        </div>
      )}
    </div>
  );
}
