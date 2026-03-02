// Type definitions for Series Planner + Episode System

export const SERIES_TYPES = ["evergreen", "signature", "arc", "community"] as const;
export type SeriesType = (typeof SERIES_TYPES)[number];

export const SERIES_TYPE_LABELS: Record<SeriesType, string> = {
  evergreen: "Evergreen",
  signature: "Signature",
  arc: "Story Arc",
  community: "Community",
};

export const SERIES_STATUSES = ["draft", "active", "paused", "completed"] as const;
export type SeriesStatus = (typeof SERIES_STATUSES)[number];

export const SERIES_STATUS_LABELS: Record<SeriesStatus, string> = {
  draft: "Nháp",
  active: "Đang chạy",
  paused: "Tạm dừng",
  completed: "Hoàn thành",
};

export const EPISODE_GOALS = ["awareness", "lead", "sale"] as const;
export type EpisodeGoal = (typeof EPISODE_GOALS)[number];

export const EPISODE_GOAL_LABELS: Record<EpisodeGoal, string> = {
  awareness: "Awareness",
  lead: "Lead",
  sale: "Sale",
};

export const EPISODE_STATUSES = ["draft", "ready", "produced", "published"] as const;
export type EpisodeStatus = (typeof EPISODE_STATUSES)[number];

export const EPISODE_STATUS_LABELS: Record<EpisodeStatus, string> = {
  draft: "Nháp",
  ready: "Sẵn sàng",
  produced: "Đã sản xuất",
  published: "Đã đăng",
};

export interface SeriesData {
  name: string;
  type: SeriesType;
  premise?: string | null;
  openingRitual?: string | null;
  closingRitual?: string | null;
  proofRule?: string | null;
  status?: SeriesStatus;
}

export interface EpisodeData {
  episodeNumber: number;
  title: string;
  goal?: EpisodeGoal | null;
  formatSlug?: string | null;
  pillar?: string | null;
  contentAssetId?: string | null;
  plannedDate?: string | null; // ISO date
  status?: EpisodeStatus;
  notes?: string | null;
}
