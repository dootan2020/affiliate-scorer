// Product crawlers: saleRank, popRank, newProduct, videoRank
import { paginatedGet } from './client.js';
import type { CrawledProduct, RankListItem } from '../types.js';

const DEFAULT_CATEGORIES = [10, 14, 24, 2, 25, 16, 3, 11];
const MAX_CONCURRENT = 3;

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] [product-crawler] ${message}`);
}

// ── Field normalizers ─────────────────────────────────────────────────────────

function parsePrice(priceStr: string | undefined): number {
  if (!priceStr) return 0;
  // Remove non-numeric except dot/comma
  const clean = priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
  return parseFloat(clean) || 0;
}

function parseRate(rateStr: string | undefined): number {
  if (!rateStr) return 0;
  return parseFloat(rateStr.replace('%', '')) || 0;
}

function parseCategories(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return [raw];
}

function normalize(item: RankListItem, endpointName: string, categoryId: number): CrawledProduct {
  const productId = String(
    item.product_id ?? item.goods_id ?? item.id ?? ''
  );
  const title = String(item.product_title ?? item.goods_title ?? item.title ?? '');
  const cover = String(item.cover ?? item.product_cover ?? '');
  const priceDisplay = String(item.price ?? item.product_price ?? '');
  const commissionRate = String(item.commission_rate ?? '');

  return {
    product_id: productId,
    title,
    cover,
    price_display: priceDisplay,
    price_vnd: parsePrice(priceDisplay),
    commission_rate: commissionRate,
    commission_rate_num: parseRate(commissionRate),
    sold_count: Number(item.sold_count ?? item.sale_count ?? 0),
    sale_amount: Number(item.sale_amount ?? 0),
    day28_sold_count: Number(item.day28_sold_count ?? 0),
    relate_author_count: Number(item.relate_author_count ?? 0),
    relate_video_count: Number(item.relate_video_count ?? 0),
    relate_live_count: Number(item.relate_live_count ?? 0),
    sold_count_inc_rate: String(item.sold_count_inc_rate ?? ''),
    product_rating: Number(item.product_score ?? item.rating ?? 0),
    category_name: parseCategories(item.category_name as string | string[] | undefined),
    category_id: Number(item.category_id ?? categoryId),
    shop_name: String(item.shop_name ?? ''),
    region: String(item.region ?? 'VN'),
    is_promoted: Boolean(item.is_promoted ?? false),
    viral_index: item.viral_index !== undefined ? Number(item.viral_index) : undefined,
    popularity_index: item.popularity_index !== undefined ? Number(item.popularity_index) : undefined,
    country_rank: item.country_rank !== undefined ? Number(item.country_rank) : undefined,
    category_rank: item.category_rank !== undefined ? Number(item.category_rank) : undefined,
    endpoint: endpointName,
    crawled_at: new Date().toISOString(),
  };
}

// ── Endpoint definitions ──────────────────────────────────────────────────────

interface EndpointConfig {
  name: string;
  path: string;
  extraParams: Record<string, string | number>;
  extractItems: (data: Record<string, unknown>) => RankListItem[];
}

const ENDPOINTS: EndpointConfig[] = [
  {
    name: 'saleRank',
    path: '/api/goods/saleRank',
    extraParams: {},
    extractItems: (data) => {
      const rankList = data['rank_list'];
      return Array.isArray(rankList) ? (rankList as RankListItem[]) : [];
    },
  },
  {
    name: 'popRank',
    path: '/api/goods/popRank',
    extraParams: {},
    extractItems: (data) => {
      const rankList = data['rank_list'];
      return Array.isArray(rankList) ? (rankList as RankListItem[]) : [];
    },
  },
  {
    name: 'newProduct',
    path: '/api/goods/newProduct',
    extraParams: { rank_type: 11 },
    extractItems: (data) => {
      const list = data['list'];
      return Array.isArray(list) ? (list as RankListItem[]) : [];
    },
  },
  {
    name: 'videoRank',
    path: '/api/video/hotGoodsVideoGroupByProduct',
    extraParams: { rank_type: 7 },
    extractItems: (data) => {
      const productList = data['product_list'];
      return Array.isArray(productList) ? (productList as RankListItem[]) : [];
    },
  },
];

// ── Crawl single endpoint for one category ────────────────────────────────────

async function crawlEndpointCategory(
  endpoint: EndpointConfig,
  categoryId: number,
  maxPages: number
): Promise<CrawledProduct[]> {
  const products: CrawledProduct[] = [];
  log(`[${endpoint.name}] category=${categoryId} starting...`);

  for (let page = 1; page <= maxPages; page++) {
    const params: Record<string, string | number | boolean> = {
      ...endpoint.extraParams,
      category_id: categoryId,
    };

    const items = await paginatedGet(endpoint.path, page, params, (json) => {
      const data = json['data'] as Record<string, unknown> | undefined;
      if (!data) return [];
      return endpoint.extractItems(data);
    });

    if (items.length === 0) {
      log(`[${endpoint.name}] category=${categoryId} page=${page} — no more results`);
      break;
    }

    const normalized = (items as RankListItem[]).map((item) =>
      normalize(item, endpoint.name, categoryId)
    );
    products.push(...normalized);
    log(`[${endpoint.name}] category=${categoryId} page=${page} — ${normalized.length} products`);
  }

  return products;
}

// ── Semaphore for bounded concurrency ─────────────────────────────────────────

function createSemaphore(max: number) {
  let count = 0;
  const queue: Array<() => void> = [];

  function release() {
    count--;
    if (queue.length > 0) {
      count++;
      const next = queue.shift();
      next?.();
    }
  }

  return async function acquire<T>(fn: () => Promise<T>): Promise<T> {
    if (count < max) {
      count++;
      try {
        return await fn();
      } finally {
        release();
      }
    }
    return new Promise<T>((resolve, reject) => {
      queue.push(async () => {
        try {
          resolve(await fn());
        } catch (err) {
          reject(err);
        } finally {
          release();
        }
      });
    });
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface CrawlProductsOptions {
  categories?: number[];
  maxPages?: number;
  endpointFilter?: string;
}

export async function crawlProducts(options: CrawlProductsOptions = {}): Promise<CrawledProduct[]> {
  const categories = options.categories ?? DEFAULT_CATEGORIES;
  const maxPages = options.maxPages ?? 10;
  const endpointFilter = options.endpointFilter;

  const endpoints = endpointFilter
    ? ENDPOINTS.filter((e) => e.name === endpointFilter)
    : ENDPOINTS;

  if (endpoints.length === 0) {
    throw new Error(`Unknown endpoint: ${endpointFilter}. Valid: ${ENDPOINTS.map((e) => e.name).join('|')}`);
  }

  const sem = createSemaphore(MAX_CONCURRENT);
  const allProducts: CrawledProduct[] = [];

  for (const endpoint of endpoints) {
    log(`Starting endpoint: ${endpoint.name} across ${categories.length} categories`);

    const tasks = categories.map((categoryId) =>
      sem(() => crawlEndpointCategory(endpoint, categoryId, maxPages))
    );

    const results = await Promise.all(tasks);
    for (const batch of results) {
      allProducts.push(...batch);
    }

    log(`Endpoint ${endpoint.name} done — ${allProducts.length} total products so far`);
  }

  log(`Crawl complete. Total products: ${allProducts.length}`);
  return allProducts;
}
