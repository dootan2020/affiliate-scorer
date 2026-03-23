// FastMoss login via persistent Playwright context — user logs in manually,
// session is saved in data/browser-profile and reused on every crawl run.
import type { Page } from 'playwright';
import {
  createBrowserContext,
  ensureLoggedIn,
  navigateToVN,
} from '../crawl/browser-context.js';

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] [login] ${message}`);
}

/**
 * Open a headed Chrome browser and wait for the user to log in manually.
 * Once logged in, the session is persisted in `data/browser-profile/` and
 * will be reused automatically by all future headless crawl runs.
 */
export async function loginFastMoss(): Promise<void> {
  log('Opening browser for manual login...');
  log('Session will be saved in: ./data/browser-profile/');

  const { context, page } = await createBrowserContext({ headed: true });

  try {
    await navigateToVN(page);

    const alreadyLoggedIn = await ensureLoggedIn(page);

    if (alreadyLoggedIn) {
      log('Already logged in — session is still valid.');
      const tier = await checkTier(page);
      log(`Tier: level=${tier.level} | expire=${tier.expire}`);
      if (tier.level > 1) {
        log('PRO TIER CONFIRMED. Ready to crawl.');
      } else {
        log('Free tier (level=1). Make sure your Pro subscription is active for VN region.');
      }
    } else {
      log('Please log in inside the browser window that just opened.');
      log('After login, press Enter in this terminal to save the session and continue...');

      // Poll localStorage every 2 s, timeout after 5 min
      await waitForLogin(page, 300_000);

      // Navigate to VN page to trigger region cookies
      await navigateToVN(page);

      const tier = await checkTier(page);
      log(`Login successful! Tier: level=${tier.level} | expire=${tier.expire}`);
      if (tier.level > 1) {
        log('PRO TIER CONFIRMED. Headless crawl will now get Pro data.');
      } else {
        log('Warning: free tier detected. Pro data requires an active VN Pro subscription.');
      }
    }
  } finally {
    await context.close();
    log('Browser closed. Session saved — run "crawl" to start headless data collection.');
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function waitForLogin(page: Page, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await ensureLoggedIn(page)) return;
    await page.waitForTimeout(2000);
  }
  throw new Error('Login timeout (5 min). Please try again.');
}

interface TierInfo {
  level: number;
  expire: number;
}

async function checkTier(page: Page): Promise<TierInfo> {
  return page.evaluate(async (): Promise<{ level: number; expire: number }> => {
    const time = Math.floor(Date.now() / 1000);
    const res = await fetch(
      `/api/user/index/userInfo?region=VN&_time=${time}&cnonce=99999`
    );
    const j = (await res.json()) as {
      data?: { level?: number; expire_at?: number };
    };
    return {
      level: j.data?.level ?? 0,
      expire: j.data?.expire_at ?? 0,
    };
  });
}
