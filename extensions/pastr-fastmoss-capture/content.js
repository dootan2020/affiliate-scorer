// Inject fetch interceptor into page context (main world)
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js');
script.onload = () => script.remove();
(document.head || document.documentElement).appendChild(script);

// Listen for captured data from page context
window.addEventListener('__PASTR_CAPTURE__', (event) => {
  const { url, body, timestamp } = event.detail;
  const data = body?.data;
  if (!data) return;

  // Extract items from any list field
  const items = data.rank_list || data.product_list || data.list ||
                data.author_list || data.live_list || data.ad_list;

  if (Array.isArray(items) && items.length > 0) {
    // Filter VN items only
    const vnItems = items.filter(item => !item.region || item.region === 'VN');
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
