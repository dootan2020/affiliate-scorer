const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome',
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const page = await browser.newPage();
  await page.goto('https://www.fastmoss.com', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(5000);

  // Get ALL visible text on page
  const allText = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const texts = [];
    let node;
    while (node = walker.nextNode()) {
      const t = node.textContent.trim();
      if (t.length > 1 && t.length < 50) texts.push(t);
    }
    return [...new Set(texts)].slice(0, 50);
  });
  console.log('Visible text on page:');
  allText.forEach(t => console.log('  "' + t + '"'));

  // Find anything with "đăng" or "log" or "sign" or "nhập"
  const loginRelated = await page.evaluate(() => {
    const els = document.querySelectorAll('*');
    const results = [];
    for (const el of els) {
      const text = (el.textContent || '').trim();
      if (text.length > 0 && text.length < 30 &&
          (text.toLowerCase().includes('đăng') || text.toLowerCase().includes('log') ||
           text.toLowerCase().includes('sign') || text.toLowerCase().includes('nhập') ||
           text.toLowerCase().includes('login'))) {
        results.push({ tag: el.tagName, text, cls: el.className?.toString?.()?.substring(0, 60) || '' });
      }
    }
    return results.slice(0, 15);
  });
  console.log('\nLogin-related elements:');
  loginRelated.forEach(e => console.log('  ' + e.tag + ': "' + e.text + '" class=' + e.cls));

  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
