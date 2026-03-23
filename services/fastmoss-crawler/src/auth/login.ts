// Playwright login for FastMoss — uses real Chrome profile to inherit Pro session
import { chromium } from 'playwright';
import type { Cookie } from '../types.js';

const FASTMOSS_URL = 'https://www.fastmoss.com';
const LOGIN_TIMEOUT = 30_000;

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] [login] ${message}`);
}

/**
 * Login to FastMoss using the user's real Chrome profile.
 * This inherits Pro subscription session cookies that a fresh Playwright context would miss.
 * IMPORTANT: Close all Chrome windows before calling this function.
 */
export async function loginFastMoss(email: string, password: string): Promise<Cookie[]> {
  // Two modes:
  // 1. CHROME_USER_DATA set → persistent context with real profile (inherits Pro session)
  // 2. Default → fresh context (login with email+password, may lose Pro tier)
  const chromeUserData = process.env.CHROME_USER_DATA || '';

  let context: Awaited<ReturnType<typeof chromium.launchPersistentContext>>;
  let usePersistent = false;

  if (chromeUserData) {
    log(`Launching Chrome with real profile: ${chromeUserData}`);
    log('IMPORTANT: Close all Chrome windows before running login!');
    context = await chromium.launchPersistentContext(chromeUserData, {
      headless: false,
      channel: 'chrome',
      args: ['--disable-blink-features=AutomationControlled', '--profile-directory=Default'],
    });
    usePersistent = true;
  } else {
    log('Launching Chrome (fresh context — set CHROME_USER_DATA for Pro tier)...');
    const browser = await chromium.launch({
      headless: false,
      channel: 'chrome',
      args: ['--disable-blink-features=AutomationControlled'],
    });
    context = Object.assign(await browser.newContext({ locale: 'en-US', timezoneId: 'Asia/Ho_Chi_Minh' }), {
      close: async () => { await browser.close(); },
    }) as unknown as Awaited<ReturnType<typeof chromium.launchPersistentContext>>;
  }

  const page = context.pages()[0] || await context.newPage();

  try {
    // Login via English page (stable selectors), then switch to VN for region cookies
    log('Navigating to FastMoss (English for login)...');
    await page.goto(`${FASTMOSS_URL}/en`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);
    log(`Page loaded. URL: ${page.url()}`);

    // Check if already logged in
    const isLoggedIn = await page.evaluate(() => {
      try {
        const store = localStorage.getItem('auth-store');
        if (store) {
          const parsed = JSON.parse(store);
          return (parsed?.state?.userInfo?.uid ?? 0) > 0;
        }
      } catch { /* ignore */ }
      return false;
    });

    if (isLoggedIn) {
      log('Already logged in — skipping email/password');
    } else {
      await performLogin(page, email, password);
    }

    // Navigate to VN page for correct cookies
    if (!page.url().includes('region=VN')) {
      await page.goto(`${FASTMOSS_URL}/vi/e-commerce/search?region=VN`, {
        waitUntil: 'networkidle', timeout: 30000,
      }).catch(() => log('Warning: VN navigation timeout'));
      await page.waitForTimeout(2000);
    }

    const cookies = await context.cookies();
    forceVNCookies(cookies);

    // CRITICAL: Switch to VN region — subscription is per-region (Pro VN ≠ Pro US)
    log('Switching to Vietnam region to activate VN subscription...');
    await context.addCookies([
      { name: 'region', value: 'VN', domain: '.fastmoss.com', path: '/' },
      { name: 'NEXT_LOCALE', value: 'vi', domain: '.fastmoss.com', path: '/' },
    ]);
    await page.goto(`${FASTMOSS_URL}/vi/e-commerce/search?region=VN`, {
      waitUntil: 'domcontentloaded', timeout: 30000,
    }).catch(() => log('Warning: VN navigation timeout'));
    await page.waitForTimeout(3000);

    // Verify subscription tier
    try {
      const tierInfo = await page.evaluate(async () => {
        const res = await fetch('/api/user/index/userInfo?region=VN&_time=' + Math.floor(Date.now()/1000) + '&cnonce=99999');
        const j = await res.json() as { data?: { level?: number; expire_at?: number; email?: string; region?: string } };
        return j.data;
      });
      log(`Tier: level=${tierInfo?.level} expire=${tierInfo?.expire_at} region=${tierInfo?.region} email=${tierInfo?.email}`);
      if (tierInfo?.level && tierInfo.level > 1) {
        log('PRO TIER CONFIRMED!');
      } else {
        log('Free tier (level=1). If you have Pro VN subscription, contact FastMoss support.');
      }
    } catch {
      log('Could not verify tier (non-fatal)');
    }

    log(`Extracted ${cookies.length} cookies (region=VN forced).`);
    return cookies.map(castCookie);
  } finally {
    await context.close();
    log('Browser closed.');
  }
}

async function performLogin(page: Awaited<ReturnType<typeof chromium.launchPersistentContext>>['pages'][0], email: string, password: string): Promise<void> {
  // Click login button
  log('Looking for login button...');
  for (const text of ['Log in', 'Đăng nhập', 'Login', 'Sign in']) {
    const btn = page.locator(`span:text-is("${text}")`).first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      log(`Clicked "${text}" button`);
      await page.waitForTimeout(3000);
      break;
    }
  }

  // Fill email
  log('Filling email...');
  const emailFilled = await fillFirst(page, [
    'input[type="email"]', 'input[placeholder*="email" i]',
    'input[autocomplete="email"]', 'input[type="text"]',
  ], email);
  if (!emailFilled) throw new Error('Could not find email input field');

  // Fill password
  log('Filling password...');
  const pwFilled = await fillFirst(page, [
    'input[type="password"]', 'input[autocomplete="current-password"]',
  ], password);
  if (!pwFilled) throw new Error('Could not find password input field');

  // Submit
  log('Submitting...');
  const submitted = await clickFirst(page, [
    'button[type="submit"]', 'button:has-text("Log in")',
    'button:has-text("Đăng nhập")', 'button:has-text("Sign in")',
  ]);
  if (!submitted) {
    // Fallback: press Enter on password field
    await page.locator('input[type="password"]').first().press('Enter').catch(() => {});
  }

  // Wait for login completion
  log('Waiting for login...');
  await Promise.race([
    page.waitForURL('**/dashboard**', { timeout: LOGIN_TIMEOUT }),
    page.waitForURL('**/search**', { timeout: LOGIN_TIMEOUT }),
    page.waitForURL('**fastmoss.com/', { timeout: LOGIN_TIMEOUT }),
  ]).catch(() => log('Warning: login redirect not detected'));
  await page.waitForTimeout(2000);
}

async function fillFirst(page: Awaited<ReturnType<typeof chromium.launchPersistentContext>>['pages'][0], selectors: string[], value: string): Promise<boolean> {
  for (const sel of selectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 2000 })) {
        await el.fill(value);
        log(`Filled using: ${sel}`);
        return true;
      }
    } catch { /* next */ }
  }
  return false;
}

async function clickFirst(page: Awaited<ReturnType<typeof chromium.launchPersistentContext>>['pages'][0], selectors: string[]): Promise<boolean> {
  for (const sel of selectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 2000 })) {
        await el.click();
        log(`Clicked: ${sel}`);
        return true;
      }
    } catch { /* next */ }
  }
  return false;
}

function forceVNCookies(cookies: Array<{ name: string; value: string; domain: string; path: string; expires: number; httpOnly: boolean; secure: boolean; sameSite: string }>): void {
  const set = (name: string, value: string) => {
    const existing = cookies.find(c => c.name === name);
    if (existing) existing.value = value;
    else cookies.push({ name, value, domain: '.fastmoss.com', path: '/', expires: -1, httpOnly: false, secure: false, sameSite: 'Lax' });
  };
  set('region', 'VN');
  set('NEXT_LOCALE', 'vi');
}

function castCookie(c: { name: string; value: string; domain: string; path: string; expires: number; httpOnly: boolean; secure: boolean; sameSite: string }): Cookie {
  return {
    name: c.name, value: c.value, domain: c.domain, path: c.path,
    expires: c.expires, httpOnly: c.httpOnly, secure: c.secure,
    sameSite: c.sameSite as Cookie['sameSite'],
  };
}
