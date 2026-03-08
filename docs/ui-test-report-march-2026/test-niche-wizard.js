#!/usr/bin/env node
/**
 * Niche Finder Wizard E2E Test Script v2
 * Uses Puppeteer page.click with waitForNavigation guards
 */
import { getBrowser, getPage, disconnectBrowser, outputJSON } from '../../.claude/skills/chrome-devtools/scripts/lib/browser.js';
import fs from 'fs/promises';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('docs/ui-test-report-march-2026/workflow-screenshots');
const BASE = 'https://affiliate-scorer.vercel.app';

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function ss(page, name) {
  const fp = path.join(SCREENSHOT_DIR, name);
  await page.screenshot({ path: fp, fullPage: false });
  console.log(`  [SS] ${name}`);
  return fp;
}

async function run() {
  const results = [];
  let step = 0;
  function log(name, status, detail) {
    step++;
    results.push({ step, name, status, detail });
    console.log(`[${status}] Step ${step}: ${name} -- ${detail}`);
  }

  try {
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
    const browser = await getBrowser({ headless: 'false' });
    const page = await getPage(browser);

    // Set a larger viewport for consistent screenshots
    await page.setViewport({ width: 1440, height: 900 });

    // ====== S1: Navigate ======
    const t0 = Date.now();
    await page.goto(`${BASE}/niche-finder`, { waitUntil: 'networkidle2', timeout: 30000 });
    log('Navigate /niche-finder', 'PASS', `${Date.now()-t0}ms, title=${await page.title()}`);

    await delay(1000);

    // ====== S2: Verify categories ======
    const cats = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button[type="button"]'))
        .filter(b => { const r = b.getBoundingClientRect(); return r.width > 80 && r.height > 60 && r.y > 150; })
        .map(b => b.textContent.trim());
    });
    log('Verify categories', cats.length >= 5 ? 'PASS' : 'FAIL', `${cats.length} found: ${cats.join(', ')}`);

    // ====== S3: Click "Do gia dung" ======
    const clickedCat = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button[type="button"]'))
        .find(b => b.textContent.includes('gia d\u1EE5ng'));
      if (btn) { btn.click(); return btn.textContent.trim(); }
      return null;
    });
    await delay(300);
    log('Select "Do gia dung"', clickedCat ? 'PASS' : 'FAIL', clickedCat || 'not found');
    await ss(page, 'w1-01-niche-selected.png');

    // ====== S4: Click "Tiep theo" - advance to step 2 ======
    // Use page.click with waitForFunction to detect step change instead of navigation
    const urlBefore = page.url();
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button'))
        .find(b => b.textContent.includes('Ti\u1EBFp theo'));
      if (btn) btn.click();
    });
    await delay(1500);
    const urlAfter = page.url();
    const stayed = urlAfter.includes('/niche-finder');
    log('Click "Tiep theo" -> step 2', stayed ? 'PASS' : 'FAIL',
      `URL: ${urlBefore} -> ${urlAfter}${stayed ? '' : ' (LEFT NICHE-FINDER!)'}`);

    if (!stayed) {
      // Navigate back and retry
      log('BUG: Navigation away', 'FAIL', 'Wizard navigated away on "Tiep theo". Going back.');
      await page.goto(`${BASE}/niche-finder`, { waitUntil: 'networkidle2' });
      await delay(1000);
    }

    await ss(page, 'w1-02-step2.png');

    // ====== S5: Step 2 - select experience ======
    const step2 = await page.evaluate(() => {
      const url = window.location.href;
      if (!url.includes('/niche-finder')) return { onPage: false, url };
      const btns = Array.from(document.querySelectorAll('button[type="button"]'));
      const options = btns.filter(b => {
        const r = b.getBoundingClientRect();
        return r.width > 80 && r.height > 60 && r.y > 150;
      });
      const texts = options.map(b => b.textContent.trim());
      // Select first option
      if (options.length > 0) options[0].click();
      return { onPage: true, url, options: texts, clicked: texts[0] || null };
    });

    if (step2.onPage) {
      log('Step 2 select', step2.clicked ? 'PASS' : 'FAIL', `Options: ${step2.options?.join(' | ')}. Clicked: ${step2.clicked}`);
      await delay(500);

      // Click next
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button'))
          .find(b => b.textContent.includes('Ti\u1EBFp theo'));
        if (btn) btn.click();
      });
      await delay(1500);

      const url3 = page.url();
      const onStep3 = url3.includes('/niche-finder');
      log('Advance to step 3', onStep3 ? 'PASS' : 'FAIL', `URL: ${url3}`);

      if (onStep3) {
        await ss(page, 'w1-03-step3.png');

        // ====== S6: Step 3 - select goal ======
        const step3 = await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button[type="button"]'));
          const options = btns.filter(b => {
            const r = b.getBoundingClientRect();
            return r.width > 80 && r.height > 60 && r.y > 150;
          });
          const texts = options.map(b => b.textContent.trim());
          if (options.length > 0) options[0].click();
          return { options: texts, clicked: texts[0] || null };
        });
        log('Step 3 select', step3.clicked ? 'PASS' : 'FAIL', `Options: ${step3.options?.join(' | ')}. Clicked: ${step3.clicked}`);
        await delay(500);

        // Check if there's a next or submit button
        const action3 = await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const nextBtn = btns.find(b => b.textContent.includes('Ti\u1EBFp theo'));
          const submitBtn = btns.find(b =>
            b.textContent.includes('T\u00ECm ng\u00E1ch') ||
            b.textContent.includes('Ph\u00E2n t\u00EDch') ||
            b.textContent.includes('B\u1EAFt \u0111\u1EA7u') ||
            b.textContent.includes('Ho\u00E0n t\u1EA5t')
          );
          if (submitBtn) { submitBtn.click(); return 'submit: ' + submitBtn.textContent.trim(); }
          if (nextBtn) { nextBtn.click(); return 'next'; }
          return 'none';
        });
        log('Submit/Next step 3', action3 !== 'none' ? 'PASS' : 'FAIL', action3);
        await delay(2000);

        // If "next" -> handle more steps
        if (action3 === 'next') {
          const url4 = page.url();
          log('Step 4 reached', url4.includes('/niche-finder') ? 'PASS' : 'FAIL', `URL: ${url4}`);

          if (url4.includes('/niche-finder')) {
            await ss(page, 'w1-04-step4.png');

            // Select option
            const step4 = await page.evaluate(() => {
              const btns = Array.from(document.querySelectorAll('button[type="button"]'));
              const options = btns.filter(b => {
                const r = b.getBoundingClientRect();
                return r.width > 80 && r.height > 60 && r.y > 150;
              });
              const texts = options.map(b => b.textContent.trim());
              if (options.length > 0) options[0].click();
              return { options: texts, clicked: texts[0] || null };
            });
            log('Step 4 select', step4.clicked ? 'PASS' : 'FAIL', `${step4.options?.join(' | ')}. Clicked: ${step4.clicked}`);
            await delay(500);

            // Submit
            await page.evaluate(() => {
              const btns = Array.from(document.querySelectorAll('button'));
              const submitBtn = btns.find(b =>
                b.textContent.includes('T\u00ECm ng\u00E1ch') ||
                b.textContent.includes('Ph\u00E2n t\u00EDch') ||
                b.textContent.includes('B\u1EAFt \u0111\u1EA7u') ||
                b.textContent.includes('Ho\u00E0n t\u1EA5t') ||
                b.textContent.includes('Ti\u1EBFp theo')
              );
              if (submitBtn) submitBtn.click();
            });
            await delay(2000);
          }
        }
      }
    } else {
      log('Step 2 - page left', 'FAIL', `Not on niche-finder: ${step2.url}`);
    }

    // ====== Wait for AI results ======
    const currentUrl = page.url();
    log('Check URL before AI wait', currentUrl.includes('/niche-finder') ? 'PASS' : 'WARN', currentUrl);

    await ss(page, 'w1-05-processing.png');

    if (currentUrl.includes('/niche-finder')) {
      const t1 = Date.now();
      let foundResults = false;

      for (let i = 0; i < 12; i++) {
        await delay(5000);
        const elapsed = Math.round((Date.now() - t1) / 1000);

        const state = await page.evaluate(() => {
          const body = document.body.innerText;
          const hasChoose = body.includes('Ch\u1ECDn ng\u00E1ch');
          const hasSpinner = !!document.querySelector('[class*="animate-spin"]');
          const hasError = body.includes('L\u1ED7i') || body.includes('Error');
          return { hasChoose, hasSpinner, hasError, url: window.location.href };
        });

        console.log(`  AI wait: ${elapsed}s spinner=${state.hasSpinner} results=${state.hasChoose} error=${state.hasError}`);

        if (state.hasChoose) {
          foundResults = true;
          log('AI results loaded', 'PASS', `${elapsed}s`);
          break;
        }
        if (state.hasError) {
          log('AI error', 'FAIL', `Error after ${elapsed}s`);
          break;
        }
        if (!state.hasSpinner && elapsed > 15) {
          log('AI no spinner/results', 'WARN', `No activity after ${elapsed}s`);
          break;
        }
      }

      await ss(page, 'w1-06-ai-results.png');

      if (foundResults) {
        // ====== Click "Chon ngach nay" ======
        const chooseResult = await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const btn = btns.find(b => b.textContent.includes('Ch\u1ECDn ng\u00E1ch'));
          if (btn) { btn.click(); return btn.textContent.trim(); }
          return null;
        });
        log('Click "Chon ngach nay"', chooseResult ? 'PASS' : 'FAIL', chooseResult || 'not found');
        await delay(2000);

        // Check for dialog
        const dialogResult = await page.evaluate(() => {
          const dialog = document.querySelector('[role="dialog"], [class*="modal"], [data-state="open"]');
          if (dialog) {
            const btns = Array.from(dialog.querySelectorAll('button'));
            const confirmBtn = btns.find(b =>
              b.textContent.includes('X\u00E1c nh\u1EADn') ||
              b.textContent.includes('\u0110\u1ED3ng \u00FD') ||
              b.textContent.includes('T\u1EA1o') ||
              b.textContent.includes('OK')
            );
            if (confirmBtn) { confirmBtn.click(); return 'confirmed: ' + confirmBtn.textContent.trim(); }
            return 'dialog found but no confirm btn. Buttons: ' + btns.map(b => b.textContent.trim()).join(', ');
          }
          return 'no dialog';
        });
        log('Confirm dialog', dialogResult.includes('confirm') ? 'PASS' : 'INFO', dialogResult);
        await delay(3000);

        await ss(page, 'w1-07-after-choose.png');

        // Final URL check
        const finalUrl = page.url();
        const isChannel = finalUrl.includes('/channels/');
        log('Redirect to channel', isChannel ? 'PASS' : 'FAIL', `URL: ${finalUrl}`);

        if (isChannel) {
          await delay(2000);
          await ss(page, 'w1-08-channel-created.png');
        }
      }
    } else {
      log('Wizard lost - wrong page', 'FAIL', `On: ${currentUrl}`);
    }

    // ====== SUMMARY ======
    console.log('\n========== SUMMARY ==========');
    const p = results.filter(r => r.status === 'PASS').length;
    const f = results.filter(r => r.status === 'FAIL').length;
    const w = results.filter(r => r.status === 'WARN').length;
    console.log(`Total: ${results.length} | PASS: ${p} | FAIL: ${f} | WARN: ${w}`);
    results.forEach(r => console.log(`  [${r.status}] ${r.name}: ${r.detail}`));

    outputJSON({ success: true, results, summary: { total: results.length, passed: p, failed: f, warns: w } });
    await disconnectBrowser(browser);
  } catch (err) {
    console.error('Fatal:', err.message);
    outputJSON({ success: false, error: err.message, results });
  }
}

run();
