// HTTP client with cookies, anti-detect headers and rate limiting
import { loadCookies } from '../auth/cookie-store.js';
import { SessionExpiredError, CrawlerError } from '../types.js';

const BASE_URL = 'https://www.fastmoss.com';
const DELAY_MS = 1000;
// FastMoss ranking endpoints cap at 5-10 items regardless of pagesize
// Start at 10 to avoid getting garbage data from larger pagesize requests
const PAGE_SIZES = [10];

let lastRequestTime = 0;

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] [client] ${message}`);
}

function randomCnonce(): string {
  return String(Math.floor(10_000_000 + Math.random() * 90_000_000));
}

function buildCookieHeader(): string {
  const cookies = loadCookies();
  if (!cookies || cookies.length === 0) {
    throw new CrawlerError('No cookies found. Please run the login command first.');
  }
  let cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
  // Force region=VN in cookie string (subscription is per-region)
  if (!cookieStr.includes('region=VN')) {
    cookieStr = cookieStr.replace(/region=[^;]+/, 'region=VN');
    if (!cookieStr.includes('region=')) cookieStr += '; region=VN';
  }
  if (!cookieStr.includes('NEXT_LOCALE=vi')) {
    cookieStr = cookieStr.replace(/NEXT_LOCALE=[^;]+/, 'NEXT_LOCALE=vi');
    if (!cookieStr.includes('NEXT_LOCALE=')) cookieStr += '; NEXT_LOCALE=vi';
  }
  return cookieStr;
}

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < DELAY_MS) {
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

export interface RequestOptions {
  params?: Record<string, string | number | boolean>;
  signal?: AbortSignal;
}

interface ApiResponse {
  code: string;
  msg?: string;
  data?: unknown;
  [key: string]: unknown;
}

export async function apiGet(path: string, options: RequestOptions = {}): Promise<ApiResponse> {
  await rateLimit();

  const cookieHeader = buildCookieHeader();

  const url = new URL(`${BASE_URL}${path}`);
  // Anti-detect params on every request
  url.searchParams.set('_time', String(Math.floor(Date.now() / 1000)));
  url.searchParams.set('cnonce', randomCnonce());
  url.searchParams.set('region', 'VN');

  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      url.searchParams.set(key, String(value));
    }
  }

  const headers: Record<string, string> = {
    Cookie: cookieHeader,
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    Referer: 'https://www.fastmoss.com/',
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'X-Requested-With': 'XMLHttpRequest',
  };

  log(`GET ${url.pathname}${url.search}`);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers,
    signal: options.signal,
  });

  if (!response.ok) {
    throw new CrawlerError(`HTTP ${response.status} from ${path}`);
  }

  const json = (await response.json()) as ApiResponse;

  // Session expired
  if (json.code === 'MSG_30001' || json.code === '30001') {
    throw new SessionExpiredError();
  }

  return json;
}

/**
 * Paginated GET that automatically tries pagesize 50 → 20 → 10 on empty/error responses.
 * Returns the first successful non-empty array of items.
 */
export async function paginatedGet(
  path: string,
  page: number,
  params: Record<string, string | number | boolean>,
  dataExtractor: (json: ApiResponse) => unknown[]
): Promise<unknown[]> {
  for (const pagesize of PAGE_SIZES) {
    try {
      const json = await apiGet(path, {
        params: { ...params, page, pagesize },
      });

      const items = dataExtractor(json);
      if (Array.isArray(items) && items.length > 0) {
        return items;
      }

      if (pagesize === PAGE_SIZES[PAGE_SIZES.length - 1]) {
        // Last fallback also empty — genuinely no more results
        return [];
      }
      log(`Empty result with pagesize=${pagesize}, retrying with smaller size...`);
    } catch (err) {
      if (err instanceof SessionExpiredError) throw err;
      if (pagesize === PAGE_SIZES[PAGE_SIZES.length - 1]) throw err;
      log(`Error with pagesize=${pagesize}: ${err instanceof Error ? err.message : String(err)}, retrying...`);
    }
  }
  return [];
}
