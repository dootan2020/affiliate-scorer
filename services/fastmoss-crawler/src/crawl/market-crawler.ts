// FastMoss market overview — intercepts marketOverview API response
import type { Page } from 'playwright';
import type { MarketOverview } from '../types.js';
import { FASTMOSS_URL } from './browser-context.js';

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] [market-crawler] ${message}`);
}

/**
 * Navigate to the market-pulse page and capture the marketOverview API call.
 * Returns a MarketOverview with the raw data payload for PASTR sync.
 */
export async function crawlMarketOverview(page: Page): Promise<MarketOverview> {
  log('Setting up interceptor for marketOverview API...');

  let marketData: Record<string, unknown> = {};
  let captured = false;

  const handler = async (response: import('playwright').Response): Promise<void> => {
    if (!response.url().includes('/api/analysis/GoodCategory/marketOverview')) return;
    if (captured) return;
    try {
      const json = (await response.json()) as { code?: number | string; data?: Record<string, unknown> };
      if (json.data) {
        marketData = json.data;
        captured = true;
        log('marketOverview response captured.');
      }
    } catch { /* ignore */ }
  };

  page.on('response', handler);

  try {
    log('Navigating to market-pulse page...');
    await page.goto(`${FASTMOSS_URL}/vi/market/market-pulse?region=VN`, {
      waitUntil: 'networkidle',
      timeout: 30_000,
    }).catch(() => log('Navigation timeout — checking captured data anyway'));
    // Extra wait: market page has deferred API calls
    await page.waitForTimeout(5000);
  } finally {
    page.off('response', handler);
  }

  if (!captured) {
    log('Warning: marketOverview API was not intercepted — returning empty data.');
  }

  return {
    region: 'VN',
    crawled_at: new Date().toISOString(),
    data: marketData,
  };
}
