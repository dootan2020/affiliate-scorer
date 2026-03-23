const { chromium } = require('playwright');

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Navigating to fastmoss.com...');
  await page.goto('https://www.fastmoss.com', { timeout: 20000 });
  await page.waitForTimeout(3000);
  console.log('URL:', page.url());

  // Get all visible text buttons/links
  const elements = await page.evaluate(() => {
    const els = document.querySelectorAll('button, a, [role="button"]');
    return Array.from(els)
      .map(el => ({ tag: el.tagName, text: (el.textContent || '').trim().substring(0, 50), href: el.getAttribute('href') || '' }))
      .filter(el => el.text.length > 0)
      .slice(0, 30);
  });
  console.log('\nButtons/Links:');
  elements.forEach(e => console.log('  ' + e.tag + ': "' + e.text + '" href=' + e.href));

  // Get inputs
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(el => ({
      type: el.type, placeholder: el.placeholder, name: el.name, id: el.id, visible: el.offsetParent !== null
    }));
  });
  console.log('\nInputs:', JSON.stringify(inputs, null, 2));

  // Try clicking "Try for Free" or login-like button
  console.log('\nLooking for login trigger...');
  const tryFree = page.locator('text=Try for Free').first();
  const logIn = page.locator('text=Log in').first();
  const signIn = page.locator('text=Sign in').first();

  for (const [name, loc] of [['Try for Free', tryFree], ['Log in', logIn], ['Sign in', signIn]]) {
    try {
      if (await loc.isVisible({ timeout: 1000 })) {
        console.log('Found: ' + name + ' — clicking...');
        await loc.click();
        await page.waitForTimeout(2000);

        // Check for login form after click
        const postInputs = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('input')).map(el => ({
            type: el.type, placeholder: el.placeholder, name: el.name, visible: el.offsetParent !== null
          }));
        });
        console.log('Inputs after click:', JSON.stringify(postInputs, null, 2));
        break;
      }
    } catch (e) {
      // next
    }
  }

  await page.screenshot({ path: 'debug.png' });
  console.log('\nScreenshot saved: debug.png');
  await browser.close();
  console.log('Done.');
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
