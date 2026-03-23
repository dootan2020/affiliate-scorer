// CLI entry point: login | crawl | categories | market | schedule
import 'dotenv/config';
import { Command } from 'commander';
import { loginFastMoss } from './auth/login.js';
import { saveCookies } from './auth/cookie-store.js';
import { createBrowserContext, ensureLoggedIn } from './crawl/browser-context.js';
import { crawlProducts } from './crawl/product-crawler.js';
import { crawlCategories } from './crawl/category-crawler.js';
import { crawlMarketOverview } from './crawl/market-crawler.js';
import { syncProducts, syncCategories, syncMarket } from './sync/pastr-sync.js';
import { startScheduler } from './schedule.js';

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] [cli] ${message}`);
}

const program = new Command();

program
  .name('fastmoss-crawler')
  .description('FastMoss data crawler and PASTR sync service (Playwright browser mode)')
  .version('2.0.0');

// ── login ─────────────────────────────────────────────────────────────────────
// Open headed Chrome, wait for user to log in, then close (session persisted).

program
  .command('login')
  .description('Open browser for manual FastMoss login (session saved in data/browser-profile/)')
  .action(async () => {
    try {
      await loginFastMoss();
    } catch (err) {
      console.error(`Login failed: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

// ── import-cookies ────────────────────────────────────────────────────────────
// Legacy fallback: import cookies from Chrome CDP or a JSON file.
// Note: these cookies are used by client-http.ts (backup) only —
// the Playwright browser mode uses persistent profile instead.

program
  .command('import-cookies')
  .description('Import Pro cookies from Chrome via CDP (port 9222) — legacy fallback')
  .option('--port <port>', 'Chrome CDP port', '9222')
  .option('--file <path>', 'Or import from JSON file instead of CDP')
  .action(async (opts: { port: string; file?: string }) => {
    const { chromium } = await import('playwright');
    let cookies: Array<{
      name: string; value: string; domain: string; path: string;
      expires: number; httpOnly: boolean; secure: boolean; sameSite: string;
    }>;

    if (opts.file) {
      const fs = await import('fs');
      if (!fs.existsSync(opts.file)) {
        console.error(`File not found: ${opts.file}`);
        process.exit(1);
      }
      cookies = JSON.parse(fs.readFileSync(opts.file, 'utf-8')) as typeof cookies;
      log(`Loaded ${cookies.length} cookies from ${opts.file}`);
    } else {
      const cdpUrl = `http://localhost:${opts.port}`;
      log(`Connecting to Chrome CDP at ${cdpUrl}...`);

      let browser;
      try {
        browser = await chromium.connectOverCDP(cdpUrl);
      } catch {
        console.error(`\nCannot connect to Chrome CDP on port ${opts.port}.`);
        console.error('\nSteps to enable CDP:');
        console.error('  1. Close ALL Chrome windows');
        console.error(`  2. Run: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=${opts.port}`);
        console.error('  3. Login to FastMoss Pro at https://www.fastmoss.com/vi/dashboard');
        console.error('  4. Run this command again');
        process.exit(1);
      }

      const context = browser.contexts()[0];
      if (!context) {
        console.error('No browser context found');
        process.exit(1);
      }

      const page = context.pages().find((p) => p.url().includes('fastmoss')) || context.pages()[0];
      if (page && !page.url().includes('fastmoss')) {
        log('Navigating to FastMoss VN...');
        await page.goto('https://www.fastmoss.com/vi/e-commerce/search?region=VN', {
          waitUntil: 'domcontentloaded', timeout: 30000,
        }).catch(() => log('Navigation timeout — extracting cookies anyway'));
        await page.waitForTimeout(3000);
      }

      cookies = (await context.cookies('https://www.fastmoss.com')).map((c) => ({
        name: c.name, value: c.value, domain: c.domain, path: c.path,
        expires: c.expires, httpOnly: c.httpOnly, secure: c.secure,
        sameSite: (c.sameSite || 'Lax') as string,
      }));

      log(`Extracted ${cookies.length} cookies from Chrome (including httpOnly)`);
    }

    // Force VN region
    const setOrAdd = (name: string, value: string): void => {
      const existing = cookies.find((c) => c.name === name);
      if (existing) existing.value = value;
      else cookies.push({ name, value, domain: '.fastmoss.com', path: '/', expires: -1, httpOnly: false, secure: false, sameSite: 'Lax' });
    };
    setOrAdd('region', 'VN');
    setOrAdd('NEXT_LOCALE', 'vi');

    saveCookies(
      cookies.map((c) => ({
        ...c,
        sameSite: (c.sameSite as 'Strict' | 'Lax' | 'None' | undefined) ?? 'Lax',
      }))
    );
    log(`Saved ${cookies.length} cookies (region=VN forced)`);
  });

