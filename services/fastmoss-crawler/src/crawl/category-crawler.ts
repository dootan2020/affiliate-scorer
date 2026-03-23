// FastMoss category tree — intercepts filterInfo API response during page navigation
import type { Page } from 'playwright';
import type { Category } from '../types.js';
import { FASTMOSS_URL } from './browser-context.js';

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] [category-crawler] ${message}`);
}

interface RawL3 {
  c_code?: string | number;
  c_name?: string;
  rank?: number;
  [key: string]: unknown;
}

interface RawL2 extends RawL3 {
  sub?: RawL3[];
}

interface RawL1 extends RawL3 {
  sub?: RawL2[];
}

interface FilterInfoData {
  category?: RawL1[];
  [key: string]: unknown;
}

/**
 * Navigate to the search page and capture the filterInfo API call that carries
 * the full category tree. Returns a flat list of all categories (L1/L2/L3).
 */
export async function crawlCategories(page: Page): Promise<Category[]> {
  log('Setting up interceptor for /api/goods/filterInfo...');

  const categories: Category[] = [];
  let resolved = false;

  const handler = async (response: import('playwright').Response): Promise<void> => {
    if (!response.url().includes('/api/goods/filterInfo')) return;
    if (resolved) return;
    try {
      const json = (await response.json()) as { code?: number | string; data?: FilterInfoData };
      const data = json.data;
      if (!data?.category) return;

      resolved = true;

      for (const l1 of data.category) {
        categories.push({
          code: Number(l1.c_code ?? 0),
          name: String(l1.c_name ?? ''),
          parentCode: null,
          level: 1,
          rank: Number(l1.rank ?? 0),
        });

        for (const l2 of l1.sub ?? []) {
          categories.push({
            code: Number(l2.c_code ?? 0),
            name: String(l2.c_name ?? ''),
            parentCode: Number(l1.c_code ?? 0),
            level: 2,
            rank: Number(l2.rank ?? 0),
          });

          for (const l3 of l2.sub ?? []) {
            categories.push({
              code: Number(l3.c_code ?? 0),
              name: String(l3.c_name ?? ''),
              parentCode: Number(l2.c_code ?? 0),
              level: 3,
              rank: Number(l3.rank ?? 0),
            });
          }
        }
      }
      log(`Captured filterInfo: ${categories.length} categories`);
    } catch { /* ignore parse errors */ }
  };

  page.on('response', handler);

  try {
    log('Navigating to search page to trigger filterInfo call...');
    await page.goto(`${FASTMOSS_URL}/vi/e-commerce/search?region=VN`, {
      waitUntil: 'networkidle',
      timeout: 30_000,
    }).catch(() => log('Navigation timeout — checking captured data anyway'));
    await page.waitForTimeout(3000);
  } finally {
    page.off('response', handler);
  }

  if (categories.length === 0) {
    log('Warning: no categories captured — filterInfo may not have been called.');
  }

  return categories;
}
