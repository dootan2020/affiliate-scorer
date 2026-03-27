export interface UserProfile {
  contentType: "ai_video" | "manual" | "both";
  buyProduct: boolean;
  targetIncome: number; // 10_000_000 | 30_000_000 | 50_000_000
  experience: "new" | "experienced";
}

export interface CategoryStats {
  categoryCode: number;
  categoryName: string;
  totalProducts: number;
  withSales: number;
  withKOL: number;
  avgCommission: number; // percentage, e.g. 12.5
  avgPrice: number; // VND
  revPerOrder: number; // VND
  totalVideos: number;
  avgRating: number;
  avgSales28d: number; // average day28SoldCount per product with sales
  newSurgeRatio: number; // fraction of products with deltaType NEW or SURGE
  totalKOL: number; // sum of relateAuthorCount across category
}

export interface KillResult {
  killed: boolean;
  reasons: string[];
}

export interface ScoreBreakdown {
  demandSignal: number; // 0-100
  supplyGap: number; // 0-100
  unitEconomics: number; // 0-100
  opportunityScore: number; // 0-100 (weighted sum)
  fitScore: number; // 0-100
  nicheScore: number; // 0-100 (opportunity×0.6 + fit×0.4)
}

export interface ScoredNiche {
  // Passthrough from CategoryStats
  categoryCode: number;
  categoryName: string;
  totalProducts: number;
  withSales: number;
  withKOL: number;
  avgCommission: number;
  avgPrice: number;
  revPerOrder: number;
  totalVideos: number;
  avgRating: number;

  // Scoring
  nicheScore: number;
  opportunityScore: number;
  fitScore: number;
  breakdown: ScoreBreakdown;
  kill: KillResult;
  highlights: string[];
  risks: string[];
  tags: string[];
}
