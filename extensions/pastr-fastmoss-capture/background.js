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
      for (let page = 1; page <= crawlState.maxPages && crawlState.active; page++) {
        crawlState.currentPage = page;
        const url = `https://www.fastmoss.com/vi/e-commerce/search?region=VN&page=${page}&l1_cid=${catCode}`;
        await navigateTab(crawlState.tabId, url);
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
