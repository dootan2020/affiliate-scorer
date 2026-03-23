// Product crawlers: browse FastMoss pages and intercept API responses
// Architecture: Playwright navigates real pages → response interceptor captures
// Pro-tier JSON → normalize to CrawledProduct[]
import type { Page } from 'playwright';
import type { CrawledProduct, RankListItem } from '../types.js';
import { FASTMOSS_URL } from './browser-context.js';

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] [product-crawler] ${message}`);
}

// ── Field normalizers ─────────────────────────────────────────────────────────

function parsePrice(priceStr: string | undefined): number {
  if (!priceStr) return 0;
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

function normalizeProduct(
  item: RankListItem,
  endpointName: string,
  sourceUrl: string
): CrawledProduct | null {
  const productId = String(item.product_id ?? item.goods_id ?? item.id ?? '');
  if (!productId) return null;

  const title = String(item.product_title ?? item.goods_title ?? item.title ?? '');
  const cover = String(item.cover ?? item.product_cover ?? '');
  const priceDisplay = String(item.price ?? item.product_price ?? '');
  const commissionRate = String(item.commission_rate ?? '');

  // Derive endpoint name from intercepted URL when not provided
  const ep = endpointName || deriveEndpointName(sourceUrl);

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
    category_id: Number(item.category_id ?? 0),
    shop_name: String(item.shop_name ?? ''),
    region: String(item.region ?? 'VN'),
    is_promoted: Boolean(item.is_promoted ?? false),
    viral_index: item.viral_index !== undefined ? Number(item.viral_index) : undefined,
    popularity_index: item.popularity_index !== undefined ? Number(item.popularity_index) : undefined,
    country_rank: item.country_rank !== undefined ? Number(item.country_rank) : undefined,
    category_rank: item.category_rank !== undefined ? Number(item.category_rank) : undefined,
    endpoint: ep,
    crawled_at: new Date().toISOString(),
  };
}

function deriveEndpointName(url: string): string {
  if (url.includes('saleRank')) return 'saleRank';
  if (url.includes('popRank')) return 'popRank';
  if (url.includes('newProduct')) return 'newProduct';
  if (url.includes('hotGoodsVideo')) return 'videoRank';
  if (url.includes('search')) return 'search';
  return 'unknown';
}

// ── Intercepted response type ─────────────────────────────────────────────────

interface CapturedResponse {
  url: string;
  data: Record<string, unknown>;
}

// ── Response interceptor setup ────────────────────────────────────────────────

/**
 * Attaches a response listener to the page that captures FastMoss API JSON.
 * Returns the mutable array that accumulates captured responses.
 */
function setupInterceptor(page: Page): CapturedResponse[] {
  const captured: CapturedResponse[] = [];

  page.on('response', (response) => {
    const url = response.url();

    // Only intercept product/video API paths
    const isGoodsApi = url.includes('/api/goods/');
    const isVideoApi = url.includes('/api/video/');
    if (!isGoodsApi && !isVideoApi) return;

    // Only relevant endpoints
    const isRelevant =
      url.includes('saleRank') ||
      url.includes('popRank') ||
      url.includes('newProduct') ||
      url.includes('hotGoodsVideo') ||
      url.includes('search') ||
      url.includes('filterInfo');
    if (!isRelevant) return;

    // Async: read body then push (fire-and-forget inside the listener)
    response.json().then((json: unknown) => {
      const j = json as { code?: number | string; data?: Record<string, unknown> };
      // Accept both full success (200) and partial auth responses
      if (j.code === 200 || j.code === 'MAG_AUTH_3011') {
        if (j.data) {
          captured.push({ url, data: j.data });
        }
      }
    }).catch(() => { /* non-JSON or network error — ignore */ });
  });

  return captured;
}

// ── Page navigation helpers ───────────────────────────────────────────────────

async function navigateAndWait(page: Page, path: string): Promise<void> {
  log(`Navigating to ${path}...`);
  await page.goto(`${FASTMOSS_URL}${path}`, {
    waitUntil: 'networkidle',
    timeout: 30_000,
  }).catch(() => log(`Timeout on ${path}, continuing with whatever was captured...`));
  // Extra wait for dynamic JS content to fire XHR calls
  await page.waitForTimeout(3000);
}

async function paginateAntd(page: Page, maxPages: number): Promise<void> {
  for (let p = 1; p < maxPages; p++) {
    const nextBtn = page
      .locator('.ant-pagination-next:not(.ant-pagination-disabled)')
      .first();
    const visible = await nextBtn.isVisible({ timeout: 2000 }).catch(() => false);
    if (!visible) break;

    await nextBtn.click();
    await page.waitForTimeout(2000);
    log(`  Paginated to page ${p + 1}`);
  }
}

// ── Ranking pages ─────────────────────────────────────────────────────────────

const RANKING_PAGES = [
  { path: '/vi/e-commerce/saleslist?region=VN', label: 'saleRank' },
  { path: '/vi/e-commerce/hotlist?region=VN', label: 'popRank' },
  { path: '/vi/e-commerce/newProducts?region=VN', label: 'newProduct' },
  { path: '/vi/e-commerce/hotvideo?region=VN', label: 'videoRank' },
];

// Category IDs: Home, Beauty, F&B, Women, Electronics, Health, Men, Kitchen
const SEARCH_CATEGORIES = [10, 14, 24, 2, 16, 25, 3, 11];

// ── Public API ────────────────────────────────────────────────────────────────

export interface CrawlProductsOptions {
  maxPages?: number;
  categories?: number[];
  endpointFilter?: string;
}

/**
 * Browse FastMoss ranking + search pages with Playwright and collect all
 * product data from intercepted API responses.
 *
 * The `page` parameter must come from `createBrowserContext()` and the user
 * must already be logged in (`ensureLoggedIn()` returns true).
 */
export async function crawlProducts(
  page: Page,
  options: CrawlProductsOptions = {}
): Promise<CrawledProduct[]> {
  const maxPages = options.maxPages ?? 5;
  const captured = setupInterceptor(page);

  // ── Phase 1: Ranking pages ──────────────────────────────────────────────
  const rankingPages = options.endpointFilter
    ? RANKING_PAGES.filter((rp) => rp.label === options.endpointFilter)
    : RANKING_PAGES;

  for (const rp of rankingPages) {
    await navigateAndWait(page, rp.path);
    await paginateAntd(page, maxPages);
  }

  // ── Phase 2: Search pages per category ─────────────────────────────────
  if (!options.endpointFilter || options.endpointFilter === 'search') {
    const cats =
      options.categories && options.categories.length > 0
        ? options.categories
        : SEARCH_CATEGORIES;

    for (const cat of cats) {
      log(`Search category ${cat}...`);
      await navigateAndWait(
        page,
        `/vi/e-commerce/search?region=VN&category=${cat}`
      );
      await paginateAntd(page, maxPages);
    }
  }

  // ── Process captured responses ──────────────────────────────────────────
  log(`Intercepted ${captured.length} API responses — extracting products...`);
  const products = new Map<string, CrawledProduct>();

  for (const item of captured) {
    const data = item.data;
    const endpointName = deriveEndpointName(item.url);

    // Different endpoints store lists under different keys
    const list = (
      data['rank_list'] ??
      data['product_list'] ??
      data['list'] ??
      []
    ) as RankListItem[];

    if (!Array.isArray(list)) continue;

    for (const raw of list) {
      const product = normalizeProduct(raw, endpointName, item.url);
      if (product && product.region === 'VN' && !products.has(product.product_id)) {
        products.set(product.product_id, product);
      }
    }
  }

  // Local category filter (if requested)
  let result = Array.from(products.values());
  if (options.categories && options.categories.length > 0) {
    const catSet = new Set(options.categories);
    result = result.filter((p) => catSet.has(p.category_id));
    log(`Category filter [${options.categories.join(',')}]: ${result.length} products`);
  }

  // Per-category breakdown log
  const catCounts = new Map<string, number>();
  for (const p of result) {
    const key = p.category_name[0] || 'Unknown';
    catCounts.set(key, (catCounts.get(key) ?? 0) + 1);
  }
  log(`Total unique VN products: ${result.length}`);
  log(
    `Per-category: ${Array.from(catCounts.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join(', ')}`
  );

  return result;
}
