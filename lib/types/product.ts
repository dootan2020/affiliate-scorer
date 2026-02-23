// Product type matching Prisma schema
export interface Product {
  id: string;
  name: string;
  url: string | null;
  category: string;
  price: number;
  commissionRate: number;
  commissionVND: number;
  platform: string;
  salesTotal: number | null;
  salesGrowth7d: number | null;
  salesGrowth30d: number | null;
  revenue7d: number | null;
  revenue30d: number | null;
  affiliateCount: number | null;
  creatorCount: number | null;
  topVideoViews: number | null;
  shopName: string | null;
  shopRating: number | null;
  aiScore: number | null;
  aiRank: number | null;
  scoreBreakdown: string | null;
  scoringVersion: string | null;
  contentSuggestion: string | null;
  platformAdvice: string | null;
  source: string;
  importBatchId: string;
  dataDate: Date;
  createdAt: Date;
}

export interface ProductWhereInput {
  category?: { contains: string } | string;
  aiScore?: { gte?: number; not?: null } | number | null;
  id?: { in: string[] } | string;
  importBatchId?: string;
}
