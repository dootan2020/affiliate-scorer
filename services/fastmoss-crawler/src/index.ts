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

// ── import-cookies ────────────────────────────────────────────────────────────
// Extract cookies from Chrome via CDP (Chrome DevTools Protocol).
// Steps: 1) Close Chrome, 2) Reopen with --remote-debugging-port=9222,
//        3) Login FastMoss Pro, 4) Run this command.
// CDP gives ALL cookies including httpOnly — no DPAPI/v20 decryption needed.

program
  .command('import-cookies')
  .description('Import Pro cookies from Chrome via CDP (port 9222)')
  .option('--port <port>', 'Chrome CDP port', '9222')
  .option('--file <path>', 'Or import from JSON file instead of CDP')
  .action(async (opts: { port: string; file?: string }) => {
    const { chromium } = await import('playwright');
    let cookies: Array<{ name: string; value: string; domain: string; path: string; expires: number; httpOnly: boolean; secure: boolean; sameSite: string }>;

    if (opts.file) {
      // File-based import (fallback)
      const fs = await import('fs');
      if (!fs.existsSync(opts.file)) {
        console.error(`File not found: ${opts.file}`);
        process.exit(1);
      }
      cookies = JSON.parse(fs.readFileSync(opts.file, 'utf-8'));
      log(`Loaded ${cookies.length} cookies from ${opts.file}`);
    } else {
      // CDP-based import (preferred — gets httpOnly cookies)
      const cdpUrl = `http://localhost:${opts.port}`;
      log(`Connecting to Chrome CDP at ${cdpUrl}...`);
      log('(Chrome must be running with --remote-debugging-port=' + opts.port + ')');

      let browser;
      try {
        browser = await chromium.connectOverCDP(cdpUrl);
      } catch {
        console.error(`\nCannot connect to Chrome CDP on port ${opts.port}.`);
        console.error('\nSteps to enable CDP:');
        console.error('  1. Close ALL Chrome windows');
        console.error('  2. Open terminal and run:');
        console.error(`     "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=${opts.port}`);
        console.error('  3. Login to FastMoss Pro at https://www.fastmoss.com/vi/dashboard');
        console.error('  4. Run this command again');
        process.exit(1);
      }

      const context = browser.contexts()[0];
      if (!context) {
        console.error('No browser context found');
        process.exit(1);
      }

      // Navigate to FastMoss VN to ensure cookies are set
      const page = context.pages().find(p => p.url().includes('fastmoss')) || context.pages()[0];
      if (page && !page.url().includes('fastmoss')) {
        log('Navigating to FastMoss VN...');
        await page.goto('https://www.fastmoss.com/vi/e-commerce/search?region=VN', {
          waitUntil: 'domcontentloaded', timeout: 30000,
        }).catch(() => log('Navigation timeout — extracting cookies anyway'));
        await page.waitForTimeout(3000);
      }

      // Extract ALL cookies (including httpOnly)
      cookies = (await context.cookies('https://www.fastmoss.com')).map(c => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path,
        expires: c.expires,
        httpOnly: c.httpOnly,
        secure: c.secure,
        sameSite: (c.sameSite || 'Lax') as string,
      }));

      log(`Extracted ${cookies.length} cookies from Chrome (including httpOnly)`);

      // Don't close — it's the user's Chrome
    }

    // Force VN region
    const setOrAdd = (name: string, value: string) => {
      const existing = cookies.find(c => c.name === name);
      if (existing) existing.value = value;
      else cookies.push({ name, value, domain: '.fastmoss.com', path: '/', expires: -1, httpOnly: false, secure: false, sameSite: 'Lax' });
    };
    setOrAdd('region', 'VN');
    setOrAdd('NEXT_LOCALE', 'vi');

    // Save encrypted
    saveCookies(cookies);
    log(`Saved ${cookies.length} cookies (region=VN forced)`);

    // Verify tier
    const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    try {
      const res = await fetch('https://www.fastmoss.com/api/user/index/userInfo?region=VN&_time=' + Math.floor(Date.now() / 1000) + '&cnonce=12345678', {
        headers: { Cookie: cookieStr, 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', Accept: 'application/json' },
      });
      const json = await res.json() as { code: string | number; data?: { level?: number; expire_at?: number; email?: string; region?: string } };
      if (json.code === 'MSG_30001') {
        log('WARNING: Not logged in (MSG_30001). Make sure you are logged into FastMoss in Chrome.');
      } else {
        const d = json.data;
        log(`Tier: level=${d?.level} | expire=${d?.expire_at} | region=${d?.region} | email=${d?.email}`);
        if (d?.level && d.level > 1) {
          log('PRO TIER CONFIRMED! Crawler will get full data.');
        } else {
          log('Free tier detected. If you have Pro, try browsing fastmoss.com/vi/account/center in Chrome first.');
        }
      }
    } catch (err) {
      log(`Could not verify tier: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

// ── crawl ─────────────────────────────────────────────────────────────────────

program
  .command('crawl')
  .description('Crawl product data from FastMoss and sync to PASTR')
  .option(
    '--categories <codes>',
    'Category codes (comma-separated)',
    ''
  )
  .option('--max-pages <n>', 'Max pages per endpoint', '10')
  .option('--dry-run', 'Print data without syncing to PASTR', false)
  .option(
    '--endpoint <name>',
    'Specific endpoint (saleRank|popRank|newProduct|videoRank)'
  )
  .action(async (opts: { categories: string; maxPages: string; dryRun: boolean; endpoint?: string }) => {
    const catStr = opts.categories.trim();
    const options: CrawlOptions = {
      // Empty = no filter (crawl all VN products, ranking endpoints don't return category_id)
      categories: catStr ? catStr.split(',').map((s) => parseInt(s.trim(), 10)).filter(Boolean) : [],
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
