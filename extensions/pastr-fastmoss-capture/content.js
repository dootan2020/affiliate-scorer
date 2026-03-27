// Bridge: MAIN world (injected.js) → ISOLATED world (this) → background.js
// Uses postMessage for reliable cross-world communication

/** Extract l1_cid from current page URL (auto-crawl pages have ?l1_cid=X) */
function getPageCategoryId() {
  try {
    const params = new URLSearchParams(window.location.search);
    const cid = params.get('l1_cid') || params.get('category') || params.get('cid');
    return cid ? parseInt(cid, 10) : null;
  } catch { return null; }
}

window.addEventListener('message', (event) => {
  // Only accept messages from the same page
  if (event.source !== window) return;

  // Handle XLSX export blob from MAIN world
  if (event.data?.type === '__PASTR_EXPORT__') {
    chrome.runtime.sendMessage({
      type: 'XLSX_EXPORT',
      payload: {
        dataUrl: event.data.dataUrl,
        size: event.data.size,
        timestamp: event.data.timestamp,
      }
    });
    return;
  }

  if (event.data?.type !== '__PASTR_CAPTURE__') return;

  const { url, body, timestamp } = event.data;
  const data = body?.data;
  if (!data) return;

  // Extract L1 category from page URL (available during auto-crawl)
  const pageCategoryId = getPageCategoryId();

  // Extract items from any list field
  const items = data.rank_list || data.product_list || data.list ||
                data.author_list || data.live_list || data.ad_list;

  if (Array.isArray(items) && items.length > 0) {
    // Filter VN items only
    let vnItems = items.filter(item => !item.region || item.region === 'VN');
    // Inject page category context if items lack category_id
    if (pageCategoryId) {
      vnItems = vnItems.map(item => ({
        ...item,
        _crawl_category_id: item.category_id ?? item.first_cid ?? pageCategoryId,
      }));
    }
    if (vnItems.length > 0) {
      chrome.runtime.sendMessage({
        type: 'API_CAPTURE',
        payload: { url, items: vnItems, timestamp, count: vnItems.length }
      });
    }
  } else if (data.product || data.overview || data.summary) {
    // Single item responses (product detail, market overview)
    chrome.runtime.sendMessage({
      type: 'API_CAPTURE_SINGLE',
      payload: { url, data, timestamp }
    });
  }
});
