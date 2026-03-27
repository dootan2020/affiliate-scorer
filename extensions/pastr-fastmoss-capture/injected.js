(function() {
  'use strict';

  const CAPTURE_PATHS = [
    '/api/goods/', '/api/video/', '/api/author/', '/api/ecommerce/',
    '/api/shop/', '/api/followers/', '/api/live/', '/api/analysis/',
    '/api/da/', '/api/dar/',
  ];

  const SEARCH_PATHS = ['/api/goods/', '/api/ecommerce/'];

  function shouldCapture(url) {
    return CAPTURE_PATHS.some(p => url.includes(p));
  }

  // Store last search request so background.js can replay with different page numbers
  window.__pastrLastSearch = null;

  // Patch fetch
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
    if (shouldCapture(url)) {
      // Save search request for pagination replay
      if (SEARCH_PATHS.some(p => url.includes(p))) {
        try {
          window.__pastrLastSearch = {
            url,
            method: args[1]?.method || 'GET',
            headers: args[1]?.headers || {},
            body: args[1]?.body || null,
          };
        } catch (e) {}
      }
      try {
        const clone = response.clone();
        const body = await clone.json();
        if (body.code == 200 || String(body.code).startsWith('MAG_AUTH')) {
          window.postMessage({
            type: '__PASTR_CAPTURE__', url, body, timestamp: Date.now()
          }, '*');
        }
      } catch (e) { /* ignore non-JSON responses */ }
    }
    return response;
  };

  // Patch XHR
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._pastrUrl = url;
    this._pastrMethod = method;
    return origOpen.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.send = function(body, ...rest) {
    if (this._pastrUrl && shouldCapture(this._pastrUrl)) {
      // Save search request for pagination replay
      if (SEARCH_PATHS.some(p => this._pastrUrl.includes(p))) {
        try {
          window.__pastrLastSearch = {
            url: this._pastrUrl,
            method: this._pastrMethod || 'GET',
            headers: {},
            body: typeof body === 'string' ? body : null,
          };
        } catch (e) {}
      }
      this.addEventListener('load', function() {
        try {
          const respBody = JSON.parse(this.responseText);
          if (respBody.code == 200 || String(respBody.code).startsWith('MAG_AUTH')) {
            window.postMessage({
              type: '__PASTR_CAPTURE__', url: this._pastrUrl, body: respBody, timestamp: Date.now()
            }, '*');
          }
        } catch (e) { /* ignore non-JSON responses */ }
      });
    }
    return origSend.call(this, body, ...rest);
  };

  console.log('[PASTR] FastMoss capture active');
})();
