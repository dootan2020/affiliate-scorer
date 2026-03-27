// ═══ CONFIG ═══
const PASTR_URL = 'https://affiliate-scorer.vercel.app';
const BATCH_SIZE = 50;
const FLUSH_INTERVAL = 30000;
const CRAWL_PAGE_DELAY = 3000;
const CRAWL_CATEGORY_DELAY = 5000;
const ALL_L1_CATEGORIES = [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,30,31];

// ═══ STATE ═══
let productBuffer = {};  // product_id → product data (object for JSON serialization)
let captureCount = 0;
let lastSyncTime = 0;
let syncCount = 0;

// Crawl state
let crawlState = {
  active: false,
  tabId: null,
  categories: [...ALL_L1_CATEGORIES],
  currentCategoryIndex: 0,
  currentPage: 0,
  maxPages: 30,
  totalCategories: ALL_L1_CATEGORIES.length,
  phase: 'idle', // idle | search | saleslist | hotlist | newProducts | hotvideo | done | stopped
  captured: 0,
};

// Export crawl state
let exportCrawlState = {
  active: false,
  tabId: null,
  categories: [...ALL_L1_CATEGORIES],
  currentCategoryIndex: 0,
  totalCategories: ALL_L1_CATEGORIES.length,
  captured: 0,
  errors: 0,
  waitingForExport: false,
  exportResolve: null,
};

// Ranking endpoints to crawl per category
const RANKING_ENDPOINTS = [
  { path: 'saleslist', label: 'saleslist' },
  { path: 'hotlist', label: 'hotlist' },
  { path: 'newProducts', label: 'newProducts' },
  { path: 'hotvideo', label: 'hotvideo' },
];

// ═══ MESSAGE HANDLER ═══
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'API_CAPTURE') {
    const { items } = msg.payload;
    for (const item of items) {
      const id = item.product_id || item.uid || item.seller_id || item.room_id || item.id;
      if (id && !productBuffer[id]) {
        productBuffer[id] = item;
        captureCount++;
        crawlState.captured++;
      }
    }
    updateBadge();
    if (Object.keys(productBuffer).length >= BATCH_SIZE) {
      flushToServer();
    }
    sendResponse({ ok: true });
    return true;
  }

  if (msg.type === 'API_CAPTURE_SINGLE') {
    // Single item responses stored in buffer with url as key
    const id = `single_${msg.payload.url}_${Date.now()}`;
    productBuffer[id] = msg.payload.data;
    captureCount++;
    updateBadge();
    sendResponse({ ok: true });
    return true;
  }

  if (msg.type === 'XLSX_EXPORT') {
    // If export crawl is waiting, resolve the promise
    if (exportCrawlState.waitingForExport && exportCrawlState.exportResolve) {
      exportCrawlState.waitingForExport = false;
      const resolve = exportCrawlState.exportResolve;
      exportCrawlState.exportResolve = null;
      handleXlsxExport(msg.payload).then(resolve);
    } else {
      // Manual export (not during crawl)
      handleXlsxExport(msg.payload).then(result => sendResponse(result));
    }
    return true;
  }

  if (msg.type === 'START_EXPORT_CRAWL') {
    startExportCrawl(msg.options || {});
    sendResponse({ ok: true });
    return true;
  }

  if (msg.type === 'STOP_EXPORT_CRAWL') {
    stopExportCrawl();
    sendResponse({ ok: true });
    return true;
  }

  if (msg.type === 'GET_STATS') {
    sendResponse({
      buffered: Object.keys(productBuffer).length,
      totalCaptured: captureCount,
      lastSyncTime,
      syncCount,
      crawlState: {
        active: crawlState.active,
        currentCategoryIndex: crawlState.currentCategoryIndex,
        currentPage: crawlState.currentPage,
        maxPages: crawlState.maxPages,
        totalCategories: crawlState.totalCategories,
        phase: crawlState.phase,
        captured: crawlState.captured,
      },
      exportCrawlState: {
        active: exportCrawlState.active,
        currentCategoryIndex: exportCrawlState.currentCategoryIndex,
        totalCategories: exportCrawlState.totalCategories,
        captured: exportCrawlState.captured,
        errors: exportCrawlState.errors,
      },
    });
    return true;
  }

  if (msg.type === 'SET_CONFIG') {
    chrome.storage.local.set(msg.config);
    sendResponse({ ok: true });
    return true;
  }

  if (msg.type === 'GET_CONFIG') {
    chrome.storage.local.get(['pastr_auth_secret', 'pastr_url'], (data) => {
      sendResponse(data);
    });
    return true;
  }

  if (msg.type === 'FORCE_SYNC') {
    flushToServer().then(() => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === 'START_CRAWL') {
    startCrawl(msg.options || {});
    sendResponse({ ok: true });
    return true;
  }

  if (msg.type === 'STOP_CRAWL') {
    stopCrawl();
    sendResponse({ ok: true });
    return true;
  }
});

