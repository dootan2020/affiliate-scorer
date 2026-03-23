// Login flow — supports CDP (Pro) and Playwright (fallback)
import { createBrowserContext, checkAuth, navigateToVN } from '../crawl/browser-context.js';

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] [login] ${message}`);
}

/**
 * CDP mode (preferred): Verify user's Chrome is running with CDP, logged in, and Pro.
 * Playwright mode (fallback): Open headed browser for manual login.
 */
export async function loginFastMoss(): Promise<void> {
  log('Attempting CDP connection to Chrome...');
  const { context, page, close } = await createBrowserContext({ headed: true });

  try {
    await navigateToVN(page);
    const auth = await checkAuth(page);

    if (auth.loggedIn) {
      log(`Logged in! level=${auth.level} expire=${auth.expire}`);
      if (auth.level > 1) {
        log('PRO TIER CONFIRMED. Crawler will get full Pro data.');
      } else {
        log('Free tier (level=1).');
        log('If you have Pro: make sure you logged in via your REAL Chrome (not Playwright).');
        log('Start Chrome with: chrome --remote-debugging-port=9222');
        log('Login FastMoss Pro there, then run this command again.');
      }
    } else {
      log('Not logged in. Please login in the browser window...');
      log('Waiting for login (polls every 2s, timeout 5 min)...');

      const start = Date.now();
      while (Date.now() - start < 300_000) {
        const check = await checkAuth(page);
        if (check.loggedIn) {
          log(`Login detected! level=${check.level} expire=${check.expire}`);
          if (check.level > 1) log('PRO TIER CONFIRMED!');
          else log('Free tier. Use CDP with real Chrome for Pro.');
          break;
        }
        await page.waitForTimeout(2000);
      }
    }
  } finally {
    await close();
    log('Done. Session saved.');
  }
}
