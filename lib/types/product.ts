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

  // Sales & Trending
  salesTotal: number | null;
  sales7d: number | null;
  salesGrowth7d: number | null;
  salesGrowth30d: number | null;
  revenue7d: number | null;
  revenue30d: number | null;
  revenueTotal: number | null;

  // Competition (KOL data)
  totalKOL: number | null;
  kolOrderRate: number | null;
  totalVideos: number | null;
  totalLivestreams: number | null;
  affiliateCount: number | null;
  creatorCount: number | null;
  topVideoViews: number | null;

  // Media & Links
  imageUrl: string | null;
  tiktokUrl: string | null;
  fastmossUrl: string | null;
  shopFastmossUrl: string | null;

  // Shop
  shopName: string | null;
  shopRating: number | null;
  productStatus: string | null;

  // Listing & History
  listingDate: Date | null;
  firstSeenAt: Date;
  lastSeenAt: Date;

  // AI Scoring
  aiScore: number | null;
  aiRank: number | null;
  scoreBreakdown: string | null;
  scoringVersion: string | null;
  contentSuggestion: string | null;
  platformAdvice: string | null;

  // Seasonal
  seasonalTag: string | null;
  sellWindowStart: Date | null;
  sellWindowEnd: Date | null;

  // Source
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
