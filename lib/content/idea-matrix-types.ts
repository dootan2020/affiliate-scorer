// Idea Matrix type definitions

import type { BibleLayerKey } from "./character-bible-types";

export type IdeaStatus = "fresh" | "picked" | "briefed" | "dismissed";

export interface IdeaMatrixItemData {
  id?: string;
  bibleLayer: BibleLayerKey;
  layerDetail: string;
  formatSlug: string;
  ideaTitle: string;
  hookSuggestions: string[];
  angle: string;
  notes: string;
  status: IdeaStatus;
  briefId?: string | null;
}

export const IDEA_STATUS_LABELS: Record<IdeaStatus, string> = {
  fresh: "Mới",
  picked: "Đã chọn",
  briefed: "Đã tạo brief",
  dismissed: "Bỏ qua",
};

export const IDEA_STATUS_COLORS: Record<IdeaStatus, string> = {
  fresh: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  picked: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  briefed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  dismissed: "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-gray-500",
};