// ── crawl ─────────────────────────────────────────────────────────────────────

program
  .command('crawl')
  .description('Browse FastMoss with Playwright, intercept API responses, sync to PASTR')
  .option('--headed', 'Show browser window (useful for debugging)', false)
  .option('--max-pages <n>', 'Max pages per section', '5')
  .option('--categories <codes>', 'Category codes (comma-separated)', '')
  .option('--endpoint <name>', 'Only crawl one endpoint (saleRank|popRank|newProduct|videoRank|search)')
  .option('--dry-run', 'Print data without syncing to PASTR', false)
  .action(async (opts: { headed: boolean; maxPages: string; categories: string; endpoint?: string; dryRun: boolean }) => {
    const session = await createBrowserContext({ headed: opts.headed });

    try {
      const loggedIn = await ensureLoggedIn(session.page);
      if (!loggedIn) {
        console.error('Not logged in. Run: npx tsx src/index.ts login');
        process.exit(1);
      }

      const catStr = opts.categories.trim();
      const categories = catStr
        ? catStr.split(',').map((s) => parseInt(s.trim(), 10)).filter(Boolean)
        : [];

      log(`Starting crawl — maxPages=${opts.maxPages}, headed=${opts.headed}, dryRun=${opts.dryRun}`);

      const products = await crawlProducts(session.page, {
        maxPages: parseInt(opts.maxPages, 10) || 5,
        categories,
        endpointFilter: opts.endpoint,
      });

      log(`Crawled ${products.length} products`);

      if (opts.dryRun) {
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
    } finally {
      await session.close();
    }
  });

// ── categories ────────────────────────────────────────────────────────────────

program
  .command('categories')
  .description('Crawl and display the FastMoss category tree')
  .option('--headed', 'Show browser window', false)
  .option('--sync', 'Sync categories to PASTR after crawling', false)
  .action(async (opts: { headed: boolean; sync: boolean }) => {
    const session = await createBrowserContext({ headed: opts.headed });

    try {
      const loggedIn = await ensureLoggedIn(session.page);
      if (!loggedIn) {
        console.error('Not logged in. Run: npx tsx src/index.ts login');
        process.exit(1);
      }

      log('Crawling categories...');
      const categories = await crawlCategories(session.page);
      log(`Fetched ${categories.length} categories`);

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
    } finally {
      await session.close();
    }
  });

// ── market ────────────────────────────────────────────────────────────────────

program
  .command('market')
  .description('Crawl market overview from FastMoss')
  .option('--headed', 'Show browser window', false)
  .option('--dry-run', 'Print data without syncing', false)
  .action(async (opts: { headed: boolean; dryRun: boolean }) => {
    const session = await createBrowserContext({ headed: opts.headed });

    try {
      const loggedIn = await ensureLoggedIn(session.page);
      if (!loggedIn) {
        console.error('Not logged in. Run: npx tsx src/index.ts login');
        process.exit(1);
      }

      log('Crawling market overview...');
      const overview = await crawlMarketOverview(session.page);

      if (opts.dryRun) {
        console.log(JSON.stringify(overview, null, 2));
      } else {
        await syncMarket(overview);
      }
    } catch (err) {
      console.error(`Market crawl failed: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    } finally {
      await session.close();
    }
  });

// ── schedule ──────────────────────────────────────────────────────────────────

program
  .command('schedule')
  .description('Start scheduled crawling (categories → products → market)')
  .option('--interval <hours>', 'Crawl interval in hours', '12')
  .option('--headed', 'Show browser window during each crawl run', false)
  .action((opts: { interval: string; headed: boolean }) => {
    const interval = parseInt(opts.interval, 10) || 12;
    if (interval < 1 || interval > 168) {
      console.error('Interval must be between 1 and 168 hours');
      process.exit(1);
    }
    startScheduler({ interval, headed: opts.headed });
  });

program.parse(process.argv);
