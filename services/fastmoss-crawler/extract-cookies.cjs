// Extract FastMoss cookies from the user's real Chrome browser
// Usage: node extract-cookies.cjs
// Requires: Chrome must be CLOSED before running (SQLite lock)

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const CHROME_USER_DATA = path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'User Data');

(async () => {
  console.log('Launching Chromium with your Chrome profile...');
  console.log('Chrome profile path:', CHROME_USER_DATA);

  if (!fs.existsSync(CHROME_USER_DATA)) {
    console.error('Chrome User Data not found at:', CHROME_USER_DATA);
    process.exit(1);
  }

  // Launch with real Chrome user data dir — inherits login session
  const browser = await chromium.launchPersistentContext(CHROME_USER_DATA, {
    headless: false,  // Must be headed to pass WAF
    channel: 'chrome', // Use installed Chrome, not Chromium
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const page = browser.pages()[0] || await browser.newPage();
  console.log('Navigating to FastMoss...');
  await page.goto('https://www.fastmoss.com/dashboard', { timeout: 30000 });
  await page.waitForTimeout(5000);

  console.log('URL:', page.url());

  // Check if logged in
  const cookies = await browser.cookies('https://www.fastmoss.com');
  const fpVisid = cookies.find(c => c.name === 'fp_visid');

  if (!fpVisid) {
    console.log('Not logged in. Please log in manually in the browser window...');
    console.log('Waiting for login (max 2 minutes)...');
    await page.waitForURL('**/dashboard**', { timeout: 120000 }).catch(() => {});
    await page.waitForTimeout(3000);
  }

  const allCookies = await browser.cookies('https://www.fastmoss.com');
  console.log('Cookies found:', allCookies.length);
  allCookies.forEach(c => console.log('  ' + c.name + '=' + c.value.substring(0, 20) + '...'));

  // Save raw cookies JSON for the crawler to encrypt
  fs.writeFileSync('data/raw-cookies.json', JSON.stringify(allCookies, null, 2));
  console.log('\nSaved to data/raw-cookies.json');
  console.log('Now run: npx tsx src/index.ts import-cookies');

  await browser.close();
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
