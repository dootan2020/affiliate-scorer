// Shared types for Phase 3B import parsers

export interface ImportedDailyResult {
  date: string; // YYYY-MM-DD
  spend: number;
  orders: number;
  revenue: number;
  clicks?: number;
  impressions?: number;
  notes?: string;
}

export interface ImportedCampaign {
  name: string;
  platform: string;
  sourceType: string;
  productId: string | null;
  dailyResults: ImportedDailyResult[];
  startDate: string | null;
  endDate: string | null;
}

export interface ImportedFinancialRecord {
  type: string; // "ads_spend" | "commission_received" | "commission_pending"
  amount: number;
  source: string; // "fb_ads" | "tiktok_ads" | "shopee_ads" | "tiktok_shop" | "shopee"
  productId: string | null;
  campaignId: string | null;
  date: Date;
  notes: string;
  metadata?: Record<string, unknown>;
}

export interface ImportParseResult {
  campaigns: ImportedCampaign[];
  financialRecords: ImportedFinancialRecord[];
  errors: Array<{ row: number; message: string }>;
}

export type ExtendedFileFormat =
  | "fastmoss"
  | "kalodata"
  | "fb_ads"
  | "tiktok_ads"
  | "shopee_ads"
  | "tiktok_affiliate"
  | "shopee_affiliate"
  | "generic"
  | "unknown";

export interface DetectionResult {
  type: ExtendedFileFormat;
  confidence: "high" | "medium" | "low";
  reason: string;
}