// ═══ AUTO-FLUSH TIMER ═══
setInterval(() => {
  if (Object.keys(productBuffer).length > 0) {
    flushToServer();
  }
}, FLUSH_INTERVAL);

// ═══ SYNC TO PASTR SERVER ═══
async function flushToServer() {
  const secret = await getConfig('pastr_auth_secret');
  if (!secret) return;

  const products = Object.values(productBuffer);
  productBuffer = {};

  if (products.length === 0) return;

  const url = (await getConfig('pastr_url')) || PASTR_URL;

  try {
    const res = await fetch(`${url}/api/fastmoss/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-secret': secret,
      },
      body: JSON.stringify({ type: 'products', region: 'VN', data: products }),
    });

    if (res.ok) {
      syncCount++;
      lastSyncTime = Date.now();
      console.log(`[PASTR] Synced ${products.length} products (total syncs: ${syncCount})`);
    } else {
      console.error(`[PASTR] Sync failed: ${res.status}`);
      // Re-buffer failed items to retry next flush
      for (const p of products) {
        const id = p.product_id || p.uid || p.id;
        if (id) productBuffer[id] = p;
      }
    }
  } catch (err) {
    console.error('[PASTR] Sync error:', err.message);
    // Re-buffer on network error
    for (const p of products) {
      const id = p.product_id || p.uid || p.id;
      if (id) productBuffer[id] = p;
    }
  }
}

async function getConfig(key) {
  return new Promise(resolve => {
    chrome.storage.local.get(key, data => resolve(data[key] || ''));
  });
}

function updateBadge() {
  const count = Object.keys(productBuffer).length;
  chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
  chrome.action.setBadgeBackgroundColor({ color: crawlState.active ? '#2563EB' : '#10B981' });
}

// ═══ AUTO-CRAWL ═══
async function startCrawl(options) {
  if (crawlState.active) return;

  crawlState.active = true;
  crawlState.categories = options.categories || [...ALL_L1_CATEGORIES];
  crawlState.maxPages = options.maxPages || 30;
  crawlState.currentCategoryIndex = 0;
  crawlState.currentPage = 0;
  crawlState.totalCategories = crawlState.categories.length;
  crawlState.phase = 'search';
  crawlState.captured = 0;

  startKeepAlive(); // Prevent MV3 service worker termination

  // Open background tab for crawling
  const tab = await chrome.tabs.create({ url: 'https://www.fastmoss.com/vi', active: false });
  crawlState.tabId = tab.id;

  await waitForTabLoad(tab.id);
  await delay(3000);

  try {
    for (let ci = 0; ci < crawlState.categories.length && crawlState.active; ci++) {
      crawlState.currentCategoryIndex = ci;
      const catCode = crawlState.categories[ci];

      // Phase 1: Search pages for current category
      crawlState.phase = 'search';

      // Page 1: navigate to the search URL (SPA loads and makes first API call)
      crawlState.currentPage = 1;
      const searchUrl = `https://www.fastmoss.com/vi/e-commerce/search?region=VN&page=1&l1_cid=${catCode}`;
      await navigateTab(crawlState.tabId, searchUrl);
      await delay(CRAWL_PAGE_DELAY + 2000); // Extra wait for page 1 to capture API call

      // Pages 2+: replay the captured API call with different page numbers
      // (FastMoss SPA ignores URL page param on navigation, so we call API directly)
      for (let page = 2; page <= crawlState.maxPages && crawlState.active; page++) {
        crawlState.currentPage = page;
        try {
          await chrome.scripting.executeScript({
            target: { tabId: crawlState.tabId },
            world: 'MAIN',
            func: async (pageNum) => {
              const last = window.__pastrLastSearch;
              if (!last) return false;
              try {
                if (last.method === 'POST' && last.body) {
                  const body = JSON.parse(last.body);
                  body.page = pageNum;
                  await fetch(last.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                  });
                } else {
                  // GET request: replace page param in URL
                  const u = new URL(last.url, location.origin);
                  u.searchParams.set('page', String(pageNum));
                  await fetch(u.toString());
                }
                return true;
              } catch { return false; }
            },
            args: [page],
          });
        } catch (e) {
          console.warn(`[PASTR] executeScript page ${page} failed:`, e.message);
        }
        await delay(CRAWL_PAGE_DELAY);
      }

      // Phase 2: Ranking pages (1 page each per category)
      for (const endpoint of RANKING_ENDPOINTS) {
        if (!crawlState.active) break;
        crawlState.phase = endpoint.label;
        crawlState.currentPage = 1;
        const url = `https://www.fastmoss.com/vi/e-commerce/${endpoint.path}?region=VN&l1_cid=${catCode}`;
        await navigateTab(crawlState.tabId, url);
        await delay(CRAWL_PAGE_DELAY);
      }

      // Delay between categories
      if (crawlState.active) await delay(CRAWL_CATEGORY_DELAY);
    }

    crawlState.phase = 'done';
    // Final flush on crawl completion
    await flushToServer();
  } finally {
    crawlState.active = false;
    stopKeepAlive();
    if (crawlState.tabId) {
      try { chrome.tabs.remove(crawlState.tabId); } catch {}
      crawlState.tabId = null;
    }
    updateBadge();
  }
}

