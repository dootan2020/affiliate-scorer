// node-cron scheduler: categories → products → market
import cron from 'node-cron';
import { crawlCategories } from './crawl/category-crawler.js';
import { crawlProducts } from './crawl/product-crawler.js';
import { crawlMarketOverview } from './crawl/market-crawler.js';
import { syncProducts, syncCategories, syncMarket } from './sync/pastr-sync.js';
import type { ScheduleOptions } from './types.js';

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] [scheduler] ${message}`);
}

async function runFullCrawl(): Promise<void> {
  log('=== Starting scheduled crawl run ===');

  // Step 1: categories
  try {
    log('Step 1/3: Crawling categories...');
    const categories = await crawlCategories();
    log(`Categories crawled: ${categories.length}`);
    if (categories.length > 0) {
      await syncCategories(categories);
    }
  } catch (err) {
    log(`Category crawl error: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Step 2: products
  try {
    log('Step 2/3: Crawling products...');
    const products = await crawlProducts();
    log(`Products crawled: ${products.length}`);
    if (products.length > 0) {
      await syncProducts(products);
    }
  } catch (err) {
    log(`Product crawl error: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Step 3: market overview
  try {
    log('Step 3/3: Crawling market overview...');
    const market = await crawlMarketOverview();
    await syncMarket(market);
  } catch (err) {
    log(`Market crawl error: ${err instanceof Error ? err.message : String(err)}`);
  }

  log('=== Scheduled crawl run complete ===');
}

export function startScheduler(options: ScheduleOptions): void {
  const intervalHours = options.interval;

  // Build cron expression: run every N hours starting at minute 0
  // e.g. interval=12 → "0 */12 * * *"
  const cronExpression = `0 */${intervalHours} * * *`;

  log(`Scheduler starting — interval: every ${intervalHours}h (cron: "${cronExpression}")`);

  // Run once immediately on start
  runFullCrawl().catch((err) => {
    log(`Initial crawl error: ${err instanceof Error ? err.message : String(err)}`);
  });

  cron.schedule(cronExpression, () => {
    runFullCrawl().catch((err) => {
      log(`Scheduled crawl error: ${err instanceof Error ? err.message : String(err)}`);
    });
  });

  log('Scheduler running. Press Ctrl+C to stop.');
}
