// Browser context — Playwright persistent profile with Chrome channel
// Note: Chrome's default user-data-dir CANNOT be used with Playwright (Chrome blocks it).
// We use a separate profile in data/browser-profile/ — user must login there once.
import { chromium } from 'playwright';
import type { BrowserContext, Page } from 'playwright';

const USER_DATA_DIR = './data/browser-profile';
const FASTMOSS_URL = 'https://www.fastmoss.com';

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
 * Launch Playwright with persistent Chrome profile.
 * Uses `channel: 'chrome'` to run the installed Chrome binary (bypasses Tencent WAF).
 * Session persists in data/browser-profile/ across runs.
 */
export async function createBrowserContext(
  options: { headed?: boolean } = {}
): Promise<BrowserSession> {
  log(`Launching Chrome (${options.headed ? 'headed' : 'headless'})...`);

  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: !options.headed,
    channel: 'chrome',
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-first-run',
      '--no-default-browser-check',
    ],
    viewport: { width: 1280, height: 800 },
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
  });

  const page = context.pages()[0] || (await context.newPage());
  return {
    context,
    page,
    close: async () => { await context.close(); },
  };
}

/**
 * Check login + tier. Returns { loggedIn, level }.
 */
export async function checkAuth(page: Page): Promise<{ loggedIn: boolean; level: number }> {
  if (!page.url().includes('fastmoss.com')) {
    await navigateToVN(page);
  }

  return page.evaluate(async () => {
    // Check localStorage
    let uid = 0;
    try {
      const store = localStorage.getItem('auth-store');
      if (store) {
        const parsed = JSON.parse(store) as { state?: { userInfo?: { uid?: number } } };
        uid = parsed?.state?.userInfo?.uid ?? 0;
      }
    } catch { /* ignore */ }

    if (uid === 0) return { loggedIn: false, level: 0 };

    // Check tier
    try {
      const res = await fetch('/api/user/index/userInfo?region=VN&_time=' + Math.floor(Date.now() / 1000) + '&cnonce=99999');
      const j = await res.json() as { data?: { level?: number } };
      return { loggedIn: true, level: j.data?.level ?? 0 };
    } catch {
      return { loggedIn: uid > 0, level: 0 };
    }
  });
}

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