function stopCrawl() {
  crawlState.active = false;
  if (crawlState.tabId) {
    try { chrome.tabs.remove(crawlState.tabId); } catch {}
    crawlState.tabId = null;
  }
  crawlState.phase = 'stopped';
  // Sync whatever was captured before stop
  flushToServer();
  updateBadge();
}

async function navigateTab(tabId, url) {
  return new Promise((resolve) => {
    chrome.tabs.update(tabId, { url }, () => {
      const listener = (id, info) => {
        if (id === tabId && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
      // Timeout after 15s to prevent hangs
      setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }, 15000);
    });
  });
}

function waitForTabLoad(tabId) {
  return new Promise((resolve) => {
    const listener = (id, info) => {
      if (id === tabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
    setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    }, 15000);
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══ MV3 KEEPALIVE ═══
// setInterval does NOT prevent MV3 service worker termination.
// Use chrome.alarms (survives worker restarts) + port connections (active event).
let keepAlivePort = null;

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepalive') {
    // This listener firing IS the keepalive — it wakes/keeps the worker
    console.log('[PASTR] keepalive ping');
  }
});

function startKeepAlive() {
  // Alarm: fires every 24s (minimum Chrome allows is ~0.0167 min ≈ 1s, but <1min may be throttled)
  chrome.alarms.create('keepalive', { periodInMinutes: 0.4 });

  // Also open a long-lived port to the crawl tab's content script
  // Port connections keep the service worker alive as long as the port is open
  tryConnectPort();
}

