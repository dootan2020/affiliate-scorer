export interface MatchResult {
  url: string;
  assetId: string | null;
  assetCode: string | null;
  productTitle: string | null;
  format: string | null;
  hookType: string | null;
  matchMethod: string;
}

export interface MetricsInput {
  views: string;
  likes: string;
  comments: string;
  shares: string;
  saves: string;
  orders: string;
}

export interface LogResult {
  rewardScore: number;
  analysis: {
    verdict: "win" | "loss" | "neutral";
    factors: Array<{ factor: string; value: string | null; impact: string; detail?: string }>;
  };
}

export const EMPTY_METRICS: MetricsInput = {
  views: "",
  likes: "",
  comments: "",
  shares: "",
  saves: "",
  orders: "",
};
