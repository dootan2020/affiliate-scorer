// Playwright headless login for FastMoss (email + password)
import { chromium } from 'playwright';
import type { Cookie } from '../types.js';

const FASTMOSS_URL = 'https://www.fastmoss.com';
const LOGIN_TIMEOUT = 30_000;

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] [login] ${message}`);
}

export async function loginFastMoss(email: string, password: string): Promise<Cookie[]> {
  log('Launching headless browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
  });
  const page = await context.newPage();

  try {
    log(`Navigating to ${FASTMOSS_URL} ...`);
    await page.goto(FASTMOSS_URL, { waitUntil: 'domcontentloaded', timeout: LOGIN_TIMEOUT });

    // Wait for the page to settle
    await page.waitForTimeout(2000);

    // Find and click the login/sign-in button to open modal
    log('Looking for login button...');
    const loginButtonSelectors = [
      'text=Log in',
      'text=Login',
      'text=Sign in',
      'text=登录',
      '[data-testid="login-btn"]',
      'button:has-text("Log")',
      'a:has-text("Log in")',
      '.login-btn',
      '.sign-in',
    ];

    let loginButtonFound = false;
    for (const selector of loginButtonSelectors) {
      try {
        const el = page.locator(selector).first();
        if (await el.isVisible({ timeout: 2000 })) {
          await el.click();
          loginButtonFound = true;
          log(`Clicked login button with selector: ${selector}`);
          await page.waitForTimeout(1500);
          break;
        }
      } catch {
        // try next selector
      }
    }

    if (!loginButtonFound) {
      log('Login button not found, checking if already on login page or modal...');
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
