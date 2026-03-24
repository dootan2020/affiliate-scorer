# PASTR FastMoss Capture — Chrome Extension

Passively captures FastMoss product data and syncs to PASTR for affiliate scoring.

## Install

1. Open `chrome://extensions/`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked" → select this folder (`extensions/pastr-fastmoss-capture/`)
4. Click extension icon → enter your PASTR Auth Secret → Save Config

## Usage

### Passive Mode
Browse FastMoss normally. The extension intercepts all product API responses in the background and buffers them for sync. No action needed — just browse and the badge counter shows buffered items.

### Auto-Crawl Mode
1. Click extension icon
2. Set "Max pages per category" (default: 30 = ~870 pages total across 29 categories)
3. Click "Start Auto-Crawl"
4. Extension opens a background tab, navigates through all 29 VN L1 categories:
   - Search pages (up to max pages per category)
   - saleslist, hotlist, newProducts, hotvideo ranking pages
5. Data syncs to PASTR automatically every 30s or when buffer reaches 50 items

### Manual Sync
Click "Sync Now" to immediately push buffered data to PASTR.

## Config

| Setting | Description |
|---------|-------------|
| PASTR Auth Secret | Same value as `AUTH_SECRET` in PASTR `.env` |
| PASTR URL | Default: `https://affiliate-scorer.vercel.app` |

## Architecture

```
injected.js    — Runs in page context (main world), monkey-patches fetch + XHR
content.js     — Runs in extension context (isolated world), bridges page ↔ background
background.js  — Service worker, buffers products, auto-syncs, runs crawl loop
popup.html/js  — Control panel with stats + crawl controls
```

## Captured API Paths

The extension intercepts responses from these FastMoss API paths:
- `/api/goods/` — product data
- `/api/video/` — video data
- `/api/author/` — creator/author data
- `/api/ecommerce/` — e-commerce data
- `/api/shop/` — shop data
- `/api/followers/` — follower data
- `/api/live/` — live stream data
- `/api/analysis/` — analysis data
- `/api/da/` + `/api/dar/` — dashboard analytics

Only Vietnamese region (`region=VN`) items are forwarded to PASTR.

## Sync Endpoint

Data is POSTed to `{PASTR_URL}/api/fastmoss/sync` with:
```json
{
  "type": "products",
  "region": "VN",
  "data": [ ...product objects ]
}
```
Header: `x-auth-secret: <your-secret>`

## Category Codes (L1)

All 29 VN L1 categories: `2-28, 30, 31`
