# Phase 3: Popup UI + Progress Tracking

**Priority:** Medium
**Effort:** ~1 hour
**Status:** Pending
**Depends on:** Phase 2

## Overview

Update popup.html/popup.js to show Export Crawl controls alongside existing Intercept Crawl.

## UI Design

```
┌──────────────────────────────────────┐
│ PASTR FastMoss Capture               │
├──────────────────────────────────────┤
│ ● Buffered: 12  │ Total: 1,234      │
│ ● Syncs: 45     │ Last: 2m ago      │
├──────────────────────────────────────┤
│ ┌─────────────┐ ┌──────────────────┐ │
│ │ Intercept ▼ │ │ Export XLSX  ▼  │ │
│ └─────────────┘ └──────────────────┘ │
│                                      │
│ ⏳ Exporting: Beauty (3/29)          │
│ ████████░░░░░░░░░░  10%             │
│ Captured: 900 SP │ Errors: 1        │
│                                      │
│ [Stop Export]                        │
├──────────────────────────────────────┤
│ Auth Secret: ●●●●●●●●  [Save]       │
│ [Sync Now]                           │
└──────────────────────────────────────┘
```

## Files to Modify

| File | Change |
|------|--------|
| `extensions/.../popup.html` | Add Export Crawl section with start/stop buttons |
| `extensions/.../popup.js` | Add export crawl controls, progress display, GET_STATS handling for exportCrawlState |
| `extensions/.../background.js` | Extend GET_STATS to include exportCrawlState |

## Key Changes

### popup.html: Add Export Section

```html
<!-- Export Crawl Controls -->
<div id="export-section" class="section">
  <h3>Export XLSX Crawl</h3>
  <div id="export-idle">
    <p class="note">300 SP/category via XLSX export</p>
    <button id="startExport" class="btn btn-primary">Start Export Crawl</button>
  </div>
  <div id="export-progress" style="display:none">
    <div class="stat-row">
      <span id="exportPhase">Category 1/29</span>
      <span id="exportCaptured">0 SP</span>
    </div>
    <div class="progress-bar">
      <div id="exportBar" class="progress-fill"></div>
    </div>
    <div class="stat-row">
      <span id="exportErrors">Errors: 0</span>
    </div>
    <button id="stopExport" class="btn btn-danger">Stop</button>
  </div>
</div>
```

### popup.js: Export Controls

```javascript
document.getElementById('startExport').onclick = () => {
  chrome.runtime.sendMessage({ type: 'START_EXPORT_CRAWL' });
};

document.getElementById('stopExport').onclick = () => {
  chrome.runtime.sendMessage({ type: 'STOP_EXPORT_CRAWL' });
};

// In loadStats():
if (stats.exportCrawlState?.active) {
  document.getElementById('export-idle').style.display = 'none';
  document.getElementById('export-progress').style.display = 'block';
  const ec = stats.exportCrawlState;
  document.getElementById('exportPhase').textContent =
    `Category ${ec.currentCategoryIndex + 1}/${ec.totalCategories}`;
  document.getElementById('exportCaptured').textContent = `${ec.captured} SP`;
  document.getElementById('exportErrors').textContent = `Errors: ${ec.errors}`;
  document.getElementById('exportBar').style.width =
    `${Math.round((ec.currentCategoryIndex / ec.totalCategories) * 100)}%`;
} else {
  document.getElementById('export-idle').style.display = 'block';
  document.getElementById('export-progress').style.display = 'none';
}
```

### background.js: Extend GET_STATS

```javascript
if (msg.type === 'GET_STATS') {
  sendResponse({
    buffered: Object.keys(productBuffer).length,
    totalCaptured: captureCount,
    lastSyncTime,
    syncCount,
    crawlState: { /* existing */ },
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
```

## Success Criteria

- [ ] Popup shows Export Crawl section
- [ ] Start button triggers export crawl
- [ ] Progress bar updates during crawl
- [ ] Stop button halts crawl
- [ ] Stats show captured count and errors
