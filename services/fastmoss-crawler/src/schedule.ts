// node-cron scheduler: categories → products → market
// Each run creates a fresh browser context, crawls, then closes it.
import cron from 'node-cron';
import { createBrowserContext, ensureLoggedIn } from './crawl/browser-context.js';
import { crawlCategories } from './crawl/category-crawler.js';
import { crawlProducts } from './crawl/product-crawler.js';
import { crawlMarketOverview } from './crawl/market-crawler.js';
import { syncProducts, syncCategories, syncMarket } from './sync/pastr-sync.js';

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] [scheduler] ${message}`);
}

export interface ScheduleOptions {
  interval: number;
  headed?: boolean;
}

async function runFullCrawl(headed: boolean): Promise<void> {
  log('=== Starting scheduled crawl run ===');

  const session = await createBrowserContext({ headed });

  try {
    const loggedIn = await ensureLoggedIn(session.page);
    if (!loggedIn) {
      log('ERROR: Not logged in. Run "login" command first, then restart scheduler.');
      return;
    }

    // Step 1: categories
    try {
      log('Step 1/3: Crawling categories...');
      const categories = await crawlCategories(session.page);
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
      const products = await crawlProducts(session.page);
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
      const market = await crawlMarketOverview(session.page);
      await syncMarket(market);
    } catch (err) {
      log(`Market crawl error: ${err instanceof Error ? err.message : String(err)}`);
    }
  } finally {
    await session.close();
    log('Browser context closed.');
  }

  log('=== Scheduled crawl run complete ===');
}

export function startScheduler(options: ScheduleOptions): void {
  const intervalHours = options.interval;
  const headed = options.headed ?? false;

  const cronExpression = `0 */${intervalHours} * * *`;

  log(`Scheduler starting — interval: every ${intervalHours}h (cron: "${cronExpression}")`);
  log(`Browser mode: ${headed ? 'headed (visible)' : 'headless'}`);

  // Run once immediately on start
  runFullCrawl(headed).catch((err) => {
    log(`Initial crawl error: ${err instanceof Error ? err.message : String(err)}`);
  });

  cron.schedule(cronExpression, () => {
    runFullCrawl(headed).catch((err) => {
      log(`Scheduled crawl error: ${err instanceof Error ? err.message : String(err)}`);
    });
  });

  log('Scheduler running. Press Ctrl+C to stop.');
}
