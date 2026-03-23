// Playwright persistent browser context — shared across all crawl operations
import { chromium } from 'playwright';
import type { BrowserContext, Page } from 'playwright';

const USER_DATA_DIR = './data/browser-profile';
const FASTMOSS_URL = 'https://www.fastmoss.com';

export type { BrowserContext, Page };

export interface BrowserSession {
  context: BrowserContext;
  page: Page;
}

/**
 * Launch Playwright using a persistent Chrome profile so the login session
 * (and Pro subscription context) survives across runs.
 *
 * Using `channel: 'chrome'` to bypass Tencent WAF — headless Chromium is
 * detected and blocked; real Chrome is not.
 */
export async function createBrowserContext(
  options: { headed?: boolean } = {}
): Promise<BrowserSession> {
  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: !options.headed,
    channel: 'chrome',
    args: ['--disable-blink-features=AutomationControlled'],
    viewport: { width: 1280, height: 800 },
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
  });

  const page = context.pages()[0] || (await context.newPage());
  return { context, page };
}

/**
 * Check if the current page session has a valid login.
 * Navigates to FastMoss first if needed (localStorage requires a page context).
 */
export async function ensureLoggedIn(page: Page): Promise<boolean> {
  // Must be on a FastMoss page to read localStorage
  if (!page.url().includes('fastmoss.com')) {
    await navigateToVN(page);
  }

  const isLoggedIn = await page.evaluate(() => {
    try {
      const store = localStorage.getItem('auth-store');
      if (store) {
        const parsed = JSON.parse(store) as { state?: { userInfo?: { uid?: number } } };
        return (parsed?.state?.userInfo?.uid ?? 0) > 0;
      }
    } catch { /* ignore */ }
    return false;
  });
  return isLoggedIn;
}

/**
 * Navigate to the FastMoss VN search page (triggers region + auth cookies).
 */
export async function navigateToVN(page: Page): Promise<void> {
  await page.goto(`${FASTMOSS_URL}/vi/e-commerce/search?region=VN`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });
  await page.waitForTimeout(3000);
}

export { FASTMOSS_URL };