function stopKeepAlive() {
  chrome.alarms.clear('keepalive');
  if (keepAlivePort) {
    try { keepAlivePort.disconnect(); } catch {}
    keepAlivePort = null;
  }
}

function tryConnectPort() {
  // Connect to the active crawl tab (if any) — port keeps worker alive
  const tabId = exportCrawlState.tabId || crawlState.tabId;
  if (!tabId) return;
  try {
    keepAlivePort = chrome.tabs.connect(tabId, { name: 'keepalive' });
    keepAlivePort.onDisconnect.addListener(() => {
      keepAlivePort = null;
      // Reconnect if crawl still active
      if (exportCrawlState.active || crawlState.active) {
        setTimeout(tryConnectPort, 1000);
      }
    });
  } catch {
    keepAlivePort = null;
  }
}

// ═══ XLSX EXPORT UPLOAD ═══
async function handleXlsxExport(payload) {
  const secret = await getConfig('pastr_auth_secret');
  if (!secret) return { ok: false, error: 'No auth secret' };

  const url = (await getConfig('pastr_url')) || PASTR_URL;

  // Convert dataURL to blob
  const res = await fetch(payload.dataUrl);
  const blob = await res.blob();

  // Upload as multipart form
  const formData = new FormData();
  formData.append('file', blob, `fastmoss-export-${Date.now()}.xlsx`);

  // Attach category context from export crawl state
  if (exportCrawlState.active) {
    const catCode = exportCrawlState.categories[exportCrawlState.currentCategoryIndex];
    if (catCode) formData.append('category_code', String(catCode));
  }

  try {
    const syncRes = await fetch(`${url}/api/fastmoss/sync-xlsx`, {
      method: 'POST',
      headers: { 'x-auth-secret': secret },
      body: formData,
    });
    const result = await syncRes.json();
    console.log('[PASTR] XLSX sync:', result);

    syncCount++;
    lastSyncTime = Date.now();
    captureCount += result.recordCount || 0;
    if (exportCrawlState.active) exportCrawlState.captured += result.newCount || 0;

    updateBadge();
    return { ok: true, ...result };
  } catch (err) {
    console.error('[PASTR] XLSX sync error:', err.message);
    return { ok: false, error: err.message };
  }
}

// ═══ EXPORT CRAWL ═══
const EXPORT_RENDER_WAIT = 5000;
const EXPORT_TIMEOUT = 30000;
const EXPORT_CRAWL_DELAY = 8000;

