(function() {
  'use strict';

  const CAPTURE_PATHS = [
    '/api/goods/', '/api/video/', '/api/author/', '/api/ecommerce/',
    '/api/shop/', '/api/followers/', '/api/live/', '/api/analysis/',
    '/api/da/', '/api/dar/',
  ];

  function shouldCapture(url) {
    return CAPTURE_PATHS.some(p => url.includes(p));
  }

  // Patch fetch
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
    if (shouldCapture(url)) {
      try {
        const clone = response.clone();
        const body = await clone.json();
        if (body.code === 200 || String(body.code).startsWith('MAG_AUTH')) {
          window.dispatchEvent(new CustomEvent('__PASTR_CAPTURE__', {
            detail: { url, body, timestamp: Date.now() }
          }));
        }
      } catch {}
    }
    return response;
  };

  // Patch XHR
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._pastrUrl = url;
    return origOpen.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.send = function(...args) {
    if (this._pastrUrl && shouldCapture(this._pastrUrl)) {
      this.addEventListener('load', function() {
        try {
          const body = JSON.parse(this.responseText);
          if (body.code === 200 || String(body.code).startsWith('MAG_AUTH')) {
            window.dispatchEvent(new CustomEvent('__PASTR_CAPTURE__', {
              detail: { url: this._pastrUrl, body, timestamp: Date.now() }
            }));
          }
        } catch {}
      });
    }
    return origSend.apply(this, args);
  };

  console.log('[PASTR] FastMoss capture active');
})();
