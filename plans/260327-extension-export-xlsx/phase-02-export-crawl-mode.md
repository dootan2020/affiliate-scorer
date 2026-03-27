# Phase 2: Export Crawl Mode

**Priority:** High — core auto-crawl functionality
**Effort:** ~2 hours
**Status:** Pending
**Depends on:** Phase 1

## Overview

Add "Export Crawl" mode to background.js that automatically:
1. Navigate to each L1 category page
2. Wait for page load
3. Find and click the export button
4. Wait for blob interception (from Phase 1)
5. Upload completes → move to next category

## Architecture

```
background.js startExportCrawl()
  ├── for each L1 category:
  │   ├── navigateTab → category search page
  │   ├── wait for page load + SPA render
  │   ├── chrome.scripting.executeScript → find + click export button
  │   ├── wait for XLSX_EXPORT message (with timeout)
  │   ├── handleXlsxExport → upload to PASTR
  │   ├── update progress
  │   └── delay between categories
  └── final flush + cleanup
```

## Implementation

### Modify: `extensions/.../background.js`

#### New State

```javascript
// Export crawl state (separate from intercept crawl)
let exportCrawlState = {
  active: false,
  tabId: null,
  categories: [...ALL_L1_CATEGORIES],
  currentCategoryIndex: 0,
  totalCategories: ALL_L1_CATEGORIES.length,
  captured: 0,
  errors: 0,
  waitingForExport: false, // true while waiting for XLSX_EXPORT message
  exportResolve: null,     // Promise resolver for export completion
};
```

#### New Message Handlers

```javascript
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
```

#### Modify XLSX_EXPORT Handler

When export crawl is active, resolve the waiting promise:

```javascript
if (msg.type === 'XLSX_EXPORT') {
  // If export crawl is waiting for this, resolve the promise
  if (exportCrawlState.waitingForExport && exportCrawlState.exportResolve) {
    exportCrawlState.waitingForExport = false;
    const resolve = exportCrawlState.exportResolve;
    exportCrawlState.exportResolve = null;
    handleXlsxExport(msg.payload).then(resolve);
  } else {
    // Manual export (not during crawl) — still upload
    handleXlsxExport(msg.payload).then(result => sendResponse(result));
  }
  return true;
}
```

#### Export Crawl Logic

```javascript
const EXPORT_CRAWL_DELAY = 8000;  // 8s between categories (includes export time)
const EXPORT_TIMEOUT = 30000;     // 30s max wait for export completion
const EXPORT_RENDER_WAIT = 5000;  // 5s wait for SPA to render after navigation

async function startExportCrawl(options) {
  if (exportCrawlState.active) return;

  exportCrawlState.active = true;
  exportCrawlState.categories = options.categories || [...ALL_L1_CATEGORIES];
  exportCrawlState.currentCategoryIndex = 0;
  exportCrawlState.totalCategories = exportCrawlState.categories.length;
  exportCrawlState.captured = 0;
  exportCrawlState.errors = 0;

  const tab = await chrome.tabs.create({
    url: 'https://www.fastmoss.com/vi/e-commerce/search?region=VN',
    active: false,
  });
  exportCrawlState.tabId = tab.id;
  await waitForTabLoad(tab.id);
  await delay(3000);

  try {
    for (let ci = 0; ci < exportCrawlState.categories.length && exportCrawlState.active; ci++) {
      exportCrawlState.currentCategoryIndex = ci;
      const catCode = exportCrawlState.categories[ci];

      // Navigate to category search page
      const url = `https://www.fastmoss.com/vi/e-commerce/search?region=VN&l1_cid=${catCode}`;
      await navigateTab(exportCrawlState.tabId, url);
      await delay(EXPORT_RENDER_WAIT);

      // Click export button via executeScript
      const clickResult = await clickExportButton(exportCrawlState.tabId);
      if (!clickResult) {
        console.warn(`[PASTR] Export button not found for category ${catCode}`);
        exportCrawlState.errors++;
        continue;
      }

      // Wait for XLSX_EXPORT message with timeout
      const exportResult = await waitForExport(EXPORT_TIMEOUT);
      if (exportResult) {
        exportCrawlState.captured += exportResult.newCount || 0;
        console.log(`[PASTR] Category ${catCode}: ${exportResult.recordCount} products`);
      } else {
        console.warn(`[PASTR] Export timeout for category ${catCode}`);
        exportCrawlState.errors++;
      }

      updateBadge();
      if (exportCrawlState.active) await delay(EXPORT_CRAWL_DELAY);
    }
  } finally {
    exportCrawlState.active = false;
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

      // Strategy 3: download icon
      if (!btn) btn = buttons.find(b =>
        b.querySelector('svg[data-icon="download"]') ||
        b.querySelector('.anticon-download')
      );

      if (btn && !btn.disabled) {
        btn.click();
        return true;
      }
      return false;
    },
  });
  return result?.result === true;
}

function waitForExport(timeoutMs) {
  return new Promise(resolve => {
    exportCrawlState.waitingForExport = true;
    exportCrawlState.exportResolve = resolve;

    setTimeout(() => {
      if (exportCrawlState.waitingForExport) {
        exportCrawlState.waitingForExport = false;
        exportCrawlState.exportResolve = null;
        resolve(null); // Timeout
      }
    }, timeoutMs);
  });
}
```

### Handle Confirm Dialogs

Some FastMoss export flows show a confirmation dialog before downloading. Add a secondary click handler:

```javascript
// After clicking export, check for confirm dialog in 2s
await delay(2000);
await chrome.scripting.executeScript({
  target: { tabId },
  world: 'MAIN',
  func: () => {
    // Look for modal OK/Confirm button
    const modal = document.querySelector('.ant-modal-confirm, .ant-modal');
    if (modal) {
      const okBtn = modal.querySelector('.ant-btn-primary, button:last-child');
      if (okBtn) okBtn.click();
    }
  },
});
```

## Files to Modify

| Action | File | Change |
|--------|------|--------|
| Modify | `extensions/.../background.js` | Add export crawl logic, state, message handlers |

## Success Criteria

- [ ] Start Export Crawl → navigates through categories
- [ ] Export button found and clicked on each page
- [ ] XLSX intercepted and uploaded for each category
- [ ] Progress tracked: currentCategory, captured count, errors
- [ ] Graceful handling: button not found, timeout, quota exceeded
- [ ] Stop Export Crawl works mid-crawl

## Testing

1. Start export crawl via popup
2. Watch background tab navigate through categories
3. Verify export button clicks (console logs)
4. Check PASTR sync status: new products per category
5. Test stop mid-crawl
6. Test with category where export button is disabled (quota)