async function startExportCrawl(options) {
  if (exportCrawlState.active) return;

  exportCrawlState.active = true;
  exportCrawlState.categories = options.categories || [...ALL_L1_CATEGORIES];
  exportCrawlState.currentCategoryIndex = 0;
  exportCrawlState.totalCategories = exportCrawlState.categories.length;
  exportCrawlState.captured = 0;
  exportCrawlState.errors = 0;

  startKeepAlive(); // Prevent MV3 service worker termination
  console.log(`[PASTR] Export crawl started: ${exportCrawlState.totalCategories} categories`);

  let tab;
  try {
    tab = await chrome.tabs.create({
      url: 'https://www.fastmoss.com/vi/e-commerce/search?region=VN',
      active: false,
    });
    exportCrawlState.tabId = tab.id;
    await waitForTabLoad(tab.id);
    await delay(3000);
  } catch (err) {
    console.error('[PASTR] Failed to open tab:', err);
    exportCrawlState.active = false;
    stopKeepAlive();
    return;
  }

  try {
    for (let ci = 0; ci < exportCrawlState.categories.length && exportCrawlState.active; ci++) {
      exportCrawlState.currentCategoryIndex = ci;
      const catCode = exportCrawlState.categories[ci];

      try {
        console.log(`[PASTR] Export ${ci + 1}/${exportCrawlState.totalCategories}: category ${catCode}`);

        // Verify tab still exists
        try { await chrome.tabs.get(exportCrawlState.tabId); } catch {
          console.warn('[PASTR] Tab lost, reopening...');
          const newTab = await chrome.tabs.create({
            url: 'https://www.fastmoss.com/vi/e-commerce/search?region=VN',
            active: false,
          });
          exportCrawlState.tabId = newTab.id;
          await waitForTabLoad(newTab.id);
          await delay(3000);
        }

        // Navigate to category search page
        const url = `https://www.fastmoss.com/vi/e-commerce/search?region=VN&l1_cid=${catCode}`;
        await navigateTab(exportCrawlState.tabId, url);
        // Reconnect keepalive port (navigation kills content script + old port)
        tryConnectPort();
        await delay(EXPORT_RENDER_WAIT);

        // Click export button
        const clicked = await clickExportButton(exportCrawlState.tabId);
        if (!clicked) {
          console.warn(`[PASTR] Export button not found for category ${catCode}, skipping`);
          exportCrawlState.errors++;
          continue;
        }

        // Handle possible confirm dialog
        await delay(2000);
        await dismissConfirmDialog(exportCrawlState.tabId);

        // Wait for XLSX_EXPORT message
        const exportResult = await waitForExport(EXPORT_TIMEOUT);
        if (exportResult) {
          console.log(`[PASTR] ✓ Category ${catCode}: ${exportResult.recordCount || 0} products (new: ${exportResult.newCount || 0})`);
        } else {
          console.warn(`[PASTR] ✗ Export timeout for category ${catCode}`);
          exportCrawlState.errors++;
        }

        updateBadge();
      } catch (err) {
        console.error(`[PASTR] ✗ Category ${catCode} error:`, err?.message || err);
        exportCrawlState.errors++;
        // Continue to next category
      }

      if (exportCrawlState.active) await delay(EXPORT_CRAWL_DELAY);
    }

    console.log(`[PASTR] Export crawl complete: ${exportCrawlState.captured} captured, ${exportCrawlState.errors} errors`);
  } finally {
    exportCrawlState.active = false;
    stopKeepAlive();
    if (exportCrawlState.tabId) {
      try { chrome.tabs.remove(exportCrawlState.tabId); } catch {}
      exportCrawlState.tabId = null;
    }
    updateBadge();
  }
}

function stopExportCrawl() {
  exportCrawlState.active = false;
  if (exportCrawlState.tabId) {
    try { chrome.tabs.remove(exportCrawlState.tabId); } catch {}
    exportCrawlState.tabId = null;
  }
  updateBadge();
}

async function clickExportButton(tabId) {
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: () => {
        // Strategy 1: text match
        const buttons = Array.from(document.querySelectorAll('button'));
        let btn = buttons.find(b =>
          b.textContent?.includes('Xuất dữ liệu') ||
          b.textContent?.includes('Export')
        );
        // Strategy 2: aria label
        if (!btn) btn = document.querySelector('button[aria-label*="Xuất"], button[aria-label*="Export"]');
        // Strategy 3: download icon (Ant Design)
        if (!btn) btn = buttons.find(b =>
          b.querySelector('.anticon-download') ||
          b.querySelector('svg[data-icon="download"]')
        );
        if (btn && !btn.disabled) { btn.click(); return true; }
        return false;
      },
    });
    return result?.result === true;
  } catch { return false; }
}

async function dismissConfirmDialog(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: () => {
        const modal = document.querySelector('.ant-modal-confirm, .ant-modal');
        if (modal) {
          const okBtn = modal.querySelector('.ant-btn-primary, button:last-child');
          if (okBtn) okBtn.click();
        }
      },
    });
  } catch {}
}

function waitForExport(timeoutMs) {
  return new Promise(resolve => {
    exportCrawlState.waitingForExport = true;
    exportCrawlState.exportResolve = resolve;
    setTimeout(() => {
      if (exportCrawlState.waitingForExport) {
        exportCrawlState.waitingForExport = false;
        exportCrawlState.exportResolve = null;
        resolve(null);
      }
    }, timeoutMs);
  });
}
