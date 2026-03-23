// CLI entry point: login | crawl | categories | schedule
import 'dotenv/config';
import { Command } from 'commander';
import { loginFastMoss } from './auth/login.js';
import { saveCookies } from './auth/cookie-store.js';
import { crawlProducts } from './crawl/product-crawler.js';
import { crawlCategories } from './crawl/category-crawler.js';
import { crawlMarketOverview } from './crawl/market-crawler.js';
import { syncProducts, syncCategories, syncMarket } from './sync/pastr-sync.js';
import { startScheduler } from './schedule.js';
import type { CrawlOptions } from './types.js';

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] [cli] ${message}`);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Error: ${name} environment variable is required. See .env.example`);
    process.exit(1);
  }
  return value;
}

const program = new Command();

program
  .name('fastmoss-crawler')
  .description('FastMoss data crawler and PASTR sync service')
  .version('1.0.0');

// ── login ─────────────────────────────────────────────────────────────────────

program
  .command('login')
  .description('Login to FastMoss using email and password (headless Playwright)')
  .action(async () => {
    const email = requireEnv('FASTMOSS_EMAIL');
    const password = requireEnv('FASTMOSS_PASSWORD');
    requireEnv('ENCRYPTION_KEY'); // ensure it's set before attempting

    log(`Logging in as ${email}...`);
    try {
      const cookies = await loginFastMoss(email, password);
      saveCookies(cookies);
      log(`Login successful. ${cookies.length} cookies saved.`);
    } catch (err) {
      console.error(`Login failed: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

// ── crawl ─────────────────────────────────────────────────────────────────────

program
  .command('crawl')
  .description('Crawl product data from FastMoss and sync to PASTR')
  .option(
    '--categories <codes>',
    'Category codes (comma-separated)',
    '10,14,24,2,25,16,3,11'
  )
  .option('--max-pages <n>', 'Max pages per category per endpoint', '10')
  .option('--dry-run', 'Print data without syncing to PASTR', false)
  .option(
    '--endpoint <name>',
    'Specific endpoint (saleRank|popRank|newProduct|videoRank)'
  )
  .action(async (opts: { categories: string; maxPages: string; dryRun: boolean; endpoint?: string }) => {
    const options: CrawlOptions = {
      categories: opts.categories.split(',').map((s) => parseInt(s.trim(), 10)).filter(Boolean),
      maxPages: parseInt(opts.maxPages, 10) || 10,
      dryRun: opts.dryRun,
      endpoint: opts.endpoint,
    };

    log(`Starting crawl — categories: [${options.categories.join(', ')}], maxPages: ${options.maxPages}, dryRun: ${options.dryRun}`);
    if (options.endpoint) {
      log(`Filtering to endpoint: ${options.endpoint}`);
    }

    try {
      const products = await crawlProducts({
        categories: options.categories,
        maxPages: options.maxPages,
        endpointFilter: options.endpoint,
      });

      log(`Total products crawled: ${products.length}`);

      if (options.dryRun) {
        console.log(JSON.stringify(products.slice(0, 5), null, 2));
        log(`Dry run — ${products.length} products would be synced (showing first 5 above)`);
      } else {
        if (products.length > 0) {
          await syncProducts(products);
        } else {
          log('No products to sync.');
        }
      }
    } catch (err) {
      console.error(`Crawl failed: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

// ── categories ────────────────────────────────────────────────────────────────

program
  .command('categories')
  .description('Crawl and display the FastMoss category tree')
  .option('--sync', 'Sync categories to PASTR after crawling', false)
  .action(async (opts: { sync: boolean }) => {
    log('Crawling categories...');
    try {
      const categories = await crawlCategories();
      log(`Fetched ${categories.length} categories`);

      // Pretty print tree
      for (const cat of categories) {
        const indent = '  '.repeat(cat.level - 1);
        console.log(`${indent}[${cat.code}] ${cat.name} (parent: ${cat.parentCode ?? 'root'}, rank: ${cat.rank})`);
      }

      if (opts.sync && categories.length > 0) {
        await syncCategories(categories);
      }
    } catch (err) {
      console.error(`Categories crawl failed: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

// ── market ────────────────────────────────────────────────────────────────────

program
  .command('market')
  .description('Crawl market overview from FastMoss')
  .option('--dry-run', 'Print data without syncing', false)
  .action(async (opts: { dryRun: boolean }) => {
    log('Crawling market overview...');
    try {
      const overview = await crawlMarketOverview();
      if (opts.dryRun) {
        console.log(JSON.stringify(overview, null, 2));
      } else {
        await syncMarket(overview);
      }
    } catch (err) {
      console.error(`Market crawl failed: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

// ── schedule ──────────────────────────────────────────────────────────────────

program
  .command('schedule')
  .description('Start scheduled crawling (categories → products → market)')
  .option('--interval <hours>', 'Crawl interval in hours', '12')
  .action((opts: { interval: string }) => {
    const interval = parseInt(opts.interval, 10) || 12;
    if (interval < 1 || interval > 168) {
      console.error('Interval must be between 1 and 168 hours');
      process.exit(1);
    }
    startScheduler({ interval });
  });

program.parse(process.argv);
