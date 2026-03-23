// Shared types for fastmoss-crawler

export interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

export interface CrawledProduct {
  product_id: string;
  title: string;
  cover: string;
  price_display: string;
  price_vnd: number;
  commission_rate: string;
  commission_rate_num: number;
  sold_count: number;
  sale_amount: number;
  day28_sold_count: number;
  relate_author_count: number;
  relate_video_count: number;
  relate_live_count: number;
  sold_count_inc_rate: string;
  product_rating: number;
  category_name: string[];
  category_id: number;
  shop_name: string;
  region: string;
  is_promoted: boolean;
  viral_index?: number;
  popularity_index?: number;
  country_rank?: number;
  category_rank?: number;
  endpoint: string;
  crawled_at: string;
}

export interface Category {
  code: number;
  name: string;
  parentCode: number | null;
  level: number;
  rank: number;
}

export interface MarketOverview {
  region: string;
  crawled_at: string;
  data: Record<string, unknown>;
}

export interface SyncPayload {
  type: 'products' | 'categories' | 'market';
  data: CrawledProduct[] | Category[] | MarketOverview;
  crawled_at: string;
}

export interface FastMossApiResponse<T> {
  code: string;
  msg: string;
  data: T;
}

export interface RankListItem {
  product_id?: string;
  goods_id?: string;
  id?: string;
  product_title?: string;
  goods_title?: string;
  title?: string;
  cover?: string;
  product_cover?: string;
  price?: string;
  product_price?: string;
  commission_rate?: string;
  sold_count?: number;
  sale_count?: number;
  sale_amount?: number;
  day28_sold_count?: number;
  relate_author_count?: number;
  relate_video_count?: number;
  relate_live_count?: number;
  sold_count_inc_rate?: string;
  product_score?: number;
  rating?: number;
  category_name?: string | string[];
  category_id?: number;
  shop_name?: string;
  region?: string;
  is_promoted?: boolean;
  viral_index?: number;
  popularity_index?: number;
  country_rank?: number;
  category_rank?: number;
  [key: string]: unknown;
}

export interface CrawlOptions {
  categories: number[];
  maxPages: number;
  dryRun: boolean;
  endpoint?: string;
}

export interface ScheduleOptions {
  interval: number;
  headed?: boolean;
}

export class SessionExpiredError extends Error {
  constructor() {
    super('SESSION_EXPIRED: FastMoss session has expired. Please run login command.');
    this.name = 'SessionExpiredError';
  }
}

export class CrawlerError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'CrawlerError';
  }
}
