// Playwright headless login for FastMoss (email + password)
import { chromium } from 'playwright';
import type { Cookie } from '../types.js';

const FASTMOSS_URL = 'https://www.fastmoss.com';
const LOGIN_TIMEOUT = 30_000;

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] [login] ${message}`);
}

export async function loginFastMoss(email: string, password: string): Promise<Cookie[]> {
  // FastMoss uses Tencent Cloud EdgeOne WAF — headless Chromium gets HTTP 567.
  // Must use headed mode with real Chrome channel to bypass bot detection.
  log('Launching Chrome (headed — required to bypass WAF)...');
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome', // Use installed Chrome, not bundled Chromium
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const context = await browser.newContext({
    locale: 'en-US',
    timezoneId: 'Asia/Ho_Chi_Minh',
  });
  const page = await context.newPage();

  try {
    log('Navigating to FastMoss (English)...');
    await page.goto(`${FASTMOSS_URL}/en`, { waitUntil: 'networkidle', timeout: 60000 });

    // Wait for WAF challenge to resolve + page JS to render
    await page.waitForTimeout(5000);
    log(`Page loaded. URL: ${page.url()}`);

    // Take debug screenshot
    await page.screenshot({ path: 'data/debug-login.png' }).catch(() => {});

    // Find and click the "Log in" span in top navbar
    log('Looking for login button...');
    const loginBtn = page.locator('span:text-is("Log in")').first();
    if (await loginBtn.isVisible({ timeout: 5000 })) {
      await loginBtn.click();
      log('Clicked "Log in" button');
      await page.waitForTimeout(3000);
      // Take screenshot after login modal opens
      await page.screenshot({ path: 'data/debug-login-modal.png' }).catch(() => {});
    } else {
      log('Login button not visible — may already be on login form');
    }

    // Fill email field
    log('Filling email field...');
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="Email"]',
      'input[placeholder*="邮箱"]',
      'input[autocomplete="email"]',
      'input[autocomplete="username"]',
      'input[type="text"]', // FastMoss may use plain text input
    ];

    let emailFilled = false;
    for (const selector of emailSelectors) {
      try {
        const el = page.locator(selector).first();
        if (await el.isVisible({ timeout: 3000 })) {
          await el.fill(email);
          emailFilled = true;
          log(`Email filled using selector: ${selector}`);
          break;
        }
      } catch {
        // try next selector
      }
    }

    if (!emailFilled) {
      throw new Error('Could not find email input field. FastMoss login page structure may have changed.');
    }

    // Fill password field
    log('Filling password field...');
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[placeholder*="password" i]',
      'input[placeholder*="Password"]',
      'input[placeholder*="密码"]',
      'input[autocomplete="current-password"]',
    ];

    let passwordFilled = false;
    for (const selector of passwordSelectors) {
      try {
        const el = page.locator(selector).first();
        if (await el.isVisible({ timeout: 3000 })) {
          await el.fill(password);
          passwordFilled = true;
          log(`Password filled using selector: ${selector}`);
          break;
        }
      } catch {
        // try next selector
      }
    }

    if (!passwordFilled) {
      throw new Error('Could not find password input field. FastMoss login page structure may have changed.');
    }

    // Click submit
    log('Clicking submit button...');
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Log in")',
      'button:has-text("Login")',
      'button:has-text("Sign in")',
      'button:has-text("登录")',
      '.login-submit',
      '[data-testid="login-submit"]',
    ];

    let submitted = false;
    for (const selector of submitSelectors) {
      try {
        const el = page.locator(selector).first();
        if (await el.isVisible({ timeout: 2000 })) {
          await el.click();
          submitted = true;
          log(`Clicked submit with selector: ${selector}`);
          break;
        }
      } catch {
        // try next selector
      }
    }

    if (!submitted) {
      // Try pressing Enter on password field as fallback
      log('Submit button not found, pressing Enter on password field...');
      for (const selector of passwordSelectors) {
        try {
          const el = page.locator(selector).first();
          if (await el.isVisible({ timeout: 1000 })) {
            await el.press('Enter');
            submitted = true;
            break;
          }
        } catch {
          // ignore
        }
      }
    }

    if (!submitted) {
      throw new Error('Could not submit login form.');
    }

    // Wait for navigation or dashboard indicator
    log('Waiting for login to complete...');
    await Promise.race([
      page.waitForURL('**/dashboard**', { timeout: LOGIN_TIMEOUT }),
      page.waitForURL('**/home**', { timeout: LOGIN_TIMEOUT }),
      page.waitForURL('**fastmoss.com/', { timeout: LOGIN_TIMEOUT }),
      page.waitForSelector('.user-avatar, .user-info, [class*="avatar"], [class*="user-menu"]', {
        timeout: LOGIN_TIMEOUT,
      }),
    ]).catch(() => {
      log('Warning: Could not detect successful login redirect. Attempting to extract cookies anyway.');
    });

    await page.waitForTimeout(2000);

    // Check for login error
    const errorSelectors = [
      '.error-message',
      '.login-error',
      '[class*="error"]',
      'text=Invalid password',
      'text=密码错误',
      'text=账号或密码错误',
    ];

    for (const selector of errorSelectors) {
      try {
        const el = page.locator(selector).first();
        if (await el.isVisible({ timeout: 1000 })) {
          const errorText = await el.textContent();
          throw new Error(`Login failed: ${errorText ?? 'Invalid credentials'}`);
        }
      } catch (err) {
        if (err instanceof Error && err.message.startsWith('Login failed:')) {
          throw err;
        }
        // ignore "element not found" errors from selector checks
      }
    }

    const cookies = await context.cookies();
    log(`Login successful. Extracted ${cookies.length} cookies.`);

    // Cast playwright cookies to our Cookie type
    return cookies.map((c) => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path,
      expires: c.expires,
      httpOnly: c.httpOnly,
      secure: c.secure,
      sameSite: c.sameSite as Cookie['sameSite'],
    }));
  } finally {
    await browser.close();
    log('Browser closed.');
  }
}
