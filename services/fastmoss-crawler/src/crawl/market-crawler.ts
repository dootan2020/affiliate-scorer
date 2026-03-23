// FastMoss market overview crawler
import { apiGet } from './client.js';
import type { MarketOverview } from '../types.js';

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] [market-crawler] ${message}`);
}

export async function crawlMarketOverview(): Promise<MarketOverview> {
  log('Fetching market overview from /api/analysis/GoodCategory/marketOverview...');

  const json = await apiGet('/api/analysis/GoodCategory/marketOverview', {
    params: { region: 'VN', is_mock: 0 },
  });

  const data = (json['data'] as Record<string, unknown> | undefined) ?? {};

  log('Market overview fetched successfully.');

  return {
    region: 'VN',
    crawled_at: new Date().toISOString(),
    data,
  };
}
