# Phase 4: L2 Subcategory Support

**Priority:** Low — enhancement after L1 works
**Effort:** ~1.5 hours
**Status:** Pending
**Depends on:** Phase 2, Phase 3

## Overview

Extend export crawl to support L2 subcategories. FastMoss has ~200 L2 subcategories under 29 L1. Each L2 export gives 300 SP → ~60,000 total (dedup ~30,000).

## Research Needed

Before implementing, user needs to verify on FastMoss Pro:

1. **L2 URL pattern**: Does `?l1_cid=14&l2_cid=XXX` work for filtering?
2. **L2 export**: Does the same "Xuất dữ liệu" button work on L2-filtered pages?
3. **L2 category codes**: Are they available from the `/api/goods/filterInfo` API response?

## Implementation

### 1. Seed L2 Categories

Extend the category seed to include L2 codes. The `/api/goods/filterInfo` API returns the full 3-level tree with `c_code`, `c_name`, `sub[]`.

#### Modify: Extension to capture filterInfo response

In `injected.js`, the `/api/goods/filterInfo` URL is already captured (matches `/api/goods/`). The `content.js` just needs to detect it and send as a category sync.

```javascript
// In content.js — detect filterInfo responses
if (url.includes('/api/goods/filterInfo') || url.includes('filterInfo')) {
  if (data.category && Array.isArray(data.category)) {
    chrome.runtime.sendMessage({
      type: 'CATEGORY_TREE',
      payload: { categories: data.category, timestamp }
    });
    return;
  }
}
```

```javascript
// In background.js — handle category tree
if (msg.type === 'CATEGORY_TREE') {
  const categories = flattenCategoryTree(msg.payload.categories);
  // Sync to PASTR
  const secret = await getConfig('pastr_auth_secret');
  const url = (await getConfig('pastr_url')) || PASTR_URL;
  await fetch(`${url}/api/fastmoss/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-auth-secret': secret },
    body: JSON.stringify({ type: 'categories', region: 'VN', data: categories }),
  });
  sendResponse({ ok: true });
  return true;
}

function flattenCategoryTree(tree) {
  const result = [];
  for (const l1 of tree) {
    result.push({ code: l1.c_code, name: l1.c_name, level: 1, rank: l1.rank || 0 });
    if (l1.sub) {
      for (const l2 of l1.sub) {
        result.push({ code: l2.c_code, name: l2.c_name, parentCode: l1.c_code, level: 2, rank: l2.rank || 0 });
        if (l2.sub) {
          for (const l3 of l2.sub) {
            result.push({ code: l3.c_code, name: l3.c_name, parentCode: l2.c_code, level: 3, rank: l3.rank || 0 });
          }
        }
      }
    }
  }
  return result;
}
```

### 2. Export Crawl Depth Option

Add depth option to popup and crawl logic:

```javascript
// In popup.html
<select id="exportDepth">
  <option value="l1">L1 only (29 categories, ~8.7K SP)</option>
  <option value="l2">L1 + L2 (~200 categories, ~30K SP)</option>
</select>

// In popup.js
const depth = document.getElementById('exportDepth').value;
chrome.runtime.sendMessage({
  type: 'START_EXPORT_CRAWL',
  options: { depth }
});
```

### 3. L2 Crawl Logic

```javascript
async function startExportCrawl(options) {
  const depth = options.depth || 'l1';

  if (depth === 'l2') {
    // Fetch L2 categories from PASTR
    const url = (await getConfig('pastr_url')) || PASTR_URL;
    const res = await fetch(`${url}/api/fastmoss/categories?region=VN`);
    const tree = await res.json();

    // Build flat list: each L1's L2 children
    const categories = [];
    for (const l1 of tree) {
      categories.push({ code: l1.code, level: 1 });
      if (l1.children) {
        for (const l2 of l1.children) {
          categories.push({ code: l2.code, level: 2, parentCode: l1.code });
        }
      }
    }
    exportCrawlState.categories = categories;
    exportCrawlState.totalCategories = categories.length;
  }

  // ... rest of crawl logic
  // URL for L2: ?region=VN&l1_cid=PARENT&l2_cid=CODE
}
```

### 4. Deduplication

L2 exports will overlap (products appear in multiple subcategories). The existing `syncProducts` handles dedup via `fastmossProductId` unique constraint. No additional logic needed.

## Files to Modify

| File | Change |
|------|--------|
| `extensions/.../content.js` | Detect filterInfo → CATEGORY_TREE message |
| `extensions/.../background.js` | Handle CATEGORY_TREE, L2 crawl logic, flattenCategoryTree |
| `extensions/.../popup.html` | Depth selector |
| `extensions/.../popup.js` | Pass depth option |

## Success Criteria

- [ ] FilterInfo response captured → categories synced to PASTR
- [ ] L2 depth option available in popup
- [ ] Export crawl iterates L2 subcategories
- [ ] Dedup: no duplicate products across overlapping L2 categories
- [ ] Total captured: ~30K unique products

## Risks

- FastMoss may not filter L2 via URL param (need user to verify)
- ~200 exports may hit daily quota limit
- Crawl time: ~200 categories × 15s = ~50 minutes
