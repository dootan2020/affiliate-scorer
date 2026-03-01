export interface TacticalSuggestion {
  field: string; // "hookBank" | "contentMix" | "contentPillars" | etc.
  label: string; // Display name tieng Viet
  action: "add" | "remove" | "replace" | "adjust";
  current: unknown;
  suggested: unknown;
  reason: string;
}

export interface TacticalRefreshInput {
  trendingContext: string;
  useTracking: boolean;
}

export interface TacticalRefreshResult {
  suggestions: TacticalSuggestion[];
  analysisNotes: string;
}

export interface ChannelPerformanceData {
  totalVideos: number;
  trackingData: Array<{
    assetId: string;
    hookType: string | null;
    format: string | null;
    contentType: string | null;
    views24h: number | null;
    views7d: number | null;
    likes: number | null;
    publishedAt: Date | null;
  }>;
  topHookTypes: Array<{ hookType: string; avgViews: number; count: number }>;
  formatPerformance: Array<{ format: string; avgViews: number; count: number }>;
  bestPublishTimes: Array<{ hour: number; avgViews: number }>;
}
