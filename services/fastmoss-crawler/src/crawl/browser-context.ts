// Browser context — connects to user's real Chrome via CDP or launches Playwright
import { chromium } from 'playwright';
import type { Browser, BrowserContext, Page } from 'playwright';

const USER_DATA_DIR = './data/browser-profile';
const FASTMOSS_URL = 'https://www.fastmoss.com';
const DEFAULT_CDP_PORT = 9222;

export type { BrowserContext, Page };

export interface BrowserSession {
  context: BrowserContext;
  page: Page;
  close: () => Promise<void>;
}

function log(msg: string): void {
  console.log(`[${new Date().toISOString()}] [browser] ${msg}`);
}

/**
 * Connect to user's real Chrome via CDP (preferred — gets Pro tier).
 * Falls back to Playwright persistent context if CDP not available.
 */
export async function createBrowserContext(
  options: { headed?: boolean; cdpPort?: number } = {}
): Promise<BrowserSession> {
  const port = options.cdpPort ?? DEFAULT_CDP_PORT;

  // Try CDP connection first
  try {
    const cdpUrl = `http://localhost:${port}`;
    log(`Connecting to Chrome CDP at ${cdpUrl}...`);
    const browser = await chromium.connectOverCDP(cdpUrl, { timeout: 5000 });
    const context = browser.contexts()[0];
    if (!context) throw new Error('No browser context');

    // Use existing page or create new tab
    let page = context.pages().find(p => p.url().includes('fastmoss'));
    if (!page) {
      page = await context.newPage();
    }

    log(`Connected to Chrome CDP (${context.pages().length} tabs)`);
    return {
      context,
      page,
      close: async () => {
        // Don't close user's Chrome — just disconnect
        // Close any tabs we created (except the one user had open)
        log('Disconnecting from Chrome (browser stays open)');
      },
    };
  } catch {
    log(`CDP not available on port ${port} — falling back to Playwright`);
  }

  // Fallback: Playwright persistent context
  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: !options.headed,
    channel: 'chrome',
    args: ['--disable-blink-features=AutomationControlled'],
    viewport: { width: 1280, height: 800 },
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
  });

  const page = context.pages()[0] || (await context.newPage());
  log('Launched Playwright persistent context (free tier — use CDP for Pro)');
  return {
    context,
    page,
    close: async () => { await context.close(); },
  };
}

/**
 * Check login + tier. Returns { loggedIn, level, expire }.
 */
export async function checkAuth(page: Page): Promise<{ loggedIn: boolean; level: number; expire: number }> {
  if (!page.url().includes('fastmoss.com')) {
    await navigateToVN(page);
  }

  const result = await page.evaluate(async () => {
    // Check localStorage first
    let uid = 0;
    try {
      const store = localStorage.getItem('auth-store');
      if (store) {
        const parsed = JSON.parse(store) as { state?: { userInfo?: { uid?: number } } };
        uid = parsed?.state?.userInfo?.uid ?? 0;
      }
    } catch { /* ignore */ }

    if (uid === 0) return { loggedIn: false, level: 0, expire: 0 };

    // Check tier via API
    try {
      const res = await fetch('/api/user/index/userInfo?region=VN&_time=' + Math.floor(Date.now() / 1000) + '&cnonce=99999');
      const j = await res.json() as { data?: { level?: number; expire_at?: number } };
      return {
        loggedIn: true,
        level: j.data?.level ?? 0,
        expire: j.data?.expire_at ?? 0,
      };
    } catch {
      return { loggedIn: uid > 0, level: 0, expire: 0 };
    }
  });

  return result;
}

/** Backwards compat */
export async function ensureLoggedIn(page: Page): Promise<boolean> {
  const auth = await checkAuth(page);
  return auth.loggedIn;
}

export async function navigateToVN(page: Page): Promise<void> {
  await page.goto(`${FASTMOSS_URL}/vi/e-commerce/search?region=VN`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });
  await page.waitForTimeout(3000);
}

export { FASTMOSS_URL };
